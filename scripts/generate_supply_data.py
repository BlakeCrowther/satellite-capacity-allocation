#!/usr/bin/env python3
import json
import random
from pathlib import Path
from datetime import datetime, timedelta

# Service areas and their satellites
SERVICE_AREAS = {
    "AMERICAS": ["USA-SAT", "NA-SAT"],
    "EUROPE": ["EU-SAT"],
}


# Generate supply projections for a satellite
def generate_supply_projections(
    satellite_id, service_area, projection_id, base_capacity=1000
):
    # Generate a random capacity modifier for the projection
    capacity_modifier = 1.0
    if projection_id == "baseline":
        capacity_modifier = 1.0
    elif projection_id == "optimized":
        capacity_modifier = random.uniform(1.2, 1.5)  # 20-50% increase

    # Calculate the supply capacity for this satellite in this service area
    supply_mbps = int(base_capacity * capacity_modifier * random.uniform(0.8, 1.2))

    # Set projection start and end dates (one week)
    start_date = datetime.now()
    end_date = start_date + timedelta(days=7)

    return {
        "projection_id": projection_id,
        "satellite_id": satellite_id,
        "service_area": service_area,
        "supply_mbps": supply_mbps,
        "projection_start": start_date.isoformat(),
        "projection_end": end_date.isoformat(),
    }


# Generate all supply data
def generate_supply_data():
    # Get the project root directory (2 levels up from the script)
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent
    data_dir = project_root / "public" / "data" / "mock"

    # Create directory if it doesn't exist
    data_dir.mkdir(parents=True, exist_ok=True)

    projections = ["baseline", "optimized"]
    all_supply_data = []

    # Generate supply data for each projection and satellite
    for projection_id in projections:
        projection_data = []

        for service_area, satellites in SERVICE_AREAS.items():
            for satellite_id in satellites:
                # Base capacity varies by satellite
                base_capacity = 0
                if satellite_id == "USA-SAT":
                    base_capacity = 2000  # Higher capacity for USA
                elif satellite_id == "NA-SAT":
                    base_capacity = 1500  # Medium capacity for North America
                elif satellite_id == "EU-SAT":
                    base_capacity = 1200  # Standard capacity for Europe

                projection = generate_supply_projections(
                    satellite_id, service_area, projection_id, base_capacity
                )
                projection_data.append(projection)

        # Write projection-specific file
        with open(data_dir / f"supply_{projection_id}.json", "w") as f:
            json.dump(projection_data, f, indent=2)

        all_supply_data.extend(projection_data)

    # Write combined supply file
    with open(data_dir / "supply.json", "w") as f:
        json.dump(all_supply_data, f, indent=2)

    print(f"Generated supply data:")
    print(f"- Baseline projection: {len(projections[0])} satellites")
    print(f"- Optimized projection: {len(projections[1])} satellites")
    print(f"- Total supply records: {len(all_supply_data)}")


if __name__ == "__main__":
    generate_supply_data()
