import { GuideDefinition } from '../types';
import {
  Xbox360RfIntroStep,
  Xbox360RfReviewStep,
  Xbox360RfWiringStep,
} from './xbox360RfGuideSteps';

export const XBOX360_RF_GUIDE: GuideDefinition = {
  id: 'xbox360-rf',
  title: 'Xbox 360 RF Wireless Module & Sync',
  subtitle: 'Use Original Fat & Slim RF Modules with Wireless Controllers',
  description:
    'Repurpose an authentic Xbox 360 RF module (Original/Fat or Slim) as an ultra-low latency wireless receiver for Xbox 360 controllers with sync and Ring of Light support.',
  category: 'adapters',
  difficulty: 'intermediate',
  estimatedTime: '25 - 40 mins',
  badge: 'Wireless RF',
  supplies: [
    'Raspberry Pi Pico 1 or Pico 2',
    "Xbox 360 RF module (Original 'Fat' model RF01/Rev H or Slim model)",
    'Soldering iron, flux, and fine wire (28-30 AWG)',
    '2x 22Ω to 27Ω resistors (recommended, in series with USB D+ and D-, see the USB Host guide)',
    'Optional: 1x tactile button for physical hardware sync (if not using software sync)',
  ],
  steps: [
    {
      id: 'rf-intro',
      title: '1. Supplies & Architecture Overview',
      shortTitle: 'Overview',
      description:
        'Understand how the Xbox 360 RF module connects via USB and two-wire serial bus.',
      badge: 'Architecture',
      render: Xbox360RfIntroStep,
    },
    {
      id: 'rf-wiring',
      title: '2. Module Pinout & Wiring',
      shortTitle: 'Wiring',
      description: 'Step-by-step soldering instructions for your chosen module.',
      badge: 'Wiring',
      render: Xbox360RfWiringStep,
    },
    {
      id: 'rf-test',
      title: '3. Configure Device, Pair & Save',
      shortTitle: 'Test & Sync',
      description:
        'Add the Xbox 360 RF device in Santroller, set your pins, sync controllers, and save.',
      badge: 'Configuration',
      render: Xbox360RfReviewStep,
    },
  ],
};
