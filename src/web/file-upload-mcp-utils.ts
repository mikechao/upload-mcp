const MODEL_SUPPORTED_MIME_TYPES = new Set(['image/png', 'image/jpeg']);

export async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const chunkSize = 0x8000;
  let binary = '';

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

export async function normalizeBlobForModel(blob: Blob): Promise<{ blob: Blob; mimeType: string }> {
  if (MODEL_SUPPORTED_MIME_TYPES.has(blob.type)) {
    return { blob, mimeType: blob.type };
  }

  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') {
    throw new TypeError(`Unsupported image mime type for model context: ${blob.type || 'unknown'}`);
  }

  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to create canvas context for image normalization');
    }

    context.drawImage(bitmap, 0, 0);
    const normalizedBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/png');
    });

    if (!normalizedBlob) {
      throw new Error('Failed to convert image to PNG for model context');
    }

    return { blob: normalizedBlob, mimeType: 'image/png' };
  } finally {
    bitmap.close();
  }
}
