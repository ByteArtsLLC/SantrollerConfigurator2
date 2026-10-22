import { useMemo } from 'react';
import { proto } from '@/components/SettingsContext/config';
import { useConfigStore } from '@/components/SettingsContext/SettingsContext';
import { labelInProfile } from './labelRegistry';

// The labels shown in the profile being edited
export function useProfileLabels(): proto.IGuiConfig[] {
  const guiDevices = useConfigStore((state) => state.guiDevices);
  const uid = useConfigStore((state) => state.config?.profiles?.[state.currentProfile]?.opts?.uid);
  return useMemo(
    () => Object.values(guiDevices).filter((label) => labelInProfile(label, uid)),
    [guiDevices, uid]
  );
}
