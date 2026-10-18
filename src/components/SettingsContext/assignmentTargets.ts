import { migrateSlotIds } from '@/components/Inputs/slotRemap';
import { proto } from './config.js';

// What a rule outputs to. A rule has one, and the rule editor shows and edits the first it finds
export const TARGET_ASSIGNMENT_TYPES: (keyof proto.IProfileAssignmentInfo)[] = [
  'ps2Emulation',
  'wiiEmulation',
  'joybusEmulation',
  'snesEmulation',
  'bluetooth',
  'consoleType',
];

export const isTarget = (assignment: proto.IProfileAssignmentInfo) =>
  TARGET_ASSIGNMENT_TYPES.some((type) => assignment[type] != null);

const infoKey = (info: proto.IProfileAssignmentInfo) =>
  JSON.stringify(
    proto.ProfileAssignmentInfo.toObject(proto.ProfileAssignmentInfo.fromObject(info))
  );
const listKey = (list: proto.IProfileAssignmentInfo[]) => JSON.stringify(list.map(infoKey));

/**
 * The same rule outputting to target and nothing else. The target takes the place of the rule's
 * first one, so every other assignment keeps its position (and with it its slot id). A rule without
 * a target gets it in front.
 */
export function retargetRule(
  list: proto.IProfileAssignmentInfo[],
  target: proto.IProfileAssignmentInfo
): proto.IProfileAssignmentInfo[] {
  const first = list.findIndex(isTarget);
  if (first === -1) {
    return [target, ...list];
  }
  return list.flatMap((item, i) => (i === first ? [target] : isTarget(item) ? [] : [item]));
}

/**
 * Some configs ended up with rules that have more than one target (eg USB and bluetooth). The
 * firmware outputs the profile on each of them, so it shows up as two devices, while the editor only
 * shows the first. Each extra target becomes a rule of its own, right after the one it came from:
 * the firmware only runs one rule per profile, and a USB rule stops matching without a host, so the
 * rule after it (eg bluetooth) takes over then. Repeats of a target, and rules the split made twice,
 * are dropped. Returns whether anything changed.
 */
export function splitExtraTargets(config: proto.IConfig): boolean {
  let changed = false;
  config.profiles = config.profiles?.map((original) => {
    const needsSplit = (original.assignments ?? []).some(
      (list) => (list.assignments ?? []).filter(isTarget).length > 1
    );
    if (!needsSplit) {
      return original;
    }
    changed = true;
    // Copies of a rule only keep reading the same devices with profile wide slot ids
    const profile = migrateSlotIds(original);
    const rules = (profile.assignments ?? []).flatMap((list) => {
      const assignments = list.assignments ?? [];
      const targets = assignments.filter(isTarget);
      return targets.length
        ? targets.map((target) => retargetRule(assignments, target))
        : [assignments];
    });
    const seen = new Set<string>();
    const assignments = rules
      .filter((rule) => {
        const key = listKey(rule);
        return !seen.has(key) && !!seen.add(key);
      })
      .map((rule) => ({ assignments: rule }));
    return { ...profile, assignments } as proto.IProfile;
  });
  return changed;
}
