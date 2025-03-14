import { ViewState } from "../data/models/types";

// Default H3 resolution for demand aggregation
export const DEFAULT_H3_RESOLUTION = 3;


// Default map view state that will be shared across components
export const DEFAULT_VIEW_STATE: ViewState = {
  longitude: -40,
  latitude: 25,
  zoom: 2.5,
  pitch: 0,
  bearing: 0,
};

// Default 3D view settings
export const DEFAULT_VIEW_STATE_3D = {
  pitch: 30,
  elevationScale: 15,
}; 