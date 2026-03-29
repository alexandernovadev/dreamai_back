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

  @Get()
  getAppInfo(): AppInfo {
    return this.appService.getAppInfo();
  }
}
