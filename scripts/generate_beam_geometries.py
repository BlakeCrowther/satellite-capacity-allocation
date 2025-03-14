#!/usr/bin/env python3
import json
import math
import random
from pathlib import Path


# Function to create a circular beam given a center point and radius (in degrees)
def create_beam(center_id, satellite_id, service_area, center, radius, num_points=32):
    coordinates = []
    for i in range(num_points):
        angle = (i / num_points) * 2 * math.pi
        # Scale longitude appropriately based on latitude
        lat_scale = math.cos(center[1] * math.pi / 180)
        lon = center[0] + (radius * math.cos(angle)) / lat_scale
        lat = center[1] + radius * math.sin(angle)
        coordinates.append([lon, lat])

    # Close the polygon
    coordinates.append(coordinates[0])

    return {
        "satellite_id": satellite_id,
        "service_area": service_area,
        "geom": {
            "type": "Polygon",
            "coordinates": [coordinates],
        },
        "center_id": center_id,
    }


# Create USA satellite beams
def create_usa_beams(count=20):
    beams = []
    satellite_id = "USA-SAT"
    service_area = "AMERICAS"

    # Define a rough bounding box for the USA
    usa_bounds = {
        "min_lon": -125,
        "max_lon": -66,
        "min_lat": 24,
        "max_lat": 49,
    }

    # Create beams based on a grid pattern
    lon_step = (usa_bounds["max_lon"] - usa_bounds["min_lon"]) / math.sqrt(count)
    lat_step = (usa_bounds["max_lat"] - usa_bounds["min_lat"]) / math.sqrt(count)

    # Radius of each beam (in degrees)
    radius = max(lon_step, lat_step) * 0.7

    beam_id = 1
    for lon in range_float(
        usa_bounds["min_lon"] + lon_step / 2, usa_bounds["max_lon"], lon_step
    ):
        for lat in range_float(
            usa_bounds["min_lat"] + lat_step / 2, usa_bounds["max_lat"], lat_step
        ):
            # Skip if we've created enough beams
            if len(beams) >= count:
                break

            # Add some randomness to the position
            jitter_lon = (random.random() - 0.5) * lon_step * 0.5
            jitter_lat = (random.random() - 0.5) * lat_step * 0.5

            beams.append(
                create_beam(
                    beam_id,
                    satellite_id,
                    service_area,
                    [lon + jitter_lon, lat + jitter_lat],
                    radius,
                )
            )
            beam_id += 1

    return beams


# Create North America and Caribbean beams
def create_north_america_beams(count=30):
    beams = []
    satellite_id = "NA-SAT"
    service_area = "AMERICAS"

    # Define regions to cover (North America, Caribbean, Atlantic bridge)
    regions = [
        # North America (broader than just USA)
        {
            "min_lon": -140,
            "max_lon": -60,
            "min_lat": 15,
            "max_lat": 60,
            "beam_count": int(count * 0.6),  # 60% of beams
        },
        # Caribbean
        {
            "min_lon": -90,
            "max_lon": -60,
            "min_lat": 8,
            "max_lat": 25,
            "beam_count": int(count * 0.2),  # 20% of beams
        },
        # Atlantic bridge
        {
            "min_lon": -60,
            "max_lon": -30,
            "min_lat": 20,
            "max_lat": 45,
            "beam_count": int(count * 0.2),  # 20% of beams
        },
    ]

    beam_id = 1

    # Create beams for each region
    for region in regions:
        beam_count = region["beam_count"]
        lon_step = (region["max_lon"] - region["min_lon"]) / math.sqrt(beam_count)
        lat_step = (region["max_lat"] - region["min_lat"]) / math.sqrt(beam_count)

        # Radius of each beam (in degrees)
        radius = max(lon_step, lat_step) * 0.75

        for lon in range_float(
            region["min_lon"] + lon_step / 2, region["max_lon"], lon_step
        ):
            for lat in range_float(
                region["min_lat"] + lat_step / 2, region["max_lat"], lat_step
            ):
                # Skip if we've created enough beams for this region
                if len(beams) >= beam_id - 1 + beam_count:
                    break

                # Add some randomness to the position
                jitter_lon = (random.random() - 0.5) * lon_step * 0.5
                jitter_lat = (random.random() - 0.5) * lat_step * 0.5

                beams.append(
                    create_beam(
                        beam_id,
                        satellite_id,
                        service_area,
                        [lon + jitter_lon, lat + jitter_lat],
                        radius,
                    )
                )
                beam_id += 1

    return beams


# Create Europe and Atlantic bridge beams
def create_europe_beams(count=20):
    beams = []
    satellite_id = "EU-SAT"
    service_area = "EUROPE"

    # Define regions to cover (Europe and a bit of the Atlantic)
    regions = [
        # Europe
        {
            "min_lon": -10,
            "max_lon": 30,
            "min_lat": 35,
            "max_lat": 60,
            "beam_count": int(count * 0.8),  # 80% of beams
        },
        # Atlantic bridge
        {
            "min_lon": -30,
            "max_lon": -10,
            "min_lat": 35,
            "max_lat": 55,
            "beam_count": int(count * 0.2),  # 20% of beams
        },
    ]

    beam_id = 1

    # Create beams for each region
    for region in regions:
        beam_count = region["beam_count"]
        lon_step = (region["max_lon"] - region["min_lon"]) / math.sqrt(beam_count)
        lat_step = (region["max_lat"] - region["min_lat"]) / math.sqrt(beam_count)

        # Radius of each beam (in degrees)
        radius = max(lon_step, lat_step) * 0.7

        for lon in range_float(
            region["min_lon"] + lon_step / 2, region["max_lon"], lon_step
        ):
            for lat in range_float(
                region["min_lat"] + lat_step / 2, region["max_lat"], lat_step
            ):
                # Skip if we've created enough beams for this region
                if len(beams) >= beam_id - 1 + beam_count:
                    break

                # Add some randomness to the position
                jitter_lon = (random.random() - 0.5) * lon_step * 0.5
                jitter_lat = (random.random() - 0.5) * lat_step * 0.5

                beams.append(
                    create_beam(
                        beam_id,
                        satellite_id,
                        service_area,
                        [lon + jitter_lon, lat + jitter_lat],
                        radius,
                    )
                )
                beam_id += 1

    return beams


# Helper function to generate float ranges (equivalent to JavaScript's for loop with floating point steps)
def range_float(start, stop, step):
    while start < stop:
        yield start
        start += step


# Generate all beams and write to files
def generate_all_beams():
    # Get the project root directory (2 levels up from the script)
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent
    data_dir = project_root / "public" / "data" / "mock"

    # Create directory if it doesn't exist
    data_dir.mkdir(parents=True, exist_ok=True)

    # Print the absolute path for debugging
    print(f"Data directory absolute path: {data_dir.absolute()}")

    # Updated beam counts as requested
    usa_beams = create_usa_beams(10)  # Changed from 20 to 10
    na_beams = create_north_america_beams(20)  # Changed from 30 to 20
    eu_beams = create_europe_beams(20)  # Keeping EU at 20

    # Combine all beams for a complete coverage file
    all_beams = usa_beams + na_beams + eu_beams

    # Write individual satellite coverage files
    with open(data_dir / "coverage_USA-SAT.json", "w") as f:
        json.dump(usa_beams, f, indent=2)
        print(
            f"Wrote {len(usa_beams)} USA beams to {(data_dir / 'coverage_USA-SAT.json').absolute()}"
        )

    with open(data_dir / "coverage_NA-SAT.json", "w") as f:
        json.dump(na_beams, f, indent=2)
        print(
            f"Wrote {len(na_beams)} NA beams to {(data_dir / 'coverage_NA-SAT.json').absolute()}"
        )

    with open(data_dir / "coverage_EU-SAT.json", "w") as f:
        json.dump(eu_beams, f, indent=2)
        print(
            f"Wrote {len(eu_beams)} EU beams to {(data_dir / 'coverage_EU-SAT.json').absolute()}"
        )

    # Write combined coverage file
    with open(data_dir / "coverage.json", "w") as f:
        json.dump(all_beams, f, indent=2)
        print(
            f"Wrote {len(all_beams)} combined beams to {(data_dir / 'coverage.json').absolute()}"
        )

    print(f"Generated beam geometries:")
    print(f"- USA: {len(usa_beams)} beams")
    print(f"- North America: {len(na_beams)} beams")
    print(f"- Europe: {len(eu_beams)} beams")
    print(f"- Total: {len(all_beams)} beams")


if __name__ == "__main__":
    generate_all_beams()
