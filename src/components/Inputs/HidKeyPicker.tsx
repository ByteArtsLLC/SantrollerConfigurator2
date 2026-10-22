import { useTranslation } from 'react-i18next';
import { ComboboxItem, Group, Select, TextInput } from '@mantine/core';
import { ASCII_TO_HID, CODE_TO_HID, HID_KEYS, hidKeyMatches, hidKeyName } from '@/devices/keyboard';

// Picks a HID keycode, either by pressing it or from the full list
export function HidKeyPicker({
  value,
  onChange,
}: {
  value: number | null | undefined;
  onChange: (code: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <Group grow align="flex-end">
      <TextInput
        label={t('keyboard.keycode')}
        description={t('keyboard.keycodeCapture')}
        value={hidKeyName(value ?? 0) ?? ''}
        onChange={() => {}}
        onKeyDown={(event) => {
          const code = CODE_TO_HID[event.code] ?? ASCII_TO_HID[event.key]?.code;
          if (code != null) {
            event.preventDefault();
            onChange(code);
          }
        }}
      />
      {/* For keys the user's own keyboard doesn't have (numpad, F13 - F24, international) */}
      <Select
        label={t('keyboard.keycodePick')}
        description={t('keyboard.keycodePickDesc')}
        searchable
        allowDeselect={false}
        data={[
          ...(value && !hidKeyName(value)
            ? [{ value: `${value}`, label: t('keyboard.keyFallback', { code: value }) }]
            : []),
          ...HID_KEYS.map(({ code, name }) => ({ value: `${code}`, label: name })),
        ]}
        filter={({ options, search }) =>
          (options as ComboboxItem[]).filter((option) =>
            hidKeyMatches(Number(option.value), search)
          )
        }
        value={value ? `${value}` : null}
        onChange={(code) => code && onChange(parseInt(code, 10))}
      />
    </Group>
  );
}
