import { describe, expect, it } from 'vitest';
import { proto } from './config';
import { savedDeviceName, savedSellerConfig } from './savedConfigFields';

describe('savedDeviceName', () => {
  it('reads the name from the main section', () => {
    const main = proto.Config.encode({ deviceName: 'My Guitar', syncCalibrations: true }).finish();
    expect(savedDeviceName(main)).toBe('My Guitar');
  });

  it('is undefined when the device is not named', () => {
    expect(
      savedDeviceName(proto.Config.encode({ syncCalibrations: true }).finish())
    ).toBeUndefined();
  });

  it('still reads it with the aux section after it', () => {
    const main = proto.Config.encode({ deviceName: 'My Guitar' }).finish();
    const aux = proto.AuxConfigBlock.encode({ toggleStates: [{ id: 1, state: true }] }).finish();
    const saved = new Uint8Array(main.length + aux.length);
    saved.set(main, 0);
    saved.set(aux, main.length);
    expect(savedDeviceName(saved)).toBe('My Guitar');
  });
});

describe('savedSellerConfig', () => {
  it('reads the seller entry from among the other gui entries', () => {
    const main = proto.Config.encode({
      guiConfig: [
        { deviceid: 3, label: { label: 'Neck', pin: 1 } },
        { deviceid: 0, seller: { name: 'My Tool', logo: new Uint8Array([1, 2, 3]) } },
      ],
    }).finish();
    const seller = savedSellerConfig(main);
    expect(seller?.name).toBe('My Tool');
    expect(Array.from(seller?.logo ?? [])).toEqual([1, 2, 3]);
  });

  it('is undefined when there is no seller entry', () => {
    const main = proto.Config.encode({
      guiConfig: [{ deviceid: 3, label: { label: 'Neck', pin: 1 } }],
    }).finish();
    expect(savedSellerConfig(main)).toBeUndefined();
  });

  it('still reads it with the aux section after it', () => {
    const main = proto.Config.encode({
      guiConfig: [{ deviceid: 0, seller: { name: 'My Tool', logo: new Uint8Array() } }],
    }).finish();
    const aux = proto.AuxConfigBlock.encode({ toggleStates: [{ id: 1, state: true }] }).finish();
    const saved = new Uint8Array(main.length + aux.length);
    saved.set(main, 0);
    saved.set(aux, main.length);
    expect(savedSellerConfig(saved)?.name).toBe('My Tool');
  });
});
