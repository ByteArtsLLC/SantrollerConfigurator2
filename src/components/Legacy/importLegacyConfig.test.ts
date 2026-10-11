import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { proto } from '@/components/SettingsContext/config';
import { importLegacyConfig } from './importLegacyConfig';
import { legacy } from './legacy';

const fixture = (name: string) => readFileSync(join(__dirname, '__fixtures__', name));

describe('importLegacyConfig', () => {
  it('imports a Rock Band guitar with shared solo fret pins', () => {
    const { config, warnings } = importLegacyConfig(fixture('reampedsunburst.picoconfig'));
    const profile = config.profiles[0];
    expect(profile.opts.deviceToEmulate).toBe(proto.SubType.RockBandGuitar);
    const byOutput = (output: proto.IOutput) =>
      profile.mappings.filter(
        (m) =>
          JSON.stringify(proto.Output.toObject(m.mapping as proto.Output)) ===
          JSON.stringify(output)
      );

    // the solo frets were bound to the same pins as the upper frets
    const RB = proto.RockBandGuitarButtonType;
    for (const [pin, fret, solo] of [
      [14, RB.RockBandGuitar_Green, RB.RockBandGuitar_SoloGreen],
      [11, RB.RockBandGuitar_Red, RB.RockBandGuitar_SoloRed],
      [10, RB.RockBandGuitar_Orange, RB.RockBandGuitar_SoloOrange],
    ]) {
      for (const output of [fret, solo]) {
        const [mapping] = byOutput({ rbButton: output });
        expect(mapping.input?.gpio).toMatchObject({
          pin,
          pinMode: proto.PinMode.PullUp,
          analog: false,
        });
        // the old global 1ms debounce
        expect(mapping.debounce100us).toBe(10);
      }
    }
    expect(
      byOutput({ gamepadButton: proto.GamepadButtonType.Gamepad_DpadUp })[0].input?.gpio?.pin
    ).toBe(21);

    const [whammy] = byOutput({ rbAxis: proto.RockBandGuitarAxisType.RockBandGuitar_Whammy });
    expect(whammy).toMatchObject({ min: 65520, max: 18512, center: 0 });
    expect(whammy.input?.gpio).toMatchObject({ pin: 26, analog: true });

    const [pickup] = byOutput({ rbAxis: proto.RockBandGuitarAxisType.RockBandGuitar_Pickup });
    expect(pickup.pickupThresholds).toEqual([14659, 27076, 40701, 56567]);

    // the old Fortnite Festival toggle on GP7 has no new equivalent
    expect(warnings.some((w) => w.includes('Fortnite Festival'))).toBe(true);
  });

  it('imports a USB keyboard layout with a PS3 pressure binding', () => {
    const { config, warnings } = importLegacyConfig(fixture('iidxkeyboard.picoconfig'));
    const profile = config.profiles[0];
    expect(profile.opts.deviceToEmulate).toBe(proto.SubType.Gamepad);
    const keys = (button: proto.GamepadButtonType) =>
      profile.mappings
        .filter((m) => m.mapping?.gamepadButton === button && m.input?.key)
        .map((m) => m.input!.key!.key);

    // the pressure cross binding on End became a cross press
    const [cross] = profile.mappings.filter(
      (m) => m.mapping?.gamepadButton === proto.GamepadButtonType.Gamepad_A && m.input?.key
    );
    expect(cross).toMatchObject({ input: { key: { key: 0x4d } }, debounce100us: 10 });
    expect(warnings.some((w) => w.includes('pressure'))).toBe(false);

    // both key sets were kept: S and left arrow
    expect(keys(proto.GamepadButtonType.Gamepad_DpadLeft)).toEqual([0x16, 0x50]);

    // the gamepad and keyboard work together or on their own, and keep their slots in every list.
    // With only USB host inputs there's no list without them, so plugging one in later still works.
    expect(profile.opts.deviceSlotIdVersion).toBe(2);
    expect(profile.assignments.map((list) => list.assignments.map((x) => x.usbType))).toEqual([
      [null, proto.SubType.Gamepad, proto.SubType.KeyboardMouse],
      [null, proto.SubType.Gamepad],
      [null, proto.SubType.KeyboardMouse],
    ]);
    expect(
      new Set(
        profile.mappings.flatMap((m) => (m.input?.usbButton ? [m.input.usbButton.deviceid] : []))
      )
    ).toEqual(new Set([1]));
    expect(
      new Set(profile.mappings.flatMap((m) => (m.input?.key ? [m.input.key.deviceid] : [])))
    ).toEqual(new Set([2]));
  });

  it('keeps a list without the USB host for a config that also reads pins', () => {
    const SB = legacy.StandardButtonType;
    const data = legacy.SerializedConfiguration.encode(
      legacy.SerializedConfiguration.create({
        deviceType: legacy.DeviceControllerType.DeviceControllerType_Gamepad,
        bindings: [
          {
            serializedControllerButton: {
              type: SB.StandardButtonType_A,
              input: {
                serializedDirectInput: {
                  pin: 3,
                  pinMode: legacy.DevicePinMode.DevicePinMode_PullUp,
                },
              },
            },
          },
          {
            serializedCombinedUsbHostOutput: {
              outputs: [
                {
                  serializedControllerButton: {
                    type: SB.StandardButtonType_B,
                    input: {
                      serializedUsbHostInput: {
                        type: legacy.UsbHostInputType.UsbHostInputType_B,
                        combined: true,
                      },
                    },
                  },
                },
              ],
            },
          },
        ],
      })
    ).finish();
    const { config } = importLegacyConfig(data);
    // the pin works without the USB host controller, so the last list matches without it
    expect(
      config.profiles[0].assignments.map((list) => list.assignments.map((x) => x.usbType))
    ).toEqual([[null, proto.SubType.Gamepad], [null]]);
  });
});
