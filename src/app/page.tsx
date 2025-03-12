"use client";

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

  // Add state for 3D view controls
  const [viewState3D, setViewState3D] = useState({
    pitch: 45,
    elevationScale: 15,
  });

  return (
    <main className='h-screen w-screen overflow-hidden relative'>
      <SatelliteMap
        dataConfig={dataConfig}
        layerVisibility={layerVisibility}
        viewState3D={viewState3D}
        setViewState3D={setViewState3D}
      />
      <ControlPanel
        dataConfig={dataConfig}
        setDataConfig={setDataConfig}
        layerVisibility={layerVisibility}
        setLayerVisibility={setLayerVisibility}
        viewState={viewState3D}
        setViewState={setViewState3D}
      />
    </main>
  );
}
