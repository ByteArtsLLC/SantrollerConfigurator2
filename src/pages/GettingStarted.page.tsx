import {
  IconAdjustments,
  IconAlertTriangle,
  IconBolt,
  IconBulb,
  IconCpu,
  IconDeviceFloppy,
  IconListCheck,
  IconPlug,
  IconSettings,
} from '@tabler/icons-react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Accordion,
  Alert,
  Button,
  Card,
  Container,
  Group,
  List,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { Layout } from '@/components/Layout/Layout';

const CONCEPT_CARDS = [
  { key: 'firmware', color: 'blue', Icon: IconBolt },
  { key: 'devices', color: 'teal', Icon: IconCpu },
  { key: 'profiles', color: 'violet', Icon: IconAdjustments },
  { key: 'assignments', color: 'orange', Icon: IconListCheck },
] as const;

// Each step can link to the page where it's done; the label is a key under gettingStarted.links
const STEPS: { key: string; to?: string; link?: string }[] = [
  { key: 'flash', to: '/setup', link: 'setup' },
  { key: 'wire', to: '/guides', link: 'guides' },
  { key: 'connect', to: '/', link: 'connect' },
  { key: 'update' },
  { key: 'devices' },
  { key: 'profile' },
  { key: 'inputs' },
  { key: 'assignments', to: '/assignments', link: 'assignments' },
  { key: 'leds' },
  { key: 'save' },
  { key: 'backup' },
];

const GOOD_TO_KNOW = ['simpleMode', 'santroller1', 'desktopApp', 'peripherals', 'labels'] as const;

const TROUBLESHOOTING_ITEMS = [
  'notFound',
  'linux',
  'notResponding',
  'profileInactive',
  'lostChanges',
  'newerFirmware',
] as const;

const strong = { strong: <strong /> };

export function GettingStartedPage() {
  const { t } = useTranslation();

  return (
    <Layout>
      <Container size="xl" px="md" pb="xl">
        {/* Header */}
        <Stack gap="xs" mb="lg">
          <Group justify="space-between" align="flex-start" wrap="wrap">
            <div>
              <Title order={1} size="h2" fw={700}>
                {t('gettingStarted.title')}
              </Title>
              <Text size="sm" c="dimmed" maw={760}>
                {t('gettingStarted.subtitle')}
              </Text>
            </div>

            <Group gap="xs">
              <Button
                variant="light"
                size="xs"
                color="blue"
                component={Link}
                to="/supported-hardware"
                leftSection={<IconCpu size={14} />}
              >
                {t('nav.supportedHardware', 'Supported Hardware')}
              </Button>
              <Button
                variant="subtle"
                size="xs"
                component={Link}
                to="/guides"
                leftSection={<IconPlug size={14} />}
              >
                {t('guides.catalogTitle', 'Build Guides')}
              </Button>
            </Group>
          </Group>
        </Stack>

        <Stack gap="xl">
          {/* How it fits together */}
          <section>
            <Title order={2} size="h3" mb="sm">
              {t('gettingStarted.concepts.title')}
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
              {CONCEPT_CARDS.map(({ key, color, Icon }) => (
                <Card key={key} withBorder radius="md" p="md">
                  <ThemeIcon color={color} variant="light" size="lg" radius="md" mb="xs">
                    <Icon size={20} />
                  </ThemeIcon>
                  <Title order={3} size="h5" mb={4}>
                    {t(`gettingStarted.concepts.${key}.title`)}
                  </Title>
                  <Text size="xs" c="dimmed">
                    <Trans i18nKey={`gettingStarted.concepts.${key}.body`} components={strong} />
                  </Text>
                </Card>
              ))}
            </SimpleGrid>
          </section>

          {/* Step by step */}
          <section>
            <Title order={2} size="h3" mb={4}>
              {t('gettingStarted.steps.title')}
            </Title>
            <Text size="sm" c="dimmed" mb="sm">
              {t('gettingStarted.steps.description')}
            </Text>
            <Stack gap="sm">
              {STEPS.map(({ key, to, link }, i) => (
                <Paper key={key} withBorder p="md" radius="sm">
                  <Group align="flex-start" gap="sm" wrap="nowrap">
                    <ThemeIcon color="blue" size="md" radius="xl">
                      <Text size="xs" fw={700}>
                        {i + 1}
                      </Text>
                    </ThemeIcon>
                    <div style={{ flex: 1 }}>
                      <Text size="sm" fw={600}>
                        {t(`gettingStarted.steps.${key}.title`)}
                      </Text>
                      <Text size="xs" c="dimmed" mt={2}>
                        <Trans i18nKey={`gettingStarted.steps.${key}.body`} components={strong} />
                      </Text>
                      {to && link && (
                        <Button variant="light" size="compact-xs" mt="xs" component={Link} to={to}>
                          {t(`gettingStarted.links.${link}`)}
                        </Button>
                      )}
                    </div>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </section>

          {/* Saving reminder */}
          <Alert
            icon={<IconDeviceFloppy size={18} />}
            title={t('gettingStarted.saveReminder.title')}
            color="blue"
            radius="md"
          >
            <Text size="sm">
              <Trans i18nKey="gettingStarted.saveReminder.body" components={strong} />
            </Text>
          </Alert>

          {/* Good to know */}
          <section>
            <Title order={2} size="h3" mb="sm">
              {t('gettingStarted.goodToKnow.title')}
            </Title>
            <Accordion variant="separated" radius="md" multiple>
              {GOOD_TO_KNOW.map((key) => (
                <Accordion.Item key={key} value={key}>
                  <Accordion.Control icon={<IconBulb size={16} />}>
                    <Text size="sm" fw={600}>
                      {t(`gettingStarted.goodToKnow.${key}.title`)}
                    </Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Text size="sm">
                      <Trans
                        i18nKey={`gettingStarted.goodToKnow.${key}.body`}
                        components={strong}
                      />
                    </Text>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          </section>

          {/* Troubleshooting */}
          <Alert
            icon={<IconAlertTriangle size={18} />}
            title={t('gettingStarted.troubleshooting.title')}
            color="orange"
            radius="md"
          >
            <List size="sm" spacing="xs">
              {TROUBLESHOOTING_ITEMS.map((key) => (
                <List.Item key={key}>
                  <Trans
                    i18nKey={`gettingStarted.troubleshooting.items.${key}`}
                    components={strong}
                  />
                </List.Item>
              ))}
            </List>
          </Alert>

          <Group gap="xs">
            <Button
              variant="light"
              size="sm"
              component={Link}
              to="/compatibility"
              leftSection={<IconSettings size={16} />}
            >
              {t('nav.compatibility', 'Console Compatibility')}
            </Button>
            <Button
              variant="subtle"
              size="sm"
              component={Link}
              to="/differences"
              leftSection={<IconListCheck size={16} />}
            >
              {t('nav.differences', 'Firmware Differences')}
            </Button>
          </Group>
        </Stack>
      </Container>
    </Layout>
  );
}
