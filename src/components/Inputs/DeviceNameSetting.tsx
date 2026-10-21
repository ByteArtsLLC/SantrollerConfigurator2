import { useTranslation } from 'react-i18next';
import { Stack, TextInput } from '@mantine/core';
import { truncateProfileName } from '@/components/SettingsContext/profileName';
import { useConfigStore } from '@/components/SettingsContext/SettingsContext';

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

export function DeviceIdentitySettings({ commercial = false }: { commercial?: boolean }) {
  const { t } = useTranslation();
  const commercialTool = useConfigStore((state) => state.seller || !!state.toolInfo);
  const manufacturerName = useConfigStore((state) => state.config.manufacturerName);
  const updateConfig = useConfigStore((state) => state.updateConfig);
  if (commercial !== commercialTool) {
    return null;
  }
  return (
    <Stack gap="md">
      <DeviceNameSetting />
      <TextInput
        value={manufacturerName ?? ''}
        placeholder="sanjay900"
        onChange={(e) =>
          updateConfig({ manufacturerName: truncateProfileName(e.currentTarget.value) })
        }
        label={t('main.manufacturer_name.label')}
        description={t('main.manufacturer_name.description')}
      />
    </Stack>
  );
}
