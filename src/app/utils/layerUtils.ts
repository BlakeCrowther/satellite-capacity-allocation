import { scaleLinear } from 'd3-scale';

// Color ranges for visualization
export const DEMAND_COLOR_RANGE = [
  [65, 182, 196],
  [127, 205, 187],
  [199, 233, 180],
  [237, 248, 177],
  [255, 255, 204],
  [255, 237, 160],
  [254, 217, 118],
  [254, 178, 76],
  [253, 141, 60],
  [252, 78, 42]
];

// Service area colors
const SERVICE_AREA_COLORS: Record<string, [number, number, number]> = {
  'AMERICAS': [255, 100, 100],
  'EUROPE': [100, 255, 100],
  'ASIA': [100, 100, 255],
  'AFRICA': [255, 255, 100],
  'OCEANIA': [255, 100, 255],
  'DEFAULT': [180, 180, 180]
};

// Satellite-specific colors
export const SATELLITE_COLORS: Record<string, [number, number, number]> = {
  'USA-SAT': [180, 80, 220],    // Purple for USA-SAT
  'NA-SAT': [80, 200, 220],     // Cyan/Teal for NA-SAT
  'EU-SAT': [150, 150, 180],    // Slate/Lavender for EU-SAT
  'DEFAULT': [120, 120, 120]    // Darker gray
};

/**
 * Get color for service area
 */
export function getServiceAreaColor(serviceArea: string): [number, number, number] {
  return SERVICE_AREA_COLORS[serviceArea] || SERVICE_AREA_COLORS.DEFAULT;
}

/**
 * Get color for satellite
 */
export function getSatelliteColor(satelliteId: string): [number, number, number] {
  return SATELLITE_COLORS[satelliteId] || SATELLITE_COLORS.DEFAULT;
}

/**
 * Format Mbps value for display
 */
export function formatMbps(mbps: number): string {
  if (mbps >= 1000) {
    return `${(mbps / 1000).toFixed(2)} Gbps`;
  }
  return `${mbps.toFixed(2)} Mbps`;
}

/**
 * Create a color scale function based on domain and color range
 */
export function createColorScale(
  domain: [number, number],
  colorRange: Array<[number, number, number]>
): (value: number) => [number, number, number] {
  // Fix: Use number instead of number[] for the scale generic type
  const scale = scaleLinear<number>()
    .domain([domain[0], domain[1]])
    .range([0, colorRange.length - 1])
    .clamp(true);
  
  return (value: number) => {
    const colorIndex = Math.floor(scale(value));
    return colorRange[colorIndex];
  };
}

/**
 * Create an elevation scale function based on domain and range
 */
export function createElevationScale(
  domain: [number, number],
  range: [number, number]
): (value: number) => number {
  const scale = scaleLinear<number>()
    .domain([domain[0], domain[1]])
    .range([range[0], range[1]])
    .clamp(true);
  
  return (value: number) => scale(value);
} 