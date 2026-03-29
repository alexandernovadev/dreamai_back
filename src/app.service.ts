import { Injectable } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BUILD_ISO_DATE } from './build-info.generated';

export interface AppInfo {
  version: string;
  date: string;
  environment: string;
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
    return {
      version: this.packageVersion,
      date: BUILD_ISO_DATE,
      environment: this.resolveEnvironment(),
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
