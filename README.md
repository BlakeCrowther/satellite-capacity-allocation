# Satellite Capacity Allocation Visualization

A Next.js application for visualizing satellite network capacity allocation using Deck.gl and MapLibre.

## Overview

This project provides interactive visualizations for satellite network management, enabling operators to monitor demand patterns, analyze capacity distribution, and optimize service quality across diverse geographic regions.

## Features

- **Demand Heatmap**: Visualize demand distribution using H3 hexagonal cells
- **Satellite Coverage**: View satellite beam coverage areas
- **Supply Configuration**: Analyze capacity thresholds across the network
- **Demand vs Capacity Analysis**: Compare demand against available capacity

## Technologies

- **Next.js**: React framework for server-rendered applications
- **Deck.gl**: WebGL-powered framework for visual exploratory data analysis
- **MapLibre GL**: Open-source map rendering library
- **H3**: Hexagonal hierarchical geospatial indexing system
- **Tailwind CSS**: Utility-first CSS framework

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

## Project Structure

- `src/app/components/`: React components for the UI
- `src/app/data/`: Data models, services, and mock data
- `src/app/utils/`: Utility functions for data processing and visualization
- `public/data/mock/`: Mock data files for development

## License

[MIT](LICENSE)
