import {
  IconAlertTriangle,
  IconBrandDiscord,
  IconExclamationCircle,
  IconHistory,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Alert,
  Button,
  FileButton,
  Flex,
  Group,
  List,
  Modal,
  Progress,
  Space,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  DesktopDownloadButton,
  RELEASES_URL,
} from '@/components/DesktopDownload/DesktopDownloadButton';
import { Layout } from '@/components/Layout/Layout';
import { translateLegacyWarning } from '@/components/Legacy/warnings';
import { BluetoothConfigDevice } from '@/components/SettingsContext/BluetoothConfigDevice';
import { useConfigStore } from '@/components/SettingsContext/SettingsContext';

const isDesktop = 'isTauri' in window;

export function ConnectPage() {
  const connect = useConfigStore((state) => state.connect);
  const connectBluetooth = useConfigStore((state) => state.connectBluetooth);
  const disconnect = useConfigStore((state) => state.disconnect);
  const bootloader = useConfigStore((state) => state.bootloader);
  const exportConfig = useConfigStore((state) => state.exportConfig);
  const loadConfig = useConfigStore((state) => state.loadConfig);
  const importLegacy = useConfigStore((state) => state.importLegacyConfig);
  const legacyImportWarnings = useConfigStore((state) => state.legacyImportWarnings);
  const clearLegacyImportWarnings = useConfigStore((state) => state.clearLegacyImportWarnings);
  const firmwareUpdate = useConfigStore((state) => state.firmwareUpdate);
  const connected = useConfigStore((state) => state.connected);
  const firmwareVersion = useConfigStore((state) => state.firmwareVersion);
  const firmwareBuild = useConfigStore((state) => state.firmwareBuild);
  const firmwareNewer = useConfigStore((state) => state.firmwareNewer);
  const hung = useConfigStore((state) => state.hung);
  const updating = useConfigStore((state) => state.updating);
  const updatePercentage = useConfigStore((state) => state.updatePercentage);
  const applyingUpdate = useConfigStore((state) => state.applyingUpdate);
  const updateError = useConfigStore((state) => state.updateError);
  const latest = useConfigStore((state) => state.latest);
  const simpleMode = useConfigStore((state) => state.simpleMode);
  const setSimpleMode = useConfigStore((state) => state.setSimpleMode);
  const needsUf2Update = useConfigStore((state) => state.needsUf2Update);
  const [advancedModalOpened, { open: openAdvancedModal, close: closeAdvancedModal }] =
    useDisclosure(false);
  const { t } = useTranslation();
  const bluetoothSupported = BluetoothConfigDevice.isSupported();
  return (
    <>
      <Layout>
        <Modal
          opened={advancedModalOpened}
          onClose={closeAdvancedModal}
          title={t('connect.advancedMode.title')}
          centered
        >
          <Text size="sm">{t('connect.advancedMode.desc')}</Text>
          <Space h="md" />
          <Alert
            variant="light"
            color="orange"
            title={t('connect.advancedMode.warningTitle')}
            icon={<IconAlertTriangle size={16} />}
          >
            {t('connect.advancedMode.warningDesc')}
          </Alert>
          <Space h="md" />
          <Flex justify="flex-end">
            <Group align="flex-end">
              <Button
                onClick={() => {
                  setSimpleMode(false);
                  closeAdvancedModal();
                }}
                color="orange"
              >
                {t('connect.advancedMode.confirm')}
              </Button>
              <Button variant="default" onClick={closeAdvancedModal}>
                {t('connect.advancedMode.cancel')}
              </Button>
            </Group>
          </Flex>
        </Modal>
        {!navigator.hid && !bluetoothSupported && (
          <Alert
            variant="light"
            color="red"
            title={t('connect.browserNotSupported')}
            icon={<IconExclamationCircle />}
          >
            {t('connect.webHidNotSupported')}
            <Space h="md" />
            <DesktopDownloadButton />
          </Alert>
        )}
        <Text size="sm" c="dimmed">
          {t('connect.configuratorVersion', {
            version: `${__CONFIGURATOR_VERSION__} (${__CONFIGURATOR_COMMIT__})`,
          })}
        </Text>
        {connected && firmwareVersion && (
          <Text size="sm" c="dimmed">
            {t('connect.firmwareVersion', {
              version: firmwareBuild ? `${firmwareBuild} (${firmwareVersion})` : firmwareVersion,
            })}
          </Text>
        )}
        {connected && (
          <>
            <Space h="md" />
            <Button disabled={updating} onClick={disconnect}>
              {t('connect.disconnect')}
            </Button>
          </>
        )}
        {connected && !simpleMode && (
          <>
            <Space h="md" />
            <Button disabled={updating || hung} onClick={bootloader}>
              {t('connect.bootloader')}
            </Button>
            <Space h="md" />
            <Button disabled={updating || hung} onClick={exportConfig}>
              {t('connect.export')}
            </Button>
            <Space h="md" />
            <FileButton disabled={updating || hung} onChange={loadConfig} accept="application/json">
              {(props) => (
                <Button disabled={updating || hung} {...props}>
                  {t('connect.load')}
                </Button>
              )}
            </FileButton>
            <Space h="md" />
            <FileButton
              disabled={updating || hung}
              onChange={importLegacy}
              accept=".picoconfig"
              multiple
            >
              {(props) => (
                <Button disabled={updating || hung} {...props}>
                  {t('connect.importLegacy')}
                </Button>
              )}
            </FileButton>
          </>
        )}
        {connected && simpleMode && (
          <>
            <Space h="md" />
            <Button disabled={updating || hung} variant="default" onClick={openAdvancedModal}>
              {t('connect.advancedMode.button')}
            </Button>
          </>
        )}
        {legacyImportWarnings.length > 0 && (
          <>
            <Space h="md" />
            <Alert
              variant="light"
              color="yellow"
              title={t('connect.legacyImportTitle')}
              icon={<IconExclamationCircle />}
              withCloseButton
              closeButtonLabel={t('connect.legacyImportDismiss')}
              onClose={clearLegacyImportWarnings}
            >
              <List size="sm">
                {legacyImportWarnings
                  .map((warning) => translateLegacyWarning(t, warning))
                  .map((warning) => (
                    <List.Item key={warning}>{warning}</List.Item>
                  ))}
              </List>
            </Alert>
          </>
        )}
        {hung && (
          <Alert
            variant="light"
            color="red"
            title={t('connect.hungTitle')}
            icon={<IconExclamationCircle />}
          >
            {t('connect.hung')}
          </Alert>
        )}
        <Space h="md" />
        {navigator.hid && !connected && (
          <Button disabled={updating} onClick={connect}>
            {t('connect.connect')}
          </Button>
        )}
        {/* Only for browsers without WebHID (like Android), as USB works everywhere else */}
        {bluetoothSupported && !navigator.hid && !connected && (
          <>
            <Space h="md" />
            <Button disabled={updating} onClick={connectBluetooth}>
              {t('connect.connectBluetooth')}
            </Button>
          </>
        )}
        {!connected && (
          <>
            <Space h="md" />
            <Button component={Link} to="/setup">
              {t('connect.setup')}
            </Button>
          </>
        )}
        {!connected && simpleMode && (
          <>
            <Space h="md" />
            <Button disabled={updating} variant="default" onClick={openAdvancedModal}>
              {t('connect.advancedMode.button')}
            </Button>
          </>
        )}

        {firmwareNewer && connected && !hung && (
          <Alert
            variant="light"
            color="yellow"
            title={t('connect.firmwareNewerTitle')}
            icon={<IconExclamationCircle />}
          >
            {t('connect.firmwareNewer')}
            {isDesktop && (
              <>
                <Space h="md" />
                <Button component="a" href={RELEASES_URL} target="_blank" rel="noopener noreferrer">
                  {t('connect.getLatestConfigurator')}
                </Button>
              </>
            )}
          </Alert>
        )}

        {!latest && !firmwareNewer && connected && !hung && (
          <Alert
            variant="light"
            color="red"
            title={t('connect.outdatedTitle')}
            icon={<IconExclamationCircle />}
          >
            {t('connect.outdated')}
            <Space h="md" />
            <Button disabled={updating} onClick={firmwareUpdate}>
              {t('connect.startUpdate')}
            </Button>
            <Progress size="xl" value={updatePercentage} />
            {applyingUpdate && (
              <>
                <Space h="xs" />
                {t('connect.applyingUpdate')}
              </>
            )}
            {updateError && (
              <>
                <Space h="xs" />
                {updateError === 'notApplied'
                  ? t('connect.updateNotApplied')
                  : t('connect.updateNoReconnect')}
              </>
            )}
          </Alert>
        )}

        {needsUf2Update && connected && !hung && (
          <>
            <Space h="md" />
            <Alert
              variant="light"
              color="yellow"
              title={t('connect.missingDongleFirmwareTitle')}
              icon={<IconExclamationCircle />}
            >
              {t('connect.missingDongleFirmware')}
              <Space h="md" />
              <Group>
                <Button
                  component="a"
                  download="santroller_pico1.uf2"
                  href="santroller_pico1.uf2"
                  target="_blank"
                >
                  {t('connect.downloadPico1')}
                </Button>
                <Button
                  component="a"
                  download="santroller_pico2.uf2"
                  href="santroller_pico2.uf2"
                  target="_blank"
                >
                  {t('connect.downloadPico2')}
                </Button>
              </Group>
            </Alert>
          </>
        )}

        {navigator.hid && !isDesktop && (
          <>
            <Space h="md" />
            <DesktopDownloadButton />
          </>
        )}
        {/* for anyone who hasn't moved their controllers over yet */}
        <Space h="md" />
        <Button
          component="a"
          href="https://s1.santroller.com"
          target="_blank"
          rel="noopener noreferrer"
          variant="default"
          leftSection={<IconHistory size={18} />}
        >
          {t('connect.santroller1')}
        </Button>
        <Space h="md" />
        <Button
          component="a"
          href="https://discord.gg/CmdYpXKcEU"
          target="_blank"
          rel="noopener noreferrer"
          variant="default"
          leftSection={<IconBrandDiscord size={18} />}
        >
          {t('connect.discord')}
        </Button>
      </Layout>
    </>
  );
}
