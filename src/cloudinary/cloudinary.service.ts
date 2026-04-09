import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'node:stream';
import { v2 as cloudinary } from 'cloudinary';
import {
  MAX_IMAGE_BYTES,
  UPLOAD_CONTEXT,
  type UploadContext,
  resolveFolderForContext,
} from './cloudinary-folders';
import { optimizeImageBuffer } from './image-optimize.util';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export interface UploadImageResult {
  publicId: string;
  secureUrl: string;
}

@Injectable()
export class CloudinaryService {
  private sdkConfigured = false;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    const cloud = this.config.get<string>('CLOUDINARY_CLOUD_NAME')?.trim();
    const key = this.config.get<string>('CLOUDINARY_API_KEY')?.trim();
    const secret = this.config.get<string>('CLOUDINARY_API_SECRET')?.trim();
    return !!(cloud && key && secret);
  }

  private ensureConfigured(): void {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Cloudinary no está configurado (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).',
      );
    }
  }

  private configureSdk(): void {
    if (this.sdkConfigured) {
      return;
    }
    this.ensureConfigured();
    cloudinary.config({
      cloud_name: this.config.get<string>('CLOUDINARY_CLOUD_NAME')!.trim(),
      api_key: this.config.get<string>('CLOUDINARY_API_KEY')!.trim(),
      api_secret: this.config.get<string>('CLOUDINARY_API_SECRET')!.trim(),
    });
    this.sdkConfigured = true;
  }

  /**
   * Sube un buffer al bucket Cloudinary (servidor → Cloudinary).
   * Las credenciales solo existen en el backend.
   */
  async uploadImageBuffer(
    buffer: Buffer,
    mimetype: string,
    context: UploadContext,
  ): Promise<UploadImageResult> {
    if (!buffer?.length) {
      throw new BadRequestException('Archivo vacío.');
    }
    if (buffer.length > MAX_IMAGE_BYTES) {
      throw new BadRequestException(
        `Imagen demasiado grande (máx. ${MAX_IMAGE_BYTES / 1024 / 1024} MB).`,
      );
    }
    if (!ALLOWED_MIME.has(mimetype)) {
      throw new BadRequestException(
        'Tipo de archivo no permitido (usar JPEG, PNG, WebP o GIF).',
      );
    }

    this.configureSdk();

    const { buffer: optimized } = await optimizeImageBuffer(buffer, mimetype);

    const rootPrefix =
      this.config.get<string>('CLOUDINARY_ROOT_PREFIX')?.trim() || 'dreamia';
    const folder = resolveFolderForContext(rootPrefix, context);

    const result = await new Promise<UploadImageResult>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          format: 'webp',
        },
        (error, res) => {
          if (error) {
            reject(new Error('Cloudinary upload failed', { cause: error }));
            return;
          }
          if (!res?.public_id || !res.secure_url) {
            reject(new Error('Respuesta Cloudinary incompleta'));
            return;
          }
          resolve({
            publicId: res.public_id,
            secureUrl: res.secure_url,
          });
        },
      );
      Readable.from(optimized).pipe(stream);
    });

    return result;
  }
}

export function parseUploadContext(
  raw: string | undefined,
): UploadContext | undefined {
  if (!raw?.trim()) {
    return undefined;
  }
  const v = raw.trim() as UploadContext;
  if (Object.values(UPLOAD_CONTEXT).includes(v)) {
    return v;
  }
  return undefined;
}
