import { proto } from '@/components/SettingsContext/config';
import { getProfileSlotIds, getSlotDeviceKind } from './inputRegistry';

// The slot kind an input reads from, for inputs that read a device through a profile slot
export function getInputSlotKind(input: proto.IInput): string | undefined {
  if (input.usbAxis || input.usbButton || input.key || input.mouseAxis || input.mouseButton) {
    return 'usbHost';
  }
  if (input.btAxis || input.btButton) {
    return 'bt';
  }
  if (input.ps2Axis || input.ps2Button) {
    return 'psx';
  }
  if (input.wiiAxis || input.wiiButton) {
    return 'wii';
  }
  switch (input.midi?.sourceType) {
    case proto.MidiInputSourceType.MidiInputSourceType_MIDI:
      return 'midi';
    case proto.MidiInputSourceType.MidiInputSourceType_USB:
      return 'usbHost';
    case proto.MidiInputSourceType.MidiInputSourceType_Bluetooth:
      return 'bt';
    case proto.MidiInputSourceType.MidiInputSourceType_Wii:
      return 'wii';
    default:
      return undefined;
  }
}

const SLOT_INPUT_KINDS = [
  'usbAxis',
  'usbButton',
  'key',
  'mouseAxis',
  'mouseButton',
  'btAxis',
  'btButton',
  'ps2Axis',
  'ps2Button',
  'wiiAxis',
  'wiiButton',
  'midi',
] as const;

// Returns the input with the slot ids of it and the inputs inside it changed by `remap`
export function remapSlotInputs(
  input: proto.IInput,
  remap: (kind: string, slotId: number) => number
): proto.IInput {
  const kind = getInputSlotKind(input);
  if (kind) {
    for (const field of SLOT_INPUT_KINDS) {
      const value = input[field];
      if (value?.deviceid != null) {
        const deviceid = remap(kind, value.deviceid);
        return deviceid === value.deviceid ? input : { ...input, [field]: { ...value, deviceid } };
      }
    }
    return input;
  }
  const child = (x: proto.IInput | null | undefined) => (x ? remapSlotInputs(x, remap) : x);
  if (input.shortcut) {
    return {
      ...input,
      shortcut: {
        ...input.shortcut,
        inputs: input.shortcut.inputs?.map((x) => remapSlotInputs(x, remap)),
      },
    };
  }
  if (input.held) {
    return { ...input, held: { ...input.held, input: child(input.held.input)! } };
  }
  if (input.shifted) {
    return {
      ...input,
      shifted: {
        ...input.shifted,
        input: child(input.shifted.input),
        shift: child(input.shifted.shift),
      },
    };
  }
  if (input.cycle) {
    return {
      ...input,
      cycle: {
        ...input.cycle,
        input: child(input.cycle.input),
        inputReverse: child(input.cycle.inputReverse),
      },
    };
  }
  if (input.toggle) {
    return { ...input, toggle: { ...input.toggle, input: child(input.toggle.input) } };
  }
  return input;
}

// Returns the profile with the slot ids of every input in it changed by `remap`
export function remapProfileSlotInputs(
  profile: proto.IProfile,
  remap: (kind: string, slotId: number) => number
): proto.IProfile {
  const inputOf = <T extends proto.IInput | null | undefined>(x: T): T =>
    x ? (remapSlotInputs(x, remap) as T) : x;
  return {
    ...profile,
    mappings: profile.mappings?.map((m) =>
      m.input ? { ...m, input: remapSlotInputs(m.input, remap) } : m
    ),
    leds: profile.leds?.map((led) =>
      led.mapping?.inputMapping?.input
        ? {
            ...led,
            mapping: {
              ...led.mapping,
              inputMapping: {
                ...led.mapping.inputMapping,
                input: inputOf(led.mapping.inputMapping.input),
              },
            },
          }
        : led
    ),
    assignments: profile.assignments?.map((list) => ({
      ...list,
      assignments: list.assignments?.map((item) => ({
        ...item,
        ...(item.input ? { input: { ...item.input, input: inputOf(item.input.input) } } : {}),
        ...(item.inputAnyTime
          ? { inputAnyTime: { ...item.inputAnyTime, input: inputOf(item.inputAnyTime.input) } }
          : {}),
      })),
    })),
  };
}

// The kind, subtype and n of each slot in each list, which say which slot it is when lists are
// added or removed
function slotKeys(profile: proto.IProfile) {
  return (profile.assignments ?? []).map((list) => {
    const counts = new Map<string, number>();
    return (list.assignments ?? []).map((item) => {
      const kind = getSlotDeviceKind(item);
      if (!kind) {
        return undefined;
      }
      const type = JSON.stringify([
        item.usbType,
        item.usbDevice?.subtype,
        item.bluetoothType,
        item.bluetoothDevice?.subtype,
        item.ps2Cnt,
        item.wiiExt,
      ]);
      const n = (counts.get(`${kind}:${type}`) ?? 0) + 1;
      counts.set(`${kind}:${type}`, n);
      return `${kind}:${type}:${n}`;
    });
  });
}

// deviceSlotIdVersion 2 numbers slots across the whole profile, so changing the assignments can
// change the ids of other slots. This moves the inputs of `next` to the ids their slots have now.
// Slots are followed by position when the lists keep their shape (eg a slot's type changed), and
// by kind, subtype and n otherwise (eg a list was added or removed).
export function remapEditedSlotIds(prev: proto.IProfile, next: proto.IProfile): proto.IProfile {
  if ((prev.opts?.deviceSlotIdVersion ?? 0) < 2 || (next.opts?.deviceSlotIdVersion ?? 0) < 2) {
    return next;
  }
  const prevLists = prev.assignments ?? [];
  const nextLists = next.assignments ?? [];
  const prevIds = getProfileSlotIds(prev);
  const nextIds = getProfileSlotIds(next);
  const sameShape =
    prevLists.length === nextLists.length &&
    prevLists.every(
      (list, i) => (list.assignments?.length ?? 0) === (nextLists[i].assignments?.length ?? 0)
    );

  // Every new id each old slot was paired with, and the one it keeps by kind, subtype and n
  const candidates = new Map<string, Set<number>>();
  const byKey = new Map<string, number>();
  const prevKeys = slotKeys(prev);
  const nextKeys = slotKeys(next);
  const nextIdOfKey = new Map<string, number>();
  nextKeys.forEach((list, i) =>
    list.forEach((key, j) => key && nextIdOfKey.set(key, nextIds[i][j]))
  );
  prevKeys.forEach((list, i) =>
    list.forEach((key, j) => {
      if (!key) {
        return;
      }
      const old = `${key.split(':')[0]}:${prevIds[i][j]}`;
      const kept = nextIdOfKey.get(key);
      if (kept != null) {
        byKey.set(old, kept);
      }
      let paired: number | undefined = kept;
      if (sameShape) {
        const nextItem = nextLists[i].assignments![j];
        paired = getSlotDeviceKind(nextItem) === key.split(':')[0] ? nextIds[i][j] : undefined;
      }
      if (paired != null) {
        candidates.set(old, (candidates.get(old) ?? new Set()).add(paired));
      }
    })
  );

  const remap = new Map<string, number>();
  // Inputs of a slot that was removed would otherwise read whichever slot has its id now
  const nextUsed = new Set(
    nextKeys.flatMap((list, i) =>
      list.flatMap((key, j) => (key ? [`${key.split(':')[0]}:${nextIds[i][j]}`] : []))
    )
  );
  prevKeys.forEach((list, i) =>
    list.forEach((key, j) => {
      const old = key && `${key.split(':')[0]}:${prevIds[i][j]}`;
      if (old && !candidates.has(old) && nextUsed.has(old)) {
        remap.set(old, 0);
      }
    })
  );
  for (const [old, ids] of candidates) {
    // A slot that changed in one list but not another stays with the unchanged one
    const id = ids.size === 1 ? [...ids][0] : (byKey.get(old) ?? [...ids][0]);
    if (`${old.split(':')[0]}:${id}` !== old) {
      remap.set(old, id);
    }
  }
  if (remap.size === 0) {
    return next;
  }
  return remapProfileSlotInputs(next, (kind, id) => remap.get(`${kind}:${id}`) ?? id);
}
