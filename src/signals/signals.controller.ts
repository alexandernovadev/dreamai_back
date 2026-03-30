import { Controller, Get, Param, Query } from '@nestjs/common';
import { SignalsHubService } from './signals-hub.service';

@Controller('signals')
export class SignalsController {
  constructor(private readonly signalsHubService: SignalsHubService) {}

  /** Aggregated Signals hub: 5 rows per catalog + appearance counts (no N+1). */
  @Get('hub')
  getHub() {
    return this.signalsHubService.getHub();
  }

  /**
   * Paginated “See all” for one catalog type — single response (no client N+1).
   * Example: `GET /signals/catalog/characters?page=1&limit=20`
   */
  @Get('catalog/:entity')
  getCatalog(
    @Param('entity') entity: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    return this.signalsHubService.getCatalogPage(entity, p, l);
  }
}
