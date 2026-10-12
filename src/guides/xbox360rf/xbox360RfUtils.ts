import { proto } from '@/components/SettingsContext/config';
import { ConfigState, useConfigStore } from '@/components/SettingsContext/SettingsContext';

export type Xbox360RfModel = 'fat' | 'slim';

const STORAGE_KEY = 'santroller_xbox360_rf_model';

// config.devices is only rebuilt on connect, so live devices are read from deviceStatus
export function findXbox360RfDevice(state: ConfigState): proto.IDevice | undefined {
  return Object.values(state.deviceStatus).find((d) => d.device.xbox360Rf != null)?.device;
}

export function getXbox360RfModel(state?: ConfigState): Xbox360RfModel {
  // A configured module wins over the model picked in a previous session
  const rfDevice = findXbox360RfDevice(state ?? useConfigStore.getState())?.xbox360Rf;
  if (rfDevice) {
    return rfDevice.type === proto.Xbox360RfModuleType.Xbox360RfSlim ? 'slim' : 'fat';
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'fat' || saved === 'slim') {
      return saved;
    }
  } catch {
    // Ignore storage issues
  }
  return 'fat';
}

export function xbox360RfModuleType(model: Xbox360RfModel): proto.Xbox360RfModuleType {
  return model === 'slim'
    ? proto.Xbox360RfModuleType.Xbox360RfSlim
    : proto.Xbox360RfModuleType.Xbox360RfFat;
}

export function setXbox360RfModel(model: Xbox360RfModel): void {
  try {
    localStorage.setItem(STORAGE_KEY, model);
  } catch {
    // Ignore storage issues
  }
  const store = useConfigStore.getState();
  const existing = findXbox360RfDevice(store);

  if (existing && existing.deviceid != null) {
    store.updateDevice(
      {
        ...existing,
        xbox360Rf: {
          type: xbox360RfModuleType(model),
          dataPin: existing.xbox360Rf?.dataPin ?? -1,
          clockPin: existing.xbox360Rf?.clockPin ?? -1,
          syncPin: existing.xbox360Rf?.syncPin ?? -1,
        },
      },
      String(existing.deviceid)
    );
  }
}
