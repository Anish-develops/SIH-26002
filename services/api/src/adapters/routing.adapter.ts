/**
 * Future Integration Adapter: OSRM / GraphHopper GIS Routing Engine
 * Standardizes graph-based shortest path and turn-by-turn routing.
 */

import { RouteRecommendation } from '@ner-sentinel/types';

export interface IRoutingProvider {
  calculateRoute(
    origin: [number, number],
    destination: [number, number],
    blockedSegmentIds: string[]
  ): Promise<RouteRecommendation>;
}
