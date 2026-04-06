import { Injectable } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BUILD_ISO_DATE, GIT_COMMIT } from './build-info.generated';

export interface AppInfo {
  /** Nombre del servicio (para pantallas de “información del sistema”). */
  serviceName: string;
  version: string;
  /** ISO 8601 del build (generado en `npm run build`). */
  buildAt: string;
  environment: string;
  /** Commit corto si hubo git al generar el build, o `GIT_COMMIT` en CI. */
  commit: string;
}

@Injectable()
export class AppService {
  private readonly packageVersion: string;

  constructor() {
    const raw = readFileSync(join(process.cwd(), 'package.json'), 'utf8');
    const pkg = JSON.parse(raw) as { version?: string };
    this.packageVersion = pkg.version ?? '0.0.0';
  }

  getAppInfo(): AppInfo {
    const fromEnv = process.env.GIT_COMMIT?.trim();
    return {
      serviceName: 'dreamia_back',
      version: this.packageVersion,
      buildAt: BUILD_ISO_DATE,
      environment: this.resolveEnvironment(),
      commit: fromEnv || GIT_COMMIT || '',
    };
  }

  private resolveEnvironment(): string {
    const explicit = process.env.APP_ENV?.trim();
    if (explicit) {
      return explicit;
    }
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv === 'production') {
      return 'production';
    }
    if (nodeEnv === 'test') {
      return 'test';
    }
    return 'development';
  }
}
