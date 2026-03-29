import { Body, Controller, Post } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { UploadSignatureDto } from './dto/upload-signature.dto';

@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinary: CloudinaryService) {}

  /**
   * Devuelve `timestamp`, `signature`, `apiKey`, `cloudName` y `folder` para subir con POST
   * a `https://api.cloudinary.com/v1_1/:cloud_name/image/upload` desde el cliente.
   */
  @Post('upload-signature')
  uploadSignature(@Body() body: UploadSignatureDto) {
    return this.cloudinary.getUploadSignature(body ?? {});
  }
}
