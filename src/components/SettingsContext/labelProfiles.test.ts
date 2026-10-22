import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { labelInProfile } from '@/components/Labels/labelRegistry';
import { proto } from './config';

vi.hoisted(() => {
  vi.stubGlobal('localStorage', { getItem: () => null });
});

const { initialConfig, useConfigStore } = await import('./SettingsContext');

const profile = (uid: number): proto.IProfile => ({
  opts: {
    uid,
    name: `Profile ${uid}`,
    faceButtonMappingMode: proto.FaceButtonMappingMode.LegendBased,
    deviceToEmulate: proto.SubType.KeyboardMouse,
  },
  assignments: [],
  mappings: [],
  leds: [],
});

const keyLabel = (deviceid: number, key: number, profiles: number[]): proto.IGuiConfig => ({
  deviceid,
  profiles,
  keyboardKeyLabel: { label: `Key ${key}`, key },
});

describe('labels scoped to profiles', () => {
  beforeEach(() => {
    useConfigStore.setState({
      ...initialConfig,
      config: proto.Config.create({ profiles: [profile(1), profile(2)] }),
      currentProfile: 0,
      // nothing to save to
      saveConfig: () => Promise.resolve(false),
    });
  });

  afterEach(() => {
    useConfigStore.setState({ ...initialConfig });
  });

  it('shows unscoped labels in every profile', () => {
    expect(labelInProfile(keyLabel(0, 4, []), 1)).toBe(true);
    expect(labelInProfile(keyLabel(0, 4, [2]), 1)).toBe(false);
    expect(labelInProfile(keyLabel(0, 4, [1, 2]), 2)).toBe(true);
  });

  it('drops a deleted profile from labels, and labels only it had', () => {
    useConfigStore.setState({
      guiDevices: { 0: keyLabel(0, 4, [1]), 1: keyLabel(1, 5, [1, 2]), 2: keyLabel(2, 6, []) },
    });
    useConfigStore.getState().deleteProfile(0);
    const labels = useConfigStore.getState().guiDevices;
    expect(labels[0]).toBeUndefined();
    expect(labels[1].profiles).toEqual([2]);
    expect(labels[2].profiles).toEqual([]);
  });

  it('gives a cloned profile the labels scoped to the original', () => {
    useConfigStore.setState({
      guiDevices: { 0: keyLabel(0, 4, [1]), 1: keyLabel(1, 5, [2]) },
    });
    useConfigStore.getState().cloneProfile(0);
    const labels = useConfigStore.getState().guiDevices;
    expect(labels[0].profiles).toEqual([1, 3]);
    expect(labels[1].profiles).toEqual([2]);
  });

  it('keeps the profiles when an editor only sends its own fields', () => {
    useConfigStore.setState({ guiDevices: { 0: keyLabel(0, 4, [2]) } });
    useConfigStore
      .getState()
      .updateLabel({ deviceid: 0, keyboardKeyLabel: { label: 'Renamed', key: 4 } }, 0);
    const label = useConfigStore.getState().guiDevices[0];
    expect(label.profiles).toEqual([2]);
    expect(label.keyboardKeyLabel?.label).toBe('Renamed');
  });

  it('scopes preset labels to their profile, only skipping keys labelled there', () => {
    useConfigStore.setState({ guiDevices: { 0: keyLabel(0, 4, [2]) } });
    useConfigStore.getState().addPresetKeyLabels(
      [
        { key: 4, names: ['a'] },
        { key: 5, names: ['b'] },
      ],
      1
    );
    const added = Object.values(useConfigStore.getState().guiDevices).filter((l) =>
      l.profiles?.includes(1)
    );
    expect(added.map((l) => l.keyboardKeyLabel?.key).sort()).toEqual([4, 5]);
    useConfigStore.getState().addPresetKeyLabels([{ key: 5, names: ['c'] }], 1);
    expect(Object.keys(useConfigStore.getState().guiDevices)).toHaveLength(3);
  });
});
