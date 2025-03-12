// ViewState for map
export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

// Data configuration
export interface DataConfig {
  forecast_id?: string;
  projection_id?: string;
  epoch?: number;
  selected_satellites?: string[];
}

// Data source configuration
export enum DataSourceType {
  LOCAL = 'local',
  SUPABASE = 'supabase'
}

export interface DataSourceConfig {
  type: DataSourceType;
  baseUrl?: string;
  apiKey?: string;
}

// Demand entity
export interface DemandEntity {
  entity_id: string;
  lat: number;
  lon: number;
  service_area: string;
  demand_mbps: number;
  epoch: number;
  timestamp: string;
  forecast_id: string;
}

// Aggregated demand (H3)
export interface AggregatedDemand {
  h3Index: string;
  service_area: string;
  demand_mbps: number;
  count: number;
  lat: number;
  lon: number;
}

// Supply projection
export interface SupplyProjection {
  projection_id: string;
  satellite_id: string;
  service_area: string;
  supply_mbps: number;
  projection_start: string;
  projection_end: string;
}

// Satellite coverage
export interface SatelliteCoverage {
  satellite_id: string;
  service_area: string;
  geom: GeoJSON.Geometry;
}

// Allocation
export interface Allocation {
  service_area: string;
  entity_id: string;
  lat: number;
  lon: number;
  epoch: number;
  mbps: number;
  satellite_id: string;
} 