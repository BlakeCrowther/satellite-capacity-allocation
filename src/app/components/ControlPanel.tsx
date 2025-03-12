"use client";

import { DataConfig } from "../data/models/types";
import React from "react";
import { SATELLITE_COLORS } from "../utils/layerUtils";

interface ControlPanelProps {
  dataConfig: DataConfig;
  setDataConfig: (config: DataConfig) => void;
  layerVisibility: {
    demand: boolean;
    supply: boolean;
    coverage: boolean;
    allocation: boolean;
  };
  setLayerVisibility: (visibility: {
    demand: boolean;
    supply: boolean;
    coverage: boolean;
    allocation: boolean;
  }) => void;
  viewState?: {
    pitch: number;
    elevationScale: number;
  };
  setViewState?: (state: { pitch: number; elevationScale: number }) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  dataConfig,
  setDataConfig,
  layerVisibility,
  setLayerVisibility,
  viewState = { pitch: 45, elevationScale: 5 },
  setViewState = () => {},
}) => {
  // Available forecasts and projections for selection
  const forecasts = [
    { id: "base_forecast", name: "Baseline Forecast" },
    { id: "peak_forecast", name: "Peak Demand Forecast" },
  ];

  const projections = [
    { id: "baseline", name: "Baseline Capacity" },
    { id: "optimized", name: "Optimized Capacity" },
  ];

  // Satellite options
  const satellites = [
    { id: "USA-SAT", name: "USA-SAT" },
    { id: "NA-SAT", name: "NA-SAT" },
    { id: "EU-SAT", name: "EU-SAT" },
  ];

  // Time epoch selection (simplified to just a few options)
  const timeEpochs = [
    { epoch: 0, name: "Hour 0" },
    { epoch: 1, name: "Hour 1" },
  ];

  // Handle satellite selection
  const handleSatelliteToggle = (satelliteId: string) => {
    const currentSelection = dataConfig.selected_satellites || [];
    const isSelected = currentSelection.includes(satelliteId);

    let newSelection: string[];
    if (isSelected) {
      // Remove if already selected
      newSelection = currentSelection.filter((id) => id !== satelliteId);
    } else {
      // Add if not selected
      newSelection = [...currentSelection, satelliteId];
    }

    setDataConfig({
      ...dataConfig,
      selected_satellites: newSelection,
    });
  };

  return (
    <div className='absolute top-3 right-3 p-3 max-w-xs bg-white/90 rounded-lg shadow-md text-sm z-10 max-h-[calc(100vh-2rem)] overflow-y-auto'>
      <h3 className='mt-0 mb-3 text-slate-800 text-base font-semibold'>
        Satellite Network Visualization
      </h3>

      <div className='mb-4 pb-2 border-b border-gray-200'>
        <h4 className='mt-4 mb-2 text-slate-700 text-sm font-medium'>
          Data Configuration
        </h4>

        <div className='flex justify-between items-center mb-2'>
          <label className='font-medium mr-2 text-slate-600 flex-1'>
            Demand Forecast:
          </label>
          <select
            className='flex-1 px-2 py-1 border border-gray-300 rounded-md bg-white'
            value={dataConfig.forecast_id || ""}
            onChange={(e) =>
              setDataConfig({
                ...dataConfig,
                forecast_id: e.target.value || undefined,
              })
            }
          >
            <option value=''>Select Forecast</option>
            {forecasts.map((forecast) => (
              <option key={forecast.id} value={forecast.id}>
                {forecast.name}
              </option>
            ))}
          </select>
        </div>

        <div className='flex justify-between items-center mb-2'>
          <label className='font-medium mr-2 text-slate-600 flex-1'>
            Capacity Projection:
          </label>
          <select
            className='flex-1 px-2 py-1 border border-gray-300 rounded-md bg-white'
            value={dataConfig.projection_id || ""}
            onChange={(e) =>
              setDataConfig({
                ...dataConfig,
                projection_id: e.target.value || undefined,
              })
            }
          >
            <option value=''>Select Projection</option>
            {projections.map((projection) => (
              <option key={projection.id} value={projection.id}>
                {projection.name}
              </option>
            ))}
          </select>
        </div>

        <div className='flex justify-between items-center mb-2'>
          <label className='font-medium mr-2 text-slate-600 flex-1'>
            Time Period:
          </label>
          <select
            className='flex-1 px-2 py-1 border border-gray-300 rounded-md bg-white'
            value={
              dataConfig.epoch !== undefined ? dataConfig.epoch.toString() : ""
            }
            onChange={(e) =>
              setDataConfig({
                ...dataConfig,
                epoch: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
          >
            <option value=''>All Time Periods</option>
            {timeEpochs.map((time) => (
              <option key={time.epoch} value={time.epoch}>
                {time.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className='mb-4 pb-2 border-b border-gray-200'>
        <h4 className='mt-4 mb-2 text-slate-700 text-sm font-medium'>
          Layer Visibility
        </h4>

        <div className='flex items-center mb-2'>
          <input
            className='mr-2'
            type='checkbox'
            id='demand-layer'
            checked={layerVisibility.demand}
            onChange={(e) =>
              setLayerVisibility({
                ...layerVisibility,
                demand: e.target.checked,
              })
            }
          />
          <label className='text-slate-600' htmlFor='demand-layer'>
            Demand Heatmap
          </label>
        </div>

        <div className='flex items-center mb-2'>
          <input
            className='mr-2'
            type='checkbox'
            id='supply-layer'
            checked={layerVisibility.supply}
            onChange={(e) =>
              setLayerVisibility({
                ...layerVisibility,
                supply: e.target.checked,
              })
            }
          />
          <label className='text-slate-600' htmlFor='supply-layer'>
            Supply Configuration
          </label>
        </div>

        <div className='flex items-center mb-2'>
          <input
            className='mr-2'
            type='checkbox'
            id='coverage-layer'
            checked={layerVisibility.coverage}
            onChange={(e) => {
              // When turning on coverage and no satellites are selected, select all
              if (
                e.target.checked &&
                (!dataConfig.selected_satellites ||
                  dataConfig.selected_satellites.length === 0)
              ) {
                setDataConfig({
                  ...dataConfig,
                  selected_satellites: satellites.map((sat) => sat.id),
                });
              }

              setLayerVisibility({
                ...layerVisibility,
                coverage: e.target.checked,
              });
            }}
          />
          <label className='text-slate-600' htmlFor='coverage-layer'>
            Satellite Coverage
          </label>
        </div>

        {/* Satellite selection section (only show when coverage is enabled) */}
        {layerVisibility.coverage && (
          <div className='pl-6 mt-1 mb-2 border-l-2 border-slate-200'>
            <div className='text-xs text-slate-500 mb-1'>
              Select satellites:
            </div>
            {satellites.map((satellite) => {
              const satelliteColor = SATELLITE_COLORS[satellite.id];
              return (
                <div key={satellite.id} className='flex items-center mb-1'>
                  <input
                    className='mr-2'
                    type='checkbox'
                    id={`satellite-${satellite.id}`}
                    checked={(dataConfig.selected_satellites || []).includes(
                      satellite.id
                    )}
                    onChange={() => handleSatelliteToggle(satellite.id)}
                  />
                  <div
                    className='w-3 h-3 mr-1.5 rounded-full'
                    style={{
                      backgroundColor: `rgb(${satelliteColor.join(",")})`,
                    }}
                  />
                  <label
                    className='text-xs text-slate-600'
                    htmlFor={`satellite-${satellite.id}`}
                  >
                    {satellite.name}
                  </label>
                </div>
              );
            })}
          </div>
        )}

        <div className='flex items-center mb-2'>
          <input
            className='mr-2'
            type='checkbox'
            id='allocation-layer'
            checked={layerVisibility.allocation}
            onChange={(e) =>
              setLayerVisibility({
                ...layerVisibility,
                allocation: e.target.checked,
              })
            }
          />
          <label className='text-slate-600' htmlFor='allocation-layer'>
            Allocations
          </label>
        </div>
      </div>

      <div className='mb-4'>
        <h4 className='mt-4 mb-2 text-slate-700 text-sm font-medium'>Legend</h4>
        <div className='mt-2'>
          <div className='flex items-center mb-1'>
            <div className='w-5 h-5 mr-2 rounded bg-[rgb(65,182,196)]'></div>
            <span className='text-slate-600'>Low Demand</span>
          </div>
          <div className='flex items-center mb-1'>
            <div className='w-5 h-5 mr-2 rounded bg-[rgb(254,178,76)]'></div>
            <span className='text-slate-600'>Medium Demand</span>
          </div>
          <div className='flex items-center mb-1'>
            <div className='w-5 h-5 mr-2 rounded bg-[rgb(252,78,42)]'></div>
            <span className='text-slate-600'>High Demand</span>
          </div>
        </div>
      </div>

      {/* 3D View Controls */}
      <div className='mb-4 pb-2 border-b border-gray-200'>
        <h4 className='mt-4 mb-2 text-slate-700 text-sm font-medium'>
          3D View Controls
        </h4>

        <div className='mb-3'>
          <label className='block text-slate-600 mb-1 text-xs'>
            Map Tilt (Pitch): {viewState.pitch}°
          </label>
          <input
            type='range'
            min='0'
            max='60'
            value={viewState.pitch}
            onChange={(e) =>
              setViewState({
                ...viewState,
                pitch: parseInt(e.target.value),
              })
            }
            className='w-full'
          />
        </div>

        <div className='mb-2'>
          <label className='block text-slate-600 mb-1 text-xs'>
            Height Scale: {viewState.elevationScale}x
          </label>
          <input
            type='range'
            min='1'
            max='20'
            value={viewState.elevationScale}
            onChange={(e) =>
              setViewState({
                ...viewState,
                elevationScale: parseInt(e.target.value),
              })
            }
            className='w-full'
          />
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
