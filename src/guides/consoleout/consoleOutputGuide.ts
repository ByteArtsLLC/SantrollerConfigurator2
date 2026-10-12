import { GuideDefinition } from '../types';
import {
  ConsoleOutputIntroStep,
  ConsoleOutputTestStep,
  ConsoleOutputWiringStep,
} from './consoleOutputGuideSteps';

export const CONSOLE_OUTPUT_GUIDE: GuideDefinition = {
  id: 'console-output',
  title: 'Play on a Wii or PS2 (Console Output)',
  subtitle: 'Plug your Pico controller into a Wii Remote or a PS2 controller port',
  description:
    'Wire a Wii extension plug or a PS2 controller plug to your Raspberry Pi Pico so it acts as a Wii extension or a PS2 controller on the real console, optionally with a USB host port so a USB controller can be played on the old console.',
  category: 'adapters',
  estimatedTime: '30 - 45 mins',
  badge: 'Wii / PS2',
  supplies: [
    'Raspberry Pi Pico 1 or Pico 2 (with a controller already built on it, or a USB host port)',
    'Wii extension plug or PS2 controller plug (e.g. from a broken controller or an extension cable)',
    'Schottky diode (when powering from the console)',
    'Optional for USB host: USB socket, plus an MT3608 boost converter when powering from the console',
    'Soldering Iron & Wire',
  ],
  steps: [
    {
      id: 'console-intro',
      title: 'Choose Your Console & Supplies',
      shortTitle: 'Overview',
      description:
        'Pick the console you are plugging into, and whether a USB controller should be played through it.',
      badge: 'Console Output',
      render: ConsoleOutputIntroStep,
    },
    {
      id: 'console-wiring',
      title: 'Wire the Console Plug',
      shortTitle: 'Wiring',
      description:
        "Wire the plug's signals and power to the Pico, then add console output to your config.",
      badge: 'Solder',
      render: ConsoleOutputWiringStep,
    },
    {
      id: 'console-test',
      title: 'Save & Play on the Console',
      shortTitle: 'Test & Save',
      description: 'Save the config to the Pico, then plug it into the console.',
      badge: 'Save to Pico',
      render: ConsoleOutputTestStep,
    },
  ],
};
