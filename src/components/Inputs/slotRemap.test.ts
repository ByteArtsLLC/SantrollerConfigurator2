import { describe, expect, it } from 'vitest';
import { proto } from '@/components/SettingsContext/config';
import { getProfileSlotForInput, getProfileSlots, getProfileWideSlotIds } from './inputRegistry';
import { remapEditedSlotIds } from './slotRemap';

const ST = proto.SubType;
const console_: proto.IProfileAssignmentInfo = { consoleType: {} };
const gamepad: proto.IProfileAssignmentInfo = { usbType: ST.Gamepad };
const keyboard: proto.IProfileAssignmentInfo = { usbType: ST.KeyboardMouse };
const guitar: proto.IProfileAssignmentInfo = { usbType: ST.GuitarHeroGuitar };
const beatmania: proto.IProfileAssignmentInfo = { usbType: ST.BeatMania };

// The same cases as the firmware's ProfileSlotIds tests, as both have to agree
describe('profile wide slot ids', () => {
  it('keeps each subtype on its id in every list', () => {
    expect(
      getProfileWideSlotIds([
        [console_, gamepad, keyboard],
        [console_, gamepad],
        [console_, keyboard],
        [console_],
      ])
    ).toEqual([[0, 1, 2], [0, 1], [0, 2], [0]]);
  });

  it("doesn't depend on the order of the lists", () => {
    expect(getProfileWideSlotIds([[keyboard], [keyboard, gamepad]])).toEqual([[2], [2, 1]]);
  });

  it('numbers slots of the same subtype in list order', () => {
    expect(getProfileWideSlotIds([[gamepad, guitar, gamepad], [gamepad]])).toEqual([
      [1, 3, 2],
      [1],
    ]);
  });

  it('numbers kinds separately', () => {
    expect(
      getProfileWideSlotIds([
        [{ wiiExt: proto.WiiExtType.WiiClassicController }, gamepad],
        [{ wiiExt: proto.WiiExtType.WiiClassicControllerPro }],
      ])
    ).toEqual([[1, 1], [2]]);
  });

  it('numbers specific devices with their subtype', () => {
    expect(
      getProfileWideSlotIds([
        [
          { usbDevice: { vid: 1, pid: 2 } },
          keyboard,
          { usbDevice: { vid: 3, pid: 4, subtype: ST.Gamepad } },
        ],
        [gamepad],
      ])
    ).toEqual([[3, 2, 1], [1]]);
  });

  it('gives each device its own slot in the profile', () => {
    const profile: proto.IProfile = {
      opts: {
        uid: 1,
        name: 'p',
        deviceToEmulate: ST.Gamepad,
        faceButtonMappingMode: proto.FaceButtonMappingMode.LegendBased,
        deviceSlotIdVersion: 2,
      },
      assignments: [{ assignments: [gamepad] }, { assignments: [keyboard] }],
    };
    const slots = getProfileSlots(profile);
    expect(slots.map((s) => [s.slotId, s.item.usbType])).toEqual([
      [1, ST.Gamepad],
      [2, ST.KeyboardMouse],
    ]);
    // Keyboard keys read the keyboard's slot
    expect(getProfileSlotForInput({ key: { deviceid: 2, key: 4 } }, slots)?.item).toBe(keyboard);
  });
});

describe('editing slots', () => {
  const profile = (lists: proto.IProfileAssignmentInfo[][], version = 2): proto.IProfile => ({
    opts: {
      uid: 1,
      name: 'p',
      deviceToEmulate: ST.Gamepad,
      faceButtonMappingMode: proto.FaceButtonMappingMode.LegendBased,
      deviceSlotIdVersion: version,
    },
    assignments: lists.map((assignments) => ({ assignments })),
    mappings: [
      {
        mapping: { gamepadButton: proto.GamepadButtonType.Gamepad_A },
        input: { usbButton: { deviceid: 1, button: { gamepadButton: 1 } } },
      },
      {
        mapping: { gamepadButton: proto.GamepadButtonType.Gamepad_B },
        input: { shortcut: { inputs: [{ key: { deviceid: 2, key: 4 } }] } },
      },
    ],
  });
  const deviceIds = (p: proto.IProfile) =>
    p.mappings!.map(
      (m) => m.input?.usbButton?.deviceid ?? m.input?.shortcut?.inputs?.[0].key?.deviceid
    );

  it('moves inputs to the ids their slots get when another slot is added', () => {
    // A guitar sorts before the keyboard, so the keyboard moves from 2 to 3
    const next = remapEditedSlotIds(
      profile([[gamepad, keyboard]]),
      profile([[gamepad, keyboard], [guitar]])
    );
    expect(deviceIds(next)).toEqual([1, 3]);
  });

  it('follows a slot whose type changed', () => {
    // The gamepad becomes a BeatMania controller, which sorts after the keyboard
    const next = remapEditedSlotIds(
      profile([[gamepad, keyboard]]),
      profile([[beatmania, keyboard]])
    );
    expect(deviceIds(next)).toEqual([2, 1]);
  });

  it("doesn't leave a removed slot's inputs on another slot", () => {
    const next = remapEditedSlotIds(profile([[gamepad, keyboard]]), profile([[keyboard]]));
    expect(deviceIds(next)).toEqual([0, 1]);
  });

  it('leaves older profiles alone', () => {
    const next = profile([[guitar, keyboard]], 1);
    expect(remapEditedSlotIds(profile([[gamepad, keyboard]], 1), next)).toBe(next);
  });
});
