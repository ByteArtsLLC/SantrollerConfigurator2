import React from 'react';
import {
  IconCheck,
  IconDeviceFloppy,
  IconDisc,
  IconInfoCircle,
  IconPlugConnected,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Alert, Badge, Button, Card, Group, Paper, Stack, Table, Text, Title } from '@mantine/core';
import { proto } from '@/components/SettingsContext/config';
import { useConfigStore } from '@/components/SettingsContext/SettingsContext';
import { LiveAxis, LiveButtons, LiveInput } from '../adapters/adapterLiveStatus';
import { GuideList } from '../components/GuideList';
import { StepWorkbench } from '../components/StepWorkbench';
import { GuideStepProps } from '../types';
import { gpWithPin, labelWithPin } from '../wiringText';
import {
  addPlatter,
  applyBasePinout,
  BASE_PINOUT,
  findPlatter,
  isBasePinoutApplied,
  PLATTER_SCL,
  PLATTER_SDA,
} from './turntableSetup';

const P = 'guides.dj-turntable.steps';

function platterInput(left: boolean, type: proto.DJHeroPlatterInputType) {
  return (m: proto.IMapping) => {
    const status = useConfigStore.getState().deviceStatus[m.input?.djhPlatter?.deviceid ?? ''];
    return (
      m.input?.djhPlatter?.type === type && (status?.device.djhTurntable?.left ?? true) === left
    );
  };
}

function gpioOutput(output: proto.IOutput) {
  const [key, value] = Object.entries(output)[0];
  return (m: proto.IMapping) =>
    m.input?.gpio != null && m.mapping?.[key as keyof proto.IOutput] === value;
}

function usePlatterButtons(left: boolean): LiveInput[] {
  const { t } = useTranslation();
  const T = proto.DJHeroPlatterInputType;
  return [
    {
      label: t(`${P}.tt-wiring.btnGreen`),
      color: 'green',
      match: platterInput(left, T.DJHeroPlatterGreen),
    },
    {
      label: t(`${P}.tt-wiring.btnRed`),
      color: 'red',
      match: platterInput(left, T.DJHeroPlatterRed),
    },
    {
      label: t(`${P}.tt-wiring.btnBlue`),
      color: 'blue',
      match: platterInput(left, T.DJHeroPlatterBlue),
    },
  ];
}

function PlatterStatus({ left }: { left: boolean }) {
  const { t } = useTranslation();
  const connected = useConfigStore((state) => state.connected);
  const platter = useConfigStore((state) => findPlatter(state, left));
  const side = left ? t(`${P}.tt-wiring.leftPlatter`) : t(`${P}.tt-wiring.rightPlatter`);
  const status = !connected
    ? t(`${P}.tt-test.picoNotConnected`)
    : !platter
      ? t(`${P}.tt-test.platterNotAdded`)
      : platter.connected
        ? t(`${P}.tt-test.platterConnected`)
        : t(`${P}.tt-test.platterNotDetected`);
  return (
    <Badge
      size="lg"
      color={connected && platter?.connected ? 'grape' : 'gray'}
      variant="light"
      leftSection={<IconDisc size={16} />}
    >
      {side}: {status}
    </Badge>
  );
}

// Step 1: Supplies & Intro
export function TurntableIntroStep(props: GuideStepProps) {
  const { t } = useTranslation();

  const guideContent = (
    <Stack gap="md">
      <Text size="sm">{t(`${P}.tt-intro.intro`)}</Text>

      <Title order={4}>{t(`${P}.tt-intro.suppliesTitle`)}</Title>
      <GuideList iconColor="grape" items={t(`${P}.tt-intro.supplies`, { returnObjects: true })} />

      <Title order={4}>{t(`${P}.tt-intro.subsystemsTitle`)}</Title>
      <Text size="sm">{t(`${P}.tt-intro.subsystemsIntro`)}</Text>
      <GuideList
        boldAllIfNoColon={false}
        items={t(`${P}.tt-intro.subsystems`, { returnObjects: true })}
      />
    </Stack>
  );

  const workbenchContent = (
    <Stack gap="md">
      <Card withBorder radius="md" p="md" bg="var(--mantine-color-body)">
        <Stack gap="xs">
          <Text fw={700} size="sm">
            {t(`${P}.tt-intro.pinoutTitle`)}
          </Text>
          <Text size="xs" c="dimmed">
            {t(`${P}.tt-intro.pinoutDesc`)}
          </Text>

          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t(`${P}.tt-intro.thFeature`)}</Table.Th>
                <Table.Th>{t(`${P}.tt-intro.thPicoPin`)}</Table.Th>
                <Table.Th>{t(`${P}.tt-intro.thType`)}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td>{t(`${P}.tt-intro.featurePlatterSda`)}</Table.Td>
                <Table.Td>{gpWithPin(PLATTER_SDA, 24)}</Table.Td>
                <Table.Td>{t(`${P}.tt-intro.typeI2cData`)}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>{t(`${P}.tt-intro.featurePlatterScl`)}</Table.Td>
                <Table.Td>{gpWithPin(PLATTER_SCL, 25)}</Table.Td>
                <Table.Td>{t(`${P}.tt-intro.typeI2cClock`)}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>{t(`${P}.tt-intro.featurePlatterPower`)}</Table.Td>
                <Table.Td>
                  {labelWithPin('3V3(OUT)', 36)}, {labelWithPin('GND', 38)}
                </Table.Td>
                <Table.Td>{t(`${P}.tt-intro.typePower`)}</Table.Td>
              </Table.Tr>
              {BASE_PINOUT.map((base) => (
                <Table.Tr key={base.key}>
                  <Table.Td>{t(`${P}.tt-intro.base.${base.key}`)}</Table.Td>
                  <Table.Td>{gpWithPin(base.pin, base.physicalPin)}</Table.Td>
                  <Table.Td>
                    {base.analog
                      ? t(`${P}.tt-intro.typeAnalog`, { adc: base.pin - 26 })
                      : t(`${P}.tt-intro.typeDigital`)}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Card>
    </Stack>
  );

  return (
    <StepWorkbench
      title={t(`${P}.tt-intro.title`)}
      badge={t(`${P}.tt-intro.badge`)}
      badgeColor="grape"
      description={t(`${P}.tt-intro.description`)}
      guideContent={guideContent}
      workbenchContent={workbenchContent}
      isFirstStep={props.isFirstStep}
      isLastStep={props.isLastStep}
      onNext={props.onNext}
      onPrevious={props.onPrevious}
    />
  );
}

function PlatterSetup({ left }: { left: boolean }) {
  const { t } = useTranslation();
  const connected = useConfigStore((state) => state.connected);
  const platter = useConfigStore((state) => findPlatter(state, left));
  const i2c = platter?.device.djhTurntable?.i2c;
  return (
    <Group justify="space-between" wrap="nowrap">
      <Text size="sm" fw={600}>
        {left ? t(`${P}.tt-wiring.leftPlatter`) : t(`${P}.tt-wiring.rightPlatter`)}
      </Text>
      {platter ? (
        <Badge color="teal" variant="filled" leftSection={<IconCheck size={14} />}>
          {t(`${P}.tt-wiring.platterAdded`, { sda: i2c?.sda, scl: i2c?.scl })}
        </Badge>
      ) : (
        <Button
          size="xs"
          color="grape"
          leftSection={<IconPlugConnected size={14} />}
          disabled={!connected}
          onClick={() => addPlatter(left)}
        >
          {t(`${P}.tt-wiring.addPlatterBtn`)}
        </Button>
      )}
    </Group>
  );
}

// Step 2: Wiring
export function TurntableWiringStep(props: GuideStepProps) {
  const { t } = useTranslation();
  const connected = useConfigStore((state) => state.connected);
  const baseApplied = useConfigStore(isBasePinoutApplied);
  const leftButtons = usePlatterButtons(true);
  const rightButtons = usePlatterButtons(false);
  const crossfader: LiveInput = {
    label: t(`${P}.tt-wiring.crossfaderHeader`),
    color: 'grape',
    match: gpioOutput(BASE_PINOUT[0].output),
  };

  const guideContent = (
    <Stack gap="md">
      <Title order={4}>{t(`${P}.tt-wiring.wiringTitle`)}</Title>
      <GuideList type="ordered" items={t(`${P}.tt-wiring.wiringSteps`, { returnObjects: true })} />
      <Alert
        color="blue"
        icon={<IconInfoCircle size={16} />}
        title={t(`${P}.tt-wiring.orientationTitle`)}
      >
        {t(`${P}.tt-wiring.orientationText`)}
      </Alert>
    </Stack>
  );

  const workbenchContent = (
    <Stack gap="sm">
      <Card withBorder radius="md" p="md" bg="var(--mantine-color-body)">
        <Stack gap="xs">
          <Text fw={700} size="sm">
            {t(`${P}.tt-wiring.setupTitle`)}
          </Text>
          <Text size="xs" c="dimmed">
            {t(`${P}.tt-wiring.setupDesc`)}
          </Text>
          <PlatterSetup left />
          <PlatterSetup left={false} />
          {baseApplied ? (
            <Badge color="teal" variant="filled" leftSection={<IconCheck size={14} />}>
              {t(`${P}.tt-wiring.baseApplied`)}
            </Badge>
          ) : (
            <Button
              size="xs"
              color="grape"
              variant="light"
              disabled={!connected}
              onClick={applyBasePinout}
            >
              {t(`${P}.tt-wiring.applyBaseBtn`)}
            </Button>
          )}
        </Stack>
      </Card>

      <Text fw={700} size="sm">
        {t(`${P}.tt-wiring.testBenchTitle`)}
      </Text>

      <Paper withBorder p="sm" radius="md" bg="var(--mantine-color-body)">
        <Stack gap="xs">
          <Text size="xs" fw={600} c="dimmed">
            {t(`${P}.tt-wiring.platterButtonsHeader`)}
          </Text>
          <Group gap="xs">
            <Text size="xs" w={60}>
              {t(`${P}.tt-wiring.leftPlatter`)}
            </Text>
            <LiveButtons inputs={leftButtons} />
          </Group>
          <Group gap="xs">
            <Text size="xs" w={60}>
              {t(`${P}.tt-wiring.rightPlatter`)}
            </Text>
            <LiveButtons inputs={rightButtons} />
          </Group>
        </Stack>
      </Paper>

      <Paper withBorder p="sm" radius="md" bg="var(--mantine-color-body)">
        <LiveAxis input={crossfader} notMappedLabel={t(`${P}.tt-wiring.notMapped`)} />
      </Paper>
    </Stack>
  );

  return (
    <StepWorkbench
      title={t(`${P}.tt-wiring.title`)}
      badge={t(`${P}.tt-wiring.badge`)}
      badgeColor="grape"
      description={t(`${P}.tt-wiring.description`)}
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
export function TurntableReviewStep(props: GuideStepProps) {
  const { t } = useTranslation();
  const commitConfig = useConfigStore((state) => state.commitConfig);
  const connected = useConfigStore((state) => state.connected);

  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const velocity = (left: boolean): LiveInput => ({
    label: left ? t(`${P}.tt-test.leftVelocity`) : t(`${P}.tt-test.rightVelocity`),
    color: 'grape',
    match: platterInput(left, proto.DJHeroPlatterInputType.DJHeroPlatterVelocity),
  });

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
      <Text size="sm">{t(`${P}.tt-test.configuredText`)}</Text>

      <Title order={4}>{t(`${P}.tt-test.scratchTestTitle`)}</Title>
      <Text size="sm">{t(`${P}.tt-test.scratchTestText`)}</Text>

      <Button
        size="md"
        color="teal"
        disabled={!connected}
        loading={saving}
        leftSection={<IconDeviceFloppy size={18} />}
        onClick={handleSave}
      >
        {saved ? t(`${P}.tt-test.btnSaved`) : t(`${P}.tt-test.btnSave`)}
      </Button>
    </Stack>
  );

  const workbenchContent = (
    <Stack gap="md">
      <Paper withBorder p="md" radius="md" bg="var(--mantine-color-body)">
        <Stack gap="xs">
          <Text size="xs" fw={600} c="dimmed">
            {t(`${P}.tt-test.telemetryTitle`)}
          </Text>
          <PlatterStatus left />
          <PlatterStatus left={false} />
          <Text size="xs" c="dimmed">
            {t(`${P}.tt-test.verifyPrompt`)}
          </Text>
          <LiveAxis input={velocity(true)} notMappedLabel={t(`${P}.tt-wiring.notMapped`)} />
          <LiveAxis input={velocity(false)} notMappedLabel={t(`${P}.tt-wiring.notMapped`)} />
        </Stack>
      </Paper>
    </Stack>
  );

  return (
    <StepWorkbench
      title={t(`${P}.tt-test.title`)}
      badge={t(`${P}.tt-test.badge`)}
      badgeColor="green"
      description={t(`${P}.tt-test.description`)}
      guideContent={guideContent}
      workbenchContent={workbenchContent}
      isFirstStep={props.isFirstStep}
      isLastStep={props.isLastStep}
      onNext={props.onNext}
      onPrevious={props.onPrevious}
    />
  );
}
