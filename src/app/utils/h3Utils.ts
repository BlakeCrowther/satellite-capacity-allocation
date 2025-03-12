import * as h3 from 'h3-js';

import { AggregatedDemand, DemandEntity } from '../data/models/types';

// Default H3 resolution for demand aggregation
export const DEFAULT_H3_RESOLUTION = 4;

/**
 * Aggregate demand data to H3 hexagons
 */
export function aggregateDemandToH3(
  demandData: DemandEntity[],
  resolution: number = DEFAULT_H3_RESOLUTION
): AggregatedDemand[] {
  // Group demand by H3 index
  const h3Aggregation: Record<string, AggregatedDemand> = {};

  demandData.forEach((entity) => {
    const h3Index = h3.latLngToCell(entity.lat, entity.lon, resolution);
    
    if (!h3Aggregation[h3Index]) {
      const [lat, lon] = h3.cellToLatLng(h3Index);
      h3Aggregation[h3Index] = {
        h3Index,
        service_area: entity.service_area,
        demand_mbps: 0,
        count: 0,
        lat,
        lon
      };
    }
    
    h3Aggregation[h3Index].demand_mbps += entity.demand_mbps;
    h3Aggregation[h3Index].count += 1;
  });

  return Object.values(h3Aggregation);
}

/**
 * Get min and max demand values from aggregated data
 */
export function getDemandRange(aggregatedDemand: AggregatedDemand[]): { min: number; max: number } {
  if (aggregatedDemand.length === 0) {
    return { min: 0, max: 0 };
  }
  
  let min = Infinity;
  let max = -Infinity;
  
  aggregatedDemand.forEach((hex) => {
    min = Math.min(min, hex.demand_mbps);
    max = Math.max(max, hex.demand_mbps);
  });
  
  return { min, max };
} 