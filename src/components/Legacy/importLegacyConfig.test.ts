import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { proto } from '@/components/SettingsContext/config';
import { importLegacyConfig, importLegacyConfigs } from './importLegacyConfig';
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
    expect(warnings.some((w) => w.key === 'legacyImport.fortniteModesUnsupported')).toBe(true);
  });

  it('imports a USB keyboard layout with a PS3 pressure binding', () => {
    const { config, warnings } = importLegacyConfig(fixture('iidxkeyboard.picoconfig'));
    const profile = config.profiles[0];
    expect(profile.opts.deviceToEmulate).toBe(proto.SubType.Gamepad);
    // keyboard keys are read like a controller's buttons, with the key as the button
    const keyMappings = profile.mappings.filter((m) => m.input?.usbButton?.button?.keycode != null);
    const padMappings = profile.mappings.filter(
      (m) => m.input?.usbButton && m.input.usbButton.button?.keycode == null
    );
    const keys = (button: proto.GamepadButtonType) =>
      keyMappings
        .filter((m) => m.mapping?.gamepadButton === button)
        .map((m) => m.input!.usbButton!.button!.keycode);

    // the pressure cross binding on End became a cross press
    const [cross] = keyMappings.filter(
      (m) => m.mapping?.gamepadButton === proto.GamepadButtonType.Gamepad_A
    );
    expect(cross).toMatchObject({
      input: { usbButton: { button: { keycode: 0x4d } } },
      debounce100us: 10,
    });
    expect(warnings).not.toContainEqual({ key: 'legacyImport.hostBindingSkipped' });

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
    expect(new Set(padMappings.map((m) => m.input!.usbButton!.deviceid))).toEqual(new Set([1]));
    expect(new Set(keyMappings.map((m) => m.input!.usbButton!.deviceid))).toEqual(new Set([2]));
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

describe('importLegacyConfigs', () => {
  const SB = legacy.StandardButtonType;
  // A USB host on GP2 and an MPR121 on the given pins, with a button on each
  const encode = (sda: number, scl: number, button: legacy.StandardButtonType) =>
    legacy.SerializedConfiguration.encode(
      legacy.SerializedConfiguration.create({
        deviceType: legacy.DeviceControllerType.DeviceControllerType_Gamepad,
        usbHostDp: 2,
        hasMpr121: true,
        mpr121Sda: sda,
        mpr121Scl: scl,
        bindings: [
          {
            serializedControllerButton: {
              type: button,
              input: { serializedMpr121Input: { input: 0 } },
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

  it('gives each file a profile and shares the devices they have in common', () => {
    const { config } = importLegacyConfigs([
      { data: encode(4, 5, SB.StandardButtonType_A), name: 'first' },
      { data: encode(8, 9, SB.StandardButtonType_X), name: 'second' },
    ]);
    expect(config.profiles.map((p) => [p.opts.uid, p.opts.name])).toEqual([
      [1, 'first'],
      [2, 'second'],
    ]);
    // the USB host is the same in both, the MPR121s are on different pins
    expect(config.devices.filter((d) => d.usbHost)).toHaveLength(1);
    const mpr121Sda = (profile: proto.IProfile) => {
      const id = profile.mappings!.find((m) => m.input?.mpr121)!.input!.mpr121!.deviceid;
      return config.devices.find((d) => d.deviceid === id)?.mpr121?.i2c?.sda;
    };
    expect(config.profiles.map(mpr121Sda)).toEqual([4, 8]);
    // slots belong to each profile, so the USB host inputs keep their slot
    expect(
      config.profiles.map(
        (p) => p.mappings.find((m) => m.input?.usbButton)?.input?.usbButton?.deviceid
      )
    ).toEqual([1, 1]);
  });

  it('names the file that could not be read', () => {
    expect(() =>
      importLegacyConfigs([
        { data: encode(4, 5, SB.StandardButtonType_A), name: 'good' },
        { data: new Uint8Array([0xff, 0xff, 0xff]), name: 'broken' },
      ])
    ).toThrow(/^broken: /);
  });
});
