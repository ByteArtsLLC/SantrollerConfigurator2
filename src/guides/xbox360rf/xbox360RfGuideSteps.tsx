import React, { useState } from 'react';
import {
  IconAlertTriangle,
  IconCheck,
  IconCpu,
  IconDeviceFloppy,
  IconInfoCircle,
  IconPlugConnected,
  IconRefresh,
  IconUsb,
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
  SegmentedControl,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { proto } from '@/components/SettingsContext/config';
import { useConfigStore } from '@/components/SettingsContext/SettingsContext';
import { GuideList } from '../components/GuideList';
import { StepWorkbench } from '../components/StepWorkbench';
import { findDeviceStatus } from '../guideConfig';
import { GuideStepProps } from '../types';
import { ensureUsbHost, profileHasUsbSlot, usbHostPins } from '../usb/usbHostUtils';
import {
  picoGpPinExample,
  picoPinWithLabel,
  picoUsbHostPin,
  pinNum,
  wireColour,
  wireColours,
  WIRING,
} from '../wiringText';
import {
  findXbox360RfDevice,
  getXbox360RfModel,
  setXbox360RfModel,
  Xbox360RfModel,
  xbox360RfModuleType,
} from './xbox360RfUtils';

// Step 1: Model Selection & Supplies Overview
export function Xbox360RfIntroStep(props: GuideStepProps) {
  const { t } = useTranslation();
  const [model, setModelState] = useState<Xbox360RfModel>(() => getXbox360RfModel());

  const handleModelChange = (val: Xbox360RfModel) => {
    setModelState(val);
    setXbox360RfModel(val);
  };

  const isFat = model === 'fat';

  const guideContent = (
    <Stack gap="md">
      <Stack gap={4}>
        <Text size="xs" fw={700} c="dimmed">
          {t('guides.xbox360-rf.steps.rf-intro.modelSelectLabel')}
        </Text>
        <SegmentedControl
          size="sm"
          value={model}
          onChange={(v) => handleModelChange(v as Xbox360RfModel)}
          data={[
            {
              label: t('guides.xbox360-rf.steps.rf-intro.modelFat'),
              value: 'fat',
            },
            {
              label: t('guides.xbox360-rf.steps.rf-intro.modelSlim'),
              value: 'slim',
            },
          ]}
        />
      </Stack>

      <Text size="sm">{t('guides.xbox360-rf.steps.rf-intro.intro')}</Text>

      {isFat ? (
        <Stack gap={4}>
          <Image
            src="/guides/xbox360rf/fat-pinout.png"
            radius="md"
            alt={t('guides.common.imageAlt.rfFatPinout')}
          />
          <Text size="xs" c="dimmed" ta="center">
            {t('guides.xbox360-rf.steps.rf-intro.fatPreviewCaption')}
          </Text>
        </Stack>
      ) : (
        <Stack gap={4}>
          <Image
            src="/guides/xbox360rf/slim-scheme.png"
            radius="md"
            alt={t('guides.common.imageAlt.rfSlimScheme')}
          />
          <Text size="xs" c="dimmed" ta="center">
            {t('guides.xbox360-rf.steps.rf-intro.slimPreviewCaption')}
          </Text>
        </Stack>
      )}

      <Alert
        color="red"
        icon={<IconAlertTriangle size={16} />}
        title={t('guides.xbox360-rf.steps.rf-intro.voltageWarningTitle')}
      >
        {t('guides.xbox360-rf.steps.rf-intro.voltageWarningText')}
      </Alert>

      <Title order={4}>{t('guides.xbox360-rf.steps.rf-intro.suppliesTitle')}</Title>
      <GuideList
        iconColor="green"
        items={t('guides.xbox360-rf.steps.rf-intro.supplies', { returnObjects: true })}
      />

      <Title order={4}>{t('guides.xbox360-rf.steps.rf-intro.twoInterfacesTitle')}</Title>
      <Text size="sm">{t('guides.xbox360-rf.steps.rf-intro.twoInterfacesText')}</Text>
      <GuideList
        iconColor="blue"
        items={t('guides.xbox360-rf.steps.rf-intro.twoInterfacesList', { returnObjects: true })}
      />
    </Stack>
  );

  const workbenchContent = (
    <Stack gap="md">
      <Card withBorder radius="md" p="md" bg="var(--mantine-color-body)">
        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Text fw={700} size="sm">
              {t('guides.xbox360-rf.steps.rf-intro.architectureOverviewTitle')}
            </Text>
            <Badge color={isFat ? 'green' : 'teal'} size="sm" variant="light">
              {isFat
                ? t('guides.xbox360-rf.steps.rf-intro.badgeFat')
                : t('guides.xbox360-rf.steps.rf-intro.badgeSlim')}
            </Badge>
          </Group>
          <Text size="xs" c="dimmed">
            {t('guides.xbox360-rf.steps.rf-intro.architectureOverviewDesc')}
          </Text>

          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('guides.xbox360-rf.steps.rf-intro.thSignal')}</Table.Th>
                <Table.Th>{t('guides.xbox360-rf.steps.rf-intro.thTarget')}</Table.Th>
                <Table.Th>{t('guides.xbox360-rf.steps.rf-intro.thPurpose')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td>
                  <Badge color="red" size="xs">
                    3.3V VCC
                  </Badge>
                </Table.Td>
                <Table.Td>{picoPinWithLabel(36, '3V3 OUT')}</Table.Td>
                <Table.Td>{t('guides.xbox360-rf.steps.rf-intro.descPower')}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Badge color="gray" size="xs">
                    GND
                  </Badge>
                </Table.Td>
                <Table.Td>{picoPinWithLabel(38, 'GND')}</Table.Td>
                <Table.Td>{t('guides.xbox360-rf.steps.rf-intro.descGnd')}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Badge color="green" size="xs">
                    USB D+ / D-
                  </Badge>
                </Table.Td>
                <Table.Td>Pico GP2 (D+) / GP3 (D-)</Table.Td>
                <Table.Td>{t('guides.xbox360-rf.steps.rf-intro.descUsb')}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Badge color="blue" size="xs">
                    {t(`${WIRING}.serialData`)}
                  </Badge>
                </Table.Td>
                <Table.Td>{picoGpPinExample('GP4')}</Table.Td>
                <Table.Td>{t('guides.xbox360-rf.steps.rf-intro.descSerialData')}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Badge color="cyan" size="xs">
                    {t(`${WIRING}.serialClock`)}
                  </Badge>
                </Table.Td>
                <Table.Td>{picoGpPinExample('GP5')}</Table.Td>
                <Table.Td>{t('guides.xbox360-rf.steps.rf-intro.descSerialClock')}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Badge color="yellow" size="xs">
                    {t('guides.xbox360-rf.pinout.syncButtonOpt')}
                  </Badge>
                </Table.Td>
                <Table.Td>{picoGpPinExample('GP6')}</Table.Td>
                <Table.Td>{t('guides.xbox360-rf.steps.rf-intro.descSync')}</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Stack>
      </Card>
    </Stack>
  );

  return (
    <StepWorkbench
      title={t('guides.xbox360-rf.steps.rf-intro.title')}
      badge={
        isFat
          ? t('guides.xbox360-rf.steps.rf-intro.badgeFat')
          : t('guides.xbox360-rf.steps.rf-intro.badgeSlim')
      }
      badgeColor={isFat ? 'green' : 'teal'}
      description={t('guides.xbox360-rf.steps.rf-intro.description')}
      guideContent={guideContent}
      workbenchContent={workbenchContent}
      isFirstStep={props.isFirstStep}
      isLastStep={props.isLastStep}
      onNext={props.onNext}
      onPrevious={props.onPrevious}
    />
  );
}

// Step 2: Wiring Step (Dynamically renders chosen Fat or Slim pinout & diagram)
export function Xbox360RfWiringStep(props: GuideStepProps) {
  const { t } = useTranslation();
  const [model, setModelState] = useState<Xbox360RfModel>(() => getXbox360RfModel());

  const handleModelChange = (val: Xbox360RfModel) => {
    setModelState(val);
    setXbox360RfModel(val);
  };

  const isFat = model === 'fat';

  const guideContent = (
    <Stack gap="md">
      <Stack gap={4}>
        <Text size="xs" fw={700} c="dimmed">
          {t('guides.xbox360-rf.steps.rf-intro.modelSelectLabel')}
        </Text>
        <SegmentedControl
          size="xs"
          value={model}
          onChange={(v) => handleModelChange(v as Xbox360RfModel)}
          data={[
            {
              label: t('guides.xbox360-rf.steps.rf-intro.modelFat'),
              value: 'fat',
            },
            {
              label: t('guides.xbox360-rf.steps.rf-intro.modelSlim'),
              value: 'slim',
            },
          ]}
        />
      </Stack>

      {isFat ? (
        <>
          <Text size="sm">{t('guides.xbox360-rf.steps.rf-fat.intro')}</Text>

          <Image
            src="/guides/xbox360rf/fat-pinout.png"
            radius="md"
            alt={t('guides.common.imageAlt.rfFatPinout')}
          />
          <Text size="xs" c="dimmed" ta="center">
            {t('guides.xbox360-rf.steps.rf-fat.connectorCaption')}
          </Text>

          <Title order={4}>{t('guides.xbox360-rf.steps.rf-fat.testPointsTitle')}</Title>
          <Text size="sm">{t('guides.xbox360-rf.steps.rf-fat.testPointsDesc')}</Text>

          <Image
            src="/guides/xbox360rf/fat-test-points.jpg"
            radius="md"
            alt={t('guides.common.imageAlt.rfFatTestPoints')}
          />
          <Text size="xs" c="dimmed" ta="center">
            {t('guides.xbox360-rf.steps.rf-fat.testPointsCaption')}
          </Text>

          <Title order={4}>{t('guides.xbox360-rf.steps.rf-fat.wiringStepsTitle')}</Title>
          <GuideList
            type="ordered"
            iconColor="green"
            items={t('guides.xbox360-rf.steps.rf-fat.wiringSteps', { returnObjects: true })}
          />
        </>
      ) : (
        <>
          <Text size="sm">{t('guides.xbox360-rf.steps.rf-slim.intro')}</Text>

          <Image
            src="/guides/xbox360rf/slim-scheme.png"
            radius="md"
            alt={t('guides.common.imageAlt.rfSlimScheme')}
          />
          <Text size="xs" c="dimmed" ta="center">
            {t('guides.xbox360-rf.steps.rf-slim.schemeCaption')}
          </Text>

          <Title order={4}>{t('guides.xbox360-rf.steps.rf-slim.wiringStepsTitle')}</Title>
          <GuideList
            type="ordered"
            iconColor="teal"
            items={t('guides.xbox360-rf.steps.rf-slim.wiringSteps', { returnObjects: true })}
          />

          <Alert
            color="blue"
            icon={<IconInfoCircle size={16} />}
            title={t('guides.xbox360-rf.steps.rf-slim.syncPinNoteTitle')}
          >
            {t('guides.xbox360-rf.steps.rf-slim.syncPinNoteText')}
          </Alert>
        </>
      )}

      <Alert
        color="teal"
        icon={<IconUsb size={16} />}
        title={t('guides.xbox360-rf.steps.rf-wiring.usbNoteTitle')}
      >
        {t('guides.xbox360-rf.steps.rf-wiring.usbNoteText')}
      </Alert>
    </Stack>
  );

  const workbenchContent = (
    <Stack gap="md">
      <Card withBorder radius="md" p="md" bg="var(--mantine-color-body)">
        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Text fw={700} size="sm">
              {isFat
                ? t('guides.xbox360-rf.steps.rf-fat.pinoutTableTitle')
                : t('guides.xbox360-rf.steps.rf-slim.pinoutTableTitle')}
            </Text>
            <Badge color={isFat ? 'green' : 'teal'} size="sm" variant="light">
              {isFat
                ? t('guides.xbox360-rf.pinout.modelFatShort')
                : t('guides.xbox360-rf.pinout.modelSlimShort')}
            </Badge>
          </Group>
          <Text size="xs" c="dimmed">
            {isFat
              ? t('guides.xbox360-rf.steps.rf-fat.pinoutTableDesc')
              : t('guides.xbox360-rf.steps.rf-slim.pinoutTableDesc')}
          </Text>

          {isFat ? (
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('guides.xbox360-rf.steps.rf-fat.thHeaderPin')}</Table.Th>
                  <Table.Th>{t('guides.xbox360-rf.steps.rf-fat.thTestPoint')}</Table.Th>
                  <Table.Th>{t('guides.xbox360-rf.steps.rf-fat.thFunction')}</Table.Th>
                  <Table.Th>{t('guides.xbox360-rf.steps.rf-fat.thConnectTo')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td>{t(`${WIRING}.topPin`, { n: 1 })}</Table.Td>
                  <Table.Td>TP18</Table.Td>
                  <Table.Td>
                    <Badge color="red" size="xs">
                      +3.3V VCC
                    </Badge>
                  </Table.Td>
                  <Table.Td>{picoPinWithLabel(36, '3V3')}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>{t(`${WIRING}.topPin`, { n: 2 })}</Table.Td>
                  <Table.Td>TP13</Table.Td>
                  <Table.Td>
                    <Badge color="yellow" size="xs">
                      USB D-
                    </Badge>
                  </Table.Td>
                  <Table.Td>{picoUsbHostPin('GP3', 'D-')}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>{t(`${WIRING}.topPin`, { n: 3 })}</Table.Td>
                  <Table.Td>TP14</Table.Td>
                  <Table.Td>
                    <Badge color="green" size="xs">
                      USB D+
                    </Badge>
                  </Table.Td>
                  <Table.Td>{picoUsbHostPin('GP2', 'D+')}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>{t(`${WIRING}.topPin`, { n: 4 })}</Table.Td>
                  <Table.Td>TP9 / TP10</Table.Td>
                  <Table.Td>
                    <Badge color="gray" size="xs">
                      GND
                    </Badge>
                  </Table.Td>
                  <Table.Td>{picoPinWithLabel(38, 'GND')}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>{t(`${WIRING}.bottomPin`, { n: 1 })}</Table.Td>
                  <Table.Td>{t('guides.xbox360-rf.pinout.buttonContact')}</Table.Td>
                  <Table.Td>
                    <Badge color="yellow" size="xs">
                      {t('guides.xbox360-rf.pinout.syncPower')}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{t(`${WIRING}.picoGpPinOptional`)}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>{t(`${WIRING}.bottomPin`, { n: 2 })}</Table.Td>
                  <Table.Td>TP16</Table.Td>
                  <Table.Td>
                    <Badge color="blue" size="xs">
                      {t(`${WIRING}.serialData`)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>Pico GP4</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>{t(`${WIRING}.bottomPin`, { n: 3 })}</Table.Td>
                  <Table.Td>TP15</Table.Td>
                  <Table.Td>
                    <Badge color="cyan" size="xs">
                      {t(`${WIRING}.serialClock`)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>Pico GP5</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>{t(`${WIRING}.bottomPin`, { n: 4 })}</Table.Td>
                  <Table.Td>TP9 / TP10</Table.Td>
                  <Table.Td>
                    <Badge color="gray" size="xs">
                      GND
                    </Badge>
                  </Table.Td>
                  <Table.Td>Pico GND</Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          ) : (
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('guides.xbox360-rf.steps.rf-slim.thSlimPin')}</Table.Th>
                  <Table.Th>{t('guides.xbox360-rf.steps.rf-slim.thColor')}</Table.Th>
                  <Table.Th>{t('guides.xbox360-rf.steps.rf-slim.thFunction')}</Table.Th>
                  <Table.Th>{t('guides.xbox360-rf.steps.rf-slim.thConnectTo')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td>{pinNum(2)}</Table.Td>
                  <Table.Td>
                    <Badge color="pink" size="xs">
                      {wireColour('pink')}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{t(`${WIRING}.serialData`)}</Table.Td>
                  <Table.Td>Pico GP4</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>{pinNum(3)}</Table.Td>
                  <Table.Td>
                    <Badge color="blue" size="xs">
                      {wireColours('cyan', 'blue')}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{t(`${WIRING}.serialClock`)}</Table.Td>
                  <Table.Td>Pico GP5</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>{pinNum(5)}</Table.Td>
                  <Table.Td>
                    <Badge color="gray" size="xs">
                      {wireColours('grey', 'white')}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{t(`${WIRING}.usbDataMinus`)}</Table.Td>
                  <Table.Td>{picoUsbHostPin('GP3', 'D-')}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>{pinNum(6)}</Table.Td>
                  <Table.Td>
                    <Badge color="green" size="xs">
                      {wireColour('green')}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{t(`${WIRING}.usbDataPlus`)}</Table.Td>
                  <Table.Td>{picoUsbHostPin('GP2', 'D+')}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>{pinNum(12)}</Table.Td>
                  <Table.Td>
                    <Badge color="orange" size="xs">
                      {wireColour('orange')}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{t(`${WIRING}.power3v3`)}</Table.Td>
                  <Table.Td>{picoPinWithLabel(36, '3V3 OUT')}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>{pinNum(13)}</Table.Td>
                  <Table.Td>
                    <Badge color="yellow" size="xs">
                      {wireColour('yellow')}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{t('guides.xbox360-rf.pinout.syncPowerButton')}</Table.Td>
                  <Table.Td>{picoGpPinExample('GP6')}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>{t('guides.xbox360-rf.pinout.mountingPad')}</Table.Td>
                  <Table.Td>
                    <Badge color="dark" size="xs">
                      {wireColour('black')}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{t(`${WIRING}.groundGnd`)}</Table.Td>
                  <Table.Td>{picoPinWithLabel(38, 'GND')}</Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          )}
        </Stack>
      </Card>
    </Stack>
  );

  return (
    <StepWorkbench
      title={
        isFat
          ? t('guides.xbox360-rf.steps.rf-fat.title')
          : t('guides.xbox360-rf.steps.rf-slim.title')
      }
      badge={
        isFat
          ? t('guides.xbox360-rf.steps.rf-fat.badge')
          : t('guides.xbox360-rf.steps.rf-slim.badge')
      }
      badgeColor={isFat ? 'green' : 'teal'}
      description={
        isFat
          ? t('guides.xbox360-rf.steps.rf-fat.description')
          : t('guides.xbox360-rf.steps.rf-slim.description')
      }
      guideContent={guideContent}
      workbenchContent={workbenchContent}
      isFirstStep={props.isFirstStep}
      isLastStep={props.isLastStep}
      onNext={props.onNext}
      onPrevious={props.onPrevious}
    />
  );
}

// Step 3: Live Configuration, Sync & Save
export function Xbox360RfReviewStep(props: GuideStepProps) {
  const { t } = useTranslation();
  const commitConfig = useConfigStore((state) => state.commitConfig);
  const connected = useConfigStore((state) => state.connected);
  const addDevice = useConfigStore((state) => state.addDevice);
  const existingRfEntry = useConfigStore(findXbox360RfDevice);
  const usbHost = useConfigStore((state) => findDeviceStatus(state, 'usbHost'))?.device.usbHost;
  const hasUsbSlot = useConfigStore(profileHasUsbSlot);
  const usbReady = usbHost != null && hasUsbSlot;
  const usbPins = usbHostPins(usbHost);
  const scanBluetooth = useConfigStore((state) => state.scanBluetooth);
  const scanningBluetooth = useConfigStore((state) => state.scanningBluetooth);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [model, setModelState] = useState<Xbox360RfModel>(() => getXbox360RfModel());

  const handleModelChange = (val: Xbox360RfModel) => {
    setModelState(val);
    setXbox360RfModel(val);
  };

  const isFat = model === 'fat';

  const hasRfDevice = existingRfEntry !== undefined;
  const rfData = existingRfEntry?.xbox360Rf;

  const handleAddDevice = () => {
    if (!hasRfDevice) {
      // Data on GP4, clock on GP5 and sync on GP6, matching the wiring steps
      addDevice('xbox360Rf', undefined, (device) => {
        device.xbox360Rf = {
          ...device.xbox360Rf,
          type: xbox360RfModuleType(model),
          dataPin: 4,
          clockPin: 5,
          syncPin: 6,
        };
      });
    }
    // The xbox360Rf device only drives the serial bus (LEDs, sync). Controller data comes from the
    // module's built in wireless receiver over USB, so it also needs a USB host port (GP2/GP3)
    // and a USB slot in the profile.
    ensureUsbHost();
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
      <Stack gap={4}>
        <Text size="xs" fw={700} c="dimmed">
          {t('guides.xbox360-rf.steps.rf-intro.modelSelectLabel')}
        </Text>
        <SegmentedControl
          size="xs"
          value={model}
          onChange={(v) => handleModelChange(v as Xbox360RfModel)}
          data={[
            {
              label: t('guides.xbox360-rf.steps.rf-intro.modelFat'),
              value: 'fat',
            },
            {
              label: t('guides.xbox360-rf.steps.rf-intro.modelSlim'),
              value: 'slim',
            },
          ]}
        />
      </Stack>

      <Text size="sm">{t('guides.xbox360-rf.steps.rf-test.intro')}</Text>

      <Title order={4}>{t('guides.xbox360-rf.steps.rf-test.syncInstructionsTitle')}</Title>
      <GuideList
        type="ordered"
        iconColor="green"
        items={t('guides.xbox360-rf.steps.rf-test.syncSteps', { returnObjects: true })}
      />

      <Button
        size="md"
        color="green"
        disabled={!connected}
        loading={saving}
        leftSection={<IconDeviceFloppy size={18} />}
        onClick={handleSave}
      >
        {saved
          ? t('guides.xbox360-rf.steps.rf-test.btnSaved')
          : t('guides.xbox360-rf.steps.rf-test.btnSave')}
      </Button>
    </Stack>
  );

  const workbenchContent = (
    <Stack gap="md">
      <Paper withBorder p="md" radius="md" bg="var(--mantine-color-body)">
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Text size="xs" fw={600} c="dimmed">
              {t('guides.xbox360-rf.steps.rf-test.deviceControlTitle')}
            </Text>
            <Badge color={isFat ? 'green' : 'teal'} size="xs" variant="light">
              {isFat
                ? t('guides.xbox360-rf.pinout.modelFatShort')
                : t('guides.xbox360-rf.pinout.modelSlimShort')}
            </Badge>
          </Group>

          {hasRfDevice ? (
            <Stack gap="xs">
              <Group justify="space-between" align="center">
                <Badge
                  size="md"
                  color="green"
                  variant="filled"
                  leftSection={<IconCheck size={14} />}
                >
                  {rfData?.type === proto.Xbox360RfModuleType.Xbox360RfSlim
                    ? t('guides.xbox360-rf.steps.rf-test.moduleConfiguredSlim')
                    : t('guides.xbox360-rf.steps.rf-test.moduleConfiguredFat')}
                </Badge>
                <Text size="xs" c="dimmed">
                  {t('guides.xbox360-rf.pinout.dataClockPins', {
                    data: rfData?.dataPin ?? -1,
                    clock: rfData?.clockPin ?? -1,
                  })}
                </Text>
              </Group>

              {usbReady ? (
                <Badge size="md" color="teal" variant="light" leftSection={<IconUsb size={14} />}>
                  {t('guides.xbox360-rf.steps.rf-test.usbHostReady', usbPins)}
                </Badge>
              ) : (
                <Stack gap={4}>
                  <Text size="xs" c="dimmed">
                    {t('guides.xbox360-rf.steps.rf-test.usbHostMissing')}
                  </Text>
                  <Button
                    size="xs"
                    color="teal"
                    variant="light"
                    leftSection={<IconUsb size={14} />}
                    onClick={() => ensureUsbHost()}
                    disabled={!connected}
                  >
                    {t('guides.xbox360-rf.steps.rf-test.addUsbHostBtn')}
                  </Button>
                </Stack>
              )}

              <Button
                size="sm"
                color="indigo"
                leftSection={<IconRefresh size={16} />}
                loading={scanningBluetooth}
                disabled={!connected || scanningBluetooth}
                onClick={scanBluetooth}
              >
                {t('xbox360Rf.sync')}
              </Button>
            </Stack>
          ) : (
            <Stack gap="xs">
              <Text size="xs" c="dimmed">
                {t('guides.xbox360-rf.steps.rf-test.addDevicePrompt')}
              </Text>
              <Button
                size="xs"
                color={isFat ? 'green' : 'teal'}
                leftSection={<IconCpu size={14} />}
                onClick={handleAddDevice}
                disabled={!connected}
              >
                {isFat
                  ? t('guides.xbox360-rf.steps.rf-test.addFatBtn')
                  : t('guides.xbox360-rf.steps.rf-test.addSlimBtn')}
              </Button>
            </Stack>
          )}

          <Group gap="xs" mt="xs">
            <Badge
              size="md"
              color={connected ? 'teal' : 'gray'}
              variant="light"
              leftSection={<IconPlugConnected size={14} />}
            >
              {connected
                ? t('guides.xbox360-rf.steps.rf-test.picoConnected')
                : t('guides.xbox360-rf.steps.rf-test.picoDisconnected')}
            </Badge>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );

  return (
    <StepWorkbench
      title={t('guides.xbox360-rf.steps.rf-test.title')}
      badge={t('guides.xbox360-rf.steps.rf-test.badge')}
      badgeColor="green"
      description={t('guides.xbox360-rf.steps.rf-test.description')}
      guideContent={guideContent}
      workbenchContent={workbenchContent}
      isFirstStep={props.isFirstStep}
      isLastStep={props.isLastStep}
      onNext={props.onNext}
      onPrevious={props.onPrevious}
    />
  );
}
