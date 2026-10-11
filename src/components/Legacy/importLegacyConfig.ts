import {
  getProfileWideSlotIds,
  getSlotDeviceKind,
  getSlotSubtype,
} from '@/components/Inputs/inputRegistry';
import {
  getInputSlotKind,
  remapProfileSlotInputs,
  remapSlotInputs,
} from '@/components/Inputs/slotRemap';
import { proto } from '@/components/SettingsContext/config';
import { LegacyImportContext } from './context';
import { convertHostMidiSettings } from './families/hostMidi';
import { convertInstrumentPeripheralSettings } from './families/instrumentPeripherals';
import { convertLedsModesSettings } from './families/ledsModes';
import { convertWiiPs2Settings } from './families/wiiPs2';

import './families';

import { legacy } from './legacy';
import { convertOutput } from './outputs';

export interface LegacyImportResult {
  config: proto.Config;
  aux: proto.AuxConfigBlock;
  // Things that couldn't be imported exactly, to show to the user
  warnings: string[];
}

function emulatedSubType(
  old: legacy.SerializedConfiguration,
  warn: (m: string) => void
): proto.SubType {
  switch (old.emulationType) {
    case legacy.EmulationType.EmulationType_KeyboardMouse:
    case legacy.EmulationType.EmulationType_BluetoothKeyboardMouse:
      return proto.SubType.KeyboardMouse;
    case legacy.EmulationType.EmulationType_FortniteFestival:
      warn('Fortnite Festival mode was imported as the controller type it was set up with.');
      break;
  }
  // The old controller types use the same numbers as the new ones
  const type = old.deviceType ?? legacy.DeviceControllerType.DeviceControllerType_Gamepad;
  return proto.SubType[type] != null ? (type as number as proto.SubType) : proto.SubType.Gamepad;
}

// Lists of slot combinations beyond this are left as all or nothing
const MAX_SLOT_COMBINATIONS = 16;

// Whether an input reads something other than a device in a profile slot, eg a pin
function readsLocalInput(input: proto.IInput | null | undefined): boolean {
  if (!input || getInputSlotKind(input)) {
    return false;
  }
  if (input.shortcut) {
    return (input.shortcut.inputs ?? []).some(readsLocalInput);
  }
  const children = [
    input.held?.input,
    input.shifted?.input,
    input.shifted?.shift,
    input.cycle?.input,
    input.cycle?.inputReverse,
    input.toggle?.input,
  ];
  if (input.held || input.shifted || input.cycle || input.toggle) {
    return children.some(readsLocalInput);
  }
  return !input.fixed;
}

// The old firmware read every device it had bindings for, whichever of them were plugged in, so
// each assignment list is copied for every combination of its slots (largest first) instead of
// needing all of them. Within a kind and subtype only later slots are left out, so the slots that
// are kept still have the same ids. A profile claims the first list that matches and keeps it, so
// the list without any slots, which always matches, is only added when there are other inputs.
function expandOptionalSlots(
  ctx: LegacyImportContext,
  lists: proto.IProfileAssignment[],
  withoutSlots: boolean
): proto.IProfileAssignment[] {
  return lists.flatMap((list) => {
    const items = list.assignments ?? [];
    const groups = new Map<string, proto.IProfileAssignmentInfo[]>();
    for (const item of items.filter((x) => ctx.slotPlaceholders.has(x))) {
      const key = `${getSlotDeviceKind(item)}:${getSlotSubtype(item)}`;
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    if (groups.size === 0) {
      return [list];
    }
    let combinations: proto.IProfileAssignmentInfo[][] = [[]];
    const count = [...groups.values()].reduce((n, group) => n * (group.length + 1), 1);
    if (count > MAX_SLOT_COMBINATIONS) {
      ctx.warn(
        'There were too many controllers to try every combination of, so all of them have to be connected for the profile to match.'
      );
      combinations = [[...groups.values()].flat(), []];
    } else {
      for (const group of groups.values()) {
        combinations = combinations.flatMap((kept) =>
          Array.from({ length: group.length + 1 }, (_, i) => [
            ...kept,
            ...group.slice(0, group.length - i),
          ])
        );
      }
      // Array.sort is stable, so equal sizes keep the order above
      combinations.sort((a, b) => b.length - a.length);
    }
    return combinations
      .filter((kept) => withoutSlots || kept.length > 0)
      .map((kept) => ({
        ...list,
        assignments: items.filter((x) => !ctx.slotPlaceholders.has(x) || kept.includes(x)),
      }));
  });
}

// Moves the inputs from the slots used while converting to the profile wide ids of the final
// lists. A slot with alternatives (eg a Classic Controller Pro for a Classic Controller) has an id
// for each, so mappings reading it get a copy for each.
function assignSlotIds(
  ctx: LegacyImportContext,
  lists: proto.IProfileAssignment[],
  profile: proto.IProfile
): proto.IProfile {
  const ids = getProfileWideSlotIds(lists.map((list) => list.assignments ?? []));
  const choices = new Map<string, number[]>();
  lists.forEach((list, i) =>
    list.assignments?.forEach((item, j) => {
      const slot = ctx.slotPlaceholders.get(item);
      if (slot) {
        const key = `${slot.deviceKind}:${slot.slotId}`;
        const found = choices.get(key) ?? [];
        if (!found.includes(ids[i][j])) {
          choices.set(key, [...found, ids[i][j]]);
        }
      }
    })
  );
  const pick = (index: number) => (kind: string, slotId: number) => {
    const found = choices.get(`${kind}:${slotId}`);
    return found ? found[Math.min(index, found.length - 1)] : slotId;
  };
  const mappings = (profile.mappings ?? []).flatMap((mapping) => {
    if (!mapping.input) {
      return [mapping];
    }
    let copies = 1;
    remapSlotInputs(mapping.input, (kind, slotId) => {
      copies = Math.max(copies, choices.get(`${kind}:${slotId}`)?.length ?? 1);
      return slotId;
    });
    return Array.from({ length: copies }, (_, index) => ({
      ...mapping,
      input: remapSlotInputs(mapping.input!, pick(index)),
    }));
  });
  return { ...remapProfileSlotInputs({ ...profile, mappings: [] }, pick(0)), mappings };
}

// Converts a Santroller 1 .picoconfig file into a new config
export function importLegacyConfig(data: Uint8Array, name = 'Imported'): LegacyImportResult {
  const old = legacy.SerializedConfiguration.decode(data);
  const warnings: string[] = [];
  const subType = emulatedSubType(old, (m) => warnings.push(m));
  const ctx = new LegacyImportContext(old, subType);
  ctx.warnings.push(...warnings);

  for (const binding of old.bindings) {
    convertOutput(ctx, binding);
  }
  convertInstrumentPeripheralSettings(ctx);
  convertHostMidiSettings(ctx);
  // This copies the profile's assignments into every console mode, so it goes after anything
  // that adds assignments
  const settings = convertLedsModesSettings(ctx);
  // Wii Remote / PS2 console output only matches while that console is talking to the device, so
  // each gets a list of its own (assignments in one list all have to match)
  const emulation = convertWiiPs2Settings(ctx).map((info) => ({
    assignments: [info, ...ctx.assignments],
  }));

  // Copy mappings onto the other devices their old input read from
  ctx.mappings.splice(
    0,
    ctx.mappings.length,
    ...ctx.mappings.flatMap((mapping) => [
      mapping,
      ...(ctx.extraInputs.get(mapping.input!) ?? []).map((input) => ({ ...mapping, input })),
    ])
  );

  // The firmware only turns the tap frets into a GH5 slider value when this is on
  const TAPS = proto.GuitarHeroGuitarButtonType;
  const supportsSlider = ctx.mappings.some(
    (m) =>
      m.mapping?.ghButton != null &&
      m.mapping.ghButton >= TAPS.GuitarHeroGuitar_TapGreen &&
      m.mapping.ghButton <= TAPS.GuitarHeroGuitar_TapOrange
  );

  const lists = ctx.expandSlotAlternatives(
    expandOptionalSlots(
      ctx,
      [...settings.assignments, ...emulation],
      ctx.mappings.some((m) => readsLocalInput(m.input))
    )
  );
  const profile = assignSlotIds(ctx, lists, {
    opts: {
      uid: 1,
      name: old.variant || name,
      deviceToEmulate: subType,
      deviceSlotIdVersion: 2,
      faceButtonMappingMode: old.swapSwitchFaceButtons
        ? proto.FaceButtonMappingMode.PositionBased
        : proto.FaceButtonMappingMode.LegendBased,
      xinputOnWindows: old.xInputOnWindows,
      invertYAxisHid: old.invertHidYAxis,
      cymbalGlitchFix: old.rb3CymbalGlitchFix,
      queueInputs: old.queueBasedInputs,
      combinedStrumDebounce: old.combinedStrumDebounce,
      selectToDpadLeft: old.selectDpadLeftXb1,
      ps3OnRpcs3: old.ps3OnRpcs3,
      fullRangeTurntableOnPc: old.djFullRange,
      supportsSlider,
    },
    assignments: lists,
    mappings: ctx.mappings,
    leds: ctx.leds,
  });

  const config = proto.Config.fromObject({
    devices: ctx.devices,
    profiles: [profile],
    guiConfig: [],
    ...(settings.inactivity ? { inactivity: settings.inactivity } : {}),
  });
  const error = proto.Config.verify(config);
  if (error) {
    throw new Error(`The imported config is invalid: ${error}`);
  }
  return {
    config,
    aux: proto.AuxConfigBlock.create({
      states: [],
      toggleStates: [],
      bluetoothStates: [],
      tlvEntries: [],
    }),
    warnings: ctx.warnings,
  };
}
