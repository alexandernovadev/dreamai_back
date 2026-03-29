import { IsString, IsUrl } from 'class-validator';

/** Referencia a un recurso en Cloudinary tras subir (direct upload o vía API). */
export class DreamImageDto {
  @IsString()
  publicId: string;

  @IsUrl({ protocols: ['https'], require_protocol: true })
  secureUrl: string;
}
