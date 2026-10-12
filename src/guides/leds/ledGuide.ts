import { GuideDefinition } from '../types';
import { LedIntroStep, LedReviewStep, LedWiringStep } from './ledGuideSteps';

export const RGB_LED_GUIDE: GuideDefinition = {
  id: 'rgb-leds',
  title: 'Addressable RGB & Fret LEDs (WS2812B / APA102)',
  subtitle: 'Fret Illumination & Game Sync Animations',
  description:
    'Add addressable RGB LEDs to your guitar or drum kit that light up on button presses and sync with Star Power in games like YARG.',
  category: 'mods',
  estimatedTime: '30 - 45 mins',
  badge: 'RGB Lighting',
  supplies: [
    'Raspberry Pi Pico 1 or Pico 2',
    'Addressable RGB LEDs (APA102 / SK9822 DotStar or WS2812B NeoPixels)',
    "330Ω to 470Ω Resistor (in series with the data line, close to the first LED, to damp ringing and reflections on the wire and protect the LED's data input)",
    '1000µF Capacitor (across 5V power and ground to smooth out sudden current draws)',
    "Recommended: 74AHCT125 (or 74HCT245) level shifter, or a 1N4001 diode for the first LED's power (see the 3.3V logic note)",
    'Soldering Iron & Wire',
  ],
  steps: [
    {
      id: 'led-intro',
      title: '1. Supplies & LED Wiring Scheme',
      shortTitle: 'Supplies',
      description:
        'Overview of addressable RGB LEDs, power distribution, and protection resistors.',
      badge: 'RGB Lighting',
      render: LedIntroStep,
    },
    {
      id: 'led-wiring',
      title: '2. Solder LEDs & Data Line',
      shortTitle: 'Wiring',
      description: 'Connect power from VBUS, chain LEDs in series, and add inline protection.',
      badge: 'Chain Wiring',
      render: LedWiringStep,
    },
    {
      id: 'led-test',
      title: '3. Live Test & Save',
      shortTitle: 'Test & Save',
      description:
        'Test fret animations, configure idle timer, and save LED configuration to flash.',
      badge: 'Test Bench',
      render: LedReviewStep,
    },
  ],
};
