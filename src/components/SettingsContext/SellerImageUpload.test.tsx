import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { SellerImageUpload } from './SellerImageUpload';

describe('seller image upload', () => {
  let container: HTMLDivElement;
  let root: Root;
  const onUpload = vi.fn<(file: File) => Promise<void>>();

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))
    );
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:preview'),
      revokeObjectURL: vi.fn(),
    });
    onUpload.mockReset().mockResolvedValue(undefined);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  async function render(image?: Uint8Array, disabled = false) {
    await act(() =>
      root.render(
        <MantineProvider>
          <SellerImageUpload
            image={image}
            label="Tool Favicon"
            errorTitle="Invalid favicon"
            disabled={disabled}
            previewWidth={32}
            onUpload={onUpload}
          />
        </MantineProvider>
      )
    );
  }

  async function selectFile(file: File) {
    const input = container.querySelector('input')!;
    Object.defineProperty(input, 'files', { configurable: true, value: [file] });
    await act(async () => {
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  it('uploads a selected image and restricts the picker to PNG and JPEG', async () => {
    await render();
    expect(container.querySelector('input')?.accept).toBe('image/png,image/jpeg');
    const file = new File(['image'], 'favicon.png', { type: 'image/png' });
    await selectFile(file);
    expect(onUpload).toHaveBeenCalledWith(file);
    expect(container.querySelector('button')?.disabled).toBe(false);
  });

  it('shows conversion errors and keeps the previous preview', async () => {
    await render(new Uint8Array([1, 2, 3]));
    onUpload.mockRejectedValueOnce(new Error('Invalid image'));
    await selectFile(new File(['bad image'], 'favicon.png', { type: 'image/png' }));
    expect(container.textContent).toContain('Invalid favicon');
    expect(container.textContent).toContain('Invalid image');
    expect(container.querySelector('img')?.getAttribute('src')).toBe('blob:preview');
    expect(container.querySelector('button')?.disabled).toBe(false);
  });

  it('releases old preview URLs when the image changes or is removed', async () => {
    await render(new Uint8Array([1]));
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('Tool Favicon');
    await render(new Uint8Array([2]));
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    await render();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
    expect(container.querySelector('img')).toBeNull();
  });

  it('disables uploads while the device is updating', async () => {
    await render(undefined, true);
    expect(container.querySelector('button')?.disabled).toBe(true);
  });

  it('disables uploads while an image is being processed', async () => {
    let finish: () => void = () => {};
    onUpload.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    await render();
    await selectFile(new File(['image'], 'favicon.png', { type: 'image/png' }));
    expect(container.querySelector('button')?.disabled).toBe(true);
    await act(async () => finish());
    expect(container.querySelector('button')?.disabled).toBe(false);
  });
});
