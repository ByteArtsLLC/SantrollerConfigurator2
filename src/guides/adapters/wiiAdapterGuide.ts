import { GuideDefinition } from '../types';
import { WiiIntroStep, WiiReviewStep, WiiWiringStep } from './wiiAdapterGuideSteps';

export const WII_ADAPTER_GUITAR_GUIDE: GuideDefinition = {
  id: 'wii-adapter',
  title: 'Wii Controller & Guitar to USB Adapter',
  subtitle: 'Plug-and-Play I2C Adapter for Wii Guitars',
  description:
    'Build an adapter using a Raspberry Pi Pico to use any Wii Guitar Hero or Rock Band guitar on PC or console with zero soldering to the guitar itself.',
  category: 'adapters',
  estimatedTime: '20 - 30 mins',
  featured: true,
  badge: 'Beginner Friendly',
  supplies: [
    'Raspberry Pi Pico 1 or Pico 2',
    'Wii Extension Breakout Board or cut extension cable',
    'Soldering Iron & 4 wires',
  ],
  steps: [
    {
      id: 'wii-intro',
      title: 'Supplies & Overview',
      shortTitle: 'Supplies',
      description: '4-wire I2C setup overview and parts list.',
      render: WiiIntroStep,
    },
    {
      id: 'wii-wiring',
      title: 'Wii Pinout & Wiring',
      shortTitle: 'Wiring',
      description: 'Wire 3.3V, Ground, SDA, and SCL, and add the Wii guitar to your profile.',
      badge: '4 Wires',
      render: WiiWiringStep,
    },
    {
      id: 'wii-test',
      title: 'Live Test & Save',
      shortTitle: 'Test & Save',
      description: 'Plug in your guitar, test inputs live, and save the adapter configuration.',
      badge: 'Save to Pico',
      render: WiiReviewStep,
    },
  ],
};
