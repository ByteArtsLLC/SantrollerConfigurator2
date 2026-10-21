import { Blob as NodeBlob } from 'node:buffer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resizeSellerFavicon, resizeSellerLogo } from './sellerLogo';

describe('resizeSellerLogo', () => {
  const drawImage = vi.fn();
  const decode = vi.fn();
  let image: { naturalWidth: number; naturalHeight: number; decode: typeof decode };
  let canvas: HTMLCanvasElement;
  const toBlob = vi.fn<HTMLCanvasElement['toBlob']>();

  beforeEach(() => {
    image = { naturalWidth: 4000, naturalHeight: 2000, decode };
    decode.mockResolvedValue(undefined);
    vi.stubGlobal('Blob', NodeBlob);
    vi.stubGlobal(
      'Image',
      vi.fn(() => image)
    );
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:logo'),
      revokeObjectURL: vi.fn(),
    });
    const context: Partial<CanvasRenderingContext2D> = { drawImage };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      context as CanvasRenderingContext2D
    );
    toBlob.mockImplementation((callback) => {
      callback(new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }));
    });
    canvas = document.createElement('canvas');
    vi.spyOn(document, 'createElement').mockReturnValue(canvas);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(toBlob);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it.each(['image/png', 'image/jpeg'])('resizes %s to a bounded PNG', async (type) => {
    const result = await resizeSellerLogo(new File(['original'], 'logo', { type }));
    expect(drawImage).toHaveBeenCalledWith(image, 0, 0, 256, 128);
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png');
    expect(result).toEqual(new Uint8Array([1, 2, 3]));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:logo');
  });

  it('preserves portrait proportions', async () => {
    image.naturalWidth = 1000;
    image.naturalHeight = 4000;
    await resizeSellerLogo(new File([], 'logo.png', { type: 'image/png' }));
    expect(drawImage).toHaveBeenCalledWith(image, 0, 0, 128, 512);
  });

  it('does not upscale small images', async () => {
    image.naturalWidth = 32;
    image.naturalHeight = 16;
    await resizeSellerLogo(new File([], 'logo.png', { type: 'image/png' }));
    expect(drawImage).toHaveBeenCalledWith(image, 0, 0, 32, 16);
  });

  it('caps square images at 128 pixels on both sides', async () => {
    image.naturalWidth = 2000;
    image.naturalHeight = 2000;
    await resizeSellerLogo(new File([], 'logo.png', { type: 'image/png' }));
    expect(drawImage).toHaveBeenCalledWith(image, 0, 0, 128, 128);
  });

  it('shrinks further when the encoded PNG exceeds 8 KiB', async () => {
    toBlob.mockImplementationOnce((callback) => callback(new Blob([new Uint8Array(8193)])));
    await resizeSellerLogo(new File([], 'logo.png', { type: 'image/png' }));
    expect(drawImage.mock.calls.map((call) => call.slice(3))).toEqual([
      [256, 128],
      [192, 96],
    ]);
    expect(canvas.width).toBe(192);
    expect(canvas.height).toBe(96);
  });

  it('accepts an encoded PNG exactly at the byte limit', async () => {
    toBlob.mockImplementationOnce((callback) => callback(new Blob([new Uint8Array(8192)])));
    const result = await resizeSellerLogo(new File([], 'logo.png', { type: 'image/png' }));
    expect(result.byteLength).toBe(8192);
    expect(toBlob).toHaveBeenCalledTimes(1);
  });

  it('does not shrink a long image whose shortest side is already below the cap', async () => {
    image.naturalWidth = 1;
    image.naturalHeight = 4000;
    await resizeSellerLogo(new File([], 'logo.png', { type: 'image/png' }));
    expect(drawImage).toHaveBeenCalledWith(image, 0, 0, 1, 4000);
  });

  it('rejects unsupported files before decoding', async () => {
    await expect(
      resizeSellerLogo(new File([], 'logo.svg', { type: 'image/svg+xml' }))
    ).rejects.toThrow('Unsupported');
    expect(decode).not.toHaveBeenCalled();
  });

  it('rejects corrupt images and releases the object URL', async () => {
    decode.mockRejectedValueOnce(new Error('Invalid image'));
    await expect(resizeSellerLogo(new File([], 'logo.png', { type: 'image/png' }))).rejects.toThrow(
      'Invalid image'
    );
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:logo');
  });

  it('rejects invalid dimensions', async () => {
    image.naturalWidth = 0;
    await expect(resizeSellerLogo(new File([], 'logo.png', { type: 'image/png' }))).rejects.toThrow(
      'dimensions'
    );
    expect(drawImage).not.toHaveBeenCalled();
  });

  it('reports encoding failures and releases the object URL', async () => {
    toBlob.mockImplementationOnce((callback) => callback(null));
    await expect(resizeSellerLogo(new File([], 'logo.png', { type: 'image/png' }))).rejects.toThrow(
      'encode'
    );
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:logo');
  });

  it('reports when canvas rendering is unavailable', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    await expect(resizeSellerLogo(new File([], 'logo.png', { type: 'image/png' }))).rejects.toThrow(
      'resize'
    );
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:logo');
  });

  it('fails rather than saving an image above the byte limit', async () => {
    toBlob.mockImplementation((callback) => callback(new Blob([new Uint8Array(8193)])));
    await expect(resizeSellerLogo(new File([], 'logo.png', { type: 'image/png' }))).rejects.toThrow(
      'size limit'
    );
    expect(canvas.width).toBe(1);
    expect(canvas.height).toBe(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:logo');
  });

  it.each([
    [4000, 2000, 32, 16],
    [2000, 4000, 16, 32],
    [2000, 2000, 32, 32],
    [16, 8, 16, 8],
    [1, 4000, 1, 32],
  ])('resizes a %ix%i favicon to %ix%i', async (width, height, expectedWidth, expectedHeight) => {
    image.naturalWidth = width;
    image.naturalHeight = height;
    await resizeSellerFavicon(new File([], 'favicon.png', { type: 'image/png' }));
    expect(drawImage).toHaveBeenCalledWith(image, 0, 0, expectedWidth, expectedHeight);
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png');
  });
});
