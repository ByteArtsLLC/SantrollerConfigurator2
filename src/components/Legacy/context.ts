import { createDeviceConfig, DeviceKind } from '@/components/Devices/deviceRegistry';
import { proto } from '@/components/SettingsContext/config';
import { I2CGroups, SPIGroups, UARTGroups } from '@/devices/pico/pins';
import { legacy } from './legacy';

export const INT16_OFFSET = 32768;

// A converted Santroller 1 input. Old inputs were either unsigned (0 - 65535) or signed
// (-32768 - 32767), while every new input is unsigned, so `isUint` says which space the old
// calibration values for this input are in.
export interface ConvertedInput {
  input: proto.IInput;
  analog: boolean;
  isUint: boolean;
  // Mapping fields the input needs, such as the trigger for an analog to digital conversion
  mapping?: Partial<proto.IMapping>;
  // A digital input driving an axis: the old value it set while pressed. The output turns this
  // into the mapping's pressed / released values, as those depend on its calibration.
  digitalToAnalog?: { on: number; type: legacy.DigitalToAnalogType };
  // How much smaller a step of the new input is than a step of the old one, for inputs that are
  // scaled differently now (new value = old value * scale + offset). Defaults to 1.
  scale?: number;
}

// The device a combined output's children read from, eg the Wii extension a Wii combined output
// was set up for. Combined inputs (SerializedWiiInputCombined and friends) use this.
export interface CombinedSource {
  kind: string;
  deviceid: number;
}

// The children of a combined output that were enabled. Combined outputs stored this as a bitmask
// (lowest bit first) that the old configurator applied over the children's own enabled flags.
export function enabledChildren(combined: {
  outputs?: legacy.ISerializedOutput[] | null;
  childrenEnabled?: Uint8Array | null;
}): legacy.ISerializedOutput[] {
  const outputs = combined.outputs ?? [];
  const mask = combined.childrenEnabled;
  if (!mask?.length) {
    return outputs;
  }
  return outputs.filter((_, i) => i >= mask.length * 8 || (mask[i >> 3] >> (i & 7)) & 1);
}

export function busBlock(groups: Record<number, string>, pin: number | null | undefined) {
  return pin != null && pin >= 0 ? parseInt(groups[pin] ?? '0', 10) || 0 : 0;
}

// These set the pins on a bus created by the device registry, keeping its default clock
export function setI2c(
  bus: proto.II2CDevice | null | undefined,
  sda?: number | null,
  scl?: number | null
) {
  if (!bus) {
    return;
  }
  bus.sda = sda ?? -1;
  bus.scl = scl ?? -1;
  bus.block = busBlock(I2CGroups, bus.sda);
}

export function setSpi(
  bus: proto.ISPIDevice | null | undefined,
  mosi?: number | null,
  miso?: number | null,
  sck?: number | null
) {
  if (!bus) {
    return;
  }
  bus.mosi = mosi ?? -1;
  bus.miso = miso ?? -1;
  bus.sck = sck ?? -1;
  bus.block = busBlock(SPIGroups, bus.sck >= 0 ? bus.sck : bus.mosi);
}

export function setUart(
  bus: proto.IUARTDevice | null | undefined,
  tx?: number | null,
  rx?: number | null
) {
  if (!bus) {
    return;
  }
  bus.tx = tx ?? -1;
  bus.rx = rx ?? -1;
  bus.block = busBlock(UARTGroups, bus.tx >= 0 ? bus.tx : bus.rx);
}

export class LegacyImportContext {
  readonly devices: proto.IDevice[] = [];
  readonly assignments: proto.IProfileAssignmentInfo[] = [];
  readonly mappings: proto.IMapping[] = [];
  readonly leds: proto.ILed[] = [];
  readonly warnings: string[] = [];
  combined?: CombinedSource;
  // The device each binding inside a combined output read from, recorded as they are converted
  readonly combinedSources = new WeakMap<legacy.ISerializedOutput, CombinedSource>();
  // Further inputs a binding's mapping is copied onto once everything is converted, for old inputs
  // that read several devices at once (eg MIDI from every source)
  readonly extraInputs = new WeakMap<proto.IInput, proto.IInput[]>();
  // Other assignments a slot also matches (eg a Classic Controller Pro for a Classic Controller
  // slot). Each one gets a copy of the assignment lists, as assignments in one list all have to match
  readonly slotAlternatives = new WeakMap<
    proto.IProfileAssignmentInfo,
    proto.IProfileAssignmentInfo[]
  >();
  // The slot each slot assignment (and its alternatives) was given while converting. Inputs use
  // these until the profile's lists are final, then move to the profile wide ids.
  readonly slotPlaceholders = new Map<
    proto.IProfileAssignmentInfo,
    { deviceKind: string; slotId: number }
  >();
  private readonly deviceKeys = new Map<string, number>();
  private readonly slotKeys = new Map<string, number>();
  private readonly slotCounts = new Map<string, number>();
  private nextDeviceId = 1;

  constructor(
    readonly old: legacy.SerializedConfiguration,
    readonly subType: proto.SubType
  ) {}

  warn(message: string) {
    if (!this.warnings.includes(message)) {
      this.warnings.push(message);
    }
  }

  // Adds a device to the config, or returns the existing one when the same device (eg the same
  // Wii extension pins) was already added. `fill` sets up the device returned by the registry.
  addDevice<Kind extends DeviceKind>(
    kind: Kind,
    key: string,
    fill: (device: NonNullable<proto.IDevice[Kind]>) => void = () => {}
  ): number {
    const fullKey = `${kind}:${key}`;
    const existing = this.deviceKeys.get(fullKey);
    if (existing != null) {
      return existing;
    }
    const deviceid = this.nextDeviceId++;
    const device = createDeviceConfig(kind, deviceid);
    fill(device[kind] as NonNullable<proto.IDevice[Kind]>);
    this.devices.push(device);
    this.deviceKeys.set(fullKey, deviceid);
    return deviceid;
  }

  // Assignment based devices (USB host, Bluetooth, PSX, MIDI, Wii extensions) are referenced by
  // their slot in the profile's assignments rather than by device id.
  addSlot(
    deviceKind: string,
    key: string,
    assignment: proto.IProfileAssignmentInfo,
    alternatives: proto.IProfileAssignmentInfo[] = []
  ): number {
    const fullKey = `${deviceKind}:${key}`;
    const existing = this.slotKeys.get(fullKey);
    if (existing != null) {
      return existing;
    }
    const slotId = (this.slotCounts.get(deviceKind) ?? 0) + 1;
    this.slotCounts.set(deviceKind, slotId);
    this.slotKeys.set(fullKey, slotId);
    this.assignments.push(assignment);
    for (const item of [assignment, ...alternatives]) {
      this.slotPlaceholders.set(item, { deviceKind, slotId });
    }
    if (alternatives.length) {
      this.slotAlternatives.set(assignment, alternatives);
    }
    return slotId;
  }

  // Copies each assignment list once per alternative of the slots in it. The copies keep the
  // same order, so the slot ids stay the same across them.
  expandSlotAlternatives(lists: proto.IProfileAssignment[]): proto.IProfileAssignment[] {
    return lists.flatMap((list) => {
      let expanded: proto.IProfileAssignmentInfo[][] = [list.assignments ?? []];
      for (const [index, item] of (list.assignments ?? []).entries()) {
        const alternatives = this.slotAlternatives.get(item);
        if (alternatives) {
          expanded = expanded.flatMap((items) => [
            items,
            ...alternatives.map((alt) => items.map((x, i) => (i === index ? alt : x))),
          ]);
        }
      }
      return expanded.map((assignments) => ({ ...list, assignments }));
    });
  }
}
