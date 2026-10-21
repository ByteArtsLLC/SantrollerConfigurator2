import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MantineProvider, TextInput } from '@mantine/core';
import type { proto } from '@/components/SettingsContext/config';
import { DeviceIdentitySettings } from './DeviceNameSetting';

const state = vi.hoisted(() => ({
  seller: false,
  toolInfo: undefined as proto.ISellerConfig | undefined,
  config: {} as proto.IConfig,
  updateConfig: vi.fn(),
}));

vi.mock('@/components/SettingsContext/SettingsContext', () => ({
  useConfigStore: (selector: (value: typeof state) => unknown) => selector(state),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@mantine/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@mantine/core')>()),
  TextInput: vi.fn(() => null),
}));

function render(commercial = false) {
  return renderToStaticMarkup(
    <MantineProvider>
      <DeviceIdentitySettings commercial={commercial} />
    </MantineProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  state.seller = false;
  state.toolInfo = undefined;
  state.config = {};
});

describe('global device identity settings', () => {
  it('shows both names in profile settings for normal tools', () => {
    state.config = { deviceName: 'My Guitar', manufacturerName: 'My Company' };
    render();
    const inputs = vi.mocked(TextInput).mock.calls.map(([props]) => props);
    expect(inputs).toHaveLength(2);
    expect(inputs.find((props) => props.label === 'main.device_name.label')?.value).toBe(
      'My Guitar'
    );
    expect(inputs.find((props) => props.label === 'main.manufacturer_name.label')?.value).toBe(
      'My Company'
    );
  });

  it('hides normal-tool names from the commercial section', () => {
    render(true);
    expect(TextInput).not.toHaveBeenCalled();
  });

  it.each(['seller', 'branded'] as const)(
    'moves both names out of profile settings for %s tools',
    (kind) => {
      state.seller = kind === 'seller';
      state.toolInfo =
        kind === 'branded' ? { name: 'Seller Tool', logo: new Uint8Array() } : undefined;
      render();
      expect(TextInput).not.toHaveBeenCalled();
      render(true);
      expect(TextInput).toHaveBeenCalledTimes(2);
    }
  );

  it('shows defaults without persisting them until edited', () => {
    render();
    const inputs = vi.mocked(TextInput).mock.calls.map(([props]) => props);
    expect(inputs.every((props) => props.value === '')).toBe(true);
    expect(inputs.map((props) => props.placeholder)).toEqual(['Santroller', 'sanjay900']);
    expect(state.updateConfig).not.toHaveBeenCalled();
  });

  it('truncates manufacturer names to the firmware UTF-8 limit', () => {
    render();
    const [manufacturer] = vi
      .mocked(TextInput)
      .mock.calls.find(([props]) => props.label === 'main.manufacturer_name.label')!;
    const input = document.createElement('input');
    input.value = `${'x'.repeat(30)}\u00e9`;
    manufacturer.onChange!({ currentTarget: input } as React.ChangeEvent<HTMLInputElement>);
    expect(state.updateConfig).toHaveBeenCalledWith({ manufacturerName: 'x'.repeat(30) });
  });

  it('allows clearing the manufacturer to restore the firmware default', () => {
    state.config.manufacturerName = 'My Company';
    render();
    const [manufacturer] = vi
      .mocked(TextInput)
      .mock.calls.find(([props]) => props.label === 'main.manufacturer_name.label')!;
    const input = document.createElement('input');
    manufacturer.onChange!({ currentTarget: input } as React.ChangeEvent<HTMLInputElement>);
    expect(state.updateConfig).toHaveBeenCalledWith({ manufacturerName: '' });
  });

  it('keeps device-name edits global and limited to the firmware buffer', () => {
    state.seller = true;
    render(true);
    const [deviceName] = vi
      .mocked(TextInput)
      .mock.calls.find(([props]) => props.label === 'main.device_name.label')!;
    const input = document.createElement('input');
    input.value = 'x'.repeat(40);
    deviceName.onChange!({ currentTarget: input } as React.ChangeEvent<HTMLInputElement>);
    expect(state.updateConfig).toHaveBeenCalledWith({ deviceName: 'x'.repeat(31) });
  });
});
