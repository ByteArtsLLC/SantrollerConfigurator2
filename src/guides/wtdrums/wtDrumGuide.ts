import { GuideDefinition } from '../types';
import { WtDrumIntroStep, WtDrumReviewStep, WtDrumWiringStep } from './wtDrumGuideSteps';

export const WT_DRUM_GUIDE: GuideDefinition = {
  id: 'wt-drums',
  title: 'World Tour Drum Kit',
  subtitle: 'Guitar Hero World Tour Drum Brain Replacement',
  description:
    "Replace the brain of a Guitar Hero World Tour drum kit with a Raspberry Pi Pico, reading the pads over the kit's own SPI cable.",
  category: 'drums',
  estimatedTime: '20 - 30 mins',
  badge: 'MIDI over SPI',
  supplies: [
    'Raspberry Pi Pico 1 or Pico 2',
    'Guitar Hero World Tour drum kit',
    'Wire, plus a connector or a soldering iron',
  ],
  steps: [
    {
      id: 'wt-intro',
      title: 'Supplies & Overview',
      shortTitle: 'Supplies',
      description: 'How the kit works, and what this conversion replaces.',
      badge: 'No Piezos',
      render: WtDrumIntroStep,
    },
    {
      id: 'wt-wiring',
      title: 'Drum Cable Wiring',
      shortTitle: 'Wiring',
      description: "Wire the drum cable to the Pico's SPI pins, then add the driver.",
      badge: 'SPI',
      render: WtDrumWiringStep,
    },
    {
      id: 'wt-test',
      title: 'Live Test & Save',
      shortTitle: 'Test & Save',
      description: 'Check the drums are detected, hit every pad, then save to the Pico.',
      badge: 'Save to Pico',
      render: WtDrumReviewStep,
    },
  ],
};
