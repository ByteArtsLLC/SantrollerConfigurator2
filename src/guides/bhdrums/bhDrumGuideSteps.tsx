import React from 'react';
import {
  IconAlertTriangle,
  IconCheck,
  IconDeviceFloppy,
  IconInfoCircle,
  IconMusic,
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
  Progress,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import {
  ConfigState,
  DeviceStatus,
  useConfigStore,
} from '@/components/SettingsContext/SettingsContext';
import { LiveButtons, LiveInput } from '../adapters/adapterLiveStatus';
import { GuideList } from '../components/GuideList';
import { InputTestRow } from '../components/InputTestRow';
import { StepWorkbench } from '../components/StepWorkbench';
import { GuideStepProps } from '../types';
import { gpWithPin, labelWithPin } from '../wiringText';
import {
  addBhDrumDriver,
  BH_BUTTONS,
  BH_I2C,
  BH_PADS,
  bhDrumFamily,
  BhPad,
  findBhDrum,
  isBhDrumConfigured,
  padMappingIndices,
  sameOutput,
} from './bhDrumSetup';

const P = 'guides.bh-drums.steps';

// Hits only last a few milliseconds, so hold the highest reading long enough to see it
function usePeakHold(value: number, holdMs = 500) {
  const [peak, setPeak] = React.useState(0);
  React.useEffect(() => {
    setPeak((current) => Math.max(current, value));
  }, [value]);
  React.useEffect(() => {
    if (peak === 0) {
      return;
    }
    const timer = setTimeout(() => setPeak(0), holdMs);
    return () => clearTimeout(timer);
  }, [peak, holdMs]);
  return Math.max(peak, value);
}

interface BrainLiveProps {
  // Translation prefix of the guide's test step, which holds the status and pad labels
  prefix: string;
}

/** Pico / driver / brain detection status for a MIDI drum brain device */
export function BrainStatusBadge({
  prefix,
  findBrain,
}: BrainLiveProps & { findBrain: (state: ConfigState) => DeviceStatus | undefined }) {
  const { t } = useTranslation();
  const connected = useConfigStore((state) => state.connected);
  const brain = useConfigStore(findBrain);
  const detected = connected && brain?.connected;
  const status = !connected
    ? t(`${prefix}.picoNotConnected`)
    : !brain
      ? t(`${prefix}.driverNotAdded`)
      : brain.connected
        ? t(`${prefix}.brainDetected`)
        : t(`${prefix}.brainNotDetected`);
  return (
    <Badge
      size="lg"
      color={detected ? 'teal' : brain && connected ? 'orange' : 'gray'}
      variant="light"
      leftSection={<IconMusic size={16} />}
    >
      {status}
    </Badge>
  );
}

function PadMonitor({ pad, prefix }: BrainLiveProps & { pad: BhPad }) {
  const { t } = useTranslation();
  const count = useConfigStore((state) => padMappingIndices(state, pad).length);
  // Several notes drive each pad, so show whichever of its mappings reads highest
  const raw = useConfigStore((state) => {
    const statuses = state.mappingStatus[state.currentProfile];
    return Math.max(
      0,
      ...padMappingIndices(state, pad).map((i) => {
        const status = statuses?.[i];
        return Math.max(status?.stateRaw ?? 0, status?.state ?? 0);
      })
    );
  });
  const value = usePeakHold(Math.min(raw, 65535));
  return (
    <Stack gap={4}>
      <Group justify="space-between">
        <Badge color={pad.color} size="sm" variant={count ? 'filled' : 'outline'}>
          {t(`${prefix}.pad.${pad.key}`)}
        </Badge>
        <Text size="xs" c="dimmed">
          {count ? t(`${prefix}.padNotes`, { count }) : t(`${prefix}.notMapped`)}
        </Text>
      </Group>
      <Progress value={(value / 65535) * 100} color={pad.color} size="sm" radius="xl" />
    </Stack>
  );
}

/** Live bars for each pad the MIDI drum defaults map to */
export function PadMonitors({ prefix }: BrainLiveProps) {
  const family = useConfigStore(bhDrumFamily);
  return (
    <Stack gap="xs">
      {BH_PADS[family].map((pad) => (
        <PadMonitor key={pad.key} pad={pad} prefix={prefix} />
      ))}
    </Stack>
  );
}

function useButtonInputs(): LiveInput[] {
  const { t } = useTranslation();
  return BH_BUTTONS.map((button) => ({
    label: t(`${P}.bh-wiring.button.${button.key}`),
    color: button.color,
    match: (m) =>
      m.input?.gpio != null && sameOutput(m.mapping, { gamepadButton: button.target.id }),
  }));
}

// Step 1: Supplies & Overview
export function BhDrumIntroStep(props: GuideStepProps) {
  const { t } = useTranslation();

  const guideContent = (
    <Stack gap="md">
      <Text size="sm">{t(`${P}.bh-intro.intro`)}</Text>

      <Alert
        color="blue"
        icon={<IconInfoCircle size={16} />}
        title={t(`${P}.bh-intro.notPiezoTitle`)}
      >
        {t(`${P}.bh-intro.notPiezoText`)}
      </Alert>

      <Title order={4}>{t(`${P}.bh-intro.howTitle`)}</Title>
      <Text size="sm">{t(`${P}.bh-intro.howText`)}</Text>

      <Title order={4}>{t(`${P}.bh-intro.suppliesTitle`)}</Title>
      <GuideList iconColor="orange" items={t(`${P}.bh-intro.supplies`, { returnObjects: true })} />

      <Alert
        color="orange"
        icon={<IconAlertTriangle size={16} />}
        title={t(`${P}.bh-intro.warningTitle`)}
      >
        {t(`${P}.bh-intro.warningText`)}
      </Alert>
    </Stack>
  );

  const workbenchContent = (
    <Card withBorder radius="md" p="md" bg="var(--mantine-color-body)">
      <Stack gap="xs">
        <Text fw={700} size="sm">
          {t(`${P}.bh-intro.pinoutTitle`)}
        </Text>
        <Text size="xs" c="dimmed">
          {t(`${P}.bh-intro.pinoutDesc`)}
        </Text>
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t(`${P}.bh-intro.thBoardPad`)}</Table.Th>
              <Table.Th>{t(`${P}.bh-intro.thPicoPin`)}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td>DATA</Table.Td>
              <Table.Td>{gpWithPin(BH_I2C.sda, 24)}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>CLK</Table.Td>
              <Table.Td>{gpWithPin(BH_I2C.scl, 25)}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>+V</Table.Td>
              <Table.Td>{labelWithPin('3V3(OUT)', 36)}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>0V, BUTTON COM, BUT COM</Table.Td>
              <Table.Td>{labelWithPin('GND', 38)}</Table.Td>
            </Table.Tr>
            {BH_BUTTONS.map((button) => (
              <Table.Tr key={button.key}>
                <Table.Td>{button.pad}</Table.Td>
                <Table.Td>{gpWithPin(button.pin, button.physicalPin)}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Stack>
    </Card>
  );

  return (
    <StepWorkbench
      title={t(`${P}.bh-intro.title`)}
      badge={t(`${P}.bh-intro.badge`)}
      badgeColor="orange"
      description={t(`${P}.bh-intro.description`)}
      guideContent={guideContent}
      workbenchContent={workbenchContent}
      isFirstStep={props.isFirstStep}
      isLastStep={props.isLastStep}
      onNext={props.onNext}
      onPrevious={props.onPrevious}
    />
  );
}

function DriverSetup() {
  const { t } = useTranslation();
  const connected = useConfigStore((state) => state.connected);
  const brain = useConfigStore(findBhDrum);
  const configured = useConfigStore(isBhDrumConfigured);
  const i2c = brain?.device.bhDrum?.i2c;
  return (
    <Card withBorder radius="md" p="md" bg="var(--mantine-color-body)">
      <Stack gap="xs">
        <Text fw={700} size="sm">
          {t(`${P}.bh-wiring.setupTitle`)}
        </Text>
        <Text size="xs" c="dimmed">
          {t(`${P}.bh-wiring.setupDesc`)}
        </Text>
        <Table withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t(`${P}.bh-wiring.thConnector`)}</Table.Th>
              <Table.Th>{t(`${P}.bh-wiring.thPicoPin`)}</Table.Th>
              <Table.Th>{t(`${P}.bh-wiring.thType`)}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td>+V</Table.Td>
              <Table.Td>{labelWithPin('3V3(OUT)', 36)}</Table.Td>
              <Table.Td>{t(`${P}.bh-wiring.typePower`)}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>CLK</Table.Td>
              <Table.Td>{gpWithPin(BH_I2C.scl, 25)}</Table.Td>
              <Table.Td>{t(`${P}.bh-wiring.typeI2cClock`)}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>DATA</Table.Td>
              <Table.Td>{gpWithPin(BH_I2C.sda, 24)}</Table.Td>
              <Table.Td>{t(`${P}.bh-wiring.typeI2cData`)}</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>0V</Table.Td>
              <Table.Td>{labelWithPin('GND', 38)}</Table.Td>
              <Table.Td>{t(`${P}.bh-wiring.typeGround`)}</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
        {configured ? (
          <Badge color="teal" variant="filled" leftSection={<IconCheck size={14} />}>
            {t(`${P}.bh-wiring.driverAdded`, { sda: i2c?.sda, scl: i2c?.scl })}
          </Badge>
        ) : (
          <Button
            size="xs"
            color="orange"
            leftSection={<IconPlugConnected size={14} />}
            disabled={!connected}
            onClick={addBhDrumDriver}
          >
            {t(`${P}.bh-wiring.addDriverBtn`)}
          </Button>
        )}
      </Stack>
    </Card>
  );
}

// Step 2: Wiring
export function BhDrumWiringStep(props: GuideStepProps) {
  const { t } = useTranslation();

  const guideContent = (
    <Stack gap="md">
      <Stack gap={4}>
        <Image
          src="/guides/drums/bh_mainboard.jpg"
          radius="md"
          alt={t(`${P}.bh-wiring.photoCaption`)}
        />
        <Text size="xs" c="dimmed" ta="center">
          {t(`${P}.bh-wiring.photoCaption`)}
        </Text>
      </Stack>

      <Title order={4}>{t(`${P}.bh-wiring.brainTitle`)}</Title>
      <GuideList type="ordered" items={t(`${P}.bh-wiring.brainSteps`, { returnObjects: true })} />

      <Title order={4}>{t(`${P}.bh-wiring.buttonsTitle`)}</Title>
      <GuideList type="ordered" items={t(`${P}.bh-wiring.buttonSteps`, { returnObjects: true })} />

      <Alert
        color="orange"
        icon={<IconAlertTriangle size={16} />}
        title={t(`${P}.bh-wiring.leaveTitle`)}
      >
        {t(`${P}.bh-wiring.leaveText`)}
      </Alert>
    </Stack>
  );

  const workbenchContent = (
    <Stack gap="sm">
      <DriverSetup />

      <Text fw={700} size="sm">
        {t(`${P}.bh-wiring.buttonsHeader`)}
      </Text>
      <Text size="xs" c="dimmed">
        {t(`${P}.bh-wiring.buttonsDesc`)}
      </Text>
      {BH_BUTTONS.map((button) => (
        <InputTestRow
          key={button.key}
          label={`${t(`${P}.bh-wiring.button.${button.key}`)} (${button.pad})`}
          target={button.target}
          color={button.color}
          recommendedPin={button.pin}
        />
      ))}
    </Stack>
  );

  return (
    <StepWorkbench
      title={t(`${P}.bh-wiring.title`)}
      badge={t(`${P}.bh-wiring.badge`)}
      badgeColor="orange"
      description={t(`${P}.bh-wiring.description`)}
      guideContent={guideContent}
      workbenchContent={workbenchContent}
      isFirstStep={props.isFirstStep}
      isLastStep={props.isLastStep}
      onNext={props.onNext}
      onPrevious={props.onPrevious}
    />
  );
}

// Step 3: Live Test & Save
export function BhDrumReviewStep(props: GuideStepProps) {
  const { t } = useTranslation();
  const commitConfig = useConfigStore((state) => state.commitConfig);
  const connected = useConfigStore((state) => state.connected);
  const buttons = useButtonInputs();

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
      <Text size="sm">{t(`${P}.bh-test.configuredText`)}</Text>

      <Title order={4}>{t(`${P}.bh-test.tipsTitle`)}</Title>
      <Text size="sm">{t(`${P}.bh-test.tipsText`)}</Text>

      <Button
        size="md"
        color="teal"
        disabled={!connected}
        loading={saving}
        leftSection={<IconDeviceFloppy size={18} />}
        onClick={handleSave}
      >
        {saved ? t(`${P}.bh-test.btnSaved`) : t(`${P}.bh-test.btnSave`)}
      </Button>
    </Stack>
  );

  const workbenchContent = (
    <Stack gap="md">
      <Paper withBorder p="md" radius="md" bg="var(--mantine-color-body)">
        <Stack gap="xs">
          <Text size="xs" fw={600} c="dimmed">
            {t(`${P}.bh-test.telemetryTitle`)}
          </Text>
          <BrainStatusBadge prefix={`${P}.bh-test`} findBrain={findBhDrum} />
          <Text size="xs" c="dimmed">
            {t(`${P}.bh-test.verifyPrompt`)}
          </Text>
          <PadMonitors prefix={`${P}.bh-test`} />
        </Stack>
      </Paper>

      <Paper withBorder p="md" radius="md" bg="var(--mantine-color-body)">
        <Stack gap="xs">
          <Text size="xs" fw={600} c="dimmed">
            {t(`${P}.bh-test.buttonsTitle`)}
          </Text>
          <LiveButtons inputs={buttons} />
        </Stack>
      </Paper>
    </Stack>
  );

  return (
    <StepWorkbench
      title={t(`${P}.bh-test.title`)}
      badge={t(`${P}.bh-test.badge`)}
      badgeColor="green"
      description={t(`${P}.bh-test.description`)}
      guideContent={guideContent}
      workbenchContent={workbenchContent}
      isFirstStep={props.isFirstStep}
      isLastStep={props.isLastStep}
      onNext={props.onNext}
      onPrevious={props.onPrevious}
    />
  );
}
