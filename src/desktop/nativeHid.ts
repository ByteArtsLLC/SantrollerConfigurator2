import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { pickDevice } from './devicePickerStore';
import { ParsedDescriptor, parseReportDescriptor } from './hidDescriptor';

// navigator.hid for the desktop app, over the hid_* commands in src-tauri. Behaves like WebHID
// does in Chrome, so the rest of the configurator doesn't need to know the difference.

interface NativeHidDeviceInfo {
  path: string;
  vendorId: number;
  productId: number;
  productName?: string;
  serialNumber?: string;
  usagePage: number;
  usage: number;
}

// WebHID has no connect events of its own here, so check for new devices this often
const POLL_INTERVAL_MS = 1000;

function toBytes(data: BufferSource) {
  return Array.from(
    data instanceof ArrayBuffer
      ? new Uint8Array(data)
      : new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  );
}

// Chrome rejects with this when a transfer fails, and the firmware upload checks for it
function transferError(e: unknown) {
  return new DOMException(String(e), 'NotAllowedError');
}

function matchesFilter(info: NativeHidDeviceInfo, filter: HIDDeviceFilter) {
  return (
    (filter.vendorId === undefined || filter.vendorId === info.vendorId) &&
    (filter.productId === undefined || filter.productId === info.productId) &&
    (filter.usagePage === undefined || filter.usagePage === info.usagePage) &&
    (filter.usage === undefined || filter.usage === info.usage)
  );
}

function sameDevice(a: NativeHidDeviceInfo, b: NativeHidDeviceInfo) {
  return (
    a.path === b.path &&
    a.vendorId === b.vendorId &&
    a.productId === b.productId &&
    a.serialNumber === b.serialNumber
  );
}

export class NativeHidDevice extends EventTarget {
  opened = false;
  oninputreport: ((evt: HIDInputReportEvent) => void) | null = null;
  // Until it is opened only the top level usage is known, which is enough to tell devices apart
  collections: HIDCollectionInfo[];
  private descriptor?: ParsedDescriptor;

  constructor(readonly info: NativeHidDeviceInfo) {
    super();
    this.collections = [
      {
        usagePage: info.usagePage,
        usage: info.usage,
        type: 1,
        children: [],
        inputReports: [],
        outputReports: [],
        featureReports: [],
      },
    ];
  }

  get vendorId() {
    return this.info.vendorId;
  }

  get productId() {
    return this.info.productId;
  }

  get productName() {
    return this.info.productName ?? '';
  }

  async open() {
    try {
      const descriptor = await invoke<number[]>('hid_open', { path: this.info.path });
      this.descriptor = parseReportDescriptor(Uint8Array.from(descriptor));
      if (this.descriptor.collections.length) {
        this.collections = this.descriptor.collections;
      }
      this.opened = true;
    } catch (e) {
      throw new DOMException(`Failed to open the device: ${e}`, 'InvalidStateError');
    }
  }

  async close() {
    if (this.opened) {
      this.opened = false;
      await invoke('hid_close', { path: this.info.path });
    }
  }

  async forget() {
    await this.close();
  }

  async sendReport(reportId: number, data: BufferSource) {
    try {
      await invoke('hid_send_report', { path: this.info.path, reportId, data: toBytes(data) });
    } catch (e) {
      throw transferError(e);
    }
  }

  async sendFeatureReport(reportId: number, data: BufferSource) {
    try {
      await invoke('hid_send_feature_report', {
        path: this.info.path,
        reportId,
        data: toBytes(data),
      });
    } catch (e) {
      throw transferError(e);
    }
  }

  // Like WebHID, the report id comes first
  async receiveFeatureReport(reportId: number) {
    const known = this.descriptor?.featureReportLengths.get(reportId);
    const length = (known ?? this.descriptor?.maxFeatureReportLength ?? 64) + 1;
    let data: number[];
    try {
      data = await invoke<number[]>('hid_receive_feature_report', {
        path: this.info.path,
        reportId,
        length,
      });
    } catch (e) {
      throw transferError(e);
    }
    const report = Uint8Array.from(known === undefined ? data : data.slice(0, known + 1));
    return new DataView(report.buffer);
  }

  dispatchInput(raw: number[]) {
    const numbered = this.descriptor?.numbered ?? false;
    const data = Uint8Array.from(numbered ? raw.slice(1) : raw);
    const event = new Event('inputreport') as HIDInputReportEvent;
    Object.defineProperties(event, {
      device: { value: this },
      reportId: { value: numbered ? raw[0] : 0 },
      data: { value: new DataView(data.buffer) },
    });
    this.dispatchEvent(event);
    this.oninputreport?.(event);
  }
}

export class NativeHid extends EventTarget {
  onconnect: ((evt: HIDConnectionEvent) => void) | null = null;
  ondisconnect: ((evt: HIDConnectionEvent) => void) | null = null;
  private readonly devices = new Map<string, NativeHidDevice>();
  private listing?: Promise<NativeHidDeviceInfo[]>;

  async initialize() {
    await listen<{ path: string; data: number[] }>('hid-input', ({ payload }) => {
      this.devices.get(payload.path)?.dispatchInput(payload.data);
    });
    // The device went away while it was open. Treat it as unplugged straight away, as it may come
    // back on the same path before the next poll would notice it was gone.
    await listen<{ path: string; error: string }>('hid-closed', ({ payload }) => {
      const device = this.devices.get(payload.path);
      if (device) {
        console.log(`Lost ${payload.path}: ${payload.error}`);
        device.opened = false;
        this.removeDevice(device);
      }
    });
    await this.refresh(false);
    setInterval(() => void this.refresh(true).catch(console.error), POLL_INTERVAL_MS);
  }

  async getDevices(): Promise<HIDDevice[]> {
    await this.refresh(true);
    return Array.from(this.devices.values()) as unknown as HIDDevice[];
  }

  // Asks which device to use when there's a choice, and goes straight to the device when there's
  // only one
  async requestDevice(options: HIDDeviceRequestOptions): Promise<HIDDevice[]> {
    await this.refresh(true);
    const matching = this.matching(options.filters);
    if (matching.length === 1) {
      return matching;
    }
    const device = await pickDevice(options.filters);
    return device ? [device] : [];
  }

  // The devices already found that match, without looking for new ones
  matching(filters: HIDDeviceFilter[]): HIDDevice[] {
    return Array.from(this.devices.values()).filter(
      (device) => !filters.length || filters.some((filter) => matchesFilter(device.info, filter))
    ) as unknown as HIDDevice[];
  }

  private removeDevice(device: NativeHidDevice) {
    this.devices.delete(device.info.path);
    void device.close().catch(console.error);
    this.fire('disconnect', device);
  }

  private fire(type: 'connect' | 'disconnect', device: NativeHidDevice) {
    const event = new Event(type) as HIDConnectionEvent;
    Object.defineProperty(event, 'device', { value: device, enumerable: true });
    this.dispatchEvent(event);
    (type === 'connect' ? this.onconnect : this.ondisconnect)?.(event);
  }

  // Devices that were already there when the app started don't count as connecting
  private async refresh(notify: boolean) {
    this.listing ??= invoke<NativeHidDeviceInfo[]>('hid_list').finally(() => {
      this.listing = undefined;
    });
    const infos = await this.listing;
    for (const device of Array.from(this.devices.values())) {
      if (!infos.some((info) => sameDevice(device.info, info))) {
        this.removeDevice(device);
      }
    }
    for (const info of infos) {
      // hidapi lists a device once per top level collection on some platforms
      if (!this.devices.has(info.path)) {
        const device = new NativeHidDevice(info);
        this.devices.set(info.path, device);
        if (notify) {
          this.fire('connect', device);
        }
      }
    }
  }
}

export async function installNativeHid() {
  const hid = new NativeHid();
  await hid.initialize();
  Object.defineProperty(navigator, 'hid', { configurable: true, value: hid });
}
