export type DreamAnalyticsCatalogTotalsDto = {
  characters: number;
  locations: number;
  objects: number;
  events: number;
  contextLife: number;
  feelings: number;
};

export type DreamAnalyticsLucidityBinDto = {
  level: number;
  count: number;
};

export type DreamAnalyticsTopEntityDto = {
  id: string;
  name: string;
  count: number;
};

/** `GET /dream-sessions/analytics/overview` — métricas de toda la vida (sin filtro de fechas por ahora). */
export type DreamAnalyticsOverviewDto = {
  dreamCount: number;
  catalogTotals: DreamAnalyticsCatalogTotalsDto;
  lucidityHistogram: DreamAnalyticsLucidityBinDto[];
  topCharacters: DreamAnalyticsTopEntityDto[];
  topLocations: DreamAnalyticsTopEntityDto[];
  topObjects: DreamAnalyticsTopEntityDto[];
};
