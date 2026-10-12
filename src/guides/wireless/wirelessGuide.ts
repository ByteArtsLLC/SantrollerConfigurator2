import { GuideDefinition } from '../types';
import {
  WirelessBatteryStep,
  WirelessBluetoothStep,
  WirelessIntroStep,
  WirelessPowerStep,
  WirelessTestStep,
} from './wirelessGuideSteps';

export const WIRELESS_GUIDE: GuideDefinition = {
  id: 'wireless',
  title: 'Wireless: Bluetooth & Battery (Pico W)',
  subtitle: 'LiPo Battery Power and Bluetooth Output on a Pico W / Pico 2 W',
  description:
    'Run your controller from a single-cell LiPo battery and pair it with a PC or phone over Bluetooth, with battery level reporting and sleep when idle. USB keeps working too.',
  category: 'mods',
  estimatedTime: '45 - 60 mins',
  badge: 'Bluetooth',
  supplies: [
    'Raspberry Pi Pico W or Pico 2 W',
    'Single-cell 3.7V LiPo / Li-ion battery with a built in protection circuit',
    'Single-cell LiPo charger board with protection (eg a TP4056 module with protection)',
    'Schottky diode rated for at least 1A and over 10V reverse voltage (eg 1N5817 or 1N5819)',
    'Optional: MAX17043 / MAX17048 fuel gauge board for a more accurate battery percentage',
    'Optional: power switch for the battery output',
    'Soldering Iron, Wire & Multimeter',
  ],
  steps: [
    {
      id: 'wireless-intro',
      title: 'Supplies, Overview & Safety',
      shortTitle: 'Overview',
      description:
        'What a wireless build gives you, what it needs, and how to handle LiPo batteries safely.',
      badge: 'Pico W',
      render: WirelessIntroStep,
    },
    {
      id: 'wireless-battery',
      title: 'Battery Wiring & Level Sensing',
      shortTitle: 'Battery',
      description:
        'Wire the charger and battery to VSYS through a Schottky diode, then pick how the battery level is measured.',
      badge: 'VSYS',
      render: WirelessBatteryStep,
    },
    {
      id: 'wireless-bluetooth',
      title: 'Bluetooth Controller Setup',
      shortTitle: 'Bluetooth',
      description:
        "Turn on the Pico W's radio, make the active profile output over Bluetooth, then pair it with your PC or phone.",
      badge: 'BLE Gamepad',
      render: WirelessBluetoothStep,
    },
    {
      id: 'wireless-power',
      title: 'Sleep & Power Saving',
      shortTitle: 'Power',
      description:
        "Turn Bluetooth off and put the Pico to sleep when the controller isn't being used.",
      badge: 'Battery Life',
      render: WirelessPowerStep,
    },
    {
      id: 'wireless-test',
      title: 'Live Test & Save',
      shortTitle: 'Test & Save',
      description:
        'Check the battery reading and the Bluetooth connection, then save the configuration to the Pico.',
      badge: 'Save to Pico',
      render: WirelessTestStep,
    },
  ],
};
