import { proto } from '@/components/SettingsContext/config';
import { ConfigState, useConfigStore } from '@/components/SettingsContext/SettingsContext';
import { findDeviceStatus } from '../guideConfig';

export type XboxAuthMethod = 'usb' | 'chip';

const STORAGE_KEY = 'santroller_xbox_auth_method';

// The chip goes on the same I2C1 header pins the other guides use (GP18 SDA / GP19 SCL). It
// answers on address 0x20, so it can share the bus with a Wii extension, GH5 neck, etc.
export const XBOX_AUTH_I2C = { sda: 18, scl: 19, block: 1 };
export const XBOX_AUTH_I2C_PHYSICAL = { sda: 24, scl: 25 };

export function findAuthChip(state: ConfigState) {
  return findDeviceStatus(state, 'xboxOneAuth');
}

export function authChipPinsSet(device?: proto.IXboxOneAuthDevice | null) {
  return !!device && device.i2c.sda >= 0 && device.i2c.scl >= 0;
}

export function getXboxAuthMethod(state?: ConfigState): XboxAuthMethod {
  // A configured chip wins over the method picked in a previous session
  if (findAuthChip(state ?? useConfigStore.getState())) {
    return 'chip';
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'usb' || saved === 'chip') {
      return saved;
    }
  } catch {
    // Ignore storage issues
  }
  return 'usb';
}

export function saveXboxAuthMethod(method: XboxAuthMethod) {
  try {
    localStorage.setItem(STORAGE_KEY, method);
  } catch {
    // Ignore storage issues
  }
}

/**
 * Brings every device on the I2C1 header pins down to the slowest clock among them, as the
 * firmware runs the shared bus at the clock of whichever device starts first.
 */
function matchI2c1Clocks() {
  const store = useConfigStore.getState();
  const onBus = Object.values(store.deviceStatus).flatMap((status) =>
    Object.entries(status.device).flatMap(([field, config]) => {
      const i2c = (config as { i2c?: proto.II2CDevice } | null)?.i2c;
      return i2c?.block === XBOX_AUTH_I2C.block &&
        i2c.sda === XBOX_AUTH_I2C.sda &&
        i2c.scl === XBOX_AUTH_I2C.scl
        ? [{ status, field, i2c }]
        : [];
    })
  );
  if (!onBus.length) {
    return;
  }
  const clock = Math.min(...onBus.map(({ i2c }) => i2c.clock));
  for (const { status, field, i2c } of onBus) {
    if (i2c.clock !== clock) {
      store.updateDevice(
        {
          ...status.device,
          [field]: {
            ...(status.device[field as keyof proto.IDevice] as object),
            i2c: { ...i2c, clock },
          },
        },
        status.id
      );
    }
  }
}

/**
 * Adds an Xbox One auth chip device on I2C1 (GP18 SDA / GP19 SCL), or moves an existing one that
 * has no pins set onto them. The reset pin is optional in firmware, so it is left unset (-1).
 * The chip isn't an input device, so it needs no profile slot.
 */
export function addAuthChip(): string {
  const store = useConfigStore.getState();
  const existing = findAuthChip(store);
  if (existing) {
    const chip = existing.device.xboxOneAuth!;
    if (!authChipPinsSet(chip)) {
      store.updateDevice(
        { ...existing.device, xboxOneAuth: { ...chip, i2c: { ...chip.i2c, ...XBOX_AUTH_I2C } } },
        existing.id
      );
      matchI2c1Clocks();
    }
    return existing.id;
  }
  const id = store.addDevice('xboxOneAuth', undefined, (device) => {
    device.xboxOneAuth!.i2c = { ...device.xboxOneAuth!.i2c, ...XBOX_AUTH_I2C };
  });
  matchI2c1Clocks();
  return id;
}
