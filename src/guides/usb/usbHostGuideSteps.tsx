import React from 'react';
import { IconCheck, IconDeviceFloppy, IconPlugConnected, IconUsb } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, Image, Paper, Stack, Table, Text, Title } from '@mantine/core';
import { useConfigStore } from '@/components/SettingsContext/SettingsContext';
import { GuideList } from '../components/GuideList';
import { StepWorkbench } from '../components/StepWorkbench';
import { findDeviceStatus } from '../guideConfig';
import { GuideStepProps } from '../types';
import { ensureUsbHost, profileHasUsbSlot, usbHostPins } from './usbHostUtils';

// Step 1: Supplies & Intro
export function UsbHostIntroStep(props: GuideStepProps) {
  const { t } = useTranslation();

  const guideContent = (
    <Stack gap="md">
      <Text size="sm">{t('guides.usb-host.steps.usb-intro.intro')}</Text>

      <Image src="/guides/usb/usb.png" radius="md" alt="USB Host cable wiring" />
      <Text size="xs" c="dimmed" ta="center">
        {t('guides.usb-host.steps.usb-intro.cableCaption')}
      </Text>

      <Title order={4}>{t('guides.usb-host.steps.usb-intro.suppliesTitle')}</Title>
      <GuideList
        iconColor="teal"
        items={t('guides.usb-host.steps.usb-intro.supplies', { returnObjects: true })}
      />
    </Stack>
  );

  const workbenchContent = (
    <Stack gap="md">
      <Card withBorder radius="md" p="md" bg="var(--mantine-color-body)">
        <Stack gap="xs">
          <Text fw={700} size="sm">
            {t('guides.usb-host.steps.usb-intro.pinoutTitle')}
          </Text>
          <Text size="xs" c="dimmed">
            {t('guides.usb-host.steps.usb-intro.pinoutDesc')}
          </Text>

          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('guides.usb-host.steps.usb-intro.thWireColor')}</Table.Th>
                <Table.Th>{t('guides.usb-host.steps.usb-intro.thUsbSignal')}</Table.Th>
                <Table.Th>{t('guides.usb-host.steps.usb-intro.thPicoPin')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td>
                  <Badge color="red" size="xs">
                    {t('guides.usb-host.steps.usb-intro.colorRed')}
                  </Badge>
                </Table.Td>
                <Table.Td>VBUS (5V)</Table.Td>
                <Table.Td>Pin 40 (VBUS)</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Badge color="gray" size="xs">
                    {t('guides.usb-host.steps.usb-intro.colorBlack')}
                  </Badge>
                </Table.Td>
                <Table.Td>GND</Table.Td>
                <Table.Td>Pin 38 (GND)</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Badge color="green" size="xs">
                    {t('guides.usb-host.steps.usb-intro.colorGreen')}
                  </Badge>
                </Table.Td>
                <Table.Td>{t('guides.usb-host.steps.usb-intro.signalDPlus')}</Table.Td>
                <Table.Td>GP2 (Pin 4)</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Badge color="yellow" size="xs">
                    {t('guides.usb-host.steps.usb-intro.colorWhite')}
                  </Badge>
                </Table.Td>
                <Table.Td>{t('guides.usb-host.steps.usb-intro.signalDMinus')}</Table.Td>
                <Table.Td>GP3 (Pin 5)</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Stack>
      </Card>
    </Stack>
  );

  return (
    <StepWorkbench
      title={t('guides.usb-host.steps.usb-intro.title')}
      badge={t('guides.usb-host.steps.usb-intro.badge')}
      badgeColor="teal"
      description={t('guides.usb-host.steps.usb-intro.description')}
      guideContent={guideContent}
      workbenchContent={workbenchContent}
      isFirstStep={props.isFirstStep}
      isLastStep={props.isLastStep}
      onNext={props.onNext}
      onPrevious={props.onPrevious}
    />
  );
}

// Step 2: Wiring & Configuration
export function UsbHostWiringStep(props: GuideStepProps) {
  const { t } = useTranslation();
  const connected = useConfigStore((state) => state.connected);
  const usbHost = useConfigStore((state) => findDeviceStatus(state, 'usbHost'))?.device.usbHost;
  const hasUsbSlot = useConfigStore(profileHasUsbSlot);
  const pins = usbHostPins(usbHost);

  const guideContent = (
    <Stack gap="md">
      <Title order={4}>{t('guides.usb-host.steps.usb-wiring.wiringTitle')}</Title>
      <GuideList
        type="ordered"
        items={t('guides.usb-host.steps.usb-wiring.wiringSteps', { returnObjects: true })}
      />
    </Stack>
  );

  const workbenchContent = (
    <Stack gap="md">
      <Card withBorder radius="md" p="md" bg="var(--mantine-color-body)">
        <Stack gap="xs">
          <Text fw={700} size="sm">
            {t('guides.usb-host.steps.usb-wiring.driverConfigTitle')}
          </Text>
          <Text size="xs" c="dimmed">
            {t('guides.usb-host.steps.usb-wiring.driverConfigDesc')}
          </Text>

          {usbHost && hasUsbSlot ? (
            <Badge color="teal" size="md" variant="filled" leftSection={<IconCheck size={14} />}>
              {t('guides.usb-host.steps.usb-wiring.driverConfiguredBadge', pins)}
            </Badge>
          ) : (
            <Button
              size="sm"
              color="teal"
              leftSection={<IconUsb size={16} />}
              onClick={() => ensureUsbHost()}
              disabled={!connected}
            >
              {t('guides.usb-host.steps.usb-wiring.enableDriverBtn')}
            </Button>
          )}
        </Stack>
      </Card>
    </Stack>
  );

  return (
    <StepWorkbench
      title={t('guides.usb-host.steps.usb-wiring.title')}
      badge={t('guides.usb-host.steps.usb-wiring.badge')}
      badgeColor="blue"
      description={t('guides.usb-host.steps.usb-wiring.description')}
      guideContent={guideContent}
      workbenchContent={workbenchContent}
      isFirstStep={props.isFirstStep}
      isLastStep={props.isLastStep}
      onNext={props.onNext}
      onPrevious={props.onPrevious}
    />
  );
}

// Step 3: Review & Save
export function UsbHostReviewStep(props: GuideStepProps) {
  const { t } = useTranslation();
  const commitConfig = useConfigStore((state) => state.commitConfig);
  const connected = useConfigStore((state) => state.connected);
  const usbHostStatus = useConfigStore((state) => findDeviceStatus(state, 'usbHost'));
  const detectedCount = Object.keys(usbHostStatus?.usbDevices ?? {}).length;

  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await commitConfig();
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch {
      //
    } finally {
      setSaving(false);
    }
  };

  const guideContent = (
    <Stack gap="md">
      <Text size="sm">{t('guides.usb-host.steps.usb-test.activeText')}</Text>

      <Title order={4}>{t('guides.usb-host.steps.usb-test.plugInTitle')}</Title>
      <Text size="sm">{t('guides.usb-host.steps.usb-test.plugInText')}</Text>

      <Button
        size="md"
        color="teal"
        disabled={!connected}
        loading={saving}
        leftSection={<IconDeviceFloppy size={18} />}
        onClick={handleSave}
      >
        {saved
          ? t('guides.usb-host.steps.usb-test.btnSaved')
          : t('guides.usb-host.steps.usb-test.btnSave')}
      </Button>
    </Stack>
  );

  const workbenchContent = (
    <Stack gap="md">
      <Paper withBorder p="md" radius="md" bg="var(--mantine-color-body)">
        <Stack gap="xs">
          <Text size="xs" fw={600} c="dimmed">
            {t('guides.usb-host.steps.usb-test.telemetryTitle')}
          </Text>
          {!usbHostStatus ? (
            <Badge size="lg" color="gray" variant="light" leftSection={<IconUsb size={16} />}>
              {t('guides.usb-host.steps.usb-test.notConfiguredBadge')}
            </Badge>
          ) : connected && detectedCount > 0 ? (
            <Badge
              size="lg"
              color="teal"
              variant="light"
              leftSection={<IconPlugConnected size={16} />}
            >
              {t('guides.usb-host.steps.usb-test.detectedBadge', { count: detectedCount })}
            </Badge>
          ) : (
            <Badge size="lg" color="yellow" variant="light" leftSection={<IconUsb size={16} />}>
              {t('guides.usb-host.steps.usb-test.waitingBadge')}
            </Badge>
          )}
          <Text size="xs" c="dimmed">
            {!usbHostStatus
              ? t('guides.usb-host.steps.usb-test.notConfiguredPrompt')
              : connected
                ? t('guides.usb-host.steps.usb-test.verifyPrompt')
                : t('guides.usb-host.steps.usb-test.connectPrompt')}
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );

  return (
    <StepWorkbench
      title={t('guides.usb-host.steps.usb-test.title')}
      badge={t('guides.usb-host.steps.usb-test.badge')}
      badgeColor="green"
      description={t('guides.usb-host.steps.usb-test.description')}
      guideContent={guideContent}
      workbenchContent={workbenchContent}
      isFirstStep={props.isFirstStep}
      isLastStep={props.isLastStep}
      onNext={props.onNext}
      onPrevious={props.onPrevious}
    />
  );
}
