import { GuideDefinition } from '../types';
import {
  TurntableIntroStep,
  TurntableReviewStep,
  TurntableWiringStep,
} from './turntableGuideSteps';

export const DJ_TURNTABLE_GUIDE: GuideDefinition = {
  id: 'dj-turntable',
  title: 'DJ Hero Turntable Controller',
  subtitle: 'Optical Encoder Platter & Crossfader Conversion',
  description:
    'Rewire any DJ Hero turntable to a Raspberry Pi Pico for low-latency scratch vinyl and crossfader controls in DJ Hero.',
  category: 'turntable',
  estimatedTime: '45 - 60 mins',
  badge: 'Optical Scratching',
  supplies: [
    'Raspberry Pi Pico 1 or Pico 2',
    'DJ Hero Turntable Controller',
    'Soldering Iron & Wire',
  ],
  steps: [
    {
      id: 'tt-intro',
      title: 'Supplies & Architecture',
      shortTitle: 'Supplies',
      description: 'Understand the I2C platters, crossfader, effects dial, and base buttons.',
      render: TurntableIntroStep,
    },
    {
      id: 'tt-wiring',
      title: 'Platter & Base Wiring',
      shortTitle: 'Wiring',
      description:
        'Wire the platters over I2C, then the crossfader, effects dial, and base buttons.',
      badge: 'I2C & ADC',
      render: TurntableWiringStep,
    },
    {
      id: 'tt-test',
      title: 'Live Test & Save',
      shortTitle: 'Test & Save',
      description: 'Verify the platters and crossfader, then save the turntable configuration.',
      badge: 'Save to Pico',
      render: TurntableReviewStep,
    },
  ],
};
