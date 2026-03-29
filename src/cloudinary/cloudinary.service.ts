import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import {
  UPLOAD_CONTEXT,
  type UploadContext,
  resolveFolderForContext,
} from './cloudinary-folders';
import type { UploadSignatureDto } from './dto/upload-signature.dto';

export interface UploadSignatureResponse {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  /** Carpeta completa en Cloudinary (p. ej. `dreamia/dreams`). */
  folder: string;
  /** Recurso usado para resolver `folder` (si no hubo override manual). */
  context: UploadContext;
  uploadPreset?: string;
}

@Injectable()
export class CloudinaryService {
  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    const cloud = this.config.get<string>('CLOUDINARY_CLOUD_NAME')?.trim();
    const key = this.config.get<string>('CLOUDINARY_API_KEY')?.trim();
    const secret = this.config.get<string>('CLOUDINARY_API_SECRET')?.trim();
    return !!(cloud && key && secret);
  }

  /** Parámetros para subida firmada desde el cliente (multipart a `https://api.cloudinary.com/v1_1/:cloud_name/image/upload`). */
  getUploadSignature(dto: UploadSignatureDto): UploadSignatureResponse {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Cloudinary no está configurado (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).',
      );
    }
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME')!.trim();
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY')!.trim();
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET')!.trim();
    const rootPrefix =
      this.config.get<string>('CLOUDINARY_ROOT_PREFIX')?.trim() || 'dreamia';
    const uploadPreset = this.config
      .get<string>('CLOUDINARY_UPLOAD_PRESET')
      ?.trim();

    const context: UploadContext = dto.context ?? UPLOAD_CONTEXT.DREAMS;
    const folder = dto.folder?.trim()
      ? dto.folder.trim()
      : resolveFolderForContext(rootPrefix, context);

    const timestamp = Math.round(Date.now() / 1000);

    const paramsToSign: Record<string, string | number> = {
      timestamp,
      folder,
    };
    if (uploadPreset) {
      paramsToSign.upload_preset = uploadPreset;
    }

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      apiSecret,
    );

    const out: UploadSignatureResponse = {
      cloudName,
      apiKey,
      timestamp,
      signature,
      folder,
      context,
    };
    if (uploadPreset) {
      out.uploadPreset = uploadPreset;
    }
    return out;
  }
}
