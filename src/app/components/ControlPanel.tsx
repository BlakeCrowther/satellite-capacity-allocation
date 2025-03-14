"use client";

import { DataConfig, Experiment } from "../data/models/types";
import React, { useEffect, useRef, useState } from "react";

import { SATELLITE_COLORS } from "../utils/layerUtils";
import { dataService } from "../data/services/DataService";

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
  h3Resolution?: number;
  setH3Resolution?: (resolution: number) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  dataConfig,
  setDataConfig,
  layerVisibility,
  setLayerVisibility,
  viewState = { pitch: 45, elevationScale: 5 },
  setViewState = () => {},
  h3Resolution = 3,
  setH3Resolution = () => {},
}) => {
  // State for experiments
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [currentExperiment, setCurrentExperiment] = useState<
    string | undefined
  >(dataConfig.experiment_id);

  // State for time animation
  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef<number | null>(null);
  const MAX_EPOCH = 23; // Maximum epoch value (23 hours)
  const currentEpochRef = useRef<number | undefined>(dataConfig.epoch);

  // Keep the ref updated with the latest epoch value
  useEffect(() => {
    currentEpochRef.current = dataConfig.epoch;
  }, [dataConfig.epoch]);

  // Function to animate through time periods
  const animateTimePeriods = () => {
    // Use the ref value to ensure we have the most current epoch
    const currentEpoch = currentEpochRef.current;

    if (currentEpoch === undefined) {
      // If "All time periods" is selected, start from hour 0
      setDataConfig({
        ...dataConfig,
        epoch: 0,
      });
    } else if (currentEpoch >= MAX_EPOCH) {
      // If at the last hour, go back to the beginning
      setDataConfig({
        ...dataConfig,
        epoch: 0,
      });
    } else {
      // Advance to next hour
      setDataConfig({
        ...dataConfig,
        epoch: currentEpoch + 1,
      });
    }
  };

  // Toggle play/pause for time animation
  const togglePlay = () => {
    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);

    if (newIsPlaying) {
      // Clear any existing interval just to be safe
      if (animationRef.current !== null) {
        clearInterval(animationRef.current);
      }

      // Start animation - advance every 1 second
      animationRef.current = window.setInterval(animateTimePeriods, 1000);
    } else if (animationRef.current !== null) {
      // Stop animation
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
  };

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        clearInterval(animationRef.current);
      }
    };
  }, []);

  // Load experiments
  useEffect(() => {
    const loadExperiments = async () => {
      try {
        const data = await dataService.getExperiments();
        setExperiments(data);
      } catch (error) {
        console.error("Error loading experiments:", error);
      }
    };

    loadExperiments();
  }, []);

  // Handle experiment selection
  const handleExperimentChange = (experimentId: string) => {
    // Find the selected experiment
    const experiment = experiments.find((exp) => exp.id === experimentId);

    if (experiment) {
      // Update data config with the experiment settings
      setDataConfig({
        ...dataConfig,
        experiment_id: experimentId,
        forecast_id: experiment.forecast_id,
        projection_id: experiment.projection_id,
        epoch: experiment.epoch,
      });

      // Remove automatic enabling of supply layer
      setCurrentExperiment(experimentId);
    } else if (experimentId === "") {
      // Clear experiment selection
      setDataConfig({
        ...dataConfig,
        experiment_id: undefined,
      });
      setCurrentExperiment(undefined);
    }
  };

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

  // Time epoch selection with all 24 hours (0-23) from the demand data
  const timeEpochs = [
    { epoch: 0, name: "12:00 AM (Hour 0)" },
    { epoch: 1, name: "1:00 AM (Hour 1)" },
    { epoch: 2, name: "2:00 AM (Hour 2)" },
    { epoch: 3, name: "3:00 AM (Hour 3)" },
    { epoch: 4, name: "4:00 AM (Hour 4)" },
    { epoch: 5, name: "5:00 AM (Hour 5)" },
    { epoch: 6, name: "6:00 AM (Hour 6)" },
    { epoch: 7, name: "7:00 AM (Hour 7)" },
    { epoch: 8, name: "8:00 AM (Hour 8)" },
    { epoch: 9, name: "9:00 AM (Hour 9)" },
    { epoch: 10, name: "10:00 AM (Hour 10)" },
    { epoch: 11, name: "11:00 AM (Hour 11)" },
    { epoch: 12, name: "12:00 PM (Hour 12)" },
    { epoch: 13, name: "1:00 PM (Hour 13)" },
    { epoch: 14, name: "2:00 PM (Hour 14)" },
    { epoch: 15, name: "3:00 PM (Hour 15)" },
    { epoch: 16, name: "4:00 PM (Hour 16)" },
    { epoch: 17, name: "5:00 PM (Hour 17)" },
    { epoch: 18, name: "6:00 PM (Hour 18)" },
    { epoch: 19, name: "7:00 PM (Hour 19)" },
    { epoch: 20, name: "8:00 PM (Hour 20)" },
    { epoch: 21, name: "9:00 PM (Hour 21)" },
    { epoch: 22, name: "10:00 PM (Hour 22)" },
    { epoch: 23, name: "11:00 PM (Hour 23)" },
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
      <h2 className='mt-0 mb-3 text-slate-800 text-lg font-semibold'>
        Satellite Network Visualization
      </h2>

      {/* Experiment Selection */}
      <div className='mb-4 pb-2 border-b border-gray-200'>
        <h3 className='font-semibold mb-2 text-slate-700 text-base font-medium'>
          Experiment
        </h3>
        <div className='mb-3'>
          <select
            className='w-full px-2 py-1 border border-gray-300 rounded-md bg-white text-slate-800 font-medium'
            value={currentExperiment || ""}
            onChange={(e) => handleExperimentChange(e.target.value)}
          >
            <option value=''>Select Experiment</option>
            {experiments.map((experiment) => (
              <option key={experiment.id} value={experiment.id}>
                {experiment.name}
              </option>
            ))}
          </select>
          {currentExperiment && (
            <div className='mt-2 text-xs text-slate-600'>
              {
                experiments.find((exp) => exp.id === currentExperiment)
                  ?.description
              }
            </div>
          )}
        </div>
      </div>

      <div className='mb-4 pb-2 border-b border-gray-200'>
        <h3 className='font-semibold mt-4 mb-2 text-slate-700 text-base font-medium'>
          Data Configuration
        </h3>

        <div className='flex justify-between items-center mb-2'>
          <label className='mr-2 text-slate-700 flex-1'>Demand Forecast:</label>
          <select
            className='flex-1 px-2 py-1 border border-gray-300 rounded-md bg-white text-slate-800 font-medium'
            value={dataConfig.forecast_id || ""}
            onChange={(e) =>
              setDataConfig({
                ...dataConfig,
                forecast_id: e.target.value || undefined,
                experiment_id: undefined, // Clear experiment when manually changing settings
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
          <label className='mr-2 text-slate-700 flex-1'>
            Supply Projection:
          </label>
          <select
            className='flex-1 px-2 py-1 border border-gray-300 rounded-md bg-white text-slate-800 font-medium'
            value={dataConfig.projection_id || ""}
            onChange={(e) =>
              setDataConfig({
                ...dataConfig,
                projection_id: e.target.value || undefined,
                experiment_id: undefined, // Clear experiment when manually changing settings
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

        <div className='mb-4'>
          <div className='flex justify-between items-center mb-1'>
            <label className='mr-2 text-slate-700 flex-1'>Time Period:</label>
            <div className='flex items-center'>
              <input
                id='all-time-periods'
                type='checkbox'
                className='mr-1'
                checked={dataConfig.epoch === undefined}
                onChange={(e) => {
                  if (e.target.checked) {
                    // Select "All time periods"
                    setDataConfig({
                      ...dataConfig,
                      epoch: undefined,
                      experiment_id: undefined, // Clear experiment when changing settings
                    });

                    // Stop animation if running
                    if (isPlaying) {
                      togglePlay();
                    }
                  } else {
                    // Select current slider position (default to 0)
                    setDataConfig({
                      ...dataConfig,
                      epoch: 0,
                      experiment_id: undefined, // Clear experiment when changing settings
                    });
                  }
                }}
              />
              <label
                htmlFor='all-time-periods'
                className='text-sm text-slate-600'
              >
                All time periods
              </label>
            </div>
          </div>

          <div className='relative px-1 py-2'>
            {/* Time ticks */}
            <div className='flex justify-between mb-1 text-xs text-slate-400 px-0.5 absolute w-full top-0 left-0 pointer-events-none'>
              {[...Array(25)].map((_, i) => (
                <span
                  key={i}
                  className='h-2 border-l border-slate-300'
                  style={{ height: i % 6 === 0 ? "8px" : "4px" }}
                ></span>
              ))}
            </div>

            <input
              type='range'
              min='0'
              max='23'
              step='1'
              value={dataConfig.epoch !== undefined ? dataConfig.epoch : 0}
              onChange={(e) => {
                const epochValue = parseInt(e.target.value);
                setDataConfig({
                  ...dataConfig,
                  epoch: epochValue,
                  experiment_id: undefined, // Clear experiment when changing settings
                });
              }}
              disabled={dataConfig.epoch === undefined}
              className={`w-full accent-blue-500 ${
                dataConfig.epoch === undefined ? "opacity-50" : ""
              }`}
            />

            {/* Time labels */}
            <div className='flex justify-between mt-1 text-xs text-slate-500 px-0.5'>
              <span>12AM</span>
              <span>6AM</span>
              <span>12PM</span>
              <span>6PM</span>
              <span>12AM</span>
            </div>
          </div>

          {/* Control row */}
          <div className='flex items-center justify-between mt-2'>
            {/* Currently selected time */}
            <div className='text-sm font-medium text-blue-600 flex-grow'>
              {dataConfig.epoch !== undefined
                ? timeEpochs.find((t) => t.epoch === dataConfig.epoch)?.name
                : "All time periods"}
            </div>

            {/* Play/Pause button */}
            <button
              onClick={togglePlay}
              disabled={dataConfig.epoch === undefined}
              className={`px-2 py-1 rounded text-xs flex items-center ${
                dataConfig.epoch === undefined
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {isPlaying ? <span>⏸ Pause</span> : <span>▶️ Play</span>}
            </button>
          </div>
        </div>
      </div>

      <div className='mb-4 pb-2 border-b border-gray-200'>
        <h3 className='font-semibold mt-4 mb-2 text-slate-700 text-base font-medium'>
          Layer Visibility
        </h3>

        <div className='flex items-center mb-2'>
          <input
            className='mr-2'
            type='checkbox'
            id='demand-layer'
            checked={layerVisibility.demand}
            onChange={(e) => {
              const isChecked = e.target.checked;
              setLayerVisibility({
                ...layerVisibility,
                demand: isChecked,
                // Disable allocation when demand is enabled
                allocation: isChecked ? false : layerVisibility.allocation,
              });
            }}
          />
          <label className='text-slate-600' htmlFor='demand-layer'>
            Demand Heatmap
          </label>
        </div>

        {/* Demand color scale */}
        {layerVisibility.demand && (
          <div className='ml-5 mt-1 mb-3 text-xs'>
            <div className='mb-1 text-slate-700'>Demand Intensity:</div>
            <div className='flex items-center'>
              <div className='w-full h-3 bg-gradient-to-r from-[rgb(65,182,196)] via-[rgb(254,178,76)] to-[rgb(252,78,42)] rounded'></div>
            </div>
            <div className='flex justify-between text-slate-600 mt-1'>
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        )}

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

        {/* Supply Capacity Legend - shown when supply layer is active */}
        {layerVisibility.supply && (
          <div className='ml-5 mt-1 mb-3 text-xs'>
            <div className='mb-1 text-slate-700'>Supply Capacity:</div>
            <div className='flex items-center'>
              <div className='w-full h-3 bg-gradient-to-r from-blue-200/20 to-blue-500/80 rounded'></div>
            </div>
            <div className='flex justify-between text-slate-600 mt-1'>
              <span>Low</span>
              <span>High</span>
            </div>
            <div className='text-slate-500 mt-1 text-xs'>
              Opacity indicates available capacity
            </div>
          </div>
        )}

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
            onChange={(e) => {
              const isChecked = e.target.checked;
              setLayerVisibility({
                ...layerVisibility,
                allocation: isChecked,
                // Disable demand when allocation is enabled
                demand: isChecked ? false : layerVisibility.demand,
              });
            }}
          />
          <label className='text-slate-600' htmlFor='allocation-layer'>
            Allocations
          </label>
        </div>

        {/* Allocation color scale - shown when allocation layer is active */}
        {layerVisibility.allocation && (
          <div className='ml-5 mt-1 mb-3 text-xs'>
            <div className='mb-1 text-slate-700'>Allocation Optimality:</div>
            <div className='flex items-center'>
              <div className='w-full h-3 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded'></div>
            </div>
            <div className='flex justify-between text-slate-600 mt-1'>
              <span>Unmet</span>
              <span>Partially met</span>
              <span>Met</span>
            </div>
            <div className='text-slate-500 mt-1 text-xs'>
              Shows how well demand is met by allocations
            </div>
          </div>
        )}
      </div>

      {/* 3D View Controls */}
      <div className='mb-4 pb-2 border-b border-gray-200'>
        <h3 className='mt-4 mb-2 text-slate-700 text-base font-medium'>
          3D View Controls
        </h3>

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
            className='w-full accent-blue-500'
          />
        </div>

        <div className='mb-2'>
          <label className='block text-slate-700 font-medium mb-1 text-xs'>
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
            className='w-full accent-blue-500'
          />
        </div>

        <div className='mb-2'>
          <label className='block text-slate-700 font-medium mb-1 text-xs'>
            H3 Resolution: {h3Resolution}{" "}
            {h3Resolution <= 3
              ? "(coarse)"
              : h3Resolution >= 6
              ? "(fine)"
              : "(medium)"}
          </label>
          <input
            type='range'
            min='2'
            max='7'
            step='1'
            value={h3Resolution}
            onChange={(e) => setH3Resolution(parseInt(e.target.value))}
            className='w-full accent-blue-500'
            title={`Hexagon grid resolution: ${h3Resolution}`}
          />
          <div className='flex justify-between text-slate-500 text-xs mt-1'>
            <span>Larger cells</span>
            <span>Smaller cells</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
