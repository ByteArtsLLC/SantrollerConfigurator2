import { GuideDefinition } from '../types';
import { DrumIntroStep, DrumPadWiringStep, DrumReviewStep } from './drumGuideSteps';

export const DRUM_KIT_GUIDE: GuideDefinition = {
  id: 'drum-kit',
  title: 'Drum Kit & E-Drums (Piezo & Multiplexer)',
  subtitle: 'Velocity-Sensitive Drum Kit with Multiplexers',
  description:
    'Build a custom velocity-sensitive electronic drum kit or rewire an existing Rock Band or Guitar Hero kit to a Raspberry Pi Pico.',
  category: 'drums',
  difficulty: 'advanced',
  estimatedTime: '1 - 2 hours',
  badge: 'Velocity Sensing',
  supplies: [
    'Raspberry Pi Pico 1 or Pico 2',
    'Piezo Electric Sensors (1 per drum pad / cymbal / kick)',
    '1MΩ Resistors (1 per piezo to pull signal to ground)',
    '3.3V Zener Diodes (1 per piezo, to protect the multiplexer and Pico from high voltage spikes)',
    'Analog Multiplexer: a 74HC4051 / CD4051 (8 channels) or 74HC4067 / CD4067 (16 channels)',
  ],
  steps: [
    {
      id: 'drum-intro',
      title: 'Supplies & Architecture',
      shortTitle: 'Supplies',
      description:
        'Understanding piezo velocity sensors, protection diodes, and multiplexer expansion.',
      render: DrumIntroStep,
    },
    {
      id: 'drum-wiring',
      title: 'Piezo & Multiplexer Wiring',
      shortTitle: 'Pad Wiring',
      description:
        'Connect each piezo with a 1MΩ resistor and 3.3V zener diode to a multiplexer channel, then wire the multiplexer to the Pico.',
      badge: 'Piezos',
      render: DrumPadWiringStep,
    },
    {
      id: 'drum-test',
      title: 'Live Test & Save',
      shortTitle: 'Test & Save',
      description: 'Perform strike tests across all pads, then save to Pico flash.',
      badge: 'Save to Pico',
      render: DrumReviewStep,
    },
  ],
};
