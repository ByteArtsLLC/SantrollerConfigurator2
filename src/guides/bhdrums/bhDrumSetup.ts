import { proto } from '@/components/SettingsContext/config';
import { ConfigState, useConfigStore } from '@/components/SettingsContext/SettingsContext';
import { ensureDeviceToEmulate } from '../adapters/adapterLiveStatus';
import { assignDeviceToProfile, findDeviceStatus } from '../guideConfig';
import { PinMappingTarget } from '../guitar/guitarMappingUtils';

// The drum brain's +V / CLK / DATA / 0V connector is wired like a DJ Hero platter, so it sits on
// I2C1 on GP18 (SDA) / GP19 (SCL). The brain itself answers on address 0x0D.
export const BH_I2C = { sda: 18, scl: 19, block: 1 };
// The brain streams General MIDI drum notes, which the MIDI drum defaults read on channel 10
export const BH_MIDI_SLOT: proto.IProfileAssignmentInfo = { midiChannel: 10 };

export type BhDrumFamily = 'gh' | 'rb';

export interface BhPad {
  key: string;
  color: string;
  output: proto.IOutput;
}

const GH = proto.GuitarHeroDrumsAxisType;
const RB = proto.RockBandDrumsAxisType;

// The outputs the MIDI drum defaults map notes to, for each kit type
export const BH_PADS: Record<BhDrumFamily, BhPad[]> = {
  gh: [
    { key: 'red', color: 'red', output: { ghDrumAxis: GH.GuitarHeroDrums_RedPad } },
    { key: 'yellow', color: 'yellow', output: { ghDrumAxis: GH.GuitarHeroDrums_YellowPad } },
    { key: 'blue', color: 'blue', output: { ghDrumAxis: GH.GuitarHeroDrums_BluePad } },
    { key: 'orange', color: 'orange', output: { ghDrumAxis: GH.GuitarHeroDrums_OrangePad } },
    { key: 'green', color: 'green', output: { ghDrumAxis: GH.GuitarHeroDrums_GreenPad } },
    { key: 'kick', color: 'grape', output: { ghDrumAxis: GH.GuitarHeroDrums_KickPedal } },
  ],
  rb: [
    { key: 'red', color: 'red', output: { rbDrumAxis: RB.RockBandDrums_RedPad } },
    { key: 'yellow', color: 'yellow', output: { rbDrumAxis: RB.RockBandDrums_YellowPad } },
    {
      key: 'yellowCymbal',
      color: 'yellow',
      output: { rbDrumAxis: RB.RockBandDrums_YellowCymbal },
    },
    { key: 'blue', color: 'blue', output: { rbDrumAxis: RB.RockBandDrums_BluePad } },
    { key: 'blueCymbal', color: 'blue', output: { rbDrumAxis: RB.RockBandDrums_BlueCymbal } },
    { key: 'green', color: 'green', output: { rbDrumAxis: RB.RockBandDrums_GreenPad } },
    { key: 'greenCymbal', color: 'green', output: { rbDrumAxis: RB.RockBandDrums_GreenCymbal } },
    {
      key: 'kick',
      color: 'grape',
      output: { rbDrumButton: proto.RockBandDrumsButtonType.RockBandDrums_Kick1Pedal },
    },
  ],
};

export interface BhButton {
  key: string;
  // The pad's label on the main board's silkscreen
  pad: string;
  pin: number;
  physicalPin: number;
  color: string;
  target: PinMappingTarget;
}

function button(name: string, id: proto.GamepadButtonType): PinMappingTarget {
  return { name, type: 'gamepadButton', id };
}

const B = proto.GamepadButtonType;

// Suggested pins for the brain's face buttons, kept clear of the I2C pins (GP18 / GP19). The probe
// rows take whichever pin is actually pressed, so these are only a starting point.
export const BH_BUTTONS: BhButton[] = [
  {
    key: 'guide',
    pad: 'GUIDE/MENU',
    pin: 2,
    physicalPin: 4,
    color: 'teal',
    target: button('Guide', B.Gamepad_Guide),
  },
  {
    key: 'dpadUp',
    pad: 'UP',
    pin: 3,
    physicalPin: 5,
    color: 'cyan',
    target: button('D-Pad Up', B.Gamepad_DpadUp),
  },
  {
    key: 'dpadDown',
    pad: 'DOWN',
    pin: 4,
    physicalPin: 6,
    color: 'cyan',
    target: button('D-Pad Down', B.Gamepad_DpadDown),
  },
  {
    key: 'dpadLeft',
    pad: 'LEFT',
    pin: 5,
    physicalPin: 7,
    color: 'cyan',
    target: button('D-Pad Left', B.Gamepad_DpadLeft),
  },
  {
    key: 'dpadRight',
    pad: 'RIGHT',
    pin: 6,
    physicalPin: 9,
    color: 'cyan',
    target: button('D-Pad Right', B.Gamepad_DpadRight),
  },
  {
    key: 'start',
    pad: 'START',
    pin: 7,
    physicalPin: 10,
    color: 'teal',
    target: button('Start', B.Gamepad_Start),
  },
  {
    key: 'back',
    pad: 'BACK',
    pin: 8,
    physicalPin: 11,
    color: 'teal',
    target: button('Back', B.Gamepad_Back),
  },
  {
    key: 'a',
    pad: 'A/CROSS',
    pin: 9,
    physicalPin: 12,
    color: 'green',
    target: button('A', B.Gamepad_A),
  },
  {
    key: 'b',
    pad: 'B/CIRCLE',
    pin: 10,
    physicalPin: 14,
    color: 'red',
    target: button('B', B.Gamepad_B),
  },
  {
    key: 'x',
    pad: 'X/SQUARE',
    pin: 11,
    physicalPin: 15,
    color: 'blue',
    target: button('X', B.Gamepad_X),
  },
  {
    key: 'y',
    pad: 'Y/TRIANGLE',
    pin: 12,
    physicalPin: 16,
    color: 'yellow',
    target: button('Y', B.Gamepad_Y),
  },
];

export function sameOutput(a: proto.IOutput | null | undefined, b: proto.IOutput) {
  const [key, value] = Object.entries(b)[0];
  return a?.[key as keyof proto.IOutput] === value;
}

export function bhDrumFamily(state: ConfigState): BhDrumFamily {
  return state.config.profiles?.[state.currentProfile]?.opts.deviceToEmulate ===
    proto.SubType.RockBandDrums
    ? 'rb'
    : 'gh';
}

export function findBhDrum(state: ConfigState) {
  return findDeviceStatus(state, 'bhDrum');
}

/** Indices of the profile's MIDI mappings driving a pad (the defaults map several notes to each) */
export function padMappingIndices(state: ConfigState, pad: BhPad): number[] {
  const mappings = state.config.profiles?.[state.currentProfile]?.mappings ?? [];
  return mappings.flatMap((m, i) =>
    m.input?.midi && sameOutput(m.mapping, pad.output) ? [i] : []
  );
}

export function hasMidiPadMappings(state: ConfigState) {
  return BH_PADS[bhDrumFamily(state)].some((pad) => padMappingIndices(state, pad).length > 0);
}

export function isBhDrumConfigured(state: ConfigState) {
  return findBhDrum(state) !== undefined && hasMidiPadMappings(state);
}

function hasMidiSlot(state: ConfigState) {
  const profile = state.config.profiles?.[state.currentProfile];
  return (profile?.assignments ?? []).some((list) =>
    (list.assignments ?? []).some((item) => item.midiChannel != null)
  );
}

/**
 * Brings every device on the I2C1 header pins down to the slowest clock among them, as the
 * firmware runs the shared bus at the clock of whichever device starts first (the same rule the
 * guitar guide follows when it adds I2C1 devices).
 */
function matchI2c1Clocks() {
  const store = useConfigStore.getState();
  const onBus = Object.values(store.deviceStatus).flatMap((status) =>
    Object.entries(status.device).flatMap(([field, config]) => {
      const i2c = (config as { i2c?: proto.II2CDevice } | null)?.i2c;
      return i2c?.block === BH_I2C.block && i2c.sda === BH_I2C.sda && i2c.scl === BH_I2C.scl
        ? [{ status, field, i2c }]
        : [];
    })
  );
  if (!onBus.length) {
    return;
  }
  const clock = Math.min(...onBus.map(({ i2c }) => i2c.clock));
  for (const { status, field, i2c } of onBus) {
    if (i2c.clock !== clock) {
      store.updateDevice(
        {
          ...status.device,
          [field]: {
            ...(status.device[field as keyof proto.IDevice] as object),
            i2c: { ...i2c, clock },
          },
        },
        status.id
      );
    }
  }
}

/**
 * Switches the profile to a Guitar Hero kit (Band Hero and World Tour kits are 5 pad + kick kits)
 * unless it already emulates a drum kit.
 */
export function ensureDrumKitProfile() {
  ensureDeviceToEmulate(
    [proto.SubType.GuitarHeroDrums, proto.SubType.RockBandDrums],
    proto.SubType.GuitarHeroDrums
  );
}

/**
 * Gives the profile a MIDI channel 10 slot for a drum brain device and loads the MIDI drum
 * defaults. assignDeviceToProfile only loads the defaults when it adds the slot, so a profile that
 * already had a MIDI slot (eg from another MIDI device) gets them loaded here instead.
 */
export function assignMidiDrumSlot(id: string) {
  const hadSlot = hasMidiSlot(useConfigStore.getState());
  assignDeviceToProfile(id, BH_MIDI_SLOT);
  const state = useConfigStore.getState();
  const status = state.deviceStatus[id];
  if (hadSlot && status && !hasMidiPadMappings(state)) {
    state.loadDefaults(status);
  }
}

/**
 * Adds the Band Hero drum brain driver on I2C1 (GP18 / GP19), gives the profile a MIDI channel 10
 * slot for it, and loads the MIDI drum defaults. The profile is switched to a Guitar Hero kit first
 * unless it already emulates a drum kit.
 */
export function addBhDrumDriver() {
  ensureDrumKitProfile();
  let id = findBhDrum(useConfigStore.getState())?.id;
  if (id === undefined) {
    id = useConfigStore.getState().addDevice('bhDrum', undefined, (device) => {
      device.bhDrum!.i2c = { ...device.bhDrum!.i2c, ...BH_I2C };
    });
    matchI2c1Clocks();
  }
  assignMidiDrumSlot(id);
}
