#!/usr/bin/env python3
import os
import time
from pathlib import Path

print("Starting data generation for satellite capacity allocation visualization...")

# Get the project root directory (2 levels up from the script)
script_dir = Path(__file__).resolve().parent
project_root = script_dir.parent

# Import and run beam generation
print("\n1. Generating satellite beam geometries...")
from generate_beam_geometries import generate_all_beams

generate_all_beams()

# Import and run supply data generation
print("\n2. Generating satellite supply data...")
from generate_supply_data import generate_supply_data

generate_supply_data()

# Import and run demand data generation
print("\n3. Generating demand data...")
from generate_demand_data import generate_all_demand

generate_all_demand()

# Create empty allocations file (placeholder for future)
print("\n4. Creating empty allocations file...")
data_dir = project_root / "public" / "data" / "mock"
data_dir.mkdir(parents=True, exist_ok=True)
with open(data_dir / "allocations.json", "w") as f:
    f.write("[]")

print("\nAll mock data successfully generated!")
print(f"Files created in: {os.path.abspath(data_dir)}")
print("You can now start the application with 'npm run dev'")
