import { getSlotDeviceKind } from '@/components/Inputs/inputRegistry';
import { proto } from '@/components/SettingsContext/config';
import { ConfigState, useConfigStore } from '@/components/SettingsContext/SettingsContext';

// config.devices is only rebuilt on connect, so guides read live devices from deviceStatus
export function findDeviceStatus(state: ConfigState, kind: keyof proto.IDevice) {
  return Object.values(state.deviceStatus).find((d) => d.device[kind] != null);
}

const defaultConsoleAssignment: proto.IProfileAssignmentInfo = {
  consoleType: {
    consoleType: null,
    forcedType: null,
    xinputOnWindows: true,
    ps4OrPs5Mode: false,
  },
};

/**
 * Adapter style devices (Wii extensions, PS2 controllers, USB host) only drive a profile once it
 * has a slot for them, so this adds one to the active profile (the same list the Inputs page's
 * adapter presets build) and loads the device's default mappings into that slot.
 * Does nothing when the profile already has a slot for that kind of device, so the defaults are
 * never loaded twice.
 */
export function assignDeviceToProfile(deviceId: string, slot: proto.IProfileAssignmentInfo) {
  const store = useConfigStore.getState();
  const profileIdx = store.currentProfile;
  const profile = store.config.profiles?.[profileIdx];
  const kind = getSlotDeviceKind(slot);
  if (!profile || !kind) {
    return;
  }
  const lists = profile.assignments ?? [];
  const hasSlot = lists.some((list) =>
    (list.assignments ?? []).some((item) => getSlotDeviceKind(item) === kind)
  );
  if (hasSlot) {
    return;
  }
  // Extend a plain console list rather than adding a second list that would match without the
  // device connected
  const consoleOnly = lists.findIndex((list) =>
    (list.assignments ?? []).every((item) => item.consoleType != null)
  );
  const assignments =
    consoleOnly === -1
      ? [...lists, { assignments: [defaultConsoleAssignment, slot] }]
      : lists.map((list, i) =>
          i === consoleOnly
            ? {
                ...list,
                assignments: [
                  ...(list.assignments?.length ? list.assignments : [defaultConsoleAssignment]),
                  slot,
                ],
              }
            : list
        );
  store.updateProfile({ ...profile, assignments }, profileIdx);
  const status = useConfigStore.getState().deviceStatus[deviceId];
  if (status) {
    useConfigStore.getState().loadDefaults(status);
  }
}
