import { GuideDefinition } from '../types';
import { BhDrumIntroStep, BhDrumReviewStep, BhDrumWiringStep } from './bhDrumGuideSteps';

export const BH_DRUM_GUIDE: GuideDefinition = {
  id: 'bh-drums',
  title: 'Band Hero Drum Kit',
  subtitle: 'Band Hero / Guitar Hero 5 Drum Brain Conversion',
  description:
    "Replace the main microcontroller in a Band Hero or Guitar Hero 5 era drum kit brain with a Raspberry Pi Pico, reading the pads from the brain's own drum chip over I2C.",
  category: 'drums',
  difficulty: 'intermediate',
  estimatedTime: '30 - 45 mins',
  badge: 'MIDI over I2C',
  supplies: [
    'Raspberry Pi Pico 1 or Pico 2',
    'Band Hero / Guitar Hero 5 era drum kit',
    'Soldering Iron & Wire',
  ],
  steps: [
    {
      id: 'bh-intro',
      title: 'Supplies & Overview',
      shortTitle: 'Supplies',
      description: 'How the drum brain works, and what this conversion replaces.',
      badge: 'No Piezos',
      render: BhDrumIntroStep,
    },
    {
      id: 'bh-wiring',
      title: 'Brain & Button Wiring',
      shortTitle: 'Wiring',
      description:
        'Wire the drum chip connector to the Pico over I2C, add the driver, then wire and probe the face buttons.',
      badge: 'I2C',
      render: BhDrumWiringStep,
    },
    {
      id: 'bh-test',
      title: 'Live Test & Save',
      shortTitle: 'Test & Save',
      description: 'Check the brain is detected, hit every pad, then save to the Pico.',
      badge: 'Save to Pico',
      render: BhDrumReviewStep,
    },
  ],
};
