import { Badge, Group, Progress, Stack, Text } from '@mantine/core';
import { proto } from '@/components/SettingsContext/config';
import { useConfigStore } from '@/components/SettingsContext/SettingsContext';

export interface LiveInput {
  label: string;
  color: string;
  // Which mapping drives this control (usually matched on its input, so GH and RB profiles both match)
  match: (mapping: proto.IMapping) => boolean;
}

function useMappingIndex(match: LiveInput['match']) {
  return useConfigStore((state) => {
    const mappings = state.config.profiles?.[state.currentProfile]?.mappings ?? [];
    return mappings.findIndex(match);
  });
}

function useMappingState(idx: number) {
  return useConfigStore((state) =>
    idx === -1 ? undefined : state.mappingStatus[state.currentProfile]?.[idx]
  );
}

function LiveButton({ input }: { input: LiveInput }) {
  const idx = useMappingIndex(input.match);
  const status = useMappingState(idx);
  const pressed = (status?.state ?? 0) > 0;
  return (
    <Badge
      size="md"
      color={idx === -1 ? 'gray' : input.color}
      variant={pressed ? 'filled' : 'outline'}
      opacity={idx === -1 ? 0.5 : 1}
    >
      {input.label}
    </Badge>
  );
}

/** Lights each mapped control while it is pressed, and greys out controls with no mapping */
export function LiveButtons({ inputs }: { inputs: LiveInput[] }) {
  return (
    <Group gap="xs">
      {inputs.map((input) => (
        <LiveButton key={input.label} input={input} />
      ))}
    </Group>
  );
}

/** Shows the raw reading of a mapped analog control */
export function LiveAxis({ input, notMappedLabel }: { input: LiveInput; notMappedLabel: string }) {
  const idx = useMappingIndex(input.match);
  const status = useMappingState(idx);
  const raw = status?.stateRaw ?? 0;
  return (
    <Stack gap={4}>
      <Group justify="space-between">
        <Text size="xs" fw={600}>
          {input.label}
        </Text>
        <Text size="xs" c="dimmed">
          {idx === -1 ? notMappedLabel : `${Math.round((raw / 65535) * 100)}%`}
        </Text>
      </Group>
      <Progress value={(raw / 65535) * 100} color={input.color} size="sm" radius="xl" />
    </Stack>
  );
}

/**
 * Switches the active profile to the fallback type unless it already emulates one of the accepted
 * types, so default mappings loaded afterwards suit the controller the guide builds
 */
export function ensureDeviceToEmulate(accepted: proto.SubType[], fallback: proto.SubType) {
  const store = useConfigStore.getState();
  const idx = store.currentProfile;
  const profile = store.config.profiles?.[idx];
  if (!profile || accepted.includes(profile.opts.deviceToEmulate)) {
    return;
  }
  store.updateProfile({ ...profile, opts: { ...profile.opts, deviceToEmulate: fallback } }, idx);
}
