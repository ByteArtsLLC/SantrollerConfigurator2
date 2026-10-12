import { GuideDefinition } from '../types';
import {
  MidiDinIntroStep,
  MidiDinSetupStep,
  MidiDinTestStep,
  MidiDinWiringStep,
} from './midiDinGuideSteps';

export const MIDI_DIN_GUIDE: GuideDefinition = {
  id: 'midi-din',
  title: 'MIDI In (5-pin DIN)',
  subtitle: 'Play with an E-Drum Kit or Other MIDI Gear',
  description:
    'Build a small opto-isolated MIDI input so an e-drum kit, keyboard or other device with a 5-pin MIDI OUT port can drive the Pico, which then acts as a Guitar Hero or Rock Band drum kit.',
  category: 'drums',
  difficulty: 'intermediate',
  estimatedTime: '30 - 45 mins',
  badge: 'MIDI over UART',
  supplies: [
    'Raspberry Pi Pico 1 or Pico 2',
    'H11L1 optocoupler',
    '1N914 diode',
    '220Ω resistor',
    '470Ω resistor',
    '5-pin DIN MIDI socket (female)',
    'A MIDI cable',
  ],
  steps: [
    {
      id: 'din-intro',
      title: 'Supplies & Overview',
      shortTitle: 'Supplies',
      description: 'What the MIDI input does, and the parts the receiver circuit needs.',
      badge: 'Opto-Isolated',
      render: MidiDinIntroStep,
    },
    {
      id: 'din-wiring',
      title: 'Circuit & Wiring',
      shortTitle: 'Wiring',
      description:
        'Build the optocoupler receiver, then connect it to the MIDI socket and the Pico.',
      badge: 'H11L1',
      render: MidiDinWiringStep,
    },
    {
      id: 'din-setup',
      title: 'MIDI Input Setup',
      shortTitle: 'Setup',
      description: 'Pick the MIDI channel and RX pin, then add the MIDI input to the Pico.',
      badge: 'UART',
      render: MidiDinSetupStep,
    },
    {
      id: 'din-test',
      title: 'Live Test & Save',
      shortTitle: 'Test & Save',
      description: 'Watch the notes arrive, hit every pad, then save to the Pico.',
      badge: 'Save to Pico',
      render: MidiDinTestStep,
    },
  ],
};
