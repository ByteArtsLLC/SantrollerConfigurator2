import { describe, expect, it } from 'vitest';
import { proto } from './config';
import { savedDeviceName } from './savedDeviceName';

describe('savedDeviceName', () => {
  it('reads the name from the main section', () => {
    const main = proto.Config.encode({ deviceName: 'My Guitar', syncCalibrations: true }).finish();
    expect(savedDeviceName(main)).toBe('My Guitar');
  });

  it('is undefined when the device is not named', () => {
    expect(savedDeviceName(proto.Config.encode({ syncCalibrations: true }).finish())).toBeUndefined();
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
