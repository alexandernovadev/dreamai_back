import { IsIn, IsOptional, IsString } from 'class-validator';
import { UPLOAD_CONTEXT_VALUES, type UploadContext } from '../cloudinary-folders';

export class UploadSignatureDto {
  /**
   * Tipo de recurso → carpeta bajo el prefijo raíz (`CLOUDINARY_ROOT_PREFIX`, default `dreamia`).
   * Default `dreams`. Para catálogo: `characters`, `locations`, `objects`.
   */
  @IsOptional()
  @IsIn(UPLOAD_CONTEXT_VALUES)
  context?: UploadContext;

  /** Override manual de la carpeta completa en Cloudinary (opcional). Si se envía, ignora `context`. */
  @IsOptional()
  @IsString()
  folder?: string;
}
