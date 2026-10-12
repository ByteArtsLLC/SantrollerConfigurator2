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
    santroller1: 'One configuration per controller, with button-combo switching between console emulation modes. Changing bindings or controller type meant rebuilding and re-flashing the firmware.',
    santroller2: 'Multiple profiles with conditional Assignments (USB, Bluetooth, console mode, connected extensions), switchable at runtime without re-flashing.',
    status: 'major',
  },
  {
    category: 'Architecture & Profiles',
    feature: 'Configuration & Firmware Builds',
    santroller1: 'The configurator saved configs as .picoconfig files, then generated a config header and compiled a custom firmware build (PlatformIO) for every configuration change. This required around a gigabyte of compilers and toolchains to be downloaded onto your machine.',
    santroller2: 'A single prebuilt firmware. Configuration is sent to the device at runtime as Protocol Buffers (nanopb on device, protobuf.js in the configurator), so changes apply instantly without a rebuild, and no compilers or toolchains need to be installed.',
    status: 'major',
  },
  {
    category: 'Hardware & Microcontrollers',
    feature: 'Raspberry Pi Pico & RP2040',
    santroller1: 'Primary platform, built on the Arduino-Pico core with multicore, PIO USB and PIO-driven LEDs.',
    santroller2: 'Rewritten directly on the Pico SDK 2.x in C++ with a modular device, emulation and profile framework.',
    status: 'improved',
  },
  {
    category: 'Hardware & Microcontrollers',
    feature: 'Raspberry Pi Pico 2 (RP2350)',
    santroller1: 'Supported (Pico 2 and Pico 2 W builds, including secondary-Pico builds).',
    santroller2: 'Supported (Pico 2 and Pico 2 W), using the same prebuilt firmware approach as RP2040.',
    status: 'unchanged',
  },
  {
    category: 'Hardware & Microcontrollers',
    feature: 'Legacy AVR Microcontrollers (Pro Micro / Leonardo / Uno / Mega)',
    santroller1: 'Supported (ATmega32U4 directly; Uno/Mega via the ATmega16U2 USB chip).',
    santroller2: 'Not supported. RP2040/RP2350 is required. AVR boards stay on the legacy firmware (v10.1.189-legacy).',
    status: 'dropped',
  },
  {
    category: 'Firmware Updates & Flashing',
    feature: 'Firmware Updates',
    santroller1: 'The desktop configurator compiled and flashed firmware over USB.',
    santroller2: 'In-browser updates over USB, plus Bluetooth FOTA (Firmware Over-The-Air) on Pico W / Pico 2 W.',
    status: 'improved',
  },
  {
    category: 'USB Host & Peripherals',
    feature: 'USB Host Subsystem',
    santroller1: 'PIO USB host with hub support, Xbox 360 wired and wireless receivers, PS4/PS5 controllers, generic HID devices and USB MIDI.',
    santroller2: 'Reworked TinyUSB + Pico-PIO-USB host stack, adding Xbox One wireless adapters, OG Xbox controllers and USB Bluetooth dongles.',
    status: 'improved',
  },
  {
    category: 'Console Emulation & Auth',
    feature: 'Console Emulation Breadth',
    santroller1: 'XInput, Xbox One, OG Xbox, PS2 (via PS3 adapters and on AVR), PS3, PS4/PS5, Switch, Wii (RB and extension emulation), PC HID, Raphnet and Fortnite Festival modes.',
    santroller2: 'Modular emulators for all of the above, plus Joybus (N64/GC), SNES and Wii Remote over Bluetooth.',
    status: 'improved',
  },
  {
    category: 'Console Emulation & Auth',
    feature: 'Console Authentication',
    santroller1: 'PS4 and Xbox One authentication passthrough using a connected USB controller, and PS5 authentication via a P5General.',
    santroller2: 'The same USB passthrough authentication (including PS5 via a P5General), plus support for dedicated Xbox One security chips over I2C.',
    status: 'improved',
  },
  {
    category: 'Console Emulation & Auth',
    feature: 'Fortnite Festival Support',
    santroller1: 'Festival was a separate emulation type with a single hardcoded mapping that could not be customized.',
    santroller2: 'Festival is a profile like any other, so it can have its own layout and bindings and be selected by Assignments alongside your standard profiles.',
    status: 'improved',
  },
  {
    category: 'Wireless & Bluetooth',
    feature: 'Bluetooth',
    santroller1: 'Pico W BLE HID gamepad and keyboard/mouse emulation, plus Bluetooth input from another Santroller.',
    santroller2: 'BTstack integration on Pico W and USB Bluetooth dongles, adding Wii Remote emulation alongside the BLE gamepad and keyboard profiles.',
    status: 'improved',
  },
  {
    category: 'Input & Processing',
    feature: 'Input Pipeline & Filtering',
    santroller1: 'Debouncing, deadzones, multipliers, analog-to-digital and digital-to-analog conversion, joystick-to-dpad and macros.',
    santroller2: 'Reworked input manager with the same processing options, plus custom analog range remapping.',
    status: 'improved',
  },
  {
    category: 'Sensors & Peripherals',
    feature: 'Core Instruments, Peripherals & LEDs (Already Supported in v1)',
    santroller1: 'Already supported: MPR121 fret sensing, analog multiplexers, matrix keypads, rotary encoders, APA102 & WS2812 RGB LEDs, STP16CPC constant-current LED drivers, I2C accelerometers, GH5 tap bars, DJ Hero turntables, WT/BH drums, CRKD guitar necks, and MAX1704x battery monitors.',
    santroller2: 'All ported to the modular device framework with unified pin assignments, per-device configuration, and profile-aware mapping.',
    status: 'unchanged',
  },
  {
    category: 'Sensors & Peripherals',
    feature: 'Newly Added Peripherals & Input Buses',
    santroller1: 'Not supported.',
    santroller2: 'Switch Network (paired pin key matrix), Xbox 360 RF front panel module, Joybus controller input (N64 / GameCube), SNES/NES controller input, ADS1115 ADCs, Infinium optical crossfaders, DMX512 lighting output, CRKD drum kits, and VTech guitar expanders.',
    status: 'major',
  },
  {
    category: 'Configuration Tooling',
    feature: 'Configurator Application & Mobile Support',
    santroller1: 'Desktop Avalonia (C#) application for Windows, macOS and Linux.',
    santroller2: 'Web app using WebHID and Web Bluetooth, with no install required. On phones, Bluetooth-capable controllers can be configured over Web Bluetooth (Chrome on Android, Bluefy on iOS).',
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
                    In Santroller 1, each controller had one configuration (with button-combo console mode switching), and changing it meant rebuilding and re-flashing the firmware. Santroller 2 introduces <strong>Profiles</strong> paired with conditional <strong>Assignments</strong>, so a single controller can use different bindings depending on the console mode, connection type, or which guitar neck or USB device is plugged in.
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
                    Santroller 1 compiled your configuration directly into a custom firmware build every time you changed it, which meant downloading around a gigabyte of compilers and toolchains first. Santroller 2 ships one prebuilt firmware and sends configuration, commands, and debug data at runtime as <strong>Google Protocol Buffers</strong> (nanopb), so changes apply instantly and the schema can grow without breaking existing configs.
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
                    Santroller 2 reworks the TinyUSB + PIO USB host stack. Alongside the hubs, Xbox 360 wireless receivers, PlayStation controllers, and USB MIDI devices supported in Santroller 1, it adds Xbox One wireless adapters, OG Xbox controllers, and USB Bluetooth dongles.
                  </Text>
                </Card>

                <Card withBorder radius="md" p="md">
                  <ThemeIcon color="grape" variant="light" size="lg" radius="md" mb="xs">
                    <IconCpu size={20} />
                  </ThemeIcon>
                  <Title order={4} size="h5" mb={4}>
                    Native Pico SDK Rewrite
                  </Title>
                  <Text size="xs" c="dimmed">
                    Santroller 1 was built on the Arduino-Pico core. Santroller 2 is rewritten directly on the Raspberry Pi Pico SDK 2.x, with a modular framework for devices, console emulators, and profiles on both RP2040 and RP2350.
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
                    On wireless hardware (Pico W and Pico 2 W), Santroller 2 includes a FOTA bootloader, so firmware can be updated over Bluetooth from the web configurator without plugging the controller in.
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
                    Replaced the desktop Avalonia (C#) application with a zero-install web app using WebHID (for USB) and Web Bluetooth. You can configure controllers, map inputs, test sensors, and update firmware from a desktop browser, and Bluetooth-capable controllers can also be configured from <strong>mobile phones</strong> (Chrome on Android, Bluefy on iOS).
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
                  Santroller 1 originated as "Ardwiino" and still supports 8-bit AVR microcontrollers like the ATmega32U4 (Arduino Leonardo / SparkFun Pro Micro) and ATmega16U2 (Arduino Uno / Mega). Due to their limited flash and RAM (32 KB / 2.5 KB on the ATmega32U4), AVR chips cannot support multi-profile storage, protocol buffers, USB host stacks, or Bluetooth emulation. 
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
                          It translates legacy bindings, pins, axis thresholds, multipliers, and peripheral definitions into Santroller 2 Profiles and Assignments.
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
                          If you already built a controller using a Raspberry Pi Pico on Santroller 1, your physical wiring stays the same. 
                          Flash Santroller 2 and import your .picoconfig (or set up your existing GPIO pins manually) without re-soldering.
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
                    <List.Item>Multiple profiles with Assignments, changeable at runtime without re-flashing</List.Item>
                    <List.Item>Xbox One wireless adapters, OG Xbox controllers and USB Bluetooth dongles over USB host, plus I2C Xbox One auth chip support</List.Item>
                    <List.Item>Customizable Fortnite Festival profiles instead of a single hardcoded mapping</List.Item>
                    <List.Item>Bluetooth FOTA updates on Pico W & Pico 2 W</List.Item>
                    <List.Item>One prebuilt firmware with runtime Protocol Buffers configuration (no per-config rebuilds, and no gigabyte of compilers to download)</List.Item>
                    <List.Item>New console emulation: Joybus (N64/GC), SNES, and Wii Remote over Bluetooth</List.Item>
                    <List.Item>New input buses & hardware: Joybus (N64/GC), SNES/NES pads, Xbox 360 RF module, Switch Network, ADS1115, DMX output, and optical crossfaders</List.Item>
                    <List.Item>Mobile configuration over Web Bluetooth (Chrome on Android, Bluefy on iOS)</List.Item>
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
                    <List.Item>Legacy desktop Avalonia (C#) configurator application</List.Item>
                    <List.Item>Per-configuration firmware compilation and the local compiler toolchain it required</List.Item>
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

