import { useEffect, useState } from 'react';
import { IconAlertTriangle } from '@tabler/icons-react';
import { relaunch } from '@tauri-apps/plugin-process';
import { check, Update } from '@tauri-apps/plugin-updater';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Flex, Group, Modal, Progress, Space, Text } from '@mantine/core';
import { useConfigStore } from '@/components/SettingsContext/SettingsContext';
import { useUpdateCheck } from './updateCheckStore';

// Every push to main is released, so look again now and then for people who leave it open
const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;

// Offers to install a newer release of the desktop app, and restarts into it
export default function UpdatePrompt() {
  const { t } = useTranslation();
  const [update, setUpdate] = useState<Update>();
  const [dismissed, setDismissed] = useState<string>();
  const [installing, setInstalling] = useState(false);
  // undefined until the download's size is known
  const [progress, setProgress] = useState<number>();
  const [error, setError] = useState<string>();
  const updatingFirmware = useConfigStore((state) => state.updating);
  const unsaved = useConfigStore((state) => state.configModified && state.connected);

  useEffect(() => {
    // a dev build is always older than the latest release
    if (import.meta.env.DEV) {
      return undefined;
    }
    const look = () =>
      check()
        .then((found) => found && setUpdate(found))
        .catch((e) => console.error('Failed to check for updates', e));
    look();
    const timer = setInterval(look, CHECK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  // Asked for by hand, so show the update again even if it was put off, and say when there isn't one
  const requests = useUpdateCheck((state) => state.requests);
  useEffect(() => {
    if (!requests) {
      return;
    }
    check()
      .then((found) => {
        useUpdateCheck.setState({ status: found ? 'idle' : 'upToDate' });
        if (found) {
          setDismissed(undefined);
          setUpdate(found);
        }
      })
      .catch((e) => {
        console.error('Failed to check for updates', e);
        useUpdateCheck.setState({ status: 'failed' });
      });
  }, [requests]);

  const install = async () => {
    if (!update) {
      return;
    }
    setError(undefined);
    setInstalling(true);
    setProgress(undefined);
    let total = 0;
    let downloaded = 0;
    try {
      await update.downloadAndInstall((event) => {
        if (event.event === 'Started') {
          total = event.data.contentLength ?? 0;
        } else if (event.event === 'Progress') {
          downloaded += event.data.chunkLength;
          setProgress(total ? (downloaded / total) * 100 : undefined);
        }
      });
      await relaunch();
    } catch (e) {
      console.error('Failed to install the update', e);
      setError(String(e));
      setInstalling(false);
    }
  };

  // Don't get in the way of a firmware update, flashing the controller matters more
  const opened = !!update && update.version !== dismissed && (installing || !updatingFirmware);

  return (
    <Modal
      opened={opened}
      onClose={() => !installing && setDismissed(update?.version)}
      withCloseButton={!installing}
      title={t('update.title')}
      centered
    >
      <Text size="sm">
        {t('update.desc', { version: update?.version, current: update?.currentVersion })}
      </Text>
      {unsaved && (
        <>
          <Space h="md" />
          <Alert variant="light" color="orange" icon={<IconAlertTriangle size={16} />}>
            {t('update.unsaved')}
          </Alert>
        </>
      )}
      {error && (
        <>
          <Space h="md" />
          <Alert variant="light" color="red" title={t('update.failed')}>
            {error}
          </Alert>
        </>
      )}
      {installing && (
        <>
          <Space h="md" />
          <Progress value={progress ?? 100} animated={!progress} size="lg" />
        </>
      )}
      <Flex justify="flex-end" mt="md">
        <Group>
          <Button onClick={install} loading={installing} disabled={updatingFirmware}>
            {t('update.install')}
          </Button>
          <Button
            variant="default"
            disabled={installing}
            onClick={() => setDismissed(update?.version)}
          >
            {t('update.later')}
          </Button>
        </Group>
      </Flex>
    </Modal>
  );
}
