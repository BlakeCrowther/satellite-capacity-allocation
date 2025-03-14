#!/usr/bin/env python3
import json
import random
import uuid
import math
import shapely.geometry as sg
from pathlib import Path
from datetime import datetime, timedelta

# Regions to generate demand points - renamed to avoid confusion
# These are geographical regions, not service areas
GEOGRAPHICAL_REGIONS = {
    "AMERICAS": [
        # USA region
        {
            "min_lon": -125,
            "max_lon": -66,
            "min_lat": 24,
            "max_lat": 49,
            "point_count": 100,  # Number of demand points to generate in this region
            "base_demand": 20,  # Base demand in Mbps
        },
        # Caribbean region
        {
            "min_lon": -90,
            "max_lon": -60,
            "min_lat": 8,
            "max_lat": 25,
            "point_count": 40,
            "base_demand": 15,
        },
        # Atlantic bridge
        {
            "min_lon": -60,
            "max_lon": -30,
            "min_lat": 20,
            "max_lat": 45,
            "point_count": 20,
            "base_demand": 10,
        },
    ],
    "EUROPE": [
        # Western Europe
        {
            "min_lon": -10,
            "max_lon": 15,
            "min_lat": 35,
            "max_lat": 60,
            "point_count": 80,
            "base_demand": 18,
        },
        # Eastern Europe
        {
            "min_lon": 15,
            "max_lon": 30,
            "min_lat": 35,
            "max_lat": 60,
            "point_count": 60,
            "base_demand": 15,
        },
        # Atlantic bridge (EU side)
        {
            "min_lon": -30,
            "max_lon": -10,
            "min_lat": 35,
            "max_lat": 55,
            "point_count": 20,
            "base_demand": 8,
        },
    ],
}


def load_service_areas(data_dir):
    """Load service areas from JSON file"""
    service_areas_file = data_dir / "service_areas.json"

    if not service_areas_file.exists():
        print(f"Warning: Service areas file not found at {service_areas_file}")
        return []

    with open(service_areas_file, "r") as f:
        return json.load(f)


def get_service_area_for_point(service_areas, lon, lat):
    """Find which service area a point belongs to"""
    point = sg.Point(lon, lat)

    for area in service_areas:
        # Create a shapely polygon from the coordinates
        coords = area["geom"]["coordinates"][0]
        polygon = sg.Polygon(coords)

        if polygon.contains(point):
            return area["service_area_id"]

    # If point is not in any service area, return the ID of the closest one
    min_distance = float("inf")
    closest_area_id = None

    for area in service_areas:
        coords = area["geom"]["coordinates"][0]
        polygon = sg.Polygon(coords)

        distance = polygon.exterior.distance(point)
        if distance < min_distance:
            min_distance = distance
            closest_area_id = area["service_area_id"]

    return closest_area_id


# Generate demand data for a specific forecast type
def generate_demand_data(forecast_id, service_areas, hours=24):
    demand_data = []

    # Generate a timestamp for each hour
    start_time = datetime.now()
    timestamps = [(start_time + timedelta(hours=h)).isoformat() for h in range(hours)]

    # Generate demand points for each region
    for region_name, regions in GEOGRAPHICAL_REGIONS.items():
        for region in regions:
            for _ in range(region["point_count"]):
                # Generate a random location within the region
                lon = random.uniform(region["min_lon"], region["max_lon"])
                lat = random.uniform(region["min_lat"], region["max_lat"])

                # Find the service area this point belongs to
                service_area_id = get_service_area_for_point(service_areas, lon, lat)

                # Skip if no service area found (should not happen with closest service area fallback)
                if not service_area_id:
                    continue

                # Generate a unique entity ID
                entity_id = str(uuid.uuid4())[:8]

                # For each hour, generate a demand point
                for epoch, timestamp in enumerate(timestamps):
                    # Base demand varies by time of day (simulate a daily pattern)
                    time_factor = 0.5 + 0.5 * (1 + math.sin(epoch * math.pi / 12)) / 2

                    # Apply forecast type modifier
                    if forecast_id == "base_forecast":
                        forecast_modifier = 1.0
                    elif forecast_id == "peak_forecast":
                        forecast_modifier = random.uniform(
                            1.3, 1.8
                        )  # 30-80% increase for peak
                    else:
                        forecast_modifier = 1.0

                    # Calculate demand with some randomness
                    demand_mbps = (
                        region["base_demand"]
                        * time_factor
                        * forecast_modifier
                        * random.uniform(0.7, 1.3)
                    )

                    # Add demand point
                    demand_data.append(
                        {
                            "entity_id": entity_id,
                            "lat": lat,
                            "lon": lon,
                            "service_area": service_area_id,
                            "demand_mbps": round(demand_mbps, 2),
                            "epoch": epoch,
                            "timestamp": timestamp,
                            "forecast_id": forecast_id,
                        }
                    )

    return demand_data


# Generate all demand data
def generate_all_demand():
    # Get the project root directory (2 levels up from the script)
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent
    data_dir = project_root / "public" / "data" / "mock"

    # Create directory if it doesn't exist
    data_dir.mkdir(parents=True, exist_ok=True)

    # Load service areas (needed to assign demand points to the right service area)
    service_areas = load_service_areas(data_dir)
    if not service_areas:
        print("Error: Service areas must be generated before demand data")
        print("Please run generate_service_areas.py first")
        return

    forecasts = ["base_forecast", "peak_forecast"]
    all_demand_data = []

    # Generate each forecast type
    for forecast_id in forecasts:
        forecast_data = generate_demand_data(forecast_id, service_areas, hours=24)

        # Write forecast-specific file
        with open(data_dir / f"demand_{forecast_id}.json", "w") as f:
            json.dump(forecast_data, f, indent=2)

        all_demand_data.extend(forecast_data)

    # Write combined demand file
    with open(data_dir / "demand.json", "w") as f:
        json.dump(all_demand_data, f, indent=2)

    print(f"Generated demand data:")
    for forecast_id in forecasts:
        count = len([d for d in all_demand_data if d["forecast_id"] == forecast_id])
        points = count // 24  # Divide by hours to get unique points
        print(f"- {forecast_id}: {points} demand points ({count} records)")
    print(f"- Total demand records: {len(all_demand_data)}")


if __name__ == "__main__":
    generate_all_demand()
