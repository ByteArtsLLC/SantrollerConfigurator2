import { Fragment } from 'react';
import { IconCpu, IconPlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Input,
  InputBase,
  NumberInput,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  getHostSourceType,
  getProfileSlotLabel,
  getProfileWideSlotIds,
  getRuleSummary,
} from '@/components/Inputs/inputRegistry';
import { proto } from '@/components/SettingsContext/config';

export interface PreviewRule {
  assignments: proto.IProfileAssignmentInfo[];
  /** Shown in place of the button picker when the rule has an input trigger */
  triggerButton?: string;
  /** Shows the editor's matching badge, left out when unset since docs have no live state */
  active?: boolean;
}

// Each target the editor's segmented control can show, keyed by the assignment field that selects it
const TARGETS = [
  ['consoleType', 'usb'],
  ['bluetooth', 'bluetooth'],
  ['ps2Emulation', 'ps2'],
  ['wiiEmulation', 'wii'],
  ['joybusEmulation', 'joybus'],
  ['snesEmulation', 'snes'],
] as const;

// The field and translation prefix the editor's DropdownBox uses for each typed source
const SOURCE_FIELDS: Partial<
  Record<string, { field: keyof proto.IProfileAssignmentInfo; enumKey: string; values: object }>
> = {
  wiiExt: { field: 'wiiExt', enumKey: 'wiiExt', values: proto.WiiExtType },
  ps2Cnt: { field: 'ps2Cnt', enumKey: 'ps2Cnt', values: proto.PS2ControllerType },
  usbType: { field: 'usbType', enumKey: 'subType', values: proto.SubType },
  bluetoothType: { field: 'bluetoothType', enumKey: 'subType', values: proto.SubType },
  midiProGuitar: { field: 'midiProGuitar', enumKey: 'subType', values: proto.SubType },
};

function RulePreviewCard({
  rule,
  listIdx,
  slotIds,
}: {
  rule: PreviewRule;
  listIdx: number;
  slotIds: number[];
}) {
  const { t } = useTranslation();
  const { assignments } = rule;

  const target = TARGETS.find(([field]) => assignments.some((x) => x[field] != null));
  const consoleType = assignments.find((x) => x.consoleType != null)?.consoleType;
  const usbOption = consoleType?.forcedType
    ? 'forced'
    : consoleType?.consoleType
      ? 'specific'
      : 'auto';
  // The editor only lists the targets this board supports, so show USB, Bluetooth and the one in use
  const targetOptions = TARGETS.filter(
    ([field]) => field === 'consoleType' || field === 'bluetooth' || field === target?.[0]
  ).map(([field, key]) => ({ value: field, label: t(`assignments.emulation_mode.${key}`) }));

  const sources = assignments
    .map((item, idx) => ({ item, slotId: slotIds[idx], type: getHostSourceType(item) }))
    .filter((x) => x.type !== null);

  const triggerItem = assignments.find((x) => x.input != null || x.inputAnyTime != null);
  const trigger = triggerItem?.input ?? triggerItem?.inputAnyTime;
  const triggerValue = triggerItem?.input
    ? 'boot'
    : triggerItem?.inputAnyTime
      ? 'anytime'
      : 'always';

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder w="420px" maw="100%">
      <Group gap="xs" mb="xs">
        <Title order={4}>{t('assignments.rule_title', { num: listIdx + 1 })}</Title>
        {rule.active !== undefined && (
          <Badge color={rule.active ? 'blue' : 'gray'}>
            {rule.active ? t('state.active') : t('state.inactive')}
          </Badge>
        )}
      </Group>

      <Card padding="xs" radius="sm" withBorder mb="sm" bg="var(--mantine-color-default-hover)">
        <Group justify="space-between" wrap="nowrap">
          <Text size="xs" fw={500} c="dimmed">
            {t('assignments.rule_summary_prefix')}:
          </Text>
          <Badge variant="light" color={target ? 'teal' : 'red'} size="sm">
            {getRuleSummary(assignments, t)}
          </Badge>
        </Group>
      </Card>

      <Stack gap="sm">
        <Stack gap={4}>
          <Input.Wrapper
            size="xs"
            label={t('assignments.step1_title')}
            description={t('assignments.step1_desc')}
          >
            <SegmentedControl
              fullWidth
              size="xs"
              readOnly
              value={target?.[0] ?? ''}
              data={targetOptions}
            />
          </Input.Wrapper>
          {target?.[0] === 'consoleType' && (
            <Select
              size="xs"
              mt="xs"
              readOnly
              label={t('assignments.usb_mode.label')}
              value={usbOption}
              data={[
                { value: 'auto', label: t('assignments.usb_mode.auto') },
                { value: 'forced', label: t('assignments.usb_mode.forced') },
                { value: 'specific', label: t('assignments.usb_mode.specific') },
              ]}
            />
          )}
        </Stack>

        <Stack gap="xs">
          <div>
            <Text size="xs" fw={500}>
              {t('assignments.step2_title')}
            </Text>
            <Text size="xs" c="dimmed">
              {t('assignments.step2_desc')}
            </Text>
          </div>

          <Card padding="xs" radius="sm" withBorder bg="var(--mantine-color-default-hover)">
            <Group justify="space-between" align="center">
              <Group gap="xs">
                <ThemeIcon size="sm" variant="transparent" color="teal">
                  <IconCpu size={16} />
                </ThemeIcon>
                <Text size="xs" fw={500}>
                  {t('assignments.default_pins_active_title')}
                </Text>
              </Group>
              <Badge size="xs" variant="light" color="teal">
                {t('assignments.always_available')}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed" mt={4}>
              {t('assignments.default_pins_active_desc')}
            </Text>
          </Card>

          {sources.map(({ item, slotId, type }) => {
            const typed = type ? SOURCE_FIELDS[type] : undefined;
            const typedValue = typed ? (item[typed.field] as number) : undefined;
            return (
              <Card
                key={`${type}-${slotId}`}
                padding="xs"
                radius="sm"
                withBorder
                bg="var(--mantine-color-default-hover)"
              >
                <Stack gap={4}>
                  <Badge size="sm" variant="light" color="blue">
                    {getProfileSlotLabel(item, slotId, t)}
                  </Badge>
                  {typed && typedValue != null && (
                    <InputBase
                      size="xs"
                      readOnly
                      label={t(`activation.${typed.field}`)}
                      value={t(
                        `${typed.enumKey}.${(typed.values as Record<number, string>)[typedValue]}`
                      )}
                    />
                  )}
                  {type === 'midiChannel' && (
                    <NumberInput
                      size="xs"
                      readOnly
                      label={t('assignments.midiChannel')}
                      value={item.midiChannel ?? 10}
                    />
                  )}
                </Stack>
              </Card>
            );
          })}

          <Button size="xs" variant="light" disabled leftSection={<IconPlus size={14} />}>
            {sources.length === 0
              ? t('assignments.add_source')
              : t('assignments.add_another_source')}
          </Button>
        </Stack>

        <Divider my={2} />

        <Stack gap={4}>
          <Text size="sm" fw={600}>
            {t('assignments.step3_title')}
          </Text>
          <Select
            size="xs"
            readOnly
            value={triggerValue}
            data={[
              { value: 'always', label: t('assignments.trigger.always') },
              { value: 'boot', label: t('assignments.trigger.boot') },
              { value: 'anytime', label: t('assignments.trigger.anytime') },
            ]}
          />
          {trigger && (
            <>
              <InputBase size="xs" readOnly value={rule.triggerButton ?? ''} />
              <Switch
                size="xs"
                readOnly
                label={t('calibration.inverted')}
                checked={!!trigger.inverted}
              />
            </>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}

// A read-only copy of a profile's assignment rules, laid out like the profile editor, for docs
export function RulePreview({ rules }: { rules: PreviewRule[] }) {
  const { t } = useTranslation();
  const slotIds = getProfileWideSlotIds(rules.map((rule) => rule.assignments));
  return (
    <Group align="flex-start" gap="md">
      {rules.map((rule, listIdx) => (
        <Fragment key={listIdx}>
          {listIdx > 0 && (
            <Badge size="lg" variant="filled" color="gray" style={{ alignSelf: 'center' }}>
              {t('assignments.logic_or')}
            </Badge>
          )}
          <RulePreviewCard rule={rule} listIdx={listIdx} slotIds={slotIds[listIdx]} />
        </Fragment>
      ))}
    </Group>
  );
}
