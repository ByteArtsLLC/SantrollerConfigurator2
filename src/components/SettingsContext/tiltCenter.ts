import { proto } from './config.js';

function isTilt(output: proto.IOutput | null | undefined): boolean {
  return (
    output?.ghAxis === proto.GuitarHeroGuitarAxisType.GuitarHeroGuitar_Tilt ||
    output?.rbAxis === proto.RockBandGuitarAxisType.RockBandGuitar_Tilt ||
    output?.ghlAxis === proto.GuitarHeroLiveGuitarAxisType.GuitarHeroLiveGuitar_Tilt ||
    output?.proAxis === proto.ProGuitarAxisType.ProGuitar_Tilt
  );
}

/**
 * Tilt used to default to a center of 0, but every guitar rests in the middle of its range when
 * horizontal, so a level guitar calibrated to partly tilted. The center isn't shown for tilt in the
 * editor, so it is moved to the middle of the calibrated range. Tilt switches send a fixed value
 * while pressed and sections calibrate like a trigger, so neither uses the center and both are left
 * alone. Returns whether anything changed.
 */
export function centerTilt(config: proto.IConfig): boolean {
  let changed = false;
  config.profiles?.forEach((profile) => {
    profile.mappings?.forEach((mapping) => {
      if (
        !isTilt(mapping.mapping) ||
        mapping.pressed != null ||
        (mapping.section ?? proto.AxisSection.AxisSectionFull) !==
          proto.AxisSection.AxisSectionFull ||
        (mapping.center ?? 0) !== 0
      ) {
        return;
      }
      mapping.center = Math.round(((mapping.min ?? 0) + (mapping.max ?? 65535)) / 2);
      changed = true;
    });
  });
  return changed;
}
