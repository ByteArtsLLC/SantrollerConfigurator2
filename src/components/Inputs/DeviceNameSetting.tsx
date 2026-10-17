import { useTranslation } from 'react-i18next';
import { TextInput } from '@mantine/core';
import { useConfigStore } from '@/components/SettingsContext/SettingsContext';
import { truncateProfileName } from '@/components/SettingsContext/profileName';

// What the whole controller is called over USB and bluetooth, rather than a single profile
export function DeviceNameSetting() {
  const { t } = useTranslation();
  const deviceName = useConfigStore((state) => state.config.deviceName);
  const updateConfig = useConfigStore((state) => state.updateConfig);
  return (
    <TextInput
      value={deviceName ?? ''}
      placeholder="Santroller"
      onChange={(e) => updateConfig({ deviceName: truncateProfileName(e.currentTarget.value) })}
      label={t('main.device_name.label')}
      description={t('main.device_name.description')}
    />
  );
}
