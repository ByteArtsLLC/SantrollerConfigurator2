import React from 'react';
import {
  IconAlertTriangle,
  IconCheck,
  IconDeviceFloppy,
  IconInfoCircle,
  IconPlugConnected,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Image,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { proto } from '@/components/SettingsContext/config';
import { isDeviceAssigned, useConfigStore } from '@/components/SettingsContext/SettingsContext';
import { GuideList } from '../components/GuideList';
import { StepWorkbench } from '../components/StepWorkbench';
import { assignDeviceToProfile, findDeviceStatus } from '../guideConfig';
import { GuideStepProps } from '../types';
import { ensureDeviceToEmulate, LiveAxis, LiveButtons, LiveInput } from './adapterLiveStatus';

const GUITAR_TYPES = [proto.SubType.GuitarHeroGuitar, proto.SubType.RockBandGuitar];

/**
 * Adds the Wii extension driver on I2C1 (GP18 / GP19) when there isn't one, then gives the
 * active profile a Wii guitar slot (loading the default guitar mappings), as a Wii device does
 * nothing until a profile has a slot for it.
 */
function configureWiiGuitar() {
  const existing = findDeviceStatus(useConfigStore.getState(), 'wii');
  const id =
    existing?.id ??
    useConfigStore.getState().addDevice('wii', undefined, (device) => {
      device.wii!.i2c = { ...device.wii!.i2c, sda: 18, scl: 19, block: 1 };
    });
  ensureDeviceToEmulate(GUITAR_TYPES, proto.SubType.GuitarHeroGuitar);
  assignDeviceToProfile(id, { wiiExt: proto.WiiExtType.WiiGuitarHeroGuitar });
}

function wiiButton(button: proto.WiiButtonType) {
  return (m: proto.IMapping) => m.input?.wiiButton?.button === button;
}

// Step 1: Overview
export function WiiIntroStep(props: GuideStepProps) {
  const { t } = useTranslation();

  const guideContent = (
    <Stack gap="md">
      <Text size="sm">{t('guides.wii-adapter.steps.wii-intro.intro')}</Text>

      <Image src="/guides/wii/adaptor.jpg" radius="md" alt="Wii Guitar Adapter" />
      <Text size="xs" c="dimmed" ta="center">
        {t('guides.wii-adapter.steps.wii-intro.adapterCaption')}
      </Text>

      <Title order={4}>{t('guides.wii-adapter.steps.wii-intro.suppliesTitle')}</Title>
      <GuideList
        iconColor="cyan"
        items={t('guides.wii-adapter.steps.wii-intro.supplies', { returnObjects: true })}
      />

      <Alert
        color="blue"
        icon={<IconInfoCircle size={16} />}
        title={t('guides.wii-adapter.steps.wii-intro.noDisassemblyTitle')}
      >
        {t('guides.wii-adapter.steps.wii-intro.noDisassemblyText')}
      </Alert>
    </Stack>
  );

  const workbenchContent = (
    <Stack gap="md">
      <Card withBorder radius="md" p="md" bg="var(--mantine-color-body)">
        <Stack gap="xs">
          <Text fw={700} size="sm">
            {t('guides.wii-adapter.steps.wii-intro.quickStartTitle')}
          </Text>
          <Text size="xs" c="dimmed">
            {t('guides.wii-adapter.steps.wii-intro.quickStartDesc')}
          </Text>
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('guides.wii-adapter.steps.wii-intro.thWiiPin')}</Table.Th>
                <Table.Th>{t('guides.wii-adapter.steps.wii-intro.thPicoPin')}</Table.Th>
                <Table.Th>{t('guides.wii-adapter.steps.wii-intro.thFunction')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td>
                  <Badge color="red" size="xs">
                    3.3V (VCC)
                  </Badge>
                </Table.Td>
                <Table.Td>Pin 36 (3V3 OUT)</Table.Td>
                <Table.Td>{t('guides.wii-adapter.steps.wii-intro.fnPower')}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Badge color="gray" size="xs">
                    GND
                  </Badge>
                </Table.Td>
                <Table.Td>Pin 38 (GND)</Table.Td>
                <Table.Td>{t('guides.wii-adapter.steps.wii-intro.fnGround')}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Badge color="blue" size="xs">
                    SDA (Data)
                  </Badge>
                </Table.Td>
                <Table.Td>GP18 (Pin 24)</Table.Td>
                <Table.Td>{t('guides.wii-adapter.steps.wii-intro.fnData')}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Badge color="yellow" size="xs">
                    SCL (Clock)
                  </Badge>
                </Table.Td>
                <Table.Td>GP19 (Pin 25)</Table.Td>
                <Table.Td>{t('guides.wii-adapter.steps.wii-intro.fnClock')}</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Stack>
      </Card>
    </Stack>
  );

  return (
    <StepWorkbench
      title={t('guides.wii-adapter.steps.wii-intro.title')}
      badge={t('guides.wii-adapter.steps.wii-intro.badge')}
      badgeColor="cyan"
      description={t('guides.wii-adapter.steps.wii-intro.description')}
      guideContent={guideContent}
      workbenchContent={workbenchContent}
      isFirstStep={props.isFirstStep}
      isLastStep={props.isLastStep}
      onNext={props.onNext}
      onPrevious={props.onPrevious}
    />
  );
}

// Step 2: Wiring
export function WiiWiringStep(props: GuideStepProps) {
  const { t } = useTranslation();
  const connected = useConfigStore((state) => state.connected);
  // config.devices is only rebuilt on connect, so read live devices from deviceStatus
  const wiiDevice = useConfigStore((state) => findDeviceStatus(state, 'wii'));
  const assigned = useConfigStore((state) =>
    isDeviceAssigned('wii', state.config.profiles?.[state.currentProfile])
  );
  const i2c = wiiDevice?.device.wii?.i2c;

  const guideContent = (
    <Stack gap="md">
      <Text size="sm">{t('guides.wii-adapter.steps.wii-wiring.intro')}</Text>

      <Group grow align="start">
        <Stack gap={4}>
          <Image src="/guides/wii/wii-ext.jpg" radius="md" alt="Wii extension socket pin numbers" />
          <Text size="xs" c="dimmed" ta="center">
            {t('guides.wii-adapter.steps.wii-wiring.socketCaption')}
          </Text>
        </Stack>
        <Stack gap={4}>
          <Image src="/guides/wii/wii-ext-pinout.png" radius="md" alt="Wii extension plug pinout" />
          <Text size="xs" c="dimmed" ta="center">
            {t('guides.wii-adapter.steps.wii-wiring.plugCaption')}
          </Text>
        </Stack>
      </Group>

      <Alert
        color="red"
        icon={<IconAlertTriangle size={16} />}
        title={t('guides.wii-adapter.steps.wii-wiring.voltageWarningTitle')}
      >
        {t('guides.wii-adapter.steps.wii-wiring.voltageWarningText')}
      </Alert>

      <Alert
        color="orange"
        icon={<IconInfoCircle size={16} />}
        title={t('guides.wii-adapter.steps.wii-wiring.wireColorWarningTitle')}
      >
        {t('guides.wii-adapter.steps.wii-wiring.wireColorWarningText')}
      </Alert>
    </Stack>
  );

  const workbenchContent = (
    <Stack gap="md">
      <Card withBorder radius="md" p="md" bg="var(--mantine-color-body)">
        <Stack gap="xs">
          <Text fw={700} size="sm">
            {t('guides.wii-adapter.steps.wii-wiring.deviceStatusTitle')}
          </Text>
          <Text size="xs" c="dimmed">
            {t('guides.wii-adapter.steps.wii-wiring.deviceStatusDesc')}
          </Text>

          {wiiDevice && assigned ? (
            <Badge color="teal" size="md" variant="filled" leftSection={<IconCheck size={14} />}>
              {t('guides.wii-adapter.steps.wii-wiring.driverConfiguredBadge', {
                sda: i2c?.sda,
                scl: i2c?.scl,
              })}
            </Badge>
          ) : (
            <>
              {wiiDevice && (
                <Text size="xs" c="orange">
                  {t('guides.wii-adapter.steps.wii-wiring.notAssignedText')}
                </Text>
              )}
              <Button
                size="sm"
                color="teal"
                leftSection={<IconPlugConnected size={16} />}
                onClick={configureWiiGuitar}
                disabled={!connected}
              >
                {wiiDevice
                  ? t('guides.wii-adapter.steps.wii-wiring.assignBtn')
                  : t('guides.wii-adapter.steps.wii-wiring.enableDriverBtn')}
              </Button>
            </>
          )}
        </Stack>
      </Card>
    </Stack>
  );

  return (
    <StepWorkbench
      title={t('guides.wii-adapter.steps.wii-wiring.title')}
      badge={t('guides.wii-adapter.steps.wii-wiring.badge')}
      badgeColor="blue"
      description={t('guides.wii-adapter.steps.wii-wiring.description')}
      guideContent={guideContent}
      workbenchContent={workbenchContent}
      isFirstStep={props.isFirstStep}
      isLastStep={props.isLastStep}
      onNext={props.onNext}
      onPrevious={props.onPrevious}
    />
  );
}

// Step 3: Live Verification
export function WiiReviewStep(props: GuideStepProps) {
  const { t } = useTranslation();
  const commitConfig = useConfigStore((state) => state.commitConfig);
  const connected = useConfigStore((state) => state.connected);

  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const wiiDevice = useConfigStore((state) => findDeviceStatus(state, 'wii'));
  const assigned = useConfigStore((state) =>
    isDeviceAssigned('wii', state.config.profiles?.[state.currentProfile])
  );
  const extType = wiiDevice?.wiiExtType ?? proto.WiiExtType.WiiNoExtension;
  const extDetected = connected && !!wiiDevice && extType !== proto.WiiExtType.WiiNoExtension;
  const extensionLabel = !connected
    ? t('guides.wii-adapter.steps.wii-test.picoNotConnected')
    : !wiiDevice
      ? t('guides.wii-adapter.steps.wii-test.driverMissing')
      : extDetected
        ? t('guides.wii-adapter.steps.wii-test.extDetected', {
            type: t(`wiiExt.${proto.WiiExtType[extType]}`),
          })
        : t('guides.wii-adapter.steps.wii-test.extNone');

  const B = proto.WiiButtonType;
  const liveButtons: LiveInput[] = [
    {
      label: t('guides.wii-adapter.steps.wii-test.green'),
      color: 'green',
      match: wiiButton(B.WiiButtonGuitarGreen),
    },
    {
      label: t('guides.wii-adapter.steps.wii-test.red'),
      color: 'red',
      match: wiiButton(B.WiiButtonGuitarRed),
    },
    {
      label: t('guides.wii-adapter.steps.wii-test.yellow'),
      color: 'yellow',
      match: wiiButton(B.WiiButtonGuitarYellow),
    },
    {
      label: t('guides.wii-adapter.steps.wii-test.blue'),
      color: 'blue',
      match: wiiButton(B.WiiButtonGuitarBlue),
    },
    {
      label: t('guides.wii-adapter.steps.wii-test.orange'),
      color: 'orange',
      match: wiiButton(B.WiiButtonGuitarOrange),
    },
    {
      label: t('guides.wii-adapter.steps.wii-test.strumUp'),
      color: 'cyan',
      match: wiiButton(B.WiiButtonGuitarStrumUp),
    },
    {
      label: t('guides.wii-adapter.steps.wii-test.strumDown'),
      color: 'cyan',
      match: wiiButton(B.WiiButtonGuitarStrumDown),
    },
  ];
  const liveWhammy: LiveInput = {
    label: t('guides.wii-adapter.steps.wii-test.whammy'),
    color: 'grape',
    match: (m) => m.input?.wiiAxis?.axis === proto.WiiAxisType.WiiAxisGuitarWhammy,
  };

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
      <Alert
        color="teal"
        icon={<IconCheck size={18} />}
        title={t('guides.wii-adapter.steps.wii-test.adapterReadyTitle')}
      >
        {t('guides.wii-adapter.steps.wii-test.adapterReadyText')}
      </Alert>

      <Title order={4}>{t('guides.wii-adapter.steps.wii-test.plugInTitle')}</Title>
      <Text size="sm">{t('guides.wii-adapter.steps.wii-test.plugInText')}</Text>

      <Button
        size="md"
        color="teal"
        disabled={!connected}
        loading={saving}
        leftSection={<IconDeviceFloppy size={18} />}
        onClick={handleSave}
      >
        {saved
          ? t('guides.wii-adapter.steps.wii-test.btnSaved')
          : t('guides.wii-adapter.steps.wii-test.btnSave')}
      </Button>
    </Stack>
  );

  const workbenchContent = (
    <Stack gap="md">
      <Paper withBorder p="md" radius="md" bg="var(--mantine-color-body)">
        <Stack gap="xs">
          <Text size="xs" fw={600} c="dimmed">
            {t('guides.wii-adapter.steps.wii-test.telemetryTitle')}
          </Text>
          <Badge
            size="lg"
            color={extDetected ? 'teal' : 'gray'}
            variant="light"
            leftSection={<IconPlugConnected size={16} />}
          >
            {extensionLabel}
          </Badge>
          {wiiDevice && !assigned && (
            <Text size="xs" c="orange">
              {t('guides.wii-adapter.steps.wii-wiring.notAssignedText')}
            </Text>
          )}
          <Text size="xs" c="dimmed">
            {t('guides.wii-adapter.steps.wii-test.verifyPrompt')}
          </Text>
          <LiveButtons inputs={liveButtons} />
          <LiveAxis
            input={liveWhammy}
            notMappedLabel={t('guides.wii-adapter.steps.wii-test.notMapped')}
          />
        </Stack>
      </Paper>
    </Stack>
  );

  return (
    <StepWorkbench
      title={t('guides.wii-adapter.steps.wii-test.title')}
      badge={t('guides.wii-adapter.steps.wii-test.badge')}
      badgeColor="green"
      description={t('guides.wii-adapter.steps.wii-test.description')}
      guideContent={guideContent}
      workbenchContent={workbenchContent}
      isFirstStep={props.isFirstStep}
      isLastStep={props.isLastStep}
      onNext={props.onNext}
      onPrevious={props.onPrevious}
    />
  );
}
