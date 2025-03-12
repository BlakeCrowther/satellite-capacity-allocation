"use client";

import {
  AggregatedDemand,
  DataConfig,
  DemandEntity,
  SatelliteCoverage,
  SupplyProjection,
  ViewState,
} from "../data/models/types";
import {
  DEFAULT_H3_RESOLUTION,
  aggregateDemandToH3,
  getDemandRange,
} from "../utils/h3Utils";
import {
  DEMAND_COLOR_RANGE,
  createColorScale,
  createElevationScale,
  getSatelliteColor,
} from "../utils/layerUtils";
import { Feature, GeoJsonProperties, Geometry } from "geojson";
import React, { useEffect, useMemo, useRef, useState } from "react";

import DeckGL from "@deck.gl/react";
import { GeoJsonLayer } from "@deck.gl/layers";
import { H3HexagonLayer } from "@deck.gl/geo-layers";
import { Map as MaplibreMap } from "maplibre-gl";
import { dataService } from "../data/services/DataService";

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

// Default map view state
const DEFAULT_VIEW_STATE: ViewState = {
  longitude: 0,
  latitude: 20,
  zoom: 1.5,
  pitch: 45,
  bearing: 0,
};

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
}

// Define hover info type
interface HoverInfo {
  x: number;
  y: number;
  object?:
    | AggregatedDemand
    | { properties: { satellite_id: string; service_area: string } }
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
  viewState3D = { pitch: 45, elevationScale: 5 },
  // We're not using setViewState3D in this component but keeping it for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setViewState3D = () => {},
}) => {
  // State
  const [viewState, setViewState] = useState<ViewState>({
    ...DEFAULT_VIEW_STATE,
    pitch: viewState3D.pitch,
  });
  const [demandData, setDemandData] = useState<DemandEntity[]>([]);
  // Keeping supplyData for future supply layer implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [supplyData, setSupplyData] = useState<SupplyProjection[]>([]);
  const [coverageData, setCoverageData] = useState<SatelliteCoverage[]>([]);
  const [hoveredObject, setHoveredObject] = useState<
    | AggregatedDemand
    | { properties: { satellite_id: string; service_area: string } }
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
    };

    fetchData();
  }, [dataConfig]);

  // Initialize MapLibre map
  useEffect(() => {
    if (!mapContainer.current) return;

    if (!mapRef.current) {
      const map = new MaplibreMap({
        container: mapContainer.current,
        style: "https://demotiles.maplibre.org/style.json",
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
    return aggregateDemandToH3(demandData, DEFAULT_H3_RESOLUTION);
  }, [demandData]);

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
      new H3HexagonLayer<AggregatedDemand>({
        id: "demand-layer",
        data: aggregatedDemand,
        pickable: true,
        wireframe: false,
        filled: true,
        extruded: true,
        elevationScale: viewState3D.elevationScale,
        getHexagon: (d: AggregatedDemand) => d.h3Index,
        getFillColor: (d: AggregatedDemand) =>
          demandColorScale(d.demand_mbps) as [number, number, number],
        getElevation: (d: AggregatedDemand) =>
          demandElevationScale(d.demand_mbps),
        opacity: 0.8,
        updateTriggers: {
          getFillColor: [demandRange],
          getElevation: [demandRange, viewState3D.elevationScale],
        },
        onHover,
      }),
  ].filter(Boolean);

  // Tooltip
  const renderTooltip = () => {
    if (!hoveredObject) {
      return null;
    }

    // Determine tooltip content based on hovered object type
    let content = "";
    if ("h3Index" in hoveredObject) {
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
    } else if ("properties" in hoveredObject) {
      // Coverage polygon
      content = `
        <div>
          <div><strong>Satellite:</strong> ${hoveredObject.properties.satellite_id}</div>
          <div><strong>Service Area:</strong> ${hoveredObject.properties.service_area}</div>
        </div>
      `;
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
        onViewStateChange={({ viewState }) =>
          setViewState(viewState as ViewState)
        }
        layers={layers}
        getTooltip={({ object }) => object && Object.keys(object).join(", ")}
      />
      {renderTooltip()}
    </div>
  );
};

export default SatelliteMap;
