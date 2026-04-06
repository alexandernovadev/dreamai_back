import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService, parseUploadContext } from './cloudinary.service';
import { MAX_IMAGE_BYTES, UPLOAD_CONTEXT } from './cloudinary-folders';

@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinary: CloudinaryService) {}

  /**
   * Subida de imagen **en el servidor** (multipart `file`).
   * Query opcional: `context` = `dreams` (default) | `characters` | `locations` | `objects`.
   * Respuesta: `{ publicId, secureUrl }`.
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_IMAGE_BYTES },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query('context') contextQuery?: string,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException(
        'Enviar un archivo en el campo multipart `file`.',
      );
    }
    const context = parseUploadContext(contextQuery) ?? UPLOAD_CONTEXT.DREAMS;
    return this.cloudinary.uploadImageBuffer(
      file.buffer,
      file.mimetype,
      context,
    );
  }
}
