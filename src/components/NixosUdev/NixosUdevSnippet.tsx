import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Code, CopyButton, Group } from '@mantine/core';

// NixOS builds /etc from configuration.nix, so the rules can't just be copied into
// /etc/udev/rules.d. Instead hand over a snippet that adds them to the system config.
export function NixosUdevSnippet() {
  const { t } = useTranslation();
  const [rules, setRules] = useState<string | null>(null);

  useEffect(() => {
    fetch('70-santroller.rules')
      .then((response) => response.text())
      .then(setRules)
      .catch(() => setRules(null));
  }, []);

  if (!rules) {
    return null;
  }

  const indented = rules
    .trimEnd()
    .split('\n')
    .map((line) => (line ? `    ${line}` : line))
    .join('\n');
  const snippet = `services.udev.extraRules = ''\n${indented}\n'';`;

  return (
    <Group align="flex-start" gap="xs" wrap="nowrap">
      <Code block style={{ flex: 1, maxHeight: 200, overflow: 'auto' }}>
        {snippet}
      </Code>
      <CopyButton value={snippet}>
        {({ copied, copy }) => (
          <Button size="xs" variant="default" color={copied ? 'teal' : 'gray'} onClick={copy}>
            {copied ? t('connect.copied') : t('connect.copy')}
          </Button>
        )}
      </CopyButton>
    </Group>
  );
}
