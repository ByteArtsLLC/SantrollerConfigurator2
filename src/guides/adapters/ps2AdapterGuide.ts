import { GuideDefinition } from '../types';
import { PS2IntroStep, PS2ReviewStep, PS2WiringStep } from './ps2AdapterGuideSteps';

export const PS2_ADAPTER_GUIDE: GuideDefinition = {
  id: 'ps2-adapter',
  title: 'PS2 Controller & Guitar to USB Adapter',
  subtitle: 'SPI Bus Adapter for DualShock 2 & PS2 Guitars',
  description:
    'Convert any original Sony PlayStation 1 or 2 gamepad, arcade stick, or Guitar Hero guitar to USB using a Raspberry Pi Pico.',
  category: 'adapters',
  estimatedTime: '30 - 45 mins',
  badge: 'SPI Bus',
  supplies: [
    'Raspberry Pi Pico 1 or Pico 2',
    'PS2 Controller Socket or cut extension cable',
    '2x 1kΩ Resistors (used as pull-up resistors for MISO and Acknowledge lines)',
    'Soldering Iron & Wire',
  ],
  steps: [
    {
      id: 'ps2-intro',
      title: 'Supplies & Overview',
      shortTitle: 'Supplies',
      description: 'PS2 socket pinout and required 1kΩ pull-up resistors.',
      render: PS2IntroStep,
    },
    {
      id: 'ps2-wiring',
      title: 'Wiring & Configuration',
      shortTitle: 'Wiring',
      description: 'Connect the 7 signal and power wires and add the PS2 guitar to your profile.',
      badge: 'SPI Bus',
      render: PS2WiringStep,
    },
    {
      id: 'ps2-test',
      title: 'Live Test & Save',
      shortTitle: 'Test & Save',
      description: 'Plug in your PS2 guitar, verify live inputs, and save to flash.',
      badge: 'Save to Pico',
      render: PS2ReviewStep,
    },
  ],
};
