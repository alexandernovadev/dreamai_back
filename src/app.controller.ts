import { Controller, Get } from '@nestjs/common';
import { AppService, type AppInfo } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** Liveness/readiness para Docker, Kubernetes, balanceadores. */
  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }

  /** Versión, build y ambiente (para la app cliente: Más → Información del sistema). */
  @Get('meta')
  getMeta(): AppInfo {
    return this.appService.getAppInfo();
  }

  @Get()
  getAppInfo(): AppInfo {
    return this.appService.getAppInfo();
  }
}
