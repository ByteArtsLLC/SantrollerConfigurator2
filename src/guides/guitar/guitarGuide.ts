import { GuideDefinition } from '../types';
import { IntroStep } from './steps/01_IntroStep';
import { FretsStep } from './steps/02_FretsStep';
import { StrumStep } from './steps/03_StrumStep';
import { WhammyStep } from './steps/04_WhammyStep';
import { TiltStep } from './steps/05_TiltStep';
import { NavStep } from './steps/06_NavStep';
import { ReviewStep } from './steps/07_ReviewStep';

export const DIRECT_PICO_GUITAR_GUIDE: GuideDefinition = {
  id: 'direct-pico-guitar',
  title: 'Direct-Wired Guitar (Raspberry Pi Pico)',
  subtitle: 'Interactive Wiring & Configuration Walkthrough',
  description:
    'Step-by-step interactive build guide for rewiring any Guitar Hero or Rock Band guitar with mechanical or original switches to a Raspberry Pi Pico or Pico 2.',
  category: 'guitar',
  estimatedTime: '1 - 2 hours',
  featured: true,
  badge: 'Mechanical / Direct Wire',
  supplies: [
    'Raspberry Pi Pico 1 or Pico 2',
    'Soldering iron & solder',
    'Wire (26-30 AWG)',
    'Multimeter',
    'Wire strippers & cutters',
  ],
  steps: [
    {
      id: 'intro',
      title: '1. Getting Started & Standard Pinout',
      shortTitle: 'Intro & Pinout',
      description:
        'Prepare your tools, microcontroller, and review the standard Santroller wiring plan.',
      badge: 'Overview',
      render: IntroStep,
    },
    {
      id: 'frets',
      title: '2. Fret Buttons & Slider',
      shortTitle: 'Frets',
      description:
        'Connect the 5 fret buttons (Green, Red, Yellow, Blue, Orange) and optional touch slider bar, then verify each input in real time.',
      badge: 'Fret Inputs',
      render: FretsStep,
    },
    {
      id: 'strum',
      title: '3. Strum Bar Switches',
      shortTitle: 'Strum',
      description:
        'Connect Strum Up and Strum Down switches, cut board traces if reusing original PCBs, and test switch actuation.',
      badge: '2 Digital Pins',
      render: StrumStep,
    },
    {
      id: 'whammy',
      title: '4. Whammy Bar Potentiometer',
      shortTitle: 'Whammy',
      description:
        'Wire the 10k potentiometer to 3.3V, Ground, and ADC0 (GP26), then test live analog movement.',
      badge: 'Analog (ADC0)',
      render: WhammyStep,
    },
    {
      id: 'tilt',
      title: '5. Star Power Tilt Sensor',
      shortTitle: 'Tilt',
      description:
        'Connect a ball tilt switch to GP11 or an I2C accelerometer to trigger Star Power / Overdrive.',
      badge: 'Digital / I2C',
      render: TiltStep,
    },
    {
      id: 'nav',
      title: '6. Start, Select & Menu Navigation',
      shortTitle: 'Start / Select',
      description:
        'Wire the Start and Select buttons to GP9 and GP10, and optionally configure the Home combo.',
      badge: '2 Digital Pins',
      render: NavStep,
    },
    {
      id: 'review',
      title: '7. Complete & Final Verification',
      shortTitle: 'Test & Save',
      description: 'Verify all guitar inputs and save your configuration to the Pico.',
      badge: 'Test Bench',
      render: ReviewStep,
    },
  ],
};
