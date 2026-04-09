import sharp from 'sharp';

export interface OptimizeResult {
  buffer: Buffer;
  mimetype: 'image/webp' | 'image/gif';
}

/**
 * Convierte cualquier imagen a WebP antes de subir a Cloudinary.
 *
 * - JPEG / PNG / WebP → WebP quality 85, sin redimensionado, sin metadata EXIF.
 * - GIF → se devuelve sin modificar (sharp no preserva animación).
 *
 * Si sharp falla se devuelve el buffer original con su mimetype
 * para no bloquear el upload.
 */
export async function optimizeImageBuffer(
  buffer: Buffer,
  mimetype: string,
): Promise<OptimizeResult> {
  if (mimetype === 'image/gif') {
    return { buffer, mimetype: 'image/gif' };
  }

  try {
    const optimizedBuffer = await sharp(buffer)
      .webp({ quality: 85, effort: 6, lossless: false })
      .toBuffer();

    return { buffer: optimizedBuffer, mimetype: 'image/webp' };
  } catch {
    // Buffer corrupto u otro error de sharp: no bloqueamos el upload.
    return { buffer, mimetype: mimetype as 'image/webp' };
  }
}
