import { proto } from '@/components/SettingsContext/config';
import { ConfigState, useConfigStore } from '@/components/SettingsContext/SettingsContext';

export type LedChipType = 'ws2812' | 'apa102';

const STORAGE_KEY = 'santroller_led_chip_type';

// WS2812 is driven by PIO, so any pin works; GP16 is clear of every other guide's pins
export const WS2812_DATA_PIN = 16;
// APA102 needs hardware SPI (SCK + TX on the same block). Every SPI pair on a Pico overlaps
// another guide: SPI1 10/11, 14/15 and 26/27 are guitar frets / whammy / pickup, SPI0 2/3 and 6/7
// are USB host, RF and frets. SPI0 SCK GP18 / TX GP19 only clashes with the optional GH5 neck /
// Wii I2C bus, so it is the least conflicting choice.
export const APA102_SPI_BLOCK = 0;
export const APA102_SCK_PIN = 18;
export const APA102_MOSI_PIN = 19;
export const DEFAULT_LED_COUNT = 5;

// config.devices is only rebuilt on connect, so live devices are read from deviceStatus
export function findLedDevice(state: ConfigState): proto.IDevice | undefined {
  return Object.values(state.deviceStatus).find(
    (d) => d.device.ws2812 != null || d.device.apa102 != null
  )?.device;
}

export function getLedChipType(state?: ConfigState): LedChipType {
  // A configured LED device wins over the type picked in a previous session
  const device = findLedDevice(state ?? useConfigStore.getState());
  if (device) {
    return device.apa102 ? 'apa102' : 'ws2812';
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ws2812' || saved === 'apa102') {
      return saved;
    }
  } catch {
    // Ignore storage issues
  }
  return 'ws2812';
}

export function setLedChipType(type: LedChipType): void {
  try {
    localStorage.setItem(STORAGE_KEY, type);
  } catch {
    // Ignore storage issues
  }
}

export function addLedDevice(type: LedChipType, count: number): string {
  const store = useConfigStore.getState();
  if (type === 'apa102') {
    return store.addDevice('apa102', undefined, (device) => {
      device.apa102 = {
        ...device.apa102!,
        spi: {
          ...device.apa102!.spi!,
          block: APA102_SPI_BLOCK,
          sck: APA102_SCK_PIN,
          mosi: APA102_MOSI_PIN,
        },
        // APA102 / SK9822 take colours in BGR order
        type: proto.APA102Type.Apa102Bgr,
        count,
      };
    });
  }
  return store.addDevice('ws2812', undefined, (device) => {
    device.ws2812 = {
      ...device.ws2812!,
      pin: WS2812_DATA_PIN,
      // WS2812B take colours in GRB order
      type: proto.WS2812Type.Ws2812Grb,
      count,
    };
  });
}

export function setLedCount(device: proto.IDevice, count: number): void {
  const store = useConfigStore.getState();
  const id = String(device.deviceid);
  if (device.apa102) {
    store.updateDevice({ ...device, apa102: { ...device.apa102, count } }, id);
  } else if (device.ws2812) {
    store.updateDevice({ ...device, ws2812: { ...device.ws2812, count } }, id);
  }
}
