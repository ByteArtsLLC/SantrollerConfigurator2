import { useTranslation } from 'react-i18next';
import { Space, Switch } from '@mantine/core';
import { useConfigStore } from '@/components/SettingsContext/SettingsContext';

// Applies to the whole controller on Xbox One / Series, rather than a single profile
export function XboxOneLegacyAdapterSetting() {
  const { t } = useTranslation();
  const legacyAdapter = useConfigStore((state) => state.config.xboxOneLegacyAdapter);
  const legacyAdapterGamepad = useConfigStore((state) => state.config.xboxOneLegacyAdapterGamepad);
  const updateConfig = useConfigStore((state) => state.updateConfig);
  return (
    <>
      <Switch
        label={t('main.xboxOneLegacyAdapter.label')}
        description={t('main.xboxOneLegacyAdapter.description')}
        checked={!!legacyAdapter}
        onChange={(event) => updateConfig({ xboxOneLegacyAdapter: event.currentTarget.checked })}
      />
      <Space h="md" />
      <Switch
        label={t('main.xboxOneLegacyAdapterGamepad.label')}
        description={t('main.xboxOneLegacyAdapterGamepad.description')}
        // Unset means on, as in the firmware
        checked={legacyAdapterGamepad ?? true}
        onChange={(event) => updateConfig({ xboxOneLegacyAdapterGamepad: event.currentTarget.checked })}
      />
    </>
  );
}
