import React from 'react';
import {
  IconAlertTriangle,
  IconCheck,
  IconDeviceFloppy,
  IconInfoCircle,
  IconPlugConnected,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Alert, Badge, Button, Card, Image, Paper, Stack, Table, Text, Title } from '@mantine/core';
import { useConfigStore } from '@/components/SettingsContext/SettingsContext';
import { BrainStatusBadge, PadMonitors } from '../bhdrums/bhDrumGuideSteps';
import { GuideList } from '../components/GuideList';
import { StepWorkbench } from '../components/StepWorkbench';
import { GuideStepProps } from '../types';
import { addWtDrumDriver, findWtDrum, isWtDrumConfigured, WT_CONNECTOR } from './wtDrumSetup';

const P = 'guides.wt-drums.steps';

function ConnectorTable({ withType }: { withType?: boolean }) {
  const { t } = useTranslation();
  return (
    <Table striped highlightOnHover withTableBorder withColumnBorders>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>{t(`${P}.wt-wiring.thConnector`)}</Table.Th>
          <Table.Th>{t(`${P}.wt-wiring.thPicoPin`)}</Table.Th>
          {withType && <Table.Th>{t(`${P}.wt-wiring.thType`)}</Table.Th>}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {WT_CONNECTOR.map((pin) => (
          <Table.Tr key={pin.label}>
            <Table.Td>{pin.label}</Table.Td>
            <Table.Td>{pin.pico()}</Table.Td>
            {withType && <Table.Td>{t(`${P}.wt-wiring.${pin.type}`)}</Table.Td>}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

// Step 1: Supplies & Overview
export function WtDrumIntroStep(props: GuideStepProps) {
  const { t } = useTranslation();

  const guideContent = (
    <Stack gap="md">
      <Text size="sm">{t(`${P}.wt-intro.intro`)}</Text>

      <Alert
        color="blue"
        icon={<IconInfoCircle size={16} />}
        title={t(`${P}.wt-intro.notPiezoTitle`)}
      >
        {t(`${P}.wt-intro.notPiezoText`)}
      </Alert>

      <Title order={4}>{t(`${P}.wt-intro.howTitle`)}</Title>
      <Text size="sm">{t(`${P}.wt-intro.howText`)}</Text>

      <Title order={4}>{t(`${P}.wt-intro.suppliesTitle`)}</Title>
      <GuideList iconColor="orange" items={t(`${P}.wt-intro.supplies`, { returnObjects: true })} />

      <Alert
        color="blue"
        icon={<IconInfoCircle size={16} />}
        title={t(`${P}.wt-intro.reversibleTitle`)}
      >
        {t(`${P}.wt-intro.reversibleText`)}
      </Alert>

      <Alert
        color="orange"
        icon={<IconAlertTriangle size={16} />}
        title={t(`${P}.wt-intro.buttonsTitle`)}
      >
        {t(`${P}.wt-intro.buttonsText`)}
      </Alert>
    </Stack>
  );

  const workbenchContent = (
    <Card withBorder radius="md" p="md" bg="var(--mantine-color-body)">
      <Stack gap="xs">
        <Text fw={700} size="sm">
          {t(`${P}.wt-intro.pinoutTitle`)}
        </Text>
        <Text size="xs" c="dimmed">
          {t(`${P}.wt-intro.pinoutDesc`)}
        </Text>
        <ConnectorTable />
      </Stack>
    </Card>
  );

  return (
    <StepWorkbench
      title={t(`${P}.wt-intro.title`)}
      badge={t(`${P}.wt-intro.badge`)}
      badgeColor="orange"
      description={t(`${P}.wt-intro.description`)}
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
  const drum = useConfigStore(findWtDrum);
  const configured = useConfigStore(isWtDrumConfigured);
  const device = drum?.device.worldTourDrum;
  return (
    <Card withBorder radius="md" p="md" bg="var(--mantine-color-body)">
      <Stack gap="xs">
        <Text fw={700} size="sm">
          {t(`${P}.wt-wiring.setupTitle`)}
        </Text>
        <Text size="xs" c="dimmed">
          {t(`${P}.wt-wiring.setupDesc`)}
        </Text>
        <ConnectorTable withType />
        {configured ? (
          <Badge color="teal" variant="filled" leftSection={<IconCheck size={14} />}>
            {t(`${P}.wt-wiring.driverAdded`, {
              sck: device?.spi.sck,
              mosi: device?.spi.mosi,
              miso: device?.spi.miso,
              cs: device?.csPin,
            })}
          </Badge>
        ) : (
          <Button
            size="xs"
            color="orange"
            leftSection={<IconPlugConnected size={14} />}
            disabled={!connected}
            onClick={addWtDrumDriver}
          >
            {t(`${P}.wt-wiring.addDriverBtn`)}
          </Button>
        )}
      </Stack>
    </Card>
  );
}

// Step 2: Wiring
export function WtDrumWiringStep(props: GuideStepProps) {
  const { t } = useTranslation();

  const guideContent = (
    <Stack gap="md">
      <Stack gap={4}>
        <Image
          src="/guides/drums/wt_mainboard.jpg"
          radius="md"
          alt={t(`${P}.wt-wiring.photoCaption`)}
        />
        <Text size="xs" c="dimmed" ta="center">
          {t(`${P}.wt-wiring.photoCaption`)}
        </Text>
      </Stack>

      <Title order={4}>{t(`${P}.wt-wiring.cableTitle`)}</Title>
      <GuideList type="ordered" items={t(`${P}.wt-wiring.cableSteps`, { returnObjects: true })} />

      <Alert
        color="orange"
        icon={<IconAlertTriangle size={16} />}
        title={t(`${P}.wt-wiring.leaveTitle`)}
      >
        {t(`${P}.wt-wiring.leaveText`)}
      </Alert>
    </Stack>
  );

  return (
    <StepWorkbench
      title={t(`${P}.wt-wiring.title`)}
      badge={t(`${P}.wt-wiring.badge`)}
      badgeColor="orange"
      description={t(`${P}.wt-wiring.description`)}
      guideContent={guideContent}
      workbenchContent={<DriverSetup />}
      isFirstStep={props.isFirstStep}
      isLastStep={props.isLastStep}
      onNext={props.onNext}
      onPrevious={props.onPrevious}
    />
  );
}

// Step 3: Live Test & Save
export function WtDrumReviewStep(props: GuideStepProps) {
  const { t } = useTranslation();
  const commitConfig = useConfigStore((state) => state.commitConfig);
  const connected = useConfigStore((state) => state.connected);

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
      <Text size="sm">{t(`${P}.wt-test.configuredText`)}</Text>

      <Title order={4}>{t(`${P}.wt-test.tipsTitle`)}</Title>
      <Text size="sm">{t(`${P}.wt-test.tipsText`)}</Text>

      <Button
        size="md"
        color="teal"
        disabled={!connected}
        loading={saving}
        leftSection={<IconDeviceFloppy size={18} />}
        onClick={handleSave}
      >
        {saved ? t(`${P}.wt-test.btnSaved`) : t(`${P}.wt-test.btnSave`)}
      </Button>
    </Stack>
  );

  const workbenchContent = (
    <Paper withBorder p="md" radius="md" bg="var(--mantine-color-body)">
      <Stack gap="xs">
        <Text size="xs" fw={600} c="dimmed">
          {t(`${P}.wt-test.telemetryTitle`)}
        </Text>
        <BrainStatusBadge prefix={`${P}.wt-test`} findBrain={findWtDrum} />
        <Text size="xs" c="dimmed">
          {t(`${P}.wt-test.verifyPrompt`)}
        </Text>
        <PadMonitors prefix={`${P}.wt-test`} />
      </Stack>
    </Paper>
  );

  return (
    <StepWorkbench
      title={t(`${P}.wt-test.title`)}
      badge={t(`${P}.wt-test.badge`)}
      badgeColor="green"
      description={t(`${P}.wt-test.description`)}
      guideContent={guideContent}
      workbenchContent={workbenchContent}
      isFirstStep={props.isFirstStep}
      isLastStep={props.isLastStep}
      onNext={props.onNext}
      onPrevious={props.onPrevious}
    />
  );
}
