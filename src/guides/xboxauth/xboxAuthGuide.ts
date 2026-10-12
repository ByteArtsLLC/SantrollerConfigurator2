import { GuideDefinition } from '../types';
import { XboxAuthIntroStep, XboxAuthTestStep, XboxAuthWiringStep } from './xboxAuthGuideSteps';

export const XBOX_AUTH_GUIDE: GuideDefinition = {
  id: 'xbox-auth',
  title: 'Xbox One / Series Authentication',
  subtitle: 'Pass Auth to a Real Controller or a Harvested Auth Chip',
  description:
    "Xbox One and Xbox Series consoles only accept genuine controllers. Let Santroller pass the console's auth requests to an official controller on the USB Host port, or to an auth chip taken from an Xbox One controller and wired over I2C.",
  category: 'adapters',
  estimatedTime: '15 - 45 mins',
  badge: 'Console Auth',
  supplies: [
    'Raspberry Pi Pico 1 or Pico 2 running Santroller',
    'USB method: an official Xbox One / Series controller and a USB Host port (see the USB Host guide)',
    'Auth chip method: an auth chip taken from an Xbox One controller, fine wire and a soldering iron',
  ],
  steps: [
    {
      id: 'auth-intro',
      title: '1. Why Xbox Needs Authentication',
      shortTitle: 'Overview',
      description: 'Which consoles check for genuine controllers, and the ways to pass the check.',
      badge: 'Overview',
      render: XboxAuthIntroStep,
    },
    {
      id: 'auth-wiring',
      title: '2. Wire Your Auth Source',
      shortTitle: 'Wiring',
      description: 'Add a USB Host port for a donor controller, or wire an auth chip over I2C.',
      badge: 'Wiring',
      render: XboxAuthWiringStep,
    },
    {
      id: 'auth-test',
      title: '3. Check, Save & Play',
      shortTitle: 'Test & Save',
      description: 'Check the auth source is detected, save to the Pico, and plug into your Xbox.',
      badge: 'Test Bench',
      render: XboxAuthTestStep,
    },
  ],
};
