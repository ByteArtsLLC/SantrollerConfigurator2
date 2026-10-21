import { describe, expect, it } from 'vitest';
import { proto } from './config.js';
import { centerTilt } from './tiltCenter';

const GH_TILT = { ghAxis: proto.GuitarHeroGuitarAxisType.GuitarHeroGuitar_Tilt };
const configWith = (...mappings: Omit<proto.IMapping, 'input'>[]) =>
  ({ profiles: [{ mappings }] }) as proto.IConfig;
const centers = (config: proto.IConfig) => config.profiles![0].mappings!.map((m) => m.center);

describe('centerTilt', () => {
  it('moves a tilt centered at 0 to the middle of its range', () => {
    const config = configWith(
      { mapping: GH_TILT, min: 0, max: 65535, center: 0 },
      {
        mapping: { rbAxis: proto.RockBandGuitarAxisType.RockBandGuitar_Tilt },
        min: 30000,
        max: 50000,
      }
    );
    expect(centerTilt(config)).toBe(true);
    expect(centers(config)).toEqual([32768, 40000]);
  });

  it('leaves tilt switches, sections, set centers and other axes alone', () => {
    const config = configWith(
      { mapping: GH_TILT, pressed: 65535, center: 0 },
      { mapping: GH_TILT, section: proto.AxisSection.AxisSectionPositive, center: 0 },
      { mapping: GH_TILT, min: 32767, max: 49151, center: 40959 },
      { mapping: { ghAxis: proto.GuitarHeroGuitarAxisType.GuitarHeroGuitar_Whammy }, center: 0 }
    );
    expect(centerTilt(config)).toBe(false);
    expect(centers(config)).toEqual([0, 0, 40959, 0]);
  });
});
