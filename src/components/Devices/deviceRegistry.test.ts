import { describe, expect, it } from 'vitest';
import {
  DEVICE_CATEGORIES,
  deviceKinds,
  getDeviceCategory,
  getGroupedDevices,
} from './deviceRegistry';

describe('deviceRegistry categories and grouping', () => {
  it('assigns a valid category to every device kind', () => {
    for (const kind of deviceKinds) {
      const category = getDeviceCategory(kind);
      expect(DEVICE_CATEGORIES).toContain(category);
    }
  });

  it('groups and sorts all device kinds alphabetically by label within each group', () => {
    const mockTranslate = (key: string) => {
      // Mock dictionary mapping
      const labels: Record<string, string> = {
        'devices.wii': 'Wii Extension',
        'devices.psx': 'PS1/PS2 Controller',
        'devices.snes': 'NES/SNES Controller',
        'devices.joybus': 'N64 / Gamecube Controller',
        'devices.usbHost': 'USB Host',
        'devices.bt': 'Bluetooth',
        'devices.xbox360Rf': 'Xbox 360 RF Module',
        'devices.xboxOneAuth': 'Xbox One Auth Chip',
        'devices.midiSerial': 'MIDI Serial (DIN)',
        'devices.crazyGuitarNeck': 'Crazy Guitar Neck',
        'devices.gh5Neck': 'Guitar Hero 5 Guitar Neck',
        'devices.crkdNeck': 'CRKD Guitar Neck',
        'devices.protarNeck': 'Rock Band Mustang Pro Guitar Neck',
        'devices.vtechExpander': 'IO Expander from a VTech Guitar',
        'devices.bhDrum': 'Band Hero Drum Body',
        'devices.worldTourDrum': 'World Tour Drum Body',
        'devices.crkdDrum': 'CRKD Drum Body',
        'devices.djhTurntable': 'DJ Hero Turntable Platter',
        'devices.infiniumFader': 'Infinium Fader',
        'devices.peripheral': 'Peripheral',
      };
      return labels[key] ?? key;
    };

    const grouped = getGroupedDevices(deviceKinds, mockTranslate);

    // Verify every group in grouped is in DEVICE_CATEGORIES order
    const categoriesInResult = grouped.map((g) => g.category);
    for (let i = 0; i < categoriesInResult.length - 1; i++) {
      const idxA = DEVICE_CATEGORIES.indexOf(categoriesInResult[i]);
      const idxB = DEVICE_CATEGORIES.indexOf(categoriesInResult[i + 1]);
      expect(idxA).toBeLessThan(idxB);
    }

    // Verify every device kind is present in exactly one group
    const allItems = grouped.flatMap((g) => g.items);
    expect(allItems.sort()).toEqual([...deviceKinds].sort());

    // Verify items in each group are sorted alphabetically
    for (const group of grouped) {
      expect(group.items.length).toBeGreaterThan(0);
      const labels = group.items.map((k) => mockTranslate(`devices.${k}`));
      const sortedLabels = [...labels].sort((a, b) => a.localeCompare(b));
      expect(labels).toEqual(sortedLabels);
    }
  });

  it('filters out empty categories when a subset of device kinds is provided', () => {
    const singleKind = ['ws2812'] as const;
    const grouped = getGroupedDevices([...singleKind], (k) => k);

    expect(grouped).toHaveLength(1);
    expect(grouped[0].category).toBe('lighting');
    expect(grouped[0].items).toEqual(['ws2812']);
  });
});

