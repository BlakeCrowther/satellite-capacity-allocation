# Satellite Capacity Allocation Visualization

A high-performance visualization system for satellite network capacity allocation using React, Next.js, and Deck.gl.

A web deployment of this project is available at [https://satellite-capacity-allocation.vercel.app/](https://satellite-capacity-allocation.vercel.app/).

## Overview

This project addresses critical challenges in satellite network management by reimagining how operators visualize and analyze complex geospatial capacity data. Replacing a legacy Dash-based dashboard, this visualization system provides unprecedented clarity into network operations, transforming satellite network analysis from a cumbersome process into a fluid, intuitive experience.

The system enables operators to quickly identify demand patterns, capacity constraints, and optimization opportunities across a global satellite network, supporting better decision-making for network operations analysts, capacity planning engineers, and executive stakeholders.

## Features

- **Demand Pattern Visualization**: Transform thousands of individual demand points into comprehensible visual representations using H3 hexagonal binning with dynamic resolution control (2-7)
- **3D Demand Landscape**: Visualize demand intensity through dual-channel encoding (color + height)
- **Satellite Coverage Analysis**: Clearly communicate satellite service areas with color-coded, semi-transparent beam footprints
- **Service Area Management**: Toggle administrative boundaries with minimal visual emphasis
- **Capacity Allocation Effectiveness**: Identify underserved regions with ratio-based color encoding on a diverging scale
- **Temporal Analysis**: Observe demand patterns over a 24-hour cycle through smooth animations and VCR-style playback controls
- **Forecast Comparison**: Toggle between baseline and peak demand scenarios to evaluate network performance
- **Projection Analysis**: Compare baseline and optimized capacity configurations to assess optimization strategies

## Technologies

- **React & Next.js**: Modern frontend framework providing component-based architecture
- **Deck.gl**: WebGL-powered visualization framework for high-performance geospatial rendering
- **MapLibre GL**: Open-source map rendering library
- **H3**: Hexagonal hierarchical geospatial indexing system for efficient spatial aggregation
- **Tailwind CSS**: Utility-first CSS framework for responsive design

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/satellite-capacity-allocation.git
   cd satellite-capacity-allocation
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

The visualization system presents a clean, intuitive interface with the following controls:

- **Layer Controls**: Toggle visibility of demand, supply, coverage, and allocation layers
- **Satellite Selection**: Enable/disable individual satellites for focused analysis
- **Time Controls**: Use VCR-style controls for temporal analysis (play/pause, step forward/backward)
- **Resolution Adjustment**: Adjust H3 resolution from coarse to fine based on analytical needs
- **3D Controls**: Adjust pitch (0-60 degrees) and height scale (1-20x) for optimal viewing
- **Forecast and Projection Selection**: Switch between different forecast types and capacity scenarios

## Project Structure

- `src/app/components/`: React components for the UI and visualization layers
- `src/app/data/`: Data services, models, and transformation utilities
- `src/app/utils/`: Utility functions for data processing, scale generation, and visualization
- `public/data/mock/`: Synthetic data files representing satellite network elements

## Data Components

The visualization system uses synthetic data that mirrors real satellite network data:

- Service Area Geometries
- Satellite Coverage Footprints
- Demand Distribution Points
- Supply Capacity Projections
- Capacity Allocation Distributions

## Data Generation

The system uses a synthetic dataset that mirrors real satellite network data while avoiding sensitive operational information. The data generation scripts are written in Python and located in the `scripts/` directory.

### Prerequisites for Data Generation

1. Set up a Python environment (Python 3.8+ recommended):
   ```bash
   # Create a virtual environment
   python -m venv venv
   
   # Activate the virtual environment
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   
   # Install required packages
   pip install -r requirements.txt
   ```

### Generating the Data

To generate all data at once, run:
```bash
npm run generate-all-data
# or
python scripts/generate_all_data.py
```

This will create the following components in sequence:

1. **Satellite Beam Geometries**: Generates circular beam footprints for the three satellites (USA-SAT, NA-SAT, EU-SAT)
2. **Supply Data**: Creates baseline and optimized capacity scenarios with regional variations
3. **Service Areas**: Creates elliptical polygons in a global grid with size variations based on geographic location
4. **Demand Distribution**: Produces demand points with varying densities matching population patterns and time-dependent cycles
5. **Allocation Distribution**: Calculates how capacity is distributed to meet demand based on proportional allocation algorithms

You can also run individual data generation scripts if needed:
```bash
npm run generate-beams-py           # Generate satellite beam geometries
npm run generate-supply-py          # Generate supply data
npm run generate-service-areas-py   # Generate service areas
npm run generate-demand-py          # Generate demand data
npm run generate-allocations-py     # Generate allocation distributions
```

All generated data is saved in the `public/data/mock/` directory, making it immediately available to the visualization application.