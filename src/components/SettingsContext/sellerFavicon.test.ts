import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applySellerFavicon } from './sellerFavicon';

describe('seller favicon', () => {
  beforeEach(() => {
    document.head.innerHTML = '<link rel="icon" type="image/png" href="/favicon.png">';
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:seller-favicon'),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    document.head.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('sets the seller favicon and restores the default on cleanup', () => {
    const cleanup = applySellerFavicon(new Uint8Array([1, 2, 3]));
    const link = document.head.querySelector('link')!;
    expect(link.getAttribute('href')).toBe('blob:seller-favicon');
    expect(link.getAttribute('type')).toBe('image/png');
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    cleanup();
    expect(link.getAttribute('href')).toBe('/favicon.png');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:seller-favicon');
  });

  it.each([undefined, null, new Uint8Array()])(
    'leaves the default for missing favicon %s',
    (favicon) => {
      const cleanup = applySellerFavicon(favicon);
      expect(document.head.querySelector('link')?.getAttribute('href')).toBe('/favicon.png');
      expect(URL.createObjectURL).not.toHaveBeenCalled();
      cleanup();
      expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    }
  );

  it('restores original attributes without changing the link relationship', () => {
    document.head.innerHTML = '<link rel="shortcut icon" sizes="64x64" href="/old.ico">';
    const link = document.head.querySelector('link')!;
    const cleanup = applySellerFavicon(new Uint8Array([1]));
    expect(link.getAttribute('rel')).toBe('shortcut icon');
    expect(link.hasAttribute('sizes')).toBe(false);
    cleanup();
    expect(link.getAttribute('href')).toBe('/old.ico');
    expect(link.getAttribute('sizes')).toBe('64x64');
    expect(link.hasAttribute('type')).toBe(false);
  });

  it('creates and removes its own link if no default exists', () => {
    document.head.innerHTML = '';
    const cleanup = applySellerFavicon(new Uint8Array([1]));
    expect(document.head.querySelector('link[rel="icon"]')?.getAttribute('href')).toBe(
      'blob:seller-favicon'
    );
    cleanup();
    expect(document.head.querySelector('link')).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:seller-favicon');
  });

  it('replaces seller branding and returns to the default when branding is cleared', () => {
    const firstCleanup = applySellerFavicon(new Uint8Array([1]));
    firstCleanup();
    vi.mocked(URL.createObjectURL).mockReturnValueOnce('blob:second-seller');
    const secondCleanup = applySellerFavicon(new Uint8Array([2]));
    expect(document.head.querySelector('link')?.getAttribute('href')).toBe('blob:second-seller');
    secondCleanup();
    applySellerFavicon(undefined)();
    expect(document.head.querySelector('link')?.getAttribute('href')).toBe('/favicon.png');
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});
