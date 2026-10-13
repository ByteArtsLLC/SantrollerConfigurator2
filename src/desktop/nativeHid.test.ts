import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { closeDevicePicker, useDevicePicker } from './devicePickerStore';
import { NativeHid } from './nativeHid';

const santroller = (path: string, serialNumber: string) => ({
  path,
  vendorId: 0x1209,
  productId: 0x2882,
  productName: 'Santroller',
  serialNumber,
  usagePage: 0xff00,
  usage: 1,
});
const keyboard = { ...santroller('kbd', ''), vendorId: 0x046d, usagePage: 1, usage: 6 };
let listed: ReturnType<typeof santroller>[] = [];

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async (command: string) => (command === 'hid_list' ? listed : undefined)),
}));
const listeners = new Map<string, (event: { payload: unknown }) => void>();
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(async (event: string, handler: (event: { payload: unknown }) => void) => {
    listeners.set(event, handler);
    return () => {};
  }),
}));

const filters = [{ vendorId: 0x1209, productId: 0x2882, usagePage: 0xff00 }];

describe('NativeHid.requestDevice', () => {
  let hid: NativeHid;
  beforeEach(async () => {
    vi.useFakeTimers();
    listed = [];
    hid = new NativeHid();
    await hid.initialize();
  });
  afterEach(() => {
    closeDevicePicker();
    vi.useRealTimers();
  });

  it('uses the only matching device without asking', async () => {
    listed = [santroller('a', 'AAAA'), keyboard];
    const devices = await hid.requestDevice({ filters });
    expect(devices.map((d) => (d as any).info.path)).toEqual(['a']);
    expect(useDevicePicker.getState().request).toBeUndefined();
  });

  it('asks when there is more than one', async () => {
    listed = [santroller('a', 'AAAA'), santroller('b', 'BBBB'), keyboard];
    const result = hid.requestDevice({ filters });
    await vi.waitFor(() => expect(useDevicePicker.getState().request).toBeDefined());
    const choices = hid.matching(useDevicePicker.getState().request!.filters);
    expect(choices.map((d) => (d as any).info.path)).toEqual(['a', 'b']);
    closeDevicePicker(choices[1]);
    expect((await result).map((d) => (d as any).info.path)).toEqual(['b']);
  });

  it('gives nothing back when the picker is cancelled', async () => {
    const result = hid.requestDevice({ filters });
    await vi.waitFor(() => expect(useDevicePicker.getState().request).toBeDefined());
    closeDevicePicker();
    expect(await result).toEqual([]);
  });
});

describe('NativeHid hotplug', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    listed = [];
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps looking after a device is plugged in until its HID interface shows up', async () => {
    const hid = new NativeHid();
    await hid.initialize();
    const connected = vi.fn();
    hid.addEventListener('connect', connected);
    listeners.get('hid-changed')!({ payload: null });
    await vi.advanceTimersByTimeAsync(600);
    expect(connected).not.toHaveBeenCalled();
    listed = [santroller('a', 'AAAA')];
    await vi.advanceTimersByTimeAsync(300);
    expect(connected).toHaveBeenCalledOnce();
  });
});
