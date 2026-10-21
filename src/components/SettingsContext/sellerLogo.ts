const MAX_LOGO_SHORT_SIDE = 128;
const MAX_IMAGE_BYTES = 8 * 1024;

export async function resizeSellerLogo(file: File): Promise<Uint8Array> {
  return resizeSellerImage(file, MAX_LOGO_SHORT_SIDE, true);
}

export async function resizeSellerFavicon(file: File): Promise<Uint8Array> {
  return resizeSellerImage(file, 32, false);
}

async function resizeSellerImage(
  file: File,
  maxDimension: number,
  shortestSide: boolean
): Promise<Uint8Array> {
  if (!['image/png', 'image/jpeg'].includes(file.type)) {
    throw new Error('Unsupported image format');
  }

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error('Invalid image dimensions');
    }

    const scale = Math.min(
      1,
      maxDimension /
        (shortestSide
          ? Math.min(image.naturalWidth, image.naturalHeight)
          : Math.max(image.naturalWidth, image.naturalHeight))
    );
    let width = Math.max(1, Math.round(image.naturalWidth * scale));
    let height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to resize image');
    }

    while (true) {
      canvas.width = width;
      canvas.height = height;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(image, 0, 0, width, height);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error('Unable to encode image'));
          }
        }, 'image/png');
      });
      if (blob.size <= MAX_IMAGE_BYTES) {
        return new Uint8Array(await blob.arrayBuffer());
      }
      if (width === 1 && height === 1) {
        throw new Error('Unable to fit image within size limit');
      }
      // PNG quality settings do not reduce file size, so shrink further for noisy images.
      width = Math.max(1, Math.floor(width * 0.75));
      height = Math.max(1, Math.floor(height * 0.75));
    }
  } finally {
    URL.revokeObjectURL(url);
  }
}
