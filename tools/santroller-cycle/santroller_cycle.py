#!/usr/bin/env python3
"""Change a Santroller's cycling inputs from the PC, with global hotkeys.

    santroller_cycle.py list              the cycling inputs, their values and where each one is (slow,
                                          as it reads the whole config)
    santroller_cycle.py next ID           step cycling input ID forward (prev steps it back)
    santroller_cycle.py set ID INDEX      jump straight to one of its values
    santroller_cycle.py listen            global hotkeys for all of them (see --help)

Needs `pip install hidapi` (and `pip install pynput` for listen), and firmware with SetCycleCommand.
"""
import argparse
import os
import sys
import zlib

try:
    import hid
except ImportError:
    sys.exit("This needs hidapi: pip install hidapi")

VID = 0x1209
PIDS = (0x2883, 0x2882)
CONFIG_USAGE_PAGE = 0xFF00

# ReportId in Santroller/proto/enums.proto
REPORT_CONFIG = 34
REPORT_CONFIG_INFO = 35
REPORT_COMMAND = 39
REPORT_SIZE = 64

# CycleType in Santroller/proto/enums.proto
CYCLE_TYPES = {1: "custom", 2: "pickup"}

CONFIG_READ_ATTEMPTS = 3


# The few protobuf fields this needs, decoded by hand so there is nothing to generate. The field
# numbers are the ones in Santroller/proto, and have to be kept in step with it.

def read_varint(data, pos):
    value = shift = 0
    while True:
        if pos >= len(data):
            raise ValueError("varint runs past the end")
        b = data[pos]
        pos += 1
        value |= (b & 0x7F) << shift
        if not b & 0x80:
            return value, pos
        shift += 7


def fields(data):
    """Yields (field number, wire type, value) for each field in a message. Varints come back as
    ints, length delimited fields as bytes. Stops at a zero tag, which is padding after the message."""
    pos = 0
    while pos < len(data):
        key, pos = read_varint(data, pos)
        if key == 0:
            return
        field, wire = key >> 3, key & 7
        if wire == 0:
            value, pos = read_varint(data, pos)
        elif wire == 1:
            value, pos = data[pos:pos + 8], pos + 8
        elif wire == 2:
            length, pos = read_varint(data, pos)
            value, pos = data[pos:pos + length], pos + length
        elif wire == 5:
            value, pos = data[pos:pos + 4], pos + 4
        else:
            raise ValueError(f"unsupported wire type {wire}")
        yield field, wire, value


def int32(value):
    value &= 0xFFFFFFFF
    return value - (1 << 32) if value & 0x80000000 else value


def repeated_int32(wire, value):
    if wire == 0:
        return [int32(value)]
    # packed
    out, pos = [], 0
    while pos < len(value):
        v, pos = read_varint(value, pos)
        out.append(int32(v))
    return out


def varint(value):
    out = bytearray()
    while True:
        b = value & 0x7F
        value >>= 7
        if value:
            out.append(b | 0x80)
        else:
            out.append(b)
            return bytes(out)


def field_varint(field, value):
    return varint(field << 3) + varint(value)


def field_bytes(field, value):
    return varint(field << 3 | 2) + varint(len(value)) + value


def parse_config_info(data):
    # ConfigInfo: dataSize = 1, dataCrc = 2, mainSize = 3, auxSize = 4, inUseByOtherTool = 10
    info = {"in_use": False}
    names = {1: "data_size", 2: "data_crc", 3: "main_size", 4: "aux_size"}
    for field, _, value in fields(data):
        if field in names:
            info[names[field]] = value & 0xFFFFFFFF
        elif field == 10:
            info["in_use"] = bool(value)
    return info


def parse_cycle_devices(main):
    # Config.devices = 2, Device.deviceid = 1, Device.cycle = 34, CycleDevice.type = 1, .values = 2
    devices = {}
    for field, _, device in fields(main):
        if field != 2:
            continue
        device_id, cycle = None, None
        for f, _, v in fields(device):
            if f == 1:
                device_id = int32(v)
            elif f == 34:
                cycle = {"type": 1, "values": []}
                for cf, cw, cv in fields(v):
                    if cf == 1:
                        cycle["type"] = cv
                    elif cf == 2:
                        cycle["values"] += repeated_int32(cw, cv)
        if cycle is not None and device_id is not None:
            devices[device_id] = cycle
    return devices


def parse_cycle_states(aux):
    # AuxConfigBlock.states = 1, CyclingInputState.id = 1, .state = 2
    states = {}
    for field, _, state in fields(aux):
        if field != 1:
            continue
        values = {f: int32(v) for f, _, v in fields(state)}
        states[values.get(1, 0)] = values.get(2, 0)
    return states


def set_cycle_command(device_id, state=None, forward=None):
    # Command.setCycle = 11, SetCycleCommand.id = 1, .state = 2, .forward = 3. Sent length delimited
    body = field_varint(1, device_id)
    if state is not None:
        body += field_varint(2, state)
    if forward is not None:
        body += field_varint(3, int(forward))
    command = field_bytes(11, body)
    return varint(len(command)) + command


# hidapi: either the hidapi package (hid.device) or the hid package (hid.Device), which both
# install as `hid`. Both give feature reports back with the report id in front.

class Santroller:
    def __init__(self, path):
        if hasattr(hid, "device"):
            self.dev = hid.device()
            self.dev.open_path(path)
        else:
            self.dev = hid.Device(path=path)

    def close(self):
        self.dev.close()

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.close()

    def get_feature(self, report_id):
        data = bytes(self.dev.get_feature_report(report_id, REPORT_SIZE))
        return data[1:]

    def send_feature(self, report_id, data):
        report = bytes([report_id]) + data
        report += bytes(REPORT_SIZE - len(report))
        try:
            sent = self.dev.send_feature_report(report)
        except (OSError, IOError, ValueError, getattr(hid, "HIDException", OSError)) as e:
            raise SystemExit(f"The controller refused it, it may be open in another configurator ({e})")
        if sent is not None and sent < 0:
            raise SystemExit("The controller refused it, it may be open in another configurator")

    def read_config(self):
        """The cycling inputs, as {id: {"type", "values", "state"}}"""
        for attempt in range(1, CONFIG_READ_ATTEMPTS + 1):
            # Reading the info restarts the config stream from the beginning
            info = parse_config_info(self.get_feature(REPORT_CONFIG_INFO))
            if info["in_use"]:
                raise SystemExit("The controller is open in a configurator over bluetooth, close that first")
            data = bytearray()
            while len(data) < info["data_size"]:
                chunk = self.get_feature(REPORT_CONFIG)[:info["data_size"] - len(data)]
                if not chunk:
                    break
                data += chunk
            if len(data) == info["data_size"] and zlib.crc32(data) == info["data_crc"]:
                break
            if attempt == CONFIG_READ_ATTEMPTS:
                raise SystemExit("Couldn't read the config from the controller")
        main = bytes(data[:info["main_size"]])
        aux = bytes(data[info["main_size"]:info["main_size"] + info["aux_size"]])
        devices = parse_cycle_devices(main)
        states = parse_cycle_states(aux)
        for device_id, cycle in devices.items():
            state = states.get(device_id, 0)
            cycle["state"] = state if state < len(cycle["values"]) else 0
        return devices

    def set_cycle(self, device_id, state=None, forward=None):
        self.send_feature(REPORT_COMMAND, set_cycle_command(device_id, state, forward))


def find_santrollers(serial=None):
    found = []
    for pid in PIDS:
        for info in hid.enumerate(VID, pid):
            if info.get("usage_page") != CONFIG_USAGE_PAGE:
                continue
            if serial and info.get("serial_number") != serial:
                continue
            found.append(info)
    return found


def open_santroller(serial=None):
    found = find_santrollers(serial)
    if not found:
        raise SystemExit("No Santroller found" + (f" with serial {serial}" if serial else "") +
                         ". It has to be plugged in over USB, in a mode with its config interface "
                         "(the same as the configurator needs).")
    if len(found) > 1:
        serials = ", ".join(str(info.get("serial_number")) for info in found)
        raise SystemExit(f"More than one Santroller is plugged in, pick one with --serial ({serials})")
    return Santroller(found[0]["path"])


def describe(device_id, cycle):
    values = cycle["values"]
    kind = CYCLE_TYPES.get(cycle["type"], f"type {cycle['type']}")
    if not values:
        return f"Cycling input {device_id} ({kind}): no values"
    state = cycle["state"]
    if cycle["type"] == 2:
        listed = "  ".join(f"[notch {i + 1}]" if i == state else f"notch {i + 1}" for i in range(len(values)))
    else:
        listed = "  ".join(f"[{v}]" if i == state else str(v) for i, v in enumerate(values))
    return f"Cycling input {device_id} ({kind}): {listed}"


def apply(serial, device_id, state=None, forward=None):
    # Only the command: reading the config back to show the new state takes a couple of seconds, as
    # it can only be read from the start. An unknown id or index is ignored by the controller
    with open_santroller(serial) as dev:
        dev.set_cycle(device_id, state, forward)


def parse_binding(text):
    """'<ctrl>+<alt>+1=next:3' -> ('<ctrl>+<alt>+1', (3, None, True))"""
    try:
        keys, action = text.rsplit("=", 1)
        parts = action.split(":")
        device_id = int(parts[1])
        if parts[0] == "next" and len(parts) == 2:
            return keys, (device_id, None, True)
        if parts[0] == "prev" and len(parts) == 2:
            return keys, (device_id, None, False)
        if parts[0] == "set" and len(parts) == 3:
            return keys, (device_id, int(parts[2]), None)
    except (ValueError, IndexError):
        pass
    raise argparse.ArgumentTypeError(f"bad binding {text!r}, expected KEYS=next:ID, KEYS=prev:ID or KEYS=set:ID:INDEX")


def listen(serial, bindings):
    try:
        from pynput import keyboard
    except ImportError:
        raise SystemExit("listen needs pynput: pip install pynput")

    if sys.platform.startswith("linux") and os.environ.get("WAYLAND_DISPLAY"):
        print("Note: on Wayland, global hotkeys only work while an X11 (XWayland) window is focused. "
              "Bind the one shot commands in your compositor instead, eg for Hyprland:\n"
              f"  bind = CTRL ALT, 1, exec, {os.path.abspath(sys.argv[0])} next 1\n",
              file=sys.stderr)

    if not bindings:
        with open_santroller(serial) as dev:
            cycles = dev.read_config()
        if not cycles:
            raise SystemExit("The controller has no cycling inputs")
        # F keys, as shift changes what a number key sends. Not ctrl+alt+F, which switches VT on linux
        for n, device_id in enumerate(sorted(cycles)[:12], start=1):
            bindings.append((f"<ctrl>+<shift>+<f{n}>", (device_id, None, True)))
            bindings.append((f"<ctrl>+<alt>+<shift>+<f{n}>", (device_id, None, False)))

    def handler(device_id, state, forward):
        def run():
            # Opened each time, so it carries on after the controller reboots or is replugged
            try:
                apply(serial, device_id, state, forward)
            except SystemExit as e:
                print(e, file=sys.stderr)
        return run

    def logged(run, action):
        def wrapped():
            print(action)
            run()
        return wrapped

    hotkeys = {}
    for keys, (device_id, state, forward) in bindings:
        hotkeys[keys] = handler(device_id, state, forward)
        action = f"set {device_id} to index {state}" if state is not None else \
            f"{'next' if forward else 'prev'} on cycling input {device_id}"
        print(f"  {keys:32} {action}")
        hotkeys[keys] = logged(hotkeys[keys], action)
    print("Listening, ctrl+c to stop")
    try:
        with keyboard.GlobalHotKeys(hotkeys) as listener:
            listener.join()
    except ValueError as e:
        raise SystemExit(f"Couldn't parse a hotkey: {e} (pynput syntax, eg <ctrl>+<alt>+h)")
    except KeyboardInterrupt:
        pass


def main():
    parser = argparse.ArgumentParser(description="Change a Santroller's cycling inputs from the PC.")
    parser.add_argument("--serial", help="which Santroller, when more than one is plugged in")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("list", help="list the cycling inputs")
    for name, help_text in (("next", "step a cycling input forward"), ("prev", "step a cycling input back")):
        p = sub.add_parser(name, help=help_text)
        p.add_argument("id", type=int, help="the cycling input's id, from list")
    p = sub.add_parser("set", help="jump a cycling input to one of its values")
    p.add_argument("id", type=int, help="the cycling input's id, from list")
    p.add_argument("index", type=int, help="which of its values, counting from 0")
    p = sub.add_parser("listen", help="run global hotkeys for the cycling inputs",
                       description="Without --bind, ctrl+shift+F1 steps the first cycling input forward and "
                                   "ctrl+alt+shift+F1 steps it back, F2 the second and so on.")
    p.add_argument("--bind", action="append", type=parse_binding, default=[], metavar="KEYS=ACTION",
                   help="eg '<ctrl>+<alt>+1=next:3', '<ctrl>+<alt>+2=prev:3' or '<ctrl>+<alt>+3=set:3:0'. Repeatable")
    args = parser.parse_args()

    if args.command == "list":
        with open_santroller(args.serial) as dev:
            cycles = dev.read_config()
        if not cycles:
            print("The controller has no cycling inputs")
        for device_id in sorted(cycles):
            print(describe(device_id, cycles[device_id]))
    elif args.command in ("next", "prev"):
        apply(args.serial, args.id, forward=args.command == "next")
    elif args.command == "set":
        apply(args.serial, args.id, state=args.index)
    elif args.command == "listen":
        listen(args.serial, args.bind)


if __name__ == "__main__":
    main()
