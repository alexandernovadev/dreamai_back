import { setServers } from 'dns';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Some local/ISP DNS resolvers refuse SRV record queries (return EREFUSED),
 * which breaks `mongodb+srv://` connection strings even though the same URI
 * works fine in tools with their own resolver (e.g. Compass). Google/Cloudflare
 * DNS both support SRV lookups reliably, so we point Node's resolver at them
 * before anything (Mongoose included) tries to connect.
 */
setServers(['8.8.8.8', '1.1.1.1']);

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
