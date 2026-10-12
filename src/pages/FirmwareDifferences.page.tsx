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
import { useTranslation } from 'react-i18next';
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
  category: string;
  feature: string;
  santroller1: string;
  santroller2: string;
  status: 'major' | 'improved' | 'unchanged' | 'dropped';
}

const COMPARISON_DATA: FeatureComparisonRow[] = [
  {
    category: 'Architecture & Profiles',
    feature: 'Multi-Profile Architecture',
    santroller1: 'Single monolithic config per flash. Re-flashing required to change controller identity or pin mapping.',
    santroller2: 'Dynamic multi-profile system with conditional Assignments (USB, Bluetooth, console mode, connected extensions).',
    status: 'major',
  },
  {
    category: 'Architecture & Profiles',
    feature: 'Configuration & Communication',
    santroller1: 'Custom raw packed binary structs / packet headers over USB serial.',
    santroller2: 'Standardized Google Protocol Buffers (nanopb on device, protobuf.js in configurator) with robust schema versioning.',
    status: 'major',
  },
  {
    category: 'Hardware & Microcontrollers',
    feature: 'Raspberry Pi Pico & RP2040',
    santroller1: 'Basic Arduino-Pico core support.',
    santroller2: 'Native Pico SDK 2.x C++ implementation with custom dual-core tasking, hardware PIO state machines, and DMA.',
    status: 'major',
  },
  {
    category: 'Hardware & Microcontrollers',
    feature: 'Raspberry Pi Pico 2 (RP2350)',
    santroller1: 'Experimental or limited support.',
    santroller2: 'Full first-class support for RP2350 (ARM Cortex-M33) with optimized binaries and compatibility builds.',
    status: 'major',
  },
  {
    category: 'Hardware & Microcontrollers',
    feature: 'Legacy AVR Microcontrollers (Pro Micro / Uno / Mega)',
    santroller1: 'Supported (ATmega32U4, ATmega16U2 via DFU).',
    santroller2: 'Deprecated. RP2040/RP2350 is required for full feature set. Legacy firmware (v10.1.189-legacy) is maintained for old boards.',
    status: 'dropped',
  },
  {
    category: 'Firmware Updates & Flashing',
    feature: 'Over-The-Air (OTA) Updates',
    santroller1: 'Manual UF2 dragging or USB DFU flashing.',
    santroller2: 'Bluetooth FOTA (Firmware Over-The-Air) update support on Pico W / Pico 2 W, plus WebHID in-app updates.',
    status: 'major',
  },
  {
    category: 'USB Host & Peripherals',
    feature: 'USB Host Subsystem',
    santroller1: 'Experimental PIO USB host with limited device class support.',
    santroller2: 'Comprehensive TinyUSB + Pico-PIO-USB host stack supporting USB hubs, Xbox 360 wireless receivers, Xbox One dongles, PS3/PS4/PS5 controllers, and USB MIDI.',
    status: 'major',
  },
  {
    category: 'Console Emulation & Auth',
    feature: 'Console Emulation Breadth',
    santroller1: 'XInput, PS3, PS4, Switch, Wii, PC HID, OG Xbox.',
    santroller2: 'Refactored modular emulators: PS3, PS4, PS5, XInput, Xbox One (GIP/XGIP), Switch, OG Xbox, PS2, Wii Extension, Wii Remote, Joybus (N64/GC), SNES.',
    status: 'improved',
  },
  {
    category: 'Console Emulation & Auth',
    feature: 'Console Authentication (PS4, PS5, Xbox One)',
    santroller1: 'Supported console authentication passthrough for PS4, PS5, and Xbox One, but USB host handshakes were less resilient to timing drops and reconnects.',
    santroller2: 'Hardened authentication architecture with rock-solid reconnect handling, plus added support for dedicated hardware auth chips (e.g. harvested Xbox One security chips over I2C) in addition to USB passthrough dongles/controllers.',
    status: 'improved',
  },
  {
    category: 'Console Emulation & Auth',
    feature: 'Fortnite Festival Support',
    santroller1: 'Handled via rigid console mode bindings. Only offered a single fixed, non-customizable set of standard mappings embedded into the global console mode.',
    santroller2: 'Dedicated custom Festival profile workflow. You can build tailored Festival profiles with customized layouts, strum/fret bindings, and navigation controls, assigning them conditionally without altering standard gameplay profiles.',
    status: 'improved',
  },
  {
    category: 'Wireless & Bluetooth',
    feature: 'Bluetooth Controller Emulation',
    santroller1: 'Limited Bluetooth experimentation.',
    santroller2: 'Full BTstack integration for Pico W and CSR8510 USB dongles (Wii Remote emulation, Bluetooth HID Gamepad & Keyboard profiles).',
    status: 'major',
  },
  {
    category: 'Input & Processing',
    feature: 'Input Pipeline & Filtering',
    santroller1: 'Simple debouncing and basic analog smoothing.',
    santroller2: 'Advanced input manager, flexible debounce models, custom analog range remapping, and dedicated trigger types.',
    status: 'improved',
  },
  {
    category: 'Sensors & Peripherals',
    feature: 'Core Instruments, Peripherals & LEDs (Already Supported in v1)',
    santroller1: 'Already supported: MPR121 fret sensing, analog multiplexers, matrix keypads, ADS1115 ADCs, rotary encoders, APA102 & WS2812 RGB LEDs, STP16CPC constant-current LED drivers, I2C/SPI accelerometers, GH5 tap bars, DJ Hero turntables, WT/BH drums, CRKD guitar necks, and MAX1704x battery monitors.',
    santroller2: 'All ported to the modular device framework with unified pin assignments, per-device configuration, and profile-aware mapping.',
    status: 'unchanged',
  },
  {
    category: 'Sensors & Peripherals',
    feature: 'Newly Added Peripherals & Input Buses',
    santroller1: 'Not supported.',
    santroller2: 'Dedicated Switch Network (paired pin key matrix), integrated Xbox 360 RF wireless receiver (front panel module), native Joybus controller input (N64 / GameCube), SNES/NES controller pad input, Infinium optical contactless crossfaders, DMX512 stage lighting output, CRKD drum kits, and VTech guitar expanders.',
    status: 'major',
  },
  {
    category: 'Configuration Tooling',
    feature: 'Configurator Application & Mobile Support',
    santroller1: 'Desktop C# WPF / Avalonia desktop client (PC only).',
    santroller2: 'Modern, cross-platform Web App using standard WebHID & Web Bluetooth. Runs on desktop operating systems as well as mobile phones directly in the browser (Chrome on Android, Bluefy on iOS)—no app or driver install required.',
    status: 'major',
  },
];

export function FirmwareDifferencesPage() {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState<string>('overview');

  const getStatusBadge = (status: FeatureComparisonRow['status']) => {
    switch (status) {
      case 'major':
        return <Badge color="teal" variant="light" size="sm">Major Upgrade</Badge>;
      case 'improved':
        return <Badge color="blue" variant="light" size="sm">Improved</Badge>;
      case 'dropped':
        return <Badge color="orange" variant="light" size="sm">Architecture Shift</Badge>;
      case 'unchanged':
        return <Badge color="gray" variant="light" size="sm">Unchanged</Badge>;
    }
  };

  return (
    <Layout>
      <Container size="xl" px="md" pb="xl">
        {/* Header */}
        <Stack gap="xs" mb="lg">
          <Group justify="space-between" align="flex-start" wrap="wrap">
            <div>
              <Title order={1} size="h2" fw={700}>
                {t('firmwareDifferences.title', 'Firmware Differences (Santroller 2 vs Santroller 1)')}
              </Title>
              <Text size="sm" c="dimmed">
                {t(
                  'firmwareDifferences.subtitle',
                  'A comprehensive breakdown of architectural changes, hardware support, and new features between Santroller 2 and the legacy Ardwiino/Santroller 1 firmware.'
                )}
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

        <Tabs value={selectedTab} onChange={(val) => setSelectedTab(val || 'overview')} color="blue" radius="md">
          <Tabs.List mb="lg">
            <Tabs.Tab value="overview" leftSection={<IconLayersLinked size={16} />}>
              {t('firmwareDifferences.tabs.overview', 'Key Architectural Differences')}
            </Tabs.Tab>
            <Tabs.Tab value="matrix" leftSection={<IconArrowsExchange size={16} />}>
              {t('firmwareDifferences.tabs.matrix', 'Side-by-Side Comparison')}
            </Tabs.Tab>
            <Tabs.Tab value="migration" leftSection={<IconRefresh size={16} />}>
              {t('firmwareDifferences.tabs.migration', 'Migration & Compatibility Guide')}
            </Tabs.Tab>
          </Tabs.List>

          {/* ================= TAB 1: OVERVIEW ================= */}
          <Tabs.Panel value="overview">
            <Stack gap="lg">
              {/* High-level summary cards */}
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                <Card withBorder radius="md" p="md">
                  <ThemeIcon color="blue" variant="light" size="lg" radius="md" mb="xs">
                    <IconLayersLinked size={20} />
                  </ThemeIcon>
                  <Title order={4} size="h5" mb={4}>
                    Multi-Profile & Assignments
                  </Title>
                  <Text size="xs" c="dimmed">
                    In Santroller 1, you flashed a fixed monolithic configuration for one controller type. Santroller 2 introduces dynamic <strong>Profiles</strong> paired with conditional <strong>Assignments</strong>. A single RP2040 can seamlessly switch between PC, Xbox, PlayStation, and Wii mode, or adapt configurations depending on what guitar neck or USB device is plugged in.
                  </Text>
                </Card>

                <Card withBorder radius="md" p="md">
                  <ThemeIcon color="teal" variant="light" size="lg" radius="md" mb="xs">
                    <IconServer size={20} />
                  </ThemeIcon>
                  <Title order={4} size="h5" mb={4}>
                    Protocol Buffers & Nanopb
                  </Title>
                  <Text size="xs" c="dimmed">
                    Santroller 1 utilized tightly packed raw binary structs that were prone to breaking configuration changes between firmware builds. Santroller 2 standardizes configuration, commands, and real-time debug telemetry around <strong>Google Protocol Buffers</strong> (nanopb), enabling extensible backward-compatible configuration schemas.
                  </Text>
                </Card>

                <Card withBorder radius="md" p="md">
                  <ThemeIcon color="violet" variant="light" size="lg" radius="md" mb="xs">
                    <IconUsb size={20} />
                  </ThemeIcon>
                  <Title order={4} size="h5" mb={4}>
                    Modern USB Host & PIO USB
                  </Title>
                  <Text size="xs" c="dimmed">
                    Santroller 2 features a robust TinyUSB + PIO USB host implementation. It supports multi-port USB hubs, passthrough authentication controllers, Xbox 360 wireless gaming receivers, Xbox One wireless adapters, and direct USB MIDI synthesizers and e-drums.
                  </Text>
                </Card>

                <Card withBorder radius="md" p="md">
                  <ThemeIcon color="grape" variant="light" size="lg" radius="md" mb="xs">
                    <IconCpu size={20} />
                  </ThemeIcon>
                  <Title order={4} size="h5" mb={4}>
                    RP2040 & RP2350 Native Architecture
                  </Title>
                  <Text size="xs" c="dimmed">
                    Built natively on the official Raspberry Pi Pico SDK 2.x rather than Arduino abstraction layers. Leverages RP2040 dual ARM Cortex-M0+ cores and RP2350 dual Cortex-M33 cores, hardware PIO state machines, and DMA transfers for sub-millisecond polling latency.
                  </Text>
                </Card>

                <Card withBorder radius="md" p="md">
                  <ThemeIcon color="indigo" variant="light" size="lg" radius="md" mb="xs">
                    <IconRefresh size={20} />
                  </ThemeIcon>
                  <Title order={4} size="h5" mb={4}>
                    FOTA (Firmware Over-The-Air)
                  </Title>
                  <Text size="xs" c="dimmed">
                    On wireless hardware (Pico W and Pico 2 W), Santroller 2 embeds an autonomous FOTA bootloader. Users can update firmware directly over Bluetooth via the web configurator without opening controller shells or pressing physical BOOTSEL buttons.
                  </Text>
                </Card>

                <Card withBorder radius="md" p="md">
                  <ThemeIcon color="cyan" variant="light" size="lg" radius="md" mb="xs">
                    <IconFileCode size={20} />
                  </ThemeIcon>
                  <Title order={4} size="h5" mb={4}>
                    Web & Mobile Configurator
                  </Title>
                  <Text size="xs" c="dimmed">
                    Replaced the old desktop C# application with a fast, zero-install Web App utilizing standard WebHID (for USB) and Web Bluetooth. You can configure controllers, map inputs, test sensors, and update firmware directly from desktop computers as well as <strong>mobile phones</strong> (Chrome on Android, Bluefy on iOS).
                  </Text>
                </Card>
              </SimpleGrid>

              {/* Hardware Shift Notice */}
              <Alert
                icon={<IconAlertTriangle size={18} />}
                title="Microcontroller Hardware Deprecation"
                color="orange"
                radius="md"
              >
                <Text size="xs">
                  Santroller 1 originated as "Ardwiino" targeting 8-bit AVR microcontrollers like the ATmega32U4 (Arduino Leonardo / SparkFun Pro Micro) and ATmega16U2 (Arduino Uno / Mega). Due to strict ROM (32 KB) and RAM (2.5 KB) constraints, AVR chips cannot support multi-profile storage, protocol buffers, USB host stacks, or Bluetooth emulation. 
                  Santroller 2 requires a <strong>Raspberry Pi Pico (RP2040)</strong> or <strong>Pico 2 (RP2350)</strong>. Existing AVR builds should remain on the legacy Santroller 1 firmware (v10.1.189-legacy.2).
                </Text>
              </Alert>
            </Stack>
          </Tabs.Panel>

          {/* ================= TAB 2: DETAILED SIDE-BY-SIDE MATRIX ================= */}
          <Tabs.Panel value="matrix">
            <Stack gap="md">
              <Paper withBorder radius="md" p="md">
                <Title order={3} size="h4" mb="xs">
                  Technical Specifications Comparison
                </Title>
                <Text size="xs" c="dimmed" mb="md">
                  Side-by-side comparison of capabilities between legacy Ardwiino / Santroller 1 and the new Santroller 2 firmware.
                </Text>

                <Table striped highlightOnHover horizontalSpacing="md" verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ width: '22%' }}>Feature</Table.Th>
                      <Table.Th style={{ width: '35%' }}>Legacy Santroller 1 (Ardwiino)</Table.Th>
                      <Table.Th style={{ width: '35%' }}>Santroller 2 (Current)</Table.Th>
                      <Table.Th style={{ width: '8%', textAlign: 'center' }}>Status</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {COMPARISON_DATA.map((row, idx) => (
                      <Table.Tr key={idx}>
                        <Table.Td>
                          <Text size="xs" fw={700}>
                            {row.feature}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {row.category}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs">{row.santroller1}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" fw={500}>
                            {row.santroller2}
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'center' }}>
                          {getStatusBadge(row.status)}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            </Stack>
          </Tabs.Panel>

          {/* ================= TAB 3: MIGRATION & COMPATIBILITY ================= */}
          <Tabs.Panel value="migration">
            <Stack gap="md">
              <Card withBorder radius="md" p="lg">
                <Title order={3} size="h4" mb="xs">
                  Migrating from Santroller 1 to Santroller 2
                </Title>
                <Text size="xs" c="dimmed" mb="md">
                  If you have existing controllers configured with Santroller 1, here is what you need to know about migrating your configuration and hardware.
                </Text>

                <Stack gap="sm">
                  <Paper withBorder p="md" radius="sm">
                    <Group align="flex-start" gap="sm">
                      <ThemeIcon color="teal" size="md" radius="xl">
                        <IconCheck size={16} />
                      </ThemeIcon>
                      <div style={{ flex: 1 }}>
                        <Text size="sm" fw={600}>
                          Automated Legacy Config (.picoconfig) Import
                        </Text>
                        <Text size="xs" c="dimmed" mt={2}>
                          The Santroller Configurator provides an automated import tool for legacy <Code>.picoconfig</Code> files. 
                          It translates legacy binding tables, axis thresholds, multipliers, and peripheral definitions directly into Santroller 2 Profiles and Assignments.
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
                          Pinout Compatibility
                        </Text>
                        <Text size="xs" c="dimmed" mt={2}>
                          If you already built a controller using a Raspberry Pi Pico on Santroller 1, your physical wiring and pin assignments remain completely compatible. 
                          You can flash the Santroller 2 UF2 file and re-assign your existing GPIO pins without re-soldering.
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
                          Legacy AVR Boards (Pro Micro / Uno)
                        </Text>
                        <Text size="xs" c="dimmed" mt={2}>
                          If your controller is built on an ATmega32U4 (Pro Micro) or ATmega16U2 (Uno/Mega), it cannot run Santroller 2. 
                          You can continue using the legacy Santroller 1 configurator and firmware at{' '}
                          <a
                            href="https://legacy.santroller.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'inherit', fontWeight: 600 }}
                          >
                            legacy.santroller.com
                          </a>. 
                          For new builds or upgrades, drop-in replacement RP2040 boards (such as RP2040-Zero or Pro Micro RP2040 pin-compatible clones) are strongly recommended.
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
                      What You Gain in Santroller 2
                    </Text>
                  </Group>
                  <List size="xs" spacing="xs" icon={<IconCheck size={12} color="var(--mantine-color-teal-6)" />}>
                    <List.Item>Multiple profiles with instant context-aware profile switching</List.Item>
                    <List.Item>Full USB Host support (Hubs, wireless receivers) with hardened PS4/PS5/Xbox One auth and dedicated I2C auth chip support</List.Item>
                    <List.Item>Dedicated custom Fortnite Festival profiles (customizable layouts instead of fixed console-mode bindings)</List.Item>
                    <List.Item>Bluetooth FOTA updates on Pico W & Pico 2 W</List.Item>
                    <List.Item>Robust Protocol Buffers configuration schema</List.Item>
                    <List.Item>New input buses & hardware: Joybus (N64/GC), SNES/NES pads, Xbox 360 RF receiver, Switch Network, DMX output, and optical crossfaders</List.Item>
                    <List.Item>Mobile phone configurator support directly from the browser (Chrome on Android, Bluefy on iOS)</List.Item>
                  </List>
                </Paper>

                <Paper withBorder radius="md" p="md">
                  <Group gap="xs" mb="xs">
                    <ThemeIcon color="orange" variant="light" size="sm" radius="xl">
                      <IconX size={14} />
                    </ThemeIcon>
                    <Text size="sm" fw={700}>
                      Deprecated / Removed
                    </Text>
                  </Group>
                  <List size="xs" spacing="xs" icon={<IconX size={12} color="var(--mantine-color-orange-6)" />}>
                    <List.Item>Support for 8-bit AVR microcontrollers (ATmega32U4 / ATmega16U2)</List.Item>
                    <List.Item>Legacy desktop C# Configurator application</List.Item>
                    <List.Item>Old raw binary struct EEPROM serialization format</List.Item>
                    <List.Item>Single-controller-only fixed configuration mode</List.Item>
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

