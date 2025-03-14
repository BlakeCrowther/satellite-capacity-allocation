#!/usr/bin/env python3
import json
import math
import os
from pathlib import Path

# Define the overall coverage area (encompasses all demand regions)
COVERAGE_AREA = {
    "min_lon": -130,  # Western extent
    "max_lon": 40,  # Eastern extent
    "min_lat": 10,  # Southern extent
    "max_lat": 65,  # Northern extent
}

# Define key land regions (North America and Europe)
LAND_REGIONS = [
    # North America
    {
        "min_lon": -125,
        "max_lon": -70,
        "min_lat": 25,
        "max_lat": 55,
    },
    # Europe
    {
        "min_lon": -10,
        "max_lon": 30,
        "min_lat": 35,
        "max_lat": 60,
    },
]

# Number of rows and columns in our grid
NUM_ROWS = 8
NUM_COLS = 12

# Total number of service areas
TOTAL_SERVICE_AREAS = NUM_ROWS * NUM_COLS

# Size adjustment to ensure overlap
LAND_OVERLAP_FACTOR = 1.4  # Higher value means more overlap


def create_ellipse(service_area_id, center, width, height, rotation, num_points=128):
    """
    Create an elliptical polygon for a service area

    Args:
        service_area_id: String identifier for the service area
        center: [lon, lat] center coordinates
        width: Width of ellipse in degrees longitude
        height: Height of ellipse in degrees latitude
        rotation: Rotation angle in degrees
        num_points: Number of points to use for the ellipse (increased for smoothness)

    Returns:
        A GeoJSON feature representing the elliptical service area
    """
    coordinates = []

    # Convert rotation to radians
    rotation_rad = rotation * math.pi / 180.0

    for i in range(num_points):
        angle = (i / num_points) * 2 * math.pi

        # Unrotated ellipse coordinates (relative to center)
        x = (width / 2) * math.cos(angle)
        y = (height / 2) * math.sin(angle)

        # Apply rotation
        x_rot = x * math.cos(rotation_rad) - y * math.sin(rotation_rad)
        y_rot = x * math.sin(rotation_rad) + y * math.cos(rotation_rad)

        # Apply latitude correction for longitude
        lat_scale = math.cos(center[1] * math.pi / 180)

        # Convert to [lon, lat] and add to center
        lon = center[0] + x_rot / lat_scale
        lat = center[1] + y_rot

        coordinates.append([lon, lat])

    # Close the polygon
    coordinates.append(coordinates[0])

    return {
        "service_area_id": service_area_id,
        "geom": {
            "type": "Polygon",
            "coordinates": [coordinates],
        },
    }


def is_in_land_region(lon, lat):
    """
    Check if a point is within any defined land region

    Args:
        lon: Longitude
        lat: Latitude

    Returns:
        True if point is in a land region, False otherwise
    """
    for region in LAND_REGIONS:
        if (
            region["min_lon"] <= lon <= region["max_lon"]
            and region["min_lat"] <= lat <= region["max_lat"]
        ):
            return True
    return False


def calculate_ellipse_size(lon, lat, min_size=8, max_size=15):
    """
    Calculate the size of an ellipse based on its location.
    Ellipses over land (NA, Europe) are more uniform, ellipses over water are more stretched.

    Args:
        lon: Longitude of ellipse center
        lat: Latitude of ellipse center
        min_size: Minimum dimension of ellipse (degrees)
        max_size: Maximum dimension of ellipse (degrees)

    Returns:
        Tuple of (width, height) in degrees
    """
    # Base size
    base_size = min_size + (max_size - min_size) * 0.3

    # Check if in land region
    if is_in_land_region(lon, lat):
        # More uniform ellipses over land with increased size for overlap
        return base_size * LAND_OVERLAP_FACTOR, base_size * (LAND_OVERLAP_FACTOR * 0.9)
    else:
        # Calculate distance from closest land
        min_distance = float("inf")
        for region in LAND_REGIONS:
            # Find closest point in region
            closest_lon = max(region["min_lon"], min(lon, region["max_lon"]))
            closest_lat = max(region["min_lat"], min(lat, region["max_lat"]))

            # Simple distance calculation
            dist = math.sqrt((lon - closest_lon) ** 2 + (lat - closest_lat) ** 2)
            min_distance = min(min_distance, dist)

        # Normalize distance (0-1 scale, capped at ~30 degrees distance)
        norm_distance = min(min_distance / 30.0, 1.0)

        # Stretch factor based on distance from land
        stretch_factor = 1.0 + norm_distance * 1.5

        # More stretched ellipses over water
        # East-west stretching to account for longitude distortion
        return base_size * stretch_factor * 1.5, base_size


def calculate_rotation(lon, lat):
    """
    Calculate rotation angle based on location

    Args:
        lon: Longitude of ellipse center
        lat: Latitude of ellipse center

    Returns:
        Rotation angle in degrees
    """
    # Western Atlantic
    if -70 < lon < -30:
        return 30  # NE-SW orientation
    # Eastern Atlantic
    elif -30 < lon < -10:
        return -30  # NW-SE orientation
    # Over North America - align with continent
    elif -125 < lon < -70:
        return 15 if lat > 40 else 0
    # Over Europe - align with continent
    elif -10 < lon < 30:
        return -15 if lat > 45 else 0
    else:
        # Default rotation
        return 0


def generate_service_areas():
    """Generate grid-like pattern of service area ellipses with special handling for land regions"""
    service_areas = []
    area_id = 1

    # Calculate spacing between ellipse centers
    lon_span = COVERAGE_AREA["max_lon"] - COVERAGE_AREA["min_lon"]
    lat_span = COVERAGE_AREA["max_lat"] - COVERAGE_AREA["min_lat"]

    lon_step = lon_span / (NUM_COLS + 1)  # +1 to provide margin
    lat_step = lat_span / (NUM_ROWS + 1)  # +1 to provide margin

    # Generate ellipses in a grid pattern
    for row in range(NUM_ROWS):
        for col in range(NUM_COLS):
            # Calculate center position
            center_lon = COVERAGE_AREA["min_lon"] + (col + 1) * lon_step
            center_lat = COVERAGE_AREA["min_lat"] + (row + 1) * lat_step

            # Calculate size based on location (land vs water)
            width, height = calculate_ellipse_size(center_lon, center_lat)

            # Calculate rotation based on location
            rotation = calculate_rotation(center_lon, center_lat)

            # Create service area
            service_area = create_ellipse(
                str(area_id), [center_lon, center_lat], width, height, rotation
            )

            service_areas.append(service_area)
            area_id += 1

    # Get the project root directory (2 levels up from the script)
    project_root = Path(__file__).resolve().parent.parent

    # Create the data directory if it doesn't exist
    data_dir = project_root / "public" / "data" / "mock"
    os.makedirs(data_dir, exist_ok=True)

    # Write the service areas to a JSON file
    output_file = data_dir / "service_areas.json"
    with open(output_file, "w") as f:
        json.dump(service_areas, f, indent=2)

    print(f"Generated {len(service_areas)} service areas and saved to {output_file}")


if __name__ == "__main__":
    generate_service_areas()
