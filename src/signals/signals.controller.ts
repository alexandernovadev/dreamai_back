import { Controller, Get } from '@nestjs/common';
import { SignalsHubService } from './signals-hub.service';

@Controller('signals')
export class SignalsController {
  constructor(private readonly signalsHubService: SignalsHubService) {}

  /** Aggregated Signals hub: 5 rows per catalog + appearance counts (no N+1). */
  @Get('hub')
  getHub() {
    return this.signalsHubService.getHub();
  }
}
