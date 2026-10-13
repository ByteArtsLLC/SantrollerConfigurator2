import { create } from 'zustand';

// Lets navigator.hid.requestDevice() ask the DevicePicker component to show itself, the same way
// Chrome shows its chooser
interface PickerRequest {
  filters: HIDDeviceFilter[];
  resolve: (device: HIDDevice | undefined) => void;
}

export const useDevicePicker = create<{ request?: PickerRequest }>(() => ({}));

export function pickDevice(filters: HIDDeviceFilter[]) {
  return new Promise<HIDDevice | undefined>((resolve) => {
    // a second request replaces the first, like Chrome only shows one chooser at a time
    useDevicePicker.getState().request?.resolve(undefined);
    useDevicePicker.setState({ request: { filters, resolve } });
  });
}

export function closeDevicePicker(device?: HIDDevice) {
  useDevicePicker.getState().request?.resolve(device);
  useDevicePicker.setState({ request: undefined });
}
