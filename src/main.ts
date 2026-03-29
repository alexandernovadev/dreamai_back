import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const DEFAULT_CORS_ORIGINS = [
  'http://localhost:8081',
  'http://localhost:3000',
  'http://localhost:8080',
];

function parseCorsOrigins(raw: string | undefined): string[] {
  if (!raw?.trim()) {
    return DEFAULT_CORS_ORIGINS;
  }
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const origins = parseCorsOrigins(config.get<string>('CORS_ORIGINS'));
  const credentials = config.get<string>('CORS_CREDENTIALS') === 'true';

  app.enableCors({
    origin: origins,
    credentials,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
