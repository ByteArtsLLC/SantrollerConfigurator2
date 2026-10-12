import { getDevicePins } from '@/components/Devices/deviceRegistry';
import { getSlotDeviceKind } from '@/components/Inputs/inputRegistry';
import { proto } from '@/components/SettingsContext/config';
import { ConfigState, useConfigStore } from '@/components/SettingsContext/SettingsContext';
import { findDeviceStatus } from '../guideConfig';
import { ensureUsbHost, usbHostPins } from '../usb/usbHostUtils';

export type ConsoleTarget = 'wii' | 'ps2';

// The Pico answers the Wiimote as an I2C slave, so SDA / SCL have to be a pair from the same I2C
// block. GP18 / GP19 is I2C1, and the same pinout the old Ardwiino firmware used.
export const WII_OUTPUT_I2C = { sda: 18, scl: 19, block: 1 };

// The PS2 is the SPI master here, so DATA (plug pin 1) is the Pico's output and COMMAND (plug pin
// 2) its input, the reverse of the PS2 adapter guide. The firmware runs this on PIO, so any pins
// work; these are the docs' recommended pins (the old Ardwiino PS2 output pinout).
export const PS2_OUTPUT_PINS = {
  dataPin: 3,
  commandPin: 4,
  clockPin: 6,
  acknowledgePin: 7,
  attentionPin: 10,
};

// Pico physical pin numbers for every GPIO broken out on the header
export const PICO_PHYSICAL_PIN: Record<number, number> = {
  0: 1,
  1: 2,
  2: 4,
  3: 5,
  4: 6,
  5: 7,
  6: 9,
  7: 10,
  8: 11,
  9: 12,
  10: 14,
  11: 15,
  12: 16,
  13: 17,
  14: 19,
  15: 20,
  16: 21,
  17: 22,
  18: 24,
  19: 25,
  20: 26,
  21: 27,
  22: 29,
  26: 31,
  27: 32,
  28: 34,
};

export const picoPinLabel = (gp: number | null | undefined) =>
  gp == null || gp < 0
    ? '-'
    : PICO_PHYSICAL_PIN[gp] != null
      ? `GP${gp} (Pin ${PICO_PHYSICAL_PIN[gp]})`
      : `GP${gp}`;

const DEVICE_KIND = { wii: 'wiiEmulation', ps2: 'psxEmulation' } as const;

// Profile subtypes the firmware builds a report for on each console. Anything else shows up on a
// Wii as a Classic Controller, and sends no inputs on a PS2.
export const WII_EXTENSION_SUBTYPES = [
  proto.SubType.GuitarHeroGuitar,
  proto.SubType.GuitarHeroDrums,
  proto.SubType.DjHeroTurntable,
  proto.SubType.Taiko,
];
export const PS2_SUBTYPES = [
  proto.SubType.Gamepad,
  proto.SubType.GuitarHeroGuitar,
  proto.SubType.Taiko,
  proto.SubType.PopNMusic,
  proto.SubType.BeatMania,
  proto.SubType.GuitarFreaks,
  proto.SubType.DrumMania,
];

/** The subtype the console will see, or null if the firmware has no PS2 report for the profile */
export function consoleSubtype(
  target: ConsoleTarget,
  deviceToEmulate: proto.SubType | null | undefined
): proto.SubType | null {
  const subtype = deviceToEmulate ?? proto.SubType.Gamepad;
  if (target === 'wii') {
    return WII_EXTENSION_SUBTYPES.includes(subtype) ? subtype : proto.SubType.Gamepad;
  }
  return PS2_SUBTYPES.includes(subtype) ? subtype : null;
}

export function findConsoleOutput(state: ConfigState, target: ConsoleTarget) {
  return findDeviceStatus(state, DEVICE_KIND[target]);
}

/** The pins the console output uses: the live device's, or the ones setup would add */
export function consoleOutputPins(state: ConfigState, target: ConsoleTarget) {
  const device = findConsoleOutput(state, target)?.device;
  if (target === 'wii') {
    const i2c = device?.wiiEmulation?.i2c ?? WII_OUTPUT_I2C;
    return { sda: i2c.sda, scl: i2c.scl };
  }
  const psx = device?.psxEmulation ?? PS2_OUTPUT_PINS;
  return {
    data: psx.dataPin,
    command: psx.commandPin,
    clock: psx.clockPin,
    acknowledge: psx.acknowledgePin,
    attention: psx.attentionPin,
  };
}

function isEmulationItem(item: proto.IProfileAssignmentInfo, target: ConsoleTarget) {
  return target === 'wii' ? item.wiiEmulation != null : item.ps2Emulation != null;
}

/** Index of the active profile's assignment list for this console, or -1 */
export function findConsoleOutputList(state: ConfigState, target: ConsoleTarget) {
  const lists = state.config.profiles?.[state.currentProfile]?.assignments ?? [];
  return lists.findIndex((list) =>
    (list.assignments ?? []).some((item) => isEmulationItem(item, target))
  );
}

function listHasUsbSlot(list: proto.IProfileAssignment | undefined) {
  return (list?.assignments ?? []).some((item) => getSlotDeviceKind(item) === 'usbHost');
}

export function consoleListHasUsbSlot(state: ConfigState, target: ConsoleTarget) {
  const idx = findConsoleOutputList(state, target);
  const lists = state.config.profiles?.[state.currentProfile]?.assignments ?? [];
  return idx !== -1 && listHasUsbSlot(lists[idx]);
}

/** Live state of the console's assignment in the active profile: true while the console talks */
export function consoleOutputTriggered(state: ConfigState, target: ConsoleTarget) {
  const listIdx = findConsoleOutputList(state, target);
  if (listIdx === -1) {
    return false;
  }
  const list = state.config.profiles?.[state.currentProfile]?.assignments?.[listIdx];
  const itemIdx = (list?.assignments ?? []).findIndex((item) => isEmulationItem(item, target));
  return state.activationStatus[state.currentProfile]?.[listIdx]?.[itemIdx]?.state === true;
}

export function isConsoleOutputConfigured(
  state: ConfigState,
  target: ConsoleTarget,
  withUsbHost: boolean
) {
  return (
    findConsoleOutput(state, target) !== undefined &&
    findConsoleOutputList(state, target) !== -1 &&
    (!withUsbHost ||
      (findDeviceStatus(state, 'usbHost') !== undefined && consoleListHasUsbSlot(state, target)))
  );
}

function consolePinList(state: ConfigState, target: ConsoleTarget) {
  return Object.values(consoleOutputPins(state, target));
}

/** Pico pins already taken by configured devices (devices on a peripheral use its pins) */
function usedPins(state: ConfigState) {
  return new Set(
    Object.values(state.deviceStatus)
      .filter((status) => !status.parentId)
      .flatMap((status) => getDevicePins(status.device))
      .filter((pin) => pin >= 0)
  );
}

/**
 * Pins setup would add that another device already uses. Empty when the console output device
 * already exists (its pins are whatever the user configured).
 */
export function consoleOutputConflicts(state: ConfigState, target: ConsoleTarget): number[] {
  const existing = findConsoleOutput(state, target);
  if (existing) {
    return [];
  }
  const used = usedPins(state);
  return consolePinList(state, target).filter((pin) => used.has(pin));
}

// D+ candidates for a new USB host port (D- is the next pin). GP2 / GP3 is the USB host guide's
// default, but the PS2 output's DATA line is on GP3, so other pairs are tried after it.
const USB_HOST_DP_CANDIDATES = [2, 20, 8, 12, 14, 16, 26];

/** D+ for a new USB host port, kept clear of the console output and every other device */
export function pickUsbHostDp(state: ConfigState, target: ConsoleTarget): number | null {
  const taken = usedPins(state);
  consolePinList(state, target).forEach((pin) => taken.add(pin));
  return USB_HOST_DP_CANDIDATES.find((dp) => !taken.has(dp) && !taken.has(dp + 1)) ?? null;
}

/** The USB host pins: the live device's, or the pair setup would pick */
export function consoleUsbHostPins(state: ConfigState, target: ConsoleTarget) {
  const usbHost = findDeviceStatus(state, 'usbHost')?.device.usbHost;
  if (usbHost) {
    return usbHostPins(usbHost);
  }
  const dp = pickUsbHostDp(state, target);
  return dp === null ? null : { dp, dm: dp + 1 };
}

/** Adds the Wii extension / PS2 controller emulation device on the recommended pins if missing */
export function ensureConsoleOutputDevice(target: ConsoleTarget): string {
  const store = useConfigStore.getState();
  const existing = findConsoleOutput(store, target);
  if (existing) {
    return existing.id;
  }
  if (target === 'wii') {
    return store.addDevice('wiiEmulation', undefined, (device) => {
      // detectPin stays unset: the plug's device detect line is tied to its 3.3V instead
      device.wiiEmulation!.i2c = { ...device.wiiEmulation!.i2c, ...WII_OUTPUT_I2C };
    });
  }
  return store.addDevice('psxEmulation', undefined, (device) => {
    Object.assign(device.psxEmulation!, PS2_OUTPUT_PINS);
  });
}

/**
 * Adds a USB host port clear of the console output pins (when there isn't one), then lets
 * ensureUsbHost give the profile's USB list a slot for it and load the default mappings.
 */
export function ensureConsoleUsbHost(target: ConsoleTarget) {
  const store = useConfigStore.getState();
  if (!findDeviceStatus(store, 'usbHost')) {
    const dp = pickUsbHostDp(store, target);
    if (dp === null) {
      return;
    }
    store.addDevice('usbHost', undefined, (device) => {
      device.usbHost!.firstPin = dp;
      device.usbHost!.dmFirst = false;
    });
  }
  ensureUsbHost();
}

/**
 * Console output only drives a profile through an assignment list of its own: a list's
 * assignments all have to match, and the USB list matches whenever the Pico is powered, so the
 * console's list goes first (the profile claims the first list that matches). With USB host, the
 * list also gets the same USB slot the USB list uses, so both share the USB controller's mappings.
 */
export function ensureConsoleOutputList(target: ConsoleTarget, withUsbHost: boolean) {
  const store = useConfigStore.getState();
  const profileIdx = store.currentProfile;
  const profile = store.config.profiles?.[profileIdx];
  if (!profile) {
    return;
  }
  const lists = profile.assignments ?? [];
  const usbSlot: proto.IProfileAssignmentInfo | undefined = withUsbHost
    ? (lists
        .flatMap((list) => list.assignments ?? [])
        .find((item) => getSlotDeviceKind(item) === 'usbHost') ?? {
        usbType: profile.opts?.deviceToEmulate ?? proto.SubType.Gamepad,
      })
    : undefined;
  const idx = findConsoleOutputList(store, target);
  let assignments: proto.IProfileAssignment[];
  if (idx === -1) {
    const item: proto.IProfileAssignmentInfo =
      target === 'wii' ? { wiiEmulation: {} } : { ps2Emulation: {} };
    assignments = [{ assignments: usbSlot ? [item, usbSlot] : [item] }, ...lists];
  } else if (usbSlot && !listHasUsbSlot(lists[idx])) {
    assignments = lists.map((list, i) =>
      i === idx ? { ...list, assignments: [...(list.assignments ?? []), usbSlot] } : list
    );
  } else {
    return;
  }
  store.updateProfile({ ...profile, assignments }, profileIdx);
}

/**
 * Sets up console output: the emulation device on the recommended pins, optionally a USB host
 * port (slot in the USB list first, so ensureUsbHost still loads the default mappings), then the
 * console's own assignment list.
 */
export function setupConsoleOutput(target: ConsoleTarget, withUsbHost: boolean) {
  ensureConsoleOutputDevice(target);
  if (withUsbHost) {
    ensureConsoleUsbHost(target);
  }
  ensureConsoleOutputList(target, withUsbHost);
}

// The console / USB host choice is remembered between steps and sessions
const TARGET_KEY = 'santroller.guides.console-output.target';
const USB_HOST_KEY = 'santroller.guides.console-output.usbHost';
const POWER_KEY = 'santroller.guides.console-output.power';

// The Pico runs either from the console's 3.3V or from its own USB port
export type ConsolePower = 'console' | 'usb';

export function getConsoleTarget(state?: ConfigState): ConsoleTarget {
  try {
    const saved = localStorage.getItem(TARGET_KEY);
    if (saved === 'wii' || saved === 'ps2') {
      return saved;
    }
  } catch {
    // Ignore storage issues
  }
  const current = state ?? useConfigStore.getState();
  return findConsoleOutput(current, 'ps2') && !findConsoleOutput(current, 'wii') ? 'ps2' : 'wii';
}

export function setConsoleTarget(target: ConsoleTarget) {
  try {
    localStorage.setItem(TARGET_KEY, target);
  } catch {
    // Ignore storage issues
  }
}

export function getConsoleUsbHost(state?: ConfigState): boolean {
  try {
    const saved = localStorage.getItem(USB_HOST_KEY);
    if (saved === 'yes' || saved === 'no') {
      return saved === 'yes';
    }
  } catch {
    // Ignore storage issues
  }
  return findDeviceStatus(state ?? useConfigStore.getState(), 'usbHost') !== undefined;
}

export function setConsoleUsbHost(enabled: boolean) {
  try {
    localStorage.setItem(USB_HOST_KEY, enabled ? 'yes' : 'no');
  } catch {
    // Ignore storage issues
  }
}

export function getConsolePower(): ConsolePower {
  try {
    return localStorage.getItem(POWER_KEY) === 'usb' ? 'usb' : 'console';
  } catch {
    return 'console';
  }
}

export function setConsolePower(power: ConsolePower) {
  try {
    localStorage.setItem(POWER_KEY, power);
  } catch {
    // Ignore storage issues
  }
}
