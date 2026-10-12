import { GuideDefinition } from '../types';
import { UsbHostIntroStep, UsbHostReviewStep, UsbHostWiringStep } from './usbHostGuideSteps';

export const USB_HOST_GUIDE: GuideDefinition = {
  id: 'usb-host',
  title: 'USB Host Controller & Console Auth',
  subtitle: 'Connect Wired Controllers & Xbox 360 Wireless Receivers',
  description:
    'Add a USB Host port to your Raspberry Pi Pico to connect wired controllers, wireless receivers, or security authentication donor controllers.',
  category: 'adapters',
  difficulty: 'beginner',
  estimatedTime: '15 - 20 mins',
  badge: 'Console Auth',
  supplies: [
    'Raspberry Pi Pico 1 or Pico 2',
    'USB Female Breakout Board or cut USB extension cable (keep the socket end)',
    'Soldering Iron & Wire',
  ],
  steps: [
    {
      id: 'usb-intro',
      title: '1. Supplies & USB Wire Colors',
      shortTitle: 'Supplies',
      description: 'Connect a USB female socket to VBUS, GND, and consecutive GP pins.',
      badge: 'USB Host',
      render: UsbHostIntroStep,
    },
    {
      id: 'usb-wiring',
      title: '2. Solder D+/D- and Enable Driver',
      shortTitle: 'Wiring',
      description: 'Connect the 4 USB wires and activate the USB Host driver in Santroller.',
      badge: 'Pico USB Host',
      render: UsbHostWiringStep,
    },
    {
      id: 'usb-test',
      title: '3. Live Test & Save',
      shortTitle: 'Test & Save',
      description:
        'Plug in a USB controller or wireless dongle, verify detection, and save to flash.',
      badge: 'Test Bench',
      render: UsbHostReviewStep,
    },
  ],
};
