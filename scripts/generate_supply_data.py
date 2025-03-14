#!/usr/bin/env python3
import json
import random
from pathlib import Path
from datetime import datetime, timedelta

# Satellite coverage regions
SATELLITE_COVERAGE = {
    "USA-SAT": {
        "primary_region": [
            -125,
            -70,
            25,
            55,
        ],  # [min_lon, max_lon, min_lat, max_lat] - North America
        "capacity_factor": 1.2,  # Reduced from 2.0
    },
    "NA-SAT": {
        "primary_region": [-125, -30, 10, 60],  # Wider coverage including oceans
        "capacity_factor": 1.0,  # Reduced from 1.5
    },
    "EU-SAT": {
        "primary_region": [-25, 45, 30, 75],  # Much wider Europe coverage
        "capacity_factor": 1.1,  # Reduced from 1.8
    },
}

# Base capacity per service area in Mbps (reduced by ~60%)
BASE_SERVICE_AREA_CAPACITY = 120  # Was 300
# Minimum capacity for any service area to ensure none have zero
MIN_SERVICE_AREA_CAPACITY = 60  # Was 150
# Low capacity for Atlantic areas
ATLANTIC_SERVICE_AREA_CAPACITY = 30  # Was 50

# European region definition (to ensure European areas get supply)
EUROPE_REGION = [-25, 45, 30, 75]  # [min_lon, max_lon, min_lat, max_lat]
# North America region definition
NORTH_AMERICA_REGION = [-125, -70, 25, 55]  # [min_lon, max_lon, min_lat, max_lat]
# Atlantic Ocean region definition
ATLANTIC_REGION = [-70, -20, 10, 60]  # [min_lon, max_lon, min_lat, max_lat]


def load_service_areas():
    """Load the service areas from the generated JSON file"""
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent
    data_dir = project_root / "public" / "data" / "mock"

    service_areas_file = data_dir / "service_areas.json"

    if not service_areas_file.exists():
        raise FileNotFoundError(f"Service areas file not found: {service_areas_file}")

    with open(service_areas_file, "r") as f:
        return json.load(f)


def is_point_in_region(lon, lat, region):
    """Check if a point is within a region defined by [min_lon, max_lon, min_lat, max_lat]"""
    min_lon, max_lon, min_lat, max_lat = region
    return min_lon <= lon <= max_lon and min_lat <= lat <= max_lat


def calculate_center_point(geometry):
    """Calculate the center point of a geometry (simple average of coordinates)"""
    if geometry["type"] == "Polygon":
        coordinates = geometry["coordinates"][0]  # Outer ring
        lon_sum = sum(coord[0] for coord in coordinates)
        lat_sum = sum(coord[1] for coord in coordinates)
        count = len(coordinates) - 1  # Subtract 1 because last point repeats first
        return lon_sum / count, lat_sum / count

    return None, None  # Unsupported geometry type


def is_in_europe(lon, lat):
    """Check if a point is within Europe region"""
    min_lon, max_lon, min_lat, max_lat = EUROPE_REGION
    # Use an expanded check for Europe to catch edge cases
    buffer = 5  # Add a buffer around Europe region
    return (min_lon - buffer) <= lon <= (max_lon + buffer) and (
        min_lat - buffer
    ) <= lat <= (max_lat + buffer)


def is_in_north_america(lon, lat):
    """Check if a point is within North America region"""
    min_lon, max_lon, min_lat, max_lat = NORTH_AMERICA_REGION
    buffer = 5  # Add a buffer
    return (min_lon - buffer) <= lon <= (max_lon + buffer) and (
        min_lat - buffer
    ) <= lat <= (max_lat + buffer)


def is_in_atlantic(lon, lat):
    """Check if a point is within the Atlantic Ocean region"""
    min_lon, max_lon, min_lat, max_lat = ATLANTIC_REGION
    # Check if the point is in the Atlantic and NOT in Europe or North America
    return (
        min_lon <= lon <= max_lon
        and min_lat <= lat <= max_lat
        and not is_in_europe(lon, lat)
        and not is_in_north_america(lon, lat)
    )


def generate_supply_projections(service_area, projection_id):
    """
    Generate supply projections for a service area

    Args:
        service_area: Service area object with ID and geometry
        projection_id: Projection ID (baseline or optimized)

    Returns:
        List of supply projections for each satellite covering this service area
    """
    # Extract service area details
    service_area_id = service_area["service_area_id"]

    # Calculate center point of the service area
    center_lon, center_lat = calculate_center_point(service_area["geom"])
    if center_lon is None:
        return []

    projections = []

    # Set projection start and end dates (one week)
    start_date = datetime.now()
    end_date = start_date + timedelta(days=7)

    # Flag to track if any satellites cover this service area
    has_coverage = False

    # Special handling for Atlantic areas - significantly reduced capacity
    if is_in_atlantic(center_lon, center_lat):
        # Determine which satellite to use (NA-SAT for western Atlantic, EU-SAT for eastern)
        if center_lon < -45:  # Western Atlantic
            satellite_id = "NA-SAT"
        else:  # Eastern Atlantic
            satellite_id = "EU-SAT"

        # Very low capacity for Atlantic areas
        supply_mbps = ATLANTIC_SERVICE_AREA_CAPACITY
        # Still show some difference between projections
        if projection_id == "optimized":
            supply_mbps = int(supply_mbps * random.uniform(1.1, 1.2))

        # Add some minimal randomness
        supply_mbps = int(supply_mbps * random.uniform(0.9, 1.1))

        projections.append(
            {
                "projection_id": projection_id,
                "satellite_id": satellite_id,
                "service_area": service_area_id,
                "supply_mbps": supply_mbps,
                "projection_start": start_date.isoformat(),
                "projection_end": end_date.isoformat(),
            }
        )

        has_coverage = True

    # Special handling for European areas - ensure they all have substantial supply
    elif is_in_europe(center_lon, center_lat):
        # European areas get higher capacity from EU-SAT
        base_capacity = (
            BASE_SERVICE_AREA_CAPACITY * SATELLITE_COVERAGE["EU-SAT"]["capacity_factor"]
        )

        # Add some randomness but ensure all European areas have significant capacity
        min_europe_capacity = base_capacity * 0.7
        max_europe_capacity = base_capacity * 1.2

        # Apply projection-specific modifier
        if projection_id == "optimized":
            min_europe_capacity *= 1.2
            max_europe_capacity *= 1.5

        supply_mbps = int(random.uniform(min_europe_capacity, max_europe_capacity))

        projections.append(
            {
                "projection_id": projection_id,
                "satellite_id": "EU-SAT",
                "service_area": service_area_id,
                "supply_mbps": supply_mbps,
                "projection_start": start_date.isoformat(),
                "projection_end": end_date.isoformat(),
            }
        )

        has_coverage = True

    # For each satellite, check if this service area is in its coverage
    if not has_coverage:
        for satellite_id, config in SATELLITE_COVERAGE.items():
            # Skip EU-SAT for European areas since we've already handled those
            if satellite_id == "EU-SAT" and has_coverage:
                continue

            # Check if service area center is within the satellite's primary region
            if is_point_in_region(center_lon, center_lat, config["primary_region"]):
                has_coverage = True
                # Calculate capacity based on satellite and projection
                base_capacity = BASE_SERVICE_AREA_CAPACITY * config["capacity_factor"]

                # Apply projection-specific modifier
                capacity_modifier = 1.0
                if projection_id == "optimized":
                    capacity_modifier = random.uniform(1.2, 1.5)  # 20-50% increase

                # Add some randomness to the capacity
                supply_mbps = int(
                    base_capacity * capacity_modifier * random.uniform(0.9, 1.1)
                )

                projections.append(
                    {
                        "projection_id": projection_id,
                        "satellite_id": satellite_id,
                        "service_area": service_area_id,
                        "supply_mbps": supply_mbps,
                        "projection_start": start_date.isoformat(),
                        "projection_end": end_date.isoformat(),
                    }
                )

    # Fallback for any areas with no coverage - assign minimum supply from nearest satellite
    if not has_coverage:
        # Determine which satellite to use based on location
        if center_lon < -40:  # Western hemisphere
            satellite_id = "NA-SAT"
        else:  # Eastern hemisphere
            satellite_id = "EU-SAT"

        # Ensure a minimum supply level
        supply_mbps = MIN_SERVICE_AREA_CAPACITY
        if projection_id == "optimized":
            supply_mbps = int(supply_mbps * random.uniform(1.2, 1.5))

        projections.append(
            {
                "projection_id": projection_id,
                "satellite_id": satellite_id,
                "service_area": service_area_id,
                "supply_mbps": supply_mbps,
                "projection_start": start_date.isoformat(),
                "projection_end": end_date.isoformat(),
            }
        )

    return projections


def generate_supply_data():
    """Generate supply data for all service areas and satellites"""
    # Get the project root directory (2 levels up from the script)
    project_root = Path(__file__).resolve().parent.parent
    data_dir = project_root / "public" / "data" / "mock"

    # Create directory if it doesn't exist
    data_dir.mkdir(parents=True, exist_ok=True)

    # Load the service areas
    try:
        service_areas = load_service_areas()
        print(f"Loaded {len(service_areas)} service areas")
    except FileNotFoundError as e:
        print(f"Error: {e}")
        print("Please run generate_service_areas.py first")
        return

    projections = ["baseline", "optimized"]
    all_supply_data = []

    # Generate supply data for each projection, service area, and satellite
    for projection_id in projections:
        projection_data = []

        for service_area in service_areas:
            area_projections = generate_supply_projections(service_area, projection_id)
            projection_data.extend(area_projections)

        # Write projection-specific file
        with open(data_dir / f"supply_{projection_id}.json", "w") as f:
            json.dump(projection_data, f, indent=2)

        all_supply_data.extend(projection_data)

    # Write combined supply file
    with open(data_dir / "supply.json", "w") as f:
        json.dump(all_supply_data, f, indent=2)

    # Count satellites per projection
    baseline_count = len(
        [p for p in all_supply_data if p["projection_id"] == "baseline"]
    )
    optimized_count = len(
        [p for p in all_supply_data if p["projection_id"] == "optimized"]
    )

    print(f"Generated supply data:")
    print(f"- Baseline projection: {baseline_count} records")
    print(f"- Optimized projection: {optimized_count} records")
    print(f"- Total supply records: {len(all_supply_data)}")


if __name__ == "__main__":
    generate_supply_data()
