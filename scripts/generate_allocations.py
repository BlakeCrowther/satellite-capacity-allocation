#!/usr/bin/env python3
import json
from pathlib import Path
from collections import defaultdict


def load_json_file(file_path):
    """Load data from a JSON file"""
    with open(file_path, "r") as f:
        return json.load(f)


def save_json_file(data, file_path):
    """Save data to a JSON file"""
    with open(file_path, "w") as f:
        json.dump(data, f, indent=2)


def aggregate_supply_by_service_area(supply_data, projection_id):
    """
    Aggregate supply data by service area for a specific projection

    Args:
        supply_data: List of supply projection objects
        projection_id: The projection ID to filter by (baseline or optimized)

    Returns:
        Dictionary mapping service areas to their total available supply in Mbps
    """
    service_area_supply = defaultdict(int)

    # Filter by projection ID and aggregate
    for item in supply_data:
        if item["projection_id"] == projection_id:
            service_area_supply[item["service_area"]] += item["supply_mbps"]

    return service_area_supply


def allocate_capacity(demand_data, supply_by_service_area, forecast_id):
    """
    Allocate capacity to demand entities based on available supply

    Args:
        demand_data: List of demand data objects
        supply_by_service_area: Dictionary mapping service areas to total supply
        forecast_id: The forecast ID to use

    Returns:
        List of allocation objects (demand data with added allocation field)
    """
    # Group demand by service area and epoch
    demand_by_area_epoch = defaultdict(list)
    for item in demand_data:
        if item["forecast_id"] == forecast_id:
            key = (item["service_area"], item["epoch"])
            demand_by_area_epoch[key].append(item)

    allocations = []

    # Process each service area and epoch
    for (service_area, epoch), entities in demand_by_area_epoch.items():
        # Get total supply for this service area
        total_supply = supply_by_service_area.get(service_area, 0)

        # Calculate total demand for this service area and epoch
        total_demand = sum(entity["demand_mbps"] for entity in entities)

        # Calculate allocation ratio
        # If supply exceeds demand, all entities get what they want
        # Otherwise, allocate proportionally based on demand
        allocation_ratio = (
            min(1.0, total_supply / total_demand) if total_demand > 0 else 0
        )

        # Distribute capacity to entities
        remaining_supply = total_supply

        # Sort entities by demand (optional: can prioritize certain entities)
        sorted_entities = sorted(entities, key=lambda x: x["demand_mbps"], reverse=True)

        for entity in sorted_entities:
            # Calculate fair allocation based on demand proportion
            if total_demand > 0:
                fair_share = min(
                    entity["demand_mbps"],  # Don't allocate more than demanded
                    (entity["demand_mbps"] / total_demand)
                    * total_supply,  # Proportional allocation
                )
            else:
                fair_share = 0

            # Ensure we don't exceed remaining supply
            allocated = min(fair_share, remaining_supply)
            remaining_supply -= allocated

            # Create allocation entry (copy of demand with added allocation field)
            allocation = entity.copy()
            allocation["allocated_mbps"] = round(allocated, 2)
            allocation["satisfaction_pct"] = (
                round((allocated / entity["demand_mbps"]) * 100, 1)
                if entity["demand_mbps"] > 0
                else 100
            )

            allocations.append(allocation)

    return allocations


def generate_allocations(data_dir=None):
    """
    Generate allocation data for different scenarios

    Args:
        data_dir: Directory where data files are stored
    """
    if data_dir is None:
        # Get the project root directory (2 levels up from the script)
        script_dir = Path(__file__).resolve().parent
        project_root = script_dir.parent
        data_dir = project_root / "public" / "data" / "mock"

    # Ensure data_dir is a Path object
    if isinstance(data_dir, str):
        data_dir = Path(data_dir)

    # Load supply and demand data
    supply_data = load_json_file(data_dir / "supply.json")
    demand_data = load_json_file(data_dir / "demand.json")

    # Define experiment scenarios
    experiments = [
        {"name": "baseline", "forecast": "base_forecast", "projection": "baseline"},
        {"name": "optimized", "forecast": "base_forecast", "projection": "optimized"},
        {"name": "peak_demand", "forecast": "peak_forecast", "projection": "baseline"},
        {
            "name": "peak_optimized",
            "forecast": "peak_forecast",
            "projection": "optimized",
        },
    ]

    all_allocations = []  # Keep track of all allocations for summary

    # Process each experiment
    for experiment in experiments:
        print(f"Generating allocations for {experiment['name']} scenario...")

        # Aggregate supply by service area for this projection
        supply_by_service_area = aggregate_supply_by_service_area(
            supply_data, experiment["projection"]
        )

        # Allocate capacity
        experiment_allocations = allocate_capacity(
            demand_data, supply_by_service_area, experiment["forecast"]
        )

        # Add experiment information to each allocation
        for allocation in experiment_allocations:
            allocation["experiment"] = experiment["name"]

        # Save individual experiment allocations to separate file
        allocation_file = data_dir / f"allocation_{experiment['name']}.json"
        save_json_file(experiment_allocations, allocation_file)
        print(f"Saved {experiment['name']} allocation data to {allocation_file}")

        # Add to the full allocations list for summary
        all_allocations.extend(experiment_allocations)

    # Save combined allocation data for reference/compatibility
    all_allocations_file = data_dir / "allocations.json"
    save_json_file(all_allocations, all_allocations_file)
    print(f"Saved combined allocation data to {all_allocations_file}")

    # Create a summary of allocation results
    summary = summarize_allocations(all_allocations)
    summary_file = data_dir / "allocation_summary.json"
    save_json_file(summary, summary_file)
    print(f"Saved allocation summary to {summary_file}")


def summarize_allocations(allocations):
    """
    Create a summary of allocation results

    Args:
        allocations: List of allocation objects

    Returns:
        Dictionary with summary statistics by experiment and service area
    """
    summary = defaultdict(lambda: defaultdict(dict))

    # Group allocations by experiment and service area
    for exp in set(a["experiment"] for a in allocations):
        exp_allocations = [a for a in allocations if a["experiment"] == exp]

        for service_area in set(a["service_area"] for a in exp_allocations):
            area_allocations = [
                a for a in exp_allocations if a["service_area"] == service_area
            ]

            # Only count unique entities per service area (avoid counting epochs)
            entity_ids = set(a["entity_id"] for a in area_allocations)
            unique_entities = len(entity_ids)

            # Calculate average satisfaction and total allocated vs demanded
            total_demand = sum(a["demand_mbps"] for a in area_allocations)
            total_allocated = sum(a["allocated_mbps"] for a in area_allocations)
            avg_satisfaction = (
                (
                    sum(a["satisfaction_pct"] for a in area_allocations)
                    / len(area_allocations)
                )
                if area_allocations
                else 0
            )

            summary[exp][service_area] = {
                "entity_count": unique_entities,
                "total_demand_mbps": round(total_demand, 2),
                "total_allocated_mbps": round(total_allocated, 2),
                "allocation_pct": (
                    round((total_allocated / total_demand) * 100, 1)
                    if total_demand > 0
                    else 100
                ),
                "avg_satisfaction_pct": round(avg_satisfaction, 1),
            }

    return dict(summary)


if __name__ == "__main__":
    generate_allocations()
