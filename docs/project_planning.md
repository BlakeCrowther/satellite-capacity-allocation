# Data Visualization Final Project Planning 

## Motivation

## Datasets & Data Wrangling

## Tasks

## Solutions

## Results

### Demand Data

1 week of data, hourly epochs as rows to start 

- `forecast_id` : different forecasts can represent different forecasts for the same or a different time period.
- `entity_id`: entity id
- `lat`: latitude of the entity
- `lon`: longitude of the entity
- `service_area`: service area entity resides in
- `demand_mbps`: demand in mbps forecasted for the entity
- `epoch` : hour of the forecasted demand since the start of the week
- `timestamp`: timestamp of the forecasted demand

### Supply Data

How much mbps a satellite can provide in a given service area. Lets say this is per week to simplify the relation with demand. 

- `projection_id`: projection id
- `satellite_id`: satellite id
- `service_area`: service area of the satellite
- `supply_mbps`: supply in mbps for the service area
- `projection_start`: start of the projection period
- `projection_end`: end of the projection period

### Satellite Network Coverage

- `satellite_id`: satellite id
- `service_area`: service area the beam is associated with
- `geom`: geometry of the beam contour

### Allocations

- `service_area`: service area the allocation is associated with
- `entity_id`: entity id receiving the allocation
- `lat`: latitude of the entity
- `lon`: longitude of the entity
- `epoch`: hour of the allocation
- `mbps`: mbps allocated to the entity
- `satellite_id`: satellite id providing the allocation