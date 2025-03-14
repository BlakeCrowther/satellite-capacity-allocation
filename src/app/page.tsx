"use client";

import {
  DEFAULT_H3_RESOLUTION,
  DEFAULT_VIEW_STATE_3D,
} from "./config/mapConfig";
import React, { useState } from "react";

import ControlPanel from "./components/ControlPanel";
import { DataConfig } from "./data/models/types";
import SatelliteMap from "./components/SatelliteMap";

export default function Home() {
  const [dataConfig, setDataConfig] = useState<DataConfig>({
    forecast_id: "base_forecast",
    projection_id: "baseline",
    epoch: 0,
    selected_satellites: ["USA-SAT", "NA-SAT", "EU-SAT"],
  });

  const [layerVisibility, setLayerVisibility] = useState({
    demand: true,
    supply: false,
    coverage: false,
    allocation: false,
  });

  // Add state for 3D view controls using the shared default
  const [viewState3D, setViewState3D] = useState(DEFAULT_VIEW_STATE_3D);

  // Add state for H3 resolution with default from config
  const [h3Resolution, setH3Resolution] = useState(DEFAULT_H3_RESOLUTION);

  return (
    <main className='h-screen w-screen overflow-hidden relative'>
      <SatelliteMap
        dataConfig={dataConfig}
        layerVisibility={layerVisibility}
        viewState3D={viewState3D}
        setViewState3D={setViewState3D}
        h3Resolution={h3Resolution}
      />
      <ControlPanel
        dataConfig={dataConfig}
        setDataConfig={setDataConfig}
        layerVisibility={layerVisibility}
        setLayerVisibility={setLayerVisibility}
        viewState={viewState3D}
        setViewState={setViewState3D}
        h3Resolution={h3Resolution}
        setH3Resolution={setH3Resolution}
      />
    </main>
  );
}
