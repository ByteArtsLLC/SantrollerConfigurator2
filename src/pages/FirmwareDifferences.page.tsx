import React, { useState } from 'react';
import {
  IconAlertTriangle,
  IconArrowsExchange,
  IconCheck,
  IconCpu,
  IconDeviceGamepad,
  IconFileCode,
  IconHistory,
  IconLayersLinked,
  IconPlug,
  IconRefresh,
  IconServer,
  IconUsb,
  IconX,
} from '@tabler/icons-react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  Code,
  Container,
  Group,
  List,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { Layout } from '@/components/Layout/Layout';

interface FeatureComparisonRow {
  /** Key under firmwareDifferences.rows */
  id: string;
  /** Key under firmwareDifferences.categories */
  category: string;
  status: 'major' | 'improved' | 'unchanged' | 'dropped';
}

const COMPARISON_DATA: FeatureComparisonRow[] = [
  { id: 'multiProfile', category: 'architecture', status: 'major' },
  { id: 'configBuilds', category: 'architecture', status: 'major' },
  { id: 'rp2040', category: 'hardware', status: 'improved' },
  { id: 'rp2350', category: 'hardware', status: 'unchanged' },
  { id: 'avr', category: 'hardware', status: 'dropped' },
  { id: 'firmwareUpdates', category: 'firmwareUpdates', status: 'improved' },
  { id: 'usbHost', category: 'usbHost', status: 'improved' },
  { id: 'consoleEmulation', category: 'consoleEmulation', status: 'improved' },
  { id: 'consoleAuth', category: 'consoleEmulation', status: 'improved' },
  { id: 'festival', category: 'consoleEmulation', status: 'improved' },
  { id: 'bluetooth', category: 'wireless', status: 'improved' },
  { id: 'inputPipeline', category: 'input', status: 'improved' },
  { id: 'coreDevices', category: 'sensors', status: 'unchanged' },
  { id: 'newDevices', category: 'sensors', status: 'major' },
  { id: 'configurator', category: 'tooling', status: 'major' },
  { id: 'buildGuides', category: 'tooling', status: 'major' },
];

const STATUS_COLORS: Record<FeatureComparisonRow['status'], string> = {
  major: 'teal',
  improved: 'blue',
  dropped: 'orange',
  unchanged: 'gray',
};

const OVERVIEW_CARDS = [
  { key: 'multiProfile', color: 'blue', Icon: IconLayersLinked },
  { key: 'protobuf', color: 'teal', Icon: IconServer },
  { key: 'usbHost', color: 'violet', Icon: IconUsb },
  { key: 'picoSdk', color: 'grape', Icon: IconCpu },
  { key: 'fota', color: 'indigo', Icon: IconRefresh },
  { key: 'webConfigurator', color: 'cyan', Icon: IconFileCode },
] as const;

const GAIN_ITEMS = [
  'profiles',
  'usbHost',
  'festival',
  'fota',
  'protobuf',
  'emulation',
  'hardware',
  'mobile',
  'guides',
] as const;

const REMOVED_ITEMS = ['avr', 'desktopApp', 'compilation'] as const;

export function FirmwareDifferencesPage() {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState<string>('overview');

  const getStatusBadge = (status: FeatureComparisonRow['status']) => (
    <Badge color={STATUS_COLORS[status]} variant="light" size="sm">
      {t(`firmwareDifferences.status.${status}`)}
    </Badge>
  );

  return (
    <Layout>
      <Container size="xl" px="md" pb="xl">
        {/* Header */}
        <Stack gap="xs" mb="lg">
          <Group justify="space-between" align="flex-start" wrap="wrap">
            <div>
              <Title order={1} size="h2" fw={700}>
                {t('firmwareDifferences.title')}
              </Title>
              <Text size="sm" c="dimmed">
                {t('firmwareDifferences.subtitle')}
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
                variant="light"
                size="xs"
                color="indigo"
                component={Link}
                to="/compatibility"
                leftSection={<IconDeviceGamepad size={14} />}
              >
                {t('nav.compatibility', 'Console Compatibility')}
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

        <Tabs
          value={selectedTab}
          onChange={(val) => setSelectedTab(val || 'overview')}
          color="blue"
          radius="md"
        >
          <Tabs.List mb="lg">
            <Tabs.Tab value="overview" leftSection={<IconLayersLinked size={16} />}>
              {t('firmwareDifferences.tabs.overview')}
            </Tabs.Tab>
            <Tabs.Tab value="matrix" leftSection={<IconArrowsExchange size={16} />}>
              {t('firmwareDifferences.tabs.matrix')}
            </Tabs.Tab>
            <Tabs.Tab value="migration" leftSection={<IconRefresh size={16} />}>
              {t('firmwareDifferences.tabs.migration')}
            </Tabs.Tab>
          </Tabs.List>

          {/* ================= TAB 1: OVERVIEW ================= */}
          <Tabs.Panel value="overview">
            <Stack gap="lg">
              {/* High-level summary cards */}
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {OVERVIEW_CARDS.map(({ key, color, Icon }) => (
                  <Card key={key} withBorder radius="md" p="md">
                    <ThemeIcon color={color} variant="light" size="lg" radius="md" mb="xs">
                      <Icon size={20} />
                    </ThemeIcon>
                    <Title order={4} size="h5" mb={4}>
                      {t(`firmwareDifferences.overview.${key}.title`)}
                    </Title>
                    <Text size="xs" c="dimmed">
                      <Trans
                        i18nKey={`firmwareDifferences.overview.${key}.body`}
                        components={{ strong: <strong /> }}
                      />
                    </Text>
                  </Card>
                ))}
              </SimpleGrid>

              {/* Hardware Shift Notice */}
              <Alert
                icon={<IconAlertTriangle size={18} />}
                title={t('firmwareDifferences.overview.avrDeprecation.title')}
                color="orange"
                radius="md"
              >
                <Text size="xs">
                  <Trans
                    i18nKey="firmwareDifferences.overview.avrDeprecation.body"
                    components={{ strong: <strong /> }}
                  />
                </Text>
              </Alert>
            </Stack>
          </Tabs.Panel>

          {/* ================= TAB 2: DETAILED SIDE-BY-SIDE MATRIX ================= */}
          <Tabs.Panel value="matrix">
            <Stack gap="md">
              <Paper withBorder radius="md" p="md">
                <Title order={3} size="h4" mb="xs">
                  {t('firmwareDifferences.matrix.title')}
                </Title>
                <Text size="xs" c="dimmed" mb="md">
                  {t('firmwareDifferences.matrix.description')}
                </Text>

                <Table.ScrollContainer minWidth={800}>
                  <Table striped highlightOnHover horizontalSpacing="md" verticalSpacing="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th style={{ width: '20%' }}>
                          {t('firmwareDifferences.matrix.headers.feature')}
                        </Table.Th>
                        <Table.Th style={{ width: '34%' }}>
                          {t('firmwareDifferences.matrix.headers.santroller1')}
                        </Table.Th>
                        <Table.Th style={{ width: '34%' }}>
                          {t('firmwareDifferences.matrix.headers.santroller2')}
                        </Table.Th>
                        <Table.Th style={{ width: '12%', minWidth: 160, textAlign: 'center' }}>
                          {t('firmwareDifferences.matrix.headers.status')}
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {COMPARISON_DATA.map((row) => (
                        <Table.Tr key={row.id}>
                          <Table.Td>
                            <Text size="xs" fw={700}>
                              {t(`firmwareDifferences.rows.${row.id}.feature`)}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {t(`firmwareDifferences.categories.${row.category}`)}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs">
                              {t(`firmwareDifferences.rows.${row.id}.santroller1`)}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" fw={500}>
                              {t(`firmwareDifferences.rows.${row.id}.santroller2`)}
                            </Text>
                          </Table.Td>
                          <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            {getStatusBadge(row.status)}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              </Paper>
            </Stack>
          </Tabs.Panel>

          {/* ================= TAB 3: MIGRATION & COMPATIBILITY ================= */}
          <Tabs.Panel value="migration">
            <Stack gap="md">
              <Card withBorder radius="md" p="lg">
                <Title order={3} size="h4" mb="xs">
                  {t('firmwareDifferences.migration.title')}
                </Title>
                <Text size="xs" c="dimmed" mb="md">
                  {t('firmwareDifferences.migration.description')}
                </Text>

                <Stack gap="sm">
                  <Paper withBorder p="md" radius="sm">
                    <Group align="flex-start" gap="sm">
                      <ThemeIcon color="teal" size="md" radius="xl">
                        <IconCheck size={16} />
                      </ThemeIcon>
                      <div style={{ flex: 1 }}>
                        <Text size="sm" fw={600}>
                          {t('firmwareDifferences.migration.configImport.title')}
                        </Text>
                        <Text size="xs" c="dimmed" mt={2}>
                          <Trans
                            i18nKey="firmwareDifferences.migration.configImport.body"
                            components={{ code: <Code /> }}
                          />
                        </Text>
                      </div>
                    </Group>
                  </Paper>

                  <Paper withBorder p="md" radius="sm">
                    <Group align="flex-start" gap="sm">
                      <ThemeIcon color="blue" size="md" radius="xl">
                        <IconCpu size={16} />
                      </ThemeIcon>
                      <div style={{ flex: 1 }}>
                        <Text size="sm" fw={600}>
                          {t('firmwareDifferences.migration.pinout.title')}
                        </Text>
                        <Text size="xs" c="dimmed" mt={2}>
                          {t('firmwareDifferences.migration.pinout.body')}
                        </Text>
                      </div>
                    </Group>
                  </Paper>

                  <Paper withBorder p="md" radius="sm">
                    <Group align="flex-start" gap="sm">
                      <ThemeIcon color="orange" size="md" radius="xl">
                        <IconHistory size={16} />
                      </ThemeIcon>
                      <div style={{ flex: 1 }}>
                        <Text size="sm" fw={600}>
                          {t('firmwareDifferences.migration.avr.title')}
                        </Text>
                        <Text size="xs" c="dimmed" mt={2}>
                          <Trans
                            i18nKey="firmwareDifferences.migration.avr.body"
                            components={{
                              legacyLink: (
                                <a
                                  href="https://legacy.santroller.com"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: 'inherit', fontWeight: 600 }}
                                />
                              ),
                            }}
                          />
                        </Text>
                      </div>
                    </Group>
                  </Paper>
                </Stack>
              </Card>

              {/* Quick Summary of What Is Lost vs Gained */}
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <Paper withBorder radius="md" p="md">
                  <Group gap="xs" mb="xs">
                    <ThemeIcon color="teal" variant="light" size="sm" radius="xl">
                      <IconCheck size={14} />
                    </ThemeIcon>
                    <Text size="sm" fw={700}>
                      {t('firmwareDifferences.migration.gains.title')}
                    </Text>
                  </Group>
                  <List
                    size="xs"
                    spacing="xs"
                    icon={<IconCheck size={12} color="var(--mantine-color-teal-6)" />}
                  >
                    {GAIN_ITEMS.map((item) => (
                      <List.Item key={item}>
                        {t(`firmwareDifferences.migration.gains.items.${item}`)}
                      </List.Item>
                    ))}
                  </List>
                </Paper>

                <Paper withBorder radius="md" p="md">
                  <Group gap="xs" mb="xs">
                    <ThemeIcon color="orange" variant="light" size="sm" radius="xl">
                      <IconX size={14} />
                    </ThemeIcon>
                    <Text size="sm" fw={700}>
                      {t('firmwareDifferences.migration.removed.title')}
                    </Text>
                  </Group>
                  <List
                    size="xs"
                    spacing="xs"
                    icon={<IconX size={12} color="var(--mantine-color-orange-6)" />}
                  >
                    {REMOVED_ITEMS.map((item) => (
                      <List.Item key={item}>
                        {t(`firmwareDifferences.migration.removed.items.${item}`)}
                      </List.Item>
                    ))}
                  </List>
                </Paper>
              </SimpleGrid>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Container>
    </Layout>
  );
}
