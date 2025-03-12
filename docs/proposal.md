# Final Project Proposal: Satellite Network Visualization

## Slide 1: Project Overview & Background
• Current Dash dashboard has become difficult to maintain
• Performance issues with complex interactive features
• Proposal: Rebuild core visualizations using modern stack:
  - Faster load times
  - Better interactivity
  - Simpler codebase

[Present: "In my work with the satellite network dashboard, I've noticed increasing performance issues. 
What started as a simple Dash application has grown complex and slow. I'm proposing we rebuild our 
core visualizations with modern tools to make them faster and easier to maintain."]

## Slide 2: Core Datasets
• Demand Data
  - Synthetic network demand patterns
  - H3 cell aggregation structure
• Supply Data
  - Capacity configurations
  - Coverage area definitions

[Present: "For this project, I'll create synthetic datasets that mirror our real network data. 
I'll use my experience from Exercise 3, where I worked with public energy data, to generate 
realistic patterns while keeping sensitive information private."]

## Slide 3: Visualization Tasks
• Basic Demand Heatmap
  - H3 hexagon visualization
  - Simple demand distribution
• Supply Configuration View
  - Capacity thresholds
  - Regional availability
• Satellite Beam Coverage
  - Coverage area visualization
  - Basic satellite selection
• Demand vs Capacity View
  - Simple comparison metrics
  - Regional analysis
• Data Anonymization Pipeline
  - Public-friendly data versions
  - Maintain data relationships
• Configuration Comparison View
  - Allow switching between different supply/demand scenarios
  - Simple dropdown to select different configurations:
    - Baseline configuration
    - Peak demand scenario
    - Optimized capacity layout
  - Side-by-side or overlay visualization options
  - Basic difference highlighting between scenarios

[Present: "I've broken down the visualization into five core tasks. I'll start with a basic 
demand heatmap, then add supply configuration and coverage views. The key is keeping each 
component simple and focused. I've specifically chosen tasks that I know I can implement 
well in the project timeframe."]

## Slide 4: Implementation Approach
• Core Technologies
  - React
  - Deck.gl
  - Simple CSS
• Interactive Features
  - Basic map controls
  - Simple filtering
  - Data updates
• Development Phases
  - React setup
  - Map implementation
  - Data visualization
  - Interaction features
  - Polish

[Present: "I've chosen React and Deck.gl because they're well-documented and specifically 
good at handling map visualizations. I've worked with similar tools in my projects, so I'm 
confident I can implement these features efficiently. I'll follow a phased approach, making 
sure each part works before moving to the next."]

## Slide 5: Value Proposition
• Network Analysts
  - Faster exploration
  - Intuitive interface
• Capacity Planners
  - Better coverage insights
• Service Quality
  - Regional performance analysis

[Present: "The real value here is speed and simplicity. From my experience with the current 
dashboard, analysts spend too much time waiting for updates. This new version will help them 
make decisions faster. I'm focusing on the features we use most often, making them work 
better rather than adding new complexity."]

