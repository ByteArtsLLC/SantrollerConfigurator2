import {
  IconAlertTriangle,
  IconBluetooth,
  IconCpu,
  IconDeviceGamepad,
  IconGitMerge,
  IconHandFinger,
  IconKeyboard,
  IconLayersLinked,
  IconListCheck,
  IconListNumbers,
  IconLock,
  IconMusic,
  IconSettings,
  IconUsb,
} from '@tabler/icons-react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Accordion,
  Alert,
  Button,
  Card,
  Group,
  List,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { getProfileSlotLabel, getProfileWideSlotIds } from '@/components/Inputs/inputRegistry';
import { PreviewRule, RulePreview } from '@/components/Inputs/RulePreview';
import { proto } from '@/components/SettingsContext/config';
import { useConfigStore } from '@/components/SettingsContext/SettingsContext';
import { MIDI_PERCUSSION_CHANNEL } from '@/devices/midi';
import { StepWorkbench } from '../components/StepWorkbench';
import { GuideStepProps } from '../types';

const SUMMARY_CARDS = [
  { key: 'rules', color: 'blue', Icon: IconListCheck },
  { key: 'and', color: 'teal', Icon: IconLayersLinked },
  { key: 'or', color: 'violet', Icon: IconGitMerge },
  { key: 'claim', color: 'orange', Icon: IconLock },
  { key: 'pins', color: 'gray', Icon: IconCpu },
] as const;

const ANATOMY_PARTS = [
  { key: 'target', step: 1, color: 'blue', Icon: IconUsb },
  { key: 'source', step: 2, color: 'teal', Icon: IconDeviceGamepad },
  { key: 'trigger', step: 3, color: 'orange', Icon: IconHandFinger },
] as const;

const MULTI_SOURCE_NOTES = ['allRequired', 'midiSeen', 'hub', 'anyCombo'] as const;

const SELECTION_STEPS = ['order', 'exclusive', 'usb', 'claim', 'localInputs'] as const;

const TROUBLESHOOTING_ITEMS = [
  'noRule',
  'notConnected',
  'taken',
  'duplicate',
  'slotMissing',
  'localInputs',
] as const;

// Example assignments, built the same way the profile editor builds them
const USB_AUTO: proto.IProfileAssignmentInfo = {
  consoleType: { consoleType: null, forcedType: null, xinputOnWindows: true, ps4OrPs5Mode: false },
};
const BLUETOOTH: proto.IProfileAssignmentInfo = { bluetooth: proto.BluetoothMode.BTStandard };
const WII_GUITAR: proto.IProfileAssignmentInfo = { wiiExt: proto.WiiExtType.WiiGuitarHeroGuitar };
const MIDI_DRUMS: proto.IProfileAssignmentInfo = { midiChannel: MIDI_PERCUSSION_CHANNEL };
const USB_GAMEPAD: proto.IProfileAssignmentInfo = { usbType: proto.SubType.Gamepad };
const USB_GUITAR: proto.IProfileAssignmentInfo = { usbType: proto.SubType.GuitarHeroGuitar };
const HOLD_AT_BOOT: proto.IProfileAssignmentInfo = { input: { input: {} } };
const LOCAL_INPUTS: proto.IProfileAssignmentInfo = { localInputs: {} };

const ANATOMY_EXAMPLE: PreviewRule[] = [
  { assignments: [USB_AUTO, WII_GUITAR], active: true },
  { assignments: [BLUETOOTH], active: false },
];

const DRUM_EXAMPLE: PreviewRule[] = [
  { assignments: [USB_AUTO, MIDI_DRUMS, USB_GAMEPAD] },
  { assignments: [USB_AUTO, MIDI_DRUMS] },
];

const TRIGGER_ROWS = ['auto', 'forced', 'specific', 'boot', 'anytime', 'inverted'] as const;

// The label each option has in the profile editor
const TRIGGER_OPTION_KEYS: Record<(typeof TRIGGER_ROWS)[number], string[]> = {
  auto: ['assignments.usb_mode.label', 'assignments.usb_mode.auto'],
  forced: ['assignments.usb_mode.label', 'assignments.usb_mode.forced'],
  specific: ['assignments.usb_mode.label', 'assignments.usb_mode.specific'],
  boot: ['assignments.trigger.boot'],
  anytime: ['assignments.trigger.anytime'],
  inverted: ['calibration.inverted'],
};

const strong = { strong: <strong /> };

function OpenProfilesButton() {
  const { t } = useTranslation();
  const connected = useConfigStore((state) => state.connected);
  if (!connected) {
    return null;
  }
  return (
    <Group>
      <Button
        variant="light"
        size="xs"
        component={Link}
        to="/profiles"
        leftSection={<IconSettings size={14} />}
      >
        {t('assignmentsGuide.openProfiles')}
      </Button>
    </Group>
  );
}

// What assignments are and the common setups, from the old How Assignments Work page
export function AssignmentsBasicsStep(props: GuideStepProps) {
  const { t } = useTranslation();

  const recipes: { key: string; icon: React.ReactNode; profiles: PreviewRule[][] }[] = [
    {
      key: 'usb',
      icon: <IconUsb size={16} />,
      profiles: [[{ assignments: [USB_AUTO] }]],
    },
    {
      key: 'adapter',
      icon: <IconDeviceGamepad size={16} />,
      profiles: [[{ assignments: [USB_AUTO, WII_GUITAR] }]],
    },
    {
      key: 'wiredWireless',
      icon: <IconBluetooth size={16} />,
      profiles: [
        [{ assignments: [USB_AUTO, LOCAL_INPUTS] }],
        [{ assignments: [BLUETOOTH, LOCAL_INPUTS] }],
      ],
    },
    {
      key: 'festivalWired',
      icon: <IconKeyboard size={16} />,
      profiles: [
        [
          {
            assignments: [USB_AUTO, HOLD_AT_BOOT, LOCAL_INPUTS],
            triggerButton: t('assignmentsGuide.recipes.triggerButton'),
          },
        ],
        [{ assignments: [USB_AUTO, LOCAL_INPUTS] }],
      ],
    },
    {
      key: 'festivalAdapter',
      icon: <IconKeyboard size={16} />,
      profiles: [
        [
          {
            assignments: [USB_AUTO, WII_GUITAR, HOLD_AT_BOOT],
            triggerButton: t('assignmentsGuide.recipes.triggerButton'),
          },
        ],
        [{ assignments: [USB_AUTO, WII_GUITAR] }],
      ],
    },
    {
      key: 'twoPlayers',
      icon: <IconDeviceGamepad size={16} />,
      profiles: [[{ assignments: [USB_AUTO, USB_GUITAR] }]],
    },
  ];

  const guideContent = (
    <Stack gap="xl">
      <Text size="sm">
        <Trans i18nKey="gettingStarted.steps.assignments.body" components={strong} />
      </Text>
      <OpenProfilesButton />
      {/* Short version */}
      <section>
        <Title order={2} size="h3" mb="sm">
          {t('assignmentsGuide.summary.title')}
        </Title>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 5 }} spacing="md">
          {SUMMARY_CARDS.map(({ key, color, Icon }) => (
            <Card key={key} withBorder radius="md" p="md">
              <ThemeIcon color={color} variant="light" size="lg" radius="md" mb="xs">
                <Icon size={20} />
              </ThemeIcon>
              <Title order={3} size="h5" mb={4}>
                {t(`assignmentsGuide.summary.${key}.title`)}
              </Title>
              <Text size="xs" c="dimmed">
                <Trans i18nKey={`assignmentsGuide.summary.${key}.body`} components={strong} />
              </Text>
            </Card>
          ))}
        </SimpleGrid>
      </section>
      {/* Anatomy of a rule */}
      <section>
        <Title order={2} size="h3" mb={4}>
          {t('assignmentsGuide.anatomy.title')}
        </Title>
        <Text size="sm" c="dimmed" mb="sm">
          {t('assignmentsGuide.anatomy.description')}
        </Text>
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md" mb="md">
          {ANATOMY_PARTS.map(({ key, step, color, Icon }) => (
            <Paper key={key} withBorder radius="md" p="md">
              <Group gap="xs" mb="xs" wrap="nowrap">
                <ThemeIcon color={color} variant="light" size="md" radius="md">
                  <Icon size={16} />
                </ThemeIcon>
                <Text size="sm" fw={700}>
                  {t(`assignments.step${step}_title`)}
                </Text>
              </Group>
              <Text size="xs" c="dimmed">
                <Trans i18nKey={`assignmentsGuide.anatomy.${key}.body`} components={strong} />
              </Text>
            </Paper>
          ))}
        </SimpleGrid>

        <Text size="sm" fw={700} mb="sm">
          {t('assignmentsGuide.anatomy.exampleTitle')}
        </Text>
        <RulePreview rules={ANATOMY_EXAMPLE} />
        <Text size="xs" c="dimmed" mt="sm">
          {t('assignmentsGuide.anatomy.exampleCaption')}
        </Text>
      </section>
      {/* Recipes */}
      <section>
        <Title order={2} size="h3" mb="sm">
          {t('assignmentsGuide.recipes.title')}
        </Title>
        <Accordion variant="separated" radius="md" multiple defaultValue={['usb']}>
          {recipes.map(({ key, icon, profiles }) => (
            <Accordion.Item key={key} value={key}>
              <Accordion.Control icon={icon}>
                <Text size="sm" fw={600}>
                  {t(`assignmentsGuide.recipes.${key}.title`)}
                </Text>
              </Accordion.Control>
              <Accordion.Panel>
                <Text size="sm" mb="md">
                  <Trans i18nKey={`assignmentsGuide.recipes.${key}.body`} components={strong} />
                </Text>
                <Group align="flex-start" gap="xl">
                  {profiles.map((rules, i) => (
                    <Stack key={i} gap="xs" maw="100%">
                      {profiles.length > 1 && (
                        <Text size="sm" fw={700}>
                          {t(`assignmentsGuide.recipes.${i === 0 ? 'profileA' : 'profileB'}`)}
                        </Text>
                      )}
                      <RulePreview rules={rules} />
                    </Stack>
                  ))}
                </Group>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </section>
    </Stack>
  );

  return (
    <StepWorkbench
      {...props}
      title={t('guides.setup.steps.assignments.title')}
      description={t('assignmentsGuide.subtitle')}
      guideContent={guideContent}
    />
  );
}

// How the firmware picks between profiles, for setups with more than one
export function AssignmentsAdvancedStep(props: GuideStepProps) {
  const { t } = useTranslation();

  const drumSlotIds = getProfileWideSlotIds(DRUM_EXAMPLE.map((rule) => rule.assignments))[0];
  const drumSlot = getProfileSlotLabel(MIDI_DRUMS, drumSlotIds[1], t);
  const gamepadSlot = getProfileSlotLabel(USB_GAMEPAD, drumSlotIds[2], t);

  const guideContent = (
    <Stack gap="xl">
      <OpenProfilesButton />
      {/* Several controllers in one rule */}
      <section>
        <Title order={2} size="h3" mb={4}>
          {t('assignmentsGuide.multiSource.title')}
        </Title>
        <Text size="sm" c="dimmed" mb="sm">
          {t('assignmentsGuide.multiSource.description')}
        </Text>
        <Group gap="xs" mb="xs" wrap="nowrap">
          <ThemeIcon color="teal" variant="light" size="md" radius="md">
            <IconMusic size={16} />
          </ThemeIcon>
          <Text size="sm" fw={700}>
            {t('assignmentsGuide.multiSource.exampleTitle')}
          </Text>
        </Group>
        <Text size="sm" mb="sm">
          {t('assignmentsGuide.multiSource.exampleIntro')}
        </Text>

        <RulePreview rules={DRUM_EXAMPLE} />
        <Text size="xs" c="dimmed" mt="sm" mb="md">
          {t('assignmentsGuide.multiSource.exampleCaption')}
        </Text>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Paper withBorder radius="md" p="md">
            <Text size="sm" fw={600} mb="xs">
              {t('assignmentsGuide.multiSource.mappingTitle')}
            </Text>
            <List size="sm" spacing="xs">
              <List.Item icon={<IconMusic size={16} />}>
                <Trans
                  i18nKey="assignmentsGuide.multiSource.mappingMidi"
                  values={{ slot: drumSlot }}
                  components={strong}
                />
              </List.Item>
              <List.Item icon={<IconDeviceGamepad size={16} />}>
                <Trans
                  i18nKey="assignmentsGuide.multiSource.mappingGamepad"
                  values={{ slot: gamepadSlot }}
                  components={strong}
                />
              </List.Item>
            </List>
          </Paper>
          <Paper withBorder radius="md" p="md">
            <Text size="sm" fw={600} mb="xs">
              {t('assignmentsGuide.multiSource.notesTitle')}
            </Text>
            <List size="xs" spacing="xs" c="dimmed">
              {MULTI_SOURCE_NOTES.map((key) => (
                <List.Item key={key}>
                  <Trans
                    i18nKey={`assignmentsGuide.multiSource.notes.${key}`}
                    components={strong}
                  />
                </List.Item>
              ))}
            </List>
          </Paper>
        </SimpleGrid>
      </section>
      {/* How profiles are chosen */}
      <section>
        <Title order={2} size="h3" mb={4}>
          {t('assignmentsGuide.selection.title')}
        </Title>
        <Text size="sm" c="dimmed" mb="sm">
          {t('assignmentsGuide.selection.description')}
        </Text>
        <Stack gap="sm">
          {SELECTION_STEPS.map((key, i) => (
            <Paper key={key} withBorder p="md" radius="sm">
              <Group align="flex-start" gap="sm" wrap="nowrap">
                <ThemeIcon color="blue" size="md" radius="xl">
                  <Text size="xs" fw={700}>
                    {i + 1}
                  </Text>
                </ThemeIcon>
                <div style={{ flex: 1 }}>
                  <Text size="sm" fw={600}>
                    {t(`assignmentsGuide.selection.steps.${key}.title`)}
                  </Text>
                  <Text size="xs" c="dimmed" mt={2}>
                    <Trans
                      i18nKey={`assignmentsGuide.selection.steps.${key}.body`}
                      components={strong}
                    />
                  </Text>
                </div>
              </Group>
            </Paper>
          ))}
        </Stack>
      </section>
      {/* Console modes and triggers */}
      <section>
        <Title order={2} size="h3" mb="sm">
          {t('assignmentsGuide.triggers.title')}
        </Title>
        <Paper withBorder radius="md">
          <Table.ScrollContainer minWidth={560}>
            <Table striped horizontalSpacing="md" verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: '30%' }}>
                    {t('assignmentsGuide.triggers.headers.option')}
                  </Table.Th>
                  <Table.Th>{t('assignmentsGuide.triggers.headers.behaviour')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {TRIGGER_ROWS.map((key) => (
                  <Table.Tr key={key}>
                    <Table.Td>
                      <Text size="xs" fw={700}>
                        {TRIGGER_OPTION_KEYS[key].map((k) => t(k)).join(': ')}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs">
                        <Trans
                          i18nKey={`assignmentsGuide.triggers.rows.${key}.behaviour`}
                          components={strong}
                        />
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      </section>
      {/* Slots */}
      <section>
        <Card withBorder radius="md" p="md">
          <Group gap="xs" mb="xs">
            <ThemeIcon color="teal" variant="light" size="md" radius="md">
              <IconListNumbers size={16} />
            </ThemeIcon>
            <Title order={2} size="h4">
              {t('assignmentsGuide.slots.title')}
            </Title>
          </Group>
          <Text size="sm">
            <Trans i18nKey="assignmentsGuide.slots.body" components={strong} />
          </Text>
          <Text size="xs" c="dimmed" mt="xs">
            <Trans i18nKey="assignmentsGuide.slots.migrate" components={strong} />
          </Text>
        </Card>
      </section>
      {/* Troubleshooting */}
      <Alert
        icon={<IconAlertTriangle size={18} />}
        title={t('assignmentsGuide.troubleshooting.title')}
        color="orange"
        radius="md"
      >
        <List size="sm" spacing="xs">
          {TROUBLESHOOTING_ITEMS.map((key) => (
            <List.Item key={key}>{t(`assignmentsGuide.troubleshooting.items.${key}`)}</List.Item>
          ))}
        </List>
      </Alert>
    </Stack>
  );

  return (
    <StepWorkbench
      {...props}
      title={t('guides.setup.steps.assignmentsAdvanced.title')}
      description={t('guides.setup.steps.assignmentsAdvanced.description')}
      guideContent={guideContent}
    />
  );
}
