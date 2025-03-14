"use client";

import {
  AggregatedDemand,
  Allocation,
  DataConfig,
  DemandEntity,
  SatelliteCoverage,
  ServiceArea,
  SupplyProjection,
  ViewState,
} from "../data/models/types";
import {
  DEFAULT_H3_RESOLUTION,
  DEFAULT_VIEW_STATE,
  DEFAULT_VIEW_STATE_3D,
} from "../config/mapConfig";
import {
  DEMAND_COLOR_RANGE,
  createColorScale,
  createElevationScale,
  getSatelliteColor,
} from "../utils/layerUtils";
import { Feature, GeoJsonProperties, Geometry } from "geojson";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { aggregateDemandToH3, getDemandRange } from "../utils/h3Utils";

import { BASEMAP } from "@deck.gl/carto";
import DeckGL from "@deck.gl/react";
import { GeoJsonLayer } from "@deck.gl/layers";
import { H3HexagonLayer } from "@deck.gl/geo-layers";
import { Map as MaplibreMap } from "maplibre-gl";
import { dataService } from "../data/services/DataService";
import { latLngToCell } from "h3-js";

// Define color range for allocation optimality
const ALLOCATION_COLOR_RANGE = [
  [180, 0, 0], // Dark red - severely under-allocated (0% met)
  [220, 53, 69], // Red - under-allocated (25% met)
  [253, 126, 20], // Orange - partially met (50% met)
  [255, 193, 7], // Yellow - mostly met (75% met)
  [40, 167, 69], // Green - fully met (100% met)
] as [number, number, number][];

// Process GeoJSON for rendering
const processCoverageData = (
  coverageData: SatelliteCoverage[],
  selectedSatellites?: string[]
): Feature<Geometry, GeoJsonProperties>[] => {
  return coverageData
    .filter(
      (coverage) =>
        // Only show satellites that are explicitly selected
        selectedSatellites &&
        selectedSatellites.length > 0 &&
        selectedSatellites.includes(coverage.satellite_id)
    )
    .map((coverage) => {
      return {
        type: "Feature",
        geometry: coverage.geom,
        properties: {
          satellite_id: coverage.satellite_id,
          service_area: coverage.service_area,
        },
      };
    });
};

// Interfaces for aggregated data
interface AggregatedAllocation {
  h3Index: string;
  service_area: string;
  demand_mbps: number;
  allocated_mbps: number;
  optimality_ratio: number;
  count: number;
  lat: number;
  lon: number;
}

interface SatelliteMapProps {
  dataConfig: DataConfig;
  layerVisibility?: {
    demand?: boolean;
    supply?: boolean;
    coverage?: boolean;
    allocation?: boolean;
  };
  viewState3D?: {
    pitch: number;
    elevationScale: number;
  };
  setViewState3D?: (state: { pitch: number; elevationScale: number }) => void;
  h3Resolution?: number;
}

// Define hover info type
interface HoverInfo {
  x: number;
  y: number;
  object?:
    | AggregatedDemand
    | AggregatedAllocation
    | { properties: { satellite_id: string; service_area: string } }
    | { properties: { service_area_id: string } }
    | null;
}

const SatelliteMap: React.FC<SatelliteMapProps> = ({
  dataConfig,
  layerVisibility = {
    demand: true,
    supply: false,
    coverage: false,
    allocation: false,
  },
  viewState3D = DEFAULT_VIEW_STATE_3D,
  // We're not using setViewState3D in this component but keeping it for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setViewState3D = () => {},
  h3Resolution = DEFAULT_H3_RESOLUTION,
}) => {
  // State
  const [viewState, setViewState] = useState<ViewState>({
    ...DEFAULT_VIEW_STATE,
    pitch: viewState3D.pitch,
  });
  const [demandData, setDemandData] = useState<DemandEntity[]>([]);
  const [supplyData, setSupplyData] = useState<SupplyProjection[]>([]);
  const [coverageData, setCoverageData] = useState<SatelliteCoverage[]>([]);
  const [serviceAreaData, setServiceAreaData] = useState<ServiceArea[]>([]);
  const [allocationData, setAllocationData] = useState<Allocation[]>([]);
  const [hoveredObject, setHoveredObject] = useState<
    | AggregatedDemand
    | AggregatedAllocation
    | { properties: { satellite_id: string; service_area: string } }
    | { properties: { service_area_id: string } }
    | null
  >(null);
  const [pointerPosition, setPointerPosition] = useState({ x: 0, y: 0 });

  // Refs
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  // Using any for DeckGL ref to avoid complex typing issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deckRef = useRef<any>(null);

  // Load data based on configuration
  useEffect(() => {
    const fetchData = async () => {
      // Fetch demand data
      const demand = await dataService.getDemandData(
        dataConfig.forecast_id,
        dataConfig.epoch
      );
      setDemandData(demand);

      // Fetch supply data
      const supply = await dataService.getSupplyData(dataConfig.projection_id);
      setSupplyData(supply);

      // Fetch coverage data
      const coverage = await dataService.getSatelliteCoverage();
      setCoverageData(coverage);

      // Fetch service area data
      const serviceAreas = await dataService.getServiceAreas();
      setServiceAreaData(serviceAreas);

      // Fetch allocation data if we have both forecast and projection
      if (dataConfig.forecast_id && dataConfig.projection_id) {
        try {
          console.log(
            `Fetching allocations for forecast: ${dataConfig.forecast_id}, projection: ${dataConfig.projection_id}, epoch: ${dataConfig.epoch}`
          );
          const allocations = await dataService.getAllocationDataForExperiment(
            dataConfig.forecast_id,
            dataConfig.projection_id,
            dataConfig.epoch
          );
          console.log(`Received ${allocations.length} allocations`);
          setAllocationData(allocations);
        } catch (error) {
          console.error("Error loading allocation data:", error);
          setAllocationData([]);
        }
      } else {
        setAllocationData([]);
      }
    };

    fetchData();
  }, [dataConfig]);

  // Initialize MapLibre map
  useEffect(() => {
    if (!mapContainer.current) return;

    if (!mapRef.current) {
      const map = new MaplibreMap({
        container: mapContainer.current,
        style: BASEMAP.POSITRON,
        interactive: false,
        center: [DEFAULT_VIEW_STATE.longitude, DEFAULT_VIEW_STATE.latitude],
        zoom: DEFAULT_VIEW_STATE.zoom,
        bearing: DEFAULT_VIEW_STATE.bearing,
        pitch: DEFAULT_VIEW_STATE.pitch,
      });

      mapRef.current = map;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Process demand data into H3 hexagons
  const aggregatedDemand = useMemo(() => {
    return aggregateDemandToH3(demandData, h3Resolution);
  }, [demandData, h3Resolution]);

  // Aggregate allocation data by H3 cell
  const aggregatedAllocations = useMemo(() => {
    console.log(
      `Processing ${allocationData.length} allocations for H3 visualization`
    );

    if (allocationData.length === 0) {
      console.log("No allocation data to aggregate");
      return [];
    }

    const h3Cells: Record<string, AggregatedAllocation> = {};

    allocationData.forEach((allocation) => {
      // Check if we have lat/lon coordinates - supporting both naming conventions
      const latitude = allocation.latitude ?? allocation.lat;
      const longitude = allocation.longitude ?? allocation.lon;

      if (latitude === undefined || longitude === undefined) {
        console.warn("Allocation missing coordinates:", allocation);
        return;
      }

      // Generate H3 index from lat/lon if it doesn't exist
      let h3Index = allocation.h3_index;
      if (!h3Index) {
        try {
          h3Index = latLngToCell(latitude, longitude, h3Resolution);
          console.log(
            `Generated H3 index ${h3Index} for coordinates ${latitude}, ${longitude}`
          );
        } catch (error) {
          console.error("Failed to generate H3 index for allocation:", error);
          return;
        }
      }

      if (!h3Cells[h3Index]) {
        h3Cells[h3Index] = {
          h3Index,
          service_area: allocation.service_area,
          demand_mbps: 0,
          allocated_mbps: 0,
          optimality_ratio: 0,
          count: 0,
          lat: latitude,
          lon: longitude,
        };
      }

      h3Cells[h3Index].demand_mbps += allocation.demand_mbps;
      h3Cells[h3Index].allocated_mbps += allocation.allocated_mbps;
      h3Cells[h3Index].count += 1;
    });

    // Calculate optimality ratio for each cell
    const result = Object.values(h3Cells).map((cell) => {
      return {
        ...cell,
        optimality_ratio:
          cell.demand_mbps > 0 ? cell.allocated_mbps / cell.demand_mbps : 1.0, // 1.0 is optimal when there's no demand
      };
    });

    console.log(
      `Created ${result.length} H3 cells for allocation visualization`
    );
    if (result.length > 0) {
      console.log("Sample H3 cell:", result[0]);
    }
    return result;
  }, [allocationData, h3Resolution]);

  // Create color scale based on demand range
  const demandRange = useMemo(() => {
    return getDemandRange(aggregatedDemand);
  }, [aggregatedDemand]);

  const demandColorScale = useMemo(() => {
    return createColorScale(
      [demandRange.min, demandRange.max],
      DEMAND_COLOR_RANGE as [number, number, number][]
    );
  }, [demandRange]);

  const demandElevationScale = useMemo(() => {
    return createElevationScale([demandRange.min, demandRange.max], [0, 50000]);
  }, [demandRange]);

  // Create color scale for allocation optimality
  const allocationColorScale = useMemo(() => {
    // Create a scale for values that don't meet demand (0 to 1.0)
    const colorScale = createColorScale(
      [0, 1.0], // Domain from 0 to 1.0
      ALLOCATION_COLOR_RANGE
    );

    // Create a function that returns the appropriate color based on the value
    return (value: number): [number, number, number] => {
      if (value >= 1.0) {
        // Green for values that meet or exceed demand
        return ALLOCATION_COLOR_RANGE[4];
      } else {
        // Use a scale for values that don't meet demand (0 to 0.99)
        return colorScale(value);
      }
    };
  }, []);

  // Create elevation scale for allocation optimality
  const allocationElevationScale = useMemo(() => {
    // Create a scale where:
    // - Unmet demand (values < 1.0) has height proportional to the gap
    // - Met demand (values >= 1.0) has minimal height
    return (value: number) => {
      if (value >= 1.0) {
        return 500; // Minimal height for fully met demand
      } else {
        // Height inversely proportional to how much demand is met
        return (1 - value) * 50000; // Higher when less demand is met
      }
    };
  }, []);

  // Process coverage data with smoothing
  const processedCoverageData = useMemo(() => {
    return processCoverageData(coverageData, dataConfig.selected_satellites);
  }, [coverageData, dataConfig.selected_satellites]);

  // Group coverage data by satellite for separate rendering
  const coverageBySatellite = useMemo(() => {
    const result: Record<string, Feature<Geometry, GeoJsonProperties>[]> = {};

    if (processedCoverageData.length > 0) {
      processedCoverageData.forEach((feature) => {
        const satelliteId = feature.properties?.satellite_id as string;
        if (!result[satelliteId]) {
          result[satelliteId] = [];
        }
        result[satelliteId].push(feature);
      });
    }

    return result;
  }, [processedCoverageData]);

  // Process service area data for display
  const processServiceAreaData = useMemo(() => {
    return serviceAreaData.map((area) => ({
      type: "Feature",
      geometry: area.geom,
      properties: {
        service_area_id: area.service_area_id,
      },
    })) as Feature<Geometry, GeoJsonProperties>[];
  }, [serviceAreaData]);

  // Aggregate supply data by service area
  const aggregateSupplyByServiceArea = useMemo(() => {
    const result: Record<string, number> = {};

    if (supplyData.length === 0 || !dataConfig.projection_id) {
      return result;
    }

    // Only use supply data from the selected projection
    const filteredSupply = supplyData.filter(
      (supply) => supply.projection_id === dataConfig.projection_id
    );

    // Group and sum supply capacity by service area
    filteredSupply.forEach((supply) => {
      const serviceAreaId = supply.service_area;
      if (!result[serviceAreaId]) {
        result[serviceAreaId] = 0;
      }
      result[serviceAreaId] += supply.supply_mbps;
    });

    return result;
  }, [supplyData, dataConfig.projection_id]);

  // Aggregate demand data by service area
  const aggregateDemandByServiceArea = useMemo(() => {
    const result: Record<string, number> = {};

    if (demandData.length === 0 || dataConfig.forecast_id === undefined) {
      return result;
    }

    // Filter demand data by forecast
    const filteredDemand = demandData.filter(
      (demand) => demand.forecast_id === dataConfig.forecast_id
    );

    // Group and sum demand by service area
    filteredDemand.forEach((demand) => {
      const serviceAreaId = demand.service_area;
      if (!result[serviceAreaId]) {
        result[serviceAreaId] = 0;
      }
      result[serviceAreaId] += demand.demand_mbps;
    });

    return result;
  }, [demandData, dataConfig.forecast_id]);

  // Find the supply range for scaling
  const supplyRange = useMemo(() => {
    const values = Object.values(aggregateSupplyByServiceArea);
    if (values.length === 0) {
      return { min: 0, max: 1 };
    }
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [aggregateSupplyByServiceArea]);

  // Create an opacity scale for supply
  const supplyOpacityScale = useMemo(() => {
    return createElevationScale([supplyRange.min, supplyRange.max], [0.1, 0.8]);
  }, [supplyRange]);

  // Update map when view state changes
  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current;
      map.jumpTo({
        center: [viewState.longitude, viewState.latitude],
        zoom: viewState.zoom,
        bearing: viewState.bearing,
        pitch: viewState.pitch,
      });
    }
  }, [viewState]);

  // Update viewState when viewState3D changes
  useEffect(() => {
    setViewState((prev) => ({
      ...prev,
      pitch: viewState3D.pitch,
    }));
  }, [viewState3D.pitch]);

  // Handle hover events
  const onHover = (info: HoverInfo) => {
    setHoveredObject(info.object || null);
    setPointerPosition({ x: info.x, y: info.y });
  };

  // Create deck.gl layers
  const layers = [
    // Base map layer (empty)
    new GeoJsonLayer({
      id: "base-map",
      data: [],
      pickable: false,
      stroked: false,
      filled: false,
    }),

    // Create separate layers for each satellite to avoid z-fighting
    ...(layerVisibility.coverage
      ? Object.entries(coverageBySatellite).map(([satelliteId, features]) => {
          return new GeoJsonLayer({
            id: `coverage-layer-${satelliteId}`,
            data: features,
            pickable: true,
            stroked: true,
            filled: true,
            lineWidthMinPixels: 1,
            getFillColor: () => {
              // Use satellite-specific colors
              const color = getSatelliteColor(satelliteId);
              return [...color, 40]; // Lower alpha to see hexagons through beams
            },
            getLineColor: () => {
              // Match border to satellite color
              const color = getSatelliteColor(satelliteId);
              return [...color, 150]; // Slightly lower alpha for border
            },
            getLineWidth: 1,
            // Use z-offset to prevent z-fighting between layers
            polygonOffset: true,
            parameters: {
              // Basic blending for transparency
              blend: true,
              depthTest: true,
              depthMask: false, // Don't write to depth buffer
            },
            updateTriggers: {
              getFillColor: [dataConfig.selected_satellites],
              getLineColor: [dataConfig.selected_satellites],
            },
            onHover,
          });
        })
      : []),

    // Demand layer (H3 hexagons)
    layerVisibility.demand &&
      !layerVisibility.allocation && // Only show if allocation is not active
      new H3HexagonLayer({
        id: "demand-layer",
        data: aggregatedDemand,
        pickable: true,
        wireframe: false,
        filled: true,
        extruded: true,
        elevationScale: viewState3D.elevationScale,
        getHexagon: (d) => d.h3Index,
        getFillColor: (d) => {
          const color = demandColorScale(d.demand_mbps);
          return [...color, 255]; // Add alpha channel
        },
        getElevation: (d) => demandElevationScale(d.demand_mbps),
        opacity: 0.8,
        updateTriggers: {
          getFillColor: [demandRange],
          getElevation: [demandRange, viewState3D.elevationScale],
        },
        onHover,
      }),

    // Allocation layer (H3 hexagons)
    layerVisibility.allocation &&
      dataConfig.forecast_id &&
      dataConfig.projection_id &&
      aggregatedAllocations.length > 0 &&
      new H3HexagonLayer({
        id: "allocation-layer",
        data: aggregatedAllocations,
        pickable: true,
        wireframe: false,
        filled: true,
        extruded: true,
        elevationScale: viewState3D.elevationScale,
        getHexagon: (d) => d.h3Index,
        getFillColor: (d: AggregatedAllocation) => {
          const color = allocationColorScale(d.optimality_ratio);
          return [...color, 255]; // Add alpha
        },
        getElevation: (d: AggregatedAllocation) =>
          allocationElevationScale(d.optimality_ratio),
        opacity: 0.8,
        updateTriggers: {
          getFillColor: [],
          getElevation: [viewState3D.elevationScale],
        },
        onHover,
      }),

    // Service Areas layer (shown when supply layer is toggled)
    layerVisibility.supply &&
      new GeoJsonLayer({
        id: "service-areas-layer",
        data: processServiceAreaData,
        pickable: true,
        stroked: true,
        filled: true,
        extruded: false,
        lineWidthScale: 20,
        lineWidthMinPixels: 2,
        getFillColor: (d) => {
          const serviceAreaId = d.properties?.service_area_id;
          const supply = aggregateSupplyByServiceArea[serviceAreaId] || 0;

          // Use a consistent color for service areas rather than changing based on supply
          // Just use opacity to indicate supply level
          const opacity = supplyOpacityScale(supply) * 255;
          return [50, 130, 210, opacity]; // Consistent blue color with varying opacity
        },
        getLineColor: [30, 100, 180, 200], // Darker blue border
        getLineWidth: 1,
        getElevation: 0,
        // Show service area ID as text overlay
        getText: (d: Feature<Geometry, GeoJsonProperties>) => {
          const serviceAreaId = d.properties?.service_area_id?.toString() || "";
          const supply = aggregateSupplyByServiceArea[serviceAreaId] || 0;

          // If we have both forecast and projection data
          if (dataConfig.forecast_id && dataConfig.projection_id) {
            const demand = aggregateDemandByServiceArea[serviceAreaId] || 0;
            const difference = supply - demand;

            // Show supply, demand, and difference
            if (demand > 0) {
              return `${serviceAreaId}\n${Math.round(supply)} vs ${Math.round(
                demand
              )}\n${difference < 0 ? "" : "+"}${Math.round(difference)}`;
            }
          }

          // Otherwise just show supply if we have data
          return supply > 0
            ? `${serviceAreaId}\n${Math.round(supply)} Mbps`
            : serviceAreaId;
        },
        getTextSize: 13,
        getTextColor: [20, 20, 20, 255], // Near black text
        getTextPixelOffset: [0, 0],
        getTextAnchor: "middle",
        getTextAlignmentBaseline: "center",
        textFontFamily: "Arial, sans-serif",
        // Enable picking
        autoHighlight: true,
        highlightColor: [255, 200, 0, 100], // Highlight on hover
        // Add onHover handler
        onHover,
        // Use same optimizations as the coverage layer
        polygonOffset: true,
        parameters: {
          // Basic blending for transparency
          blend: true,
          depthTest: true,
          depthMask: false, // Don't write to depth buffer
        },
        updateTriggers: {
          getFillColor: [aggregateSupplyByServiceArea, supplyRange],
          getText: [aggregateSupplyByServiceArea, aggregateDemandByServiceArea],
        },
      }),
  ].filter(
    (layer) =>
      layer !== false && layer !== null && layer !== "" && layer !== undefined
  );

  // Tooltip
  const renderTooltip = () => {
    if (!hoveredObject) {
      return null;
    }

    // Determine tooltip content based on hovered object type
    let content = "";
    if ("h3Index" in hoveredObject) {
      if ("optimality_ratio" in hoveredObject) {
        // Allocation hexagon
        const optimality = hoveredObject.optimality_ratio;
        let status = "";
        let colorClass = "";
        let percentMet = (optimality * 100).toFixed(1);

        if (optimality >= 1.0) {
          status = "Fully met";
          colorClass = "text-green-500 font-semibold";
          percentMet = "100";
        } else if (optimality >= 0.75) {
          status = "Mostly met";
          colorClass = "text-yellow-500 font-semibold";
        } else if (optimality >= 0.5) {
          status = "Partially met";
          colorClass = "text-orange-500 font-semibold";
        } else if (optimality >= 0.25) {
          status = "Under-allocated";
          colorClass = "text-red-500 font-semibold";
        } else {
          status = "Severely under-allocated";
          colorClass = "text-red-700 font-semibold";
        }

        const unmetDemand =
          hoveredObject.demand_mbps - hoveredObject.allocated_mbps;

        content = `
          <div>
            <div class="text-lg mb-1"><strong>Allocation Status</strong></div>
            <div><strong>Service Area:</strong> ${
              hoveredObject.service_area
            }</div>
            <div><strong>Status:</strong> <span class="${colorClass}">${status}</span></div>
            <div><strong>Demand:</strong> ${hoveredObject.demand_mbps.toFixed(
              2
            )} Mbps</div>
            <div><strong>Allocated:</strong> ${hoveredObject.allocated_mbps.toFixed(
              2
            )} Mbps</div>
            <div><strong>Unmet Demand:</strong> ${unmetDemand.toFixed(
              2
            )} Mbps</div>
            <div><strong>Demand Met:</strong> <span class="${colorClass}">${percentMet}%</span></div>
            <div><strong>Entities:</strong> ${hoveredObject.count}</div>
            <div class="text-xs mt-1 opacity-75">${
              optimality < 1.0
                ? "Height indicates severity of unmet demand"
                : "Demand fully satisfied by allocation"
            }</div>
          </div>
        `;
      } else if ("demand_mbps" in hoveredObject) {
        // Demand hexagon
        content = `
          <div>
            <div><strong>Demand:</strong> ${hoveredObject.demand_mbps.toFixed(
              2
            )} Mbps</div>
            <div><strong>Service Area:</strong> ${
              hoveredObject.service_area
            }</div>
            <div><strong>Entities:</strong> ${hoveredObject.count}</div>
          </div>
        `;
      }
    } else if ("properties" in hoveredObject) {
      if ("satellite_id" in hoveredObject.properties) {
        // Coverage polygon
        content = `
          <div>
            <div><strong>Satellite:</strong> ${hoveredObject.properties.satellite_id}</div>
            <div><strong>Service Area:</strong> ${hoveredObject.properties.service_area}</div>
          </div>
        `;
      } else if ("service_area_id" in hoveredObject.properties) {
        // Service Area polygon
        const serviceAreaId = hoveredObject.properties.service_area_id;
        const supply = aggregateSupplyByServiceArea[serviceAreaId] || 0;
        const demand = aggregateDemandByServiceArea[serviceAreaId] || 0;
        const difference = supply - demand;
        const hasBothSupplyAndDemand =
          dataConfig.projection_id &&
          dataConfig.forecast_id &&
          supply > 0 &&
          demand > 0;

        if (hasBothSupplyAndDemand) {
          // Show demand vs supply info
          content = `
            <div>
              <div><strong>Service Area ID:</strong> ${serviceAreaId}</div>
              <div><strong>Supply:</strong> ${supply.toFixed(0)} Mbps</div>
              <div><strong>Demand:</strong> ${demand.toFixed(0)} Mbps</div>
              <div><strong>Difference:</strong> <span class="${
                difference < 0 ? "text-red-500" : "text-green-500"
              }">${difference < 0 ? "" : "+"}${difference.toFixed(
            0
          )} Mbps</span></div>
              <div class="text-xs mt-1 text-gray-300">${
                difference < 0
                  ? "Demand exceeds available supply"
                  : "Supply meets or exceeds demand"
              }</div>
            </div>
          `;
        } else if (dataConfig.projection_id && supply > 0) {
          // Show detailed supply information if we have supply data
          content = `
            <div>
              <div><strong>Service Area ID:</strong> ${serviceAreaId}</div>
              <div><strong>Total Supply:</strong> ${supply.toFixed(
                0
              )} Mbps</div>
              <div><strong>Projection:</strong> ${
                dataConfig.projection_id
              }</div>
              <div class="text-xs mt-1 text-gray-300">Supply represents total satellite capacity allocated to this service area</div>
            </div>
          `;
        } else {
          // Basic information without supply data
          content = `
            <div>
              <div><strong>Service Area ID:</strong> ${serviceAreaId}</div>
              <div class="text-xs mt-1 text-gray-300">Select a projection to see supply data</div>
            </div>
          `;
        }
      }
    }

    return (
      <div
        className='absolute z-10 pointer-events-none p-2 rounded-md bg-black/80 text-white text-xs max-w-xs'
        style={{
          left: pointerPosition.x,
          top: pointerPosition.y,
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  };

  return (
    <div className='relative w-full h-full'>
      <div
        ref={mapContainer}
        style={{ position: "absolute", width: "100%", height: "100%" }}
      />
      <DeckGL
        ref={deckRef}
        viewState={viewState}
        controller={true}
        onViewStateChange={({ viewState }) => {
          setViewState(viewState as ViewState);
        }}
        layers={layers}
      />
      {renderTooltip()}
    </div>
  );
};

export default SatelliteMap;
