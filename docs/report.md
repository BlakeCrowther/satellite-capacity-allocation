# Final Project Report

## Abstract (300 words, 0.5 page) - Summarize project goals, results and findings.

## Introduction (0.5 page) - Provide a brief background and motivation for the project

Data visualization plays a critical role in satellite network management, enabling operators to monitor demand patterns, analyze capacity distribution, and optimize service quality across diverse geographic regions. However, as satellite networks grow in complexity, so too do the visualization tools used to manage them. What often begins as a simple dashboard solution can evolve into an unwieldy application plagued by performance issues and maintenance challenges.

This project addresses a common problem in network visualization systems: the gradual degradation of performance and maintainability as more features are added to legacy dashboards. Specifically, the current satellite network visualization dashboard, built using Dash, has become increasingly difficult to maintain while suffering from performance bottlenecks when handling complex interactive features. As users demand more sophisticated analysis capabilities, the existing architecture struggles to keep pace, resulting in slower load times and a diminished user experience.

The motivation behind this project is to rebuild the core visualizations using a modern technology stack focused on performance and simplicity. By leveraging React and Deck.gl for efficient rendering of geospatial data, the project aims to create a more responsive, intuitive interface that enables network analysts and capacity planners to quickly derive insights from complex satellite network data. Rather than adding new complexity, this project emphasizes making essential features work better, ultimately improving decision-making efficiency for the professionals who rely on these tools daily.

## Datasets (0.5 - 1 page) - Briefly describe the data and summarize its key attributes. Include description of significant preprocessing that was required for the project.

This project utilizes synthetic datasets designed to mirror real satellite network data patterns while maintaining privacy and security. The data structure closely resembles operational satellite network data but has been generated with anonymized patterns based on typical usage scenarios. Four primary datasets form the foundation of this visualization project:

### Demand Data

The demand dataset represents forecasted network usage across various geographic locations. It provides hourly demand forecasts aggregated at the entity level (typically a geographic cell or service point).

One week of data was used with hourly epochs as rows to establish a representative time window for analysis:

- `forecast_id` : Unique identifier for different forecasts, which may represent predictions for the same or different time periods
- `entity_id`: Identifier for the demand entity (geographic point)
- `lat`: Latitude of the entity
- `lon`: Longitude of the entity
- `service_area`: Service area the entity resides in
- `demand_mbps`: Forecasted demand in megabits per second (Mbps) for the entity
- `epoch` : Hour of the forecasted demand since the start of the week
- `timestamp`: Timestamp of the forecasted demand

Preprocessing for this dataset involved aggregating raw demand data into H3 hexagonal cells, which provides a balanced approach to spatial resolution while maintaining computational efficiency. This aggregation helps smooth out noise in individual demand points while still preserving important spatial patterns.

### Supply Data

The supply dataset captures the capacity that satellites can provide to different service areas over time. For simplicity in relation to the demand data, supply values are represented on a weekly basis:

- `projection_id`: Unique identifier for the capacity projection
- `satellite_id`: Identifier for the specific satellite
- `service_area`: Service area covered by the satellite
- `supply_mbps`: Available supply in megabits per second (Mbps) for the service area
- `projection_start`: Start timestamp of the projection period
- `projection_end`: End timestamp of the projection period

Preprocessing included normalizing temporal resolutions between supply and demand datasets and developing allocation algorithms to model how supply would be distributed across demand entities within each service area.

### Satellite Network Coverage

This dataset defines the geographic coverage provided by each satellite:

- `satellite_id`: Identifier for the specific satellite
- `service_area`: Service area associated with the beam
- `geom`: Geometry representation of the beam contour

Converting the coverage data into visualization-ready formats required simplifying complex beam geometries while maintaining accurate coverage representation. The preprocessing included transforming various coordinate systems and optimizing geometry complexity for efficient rendering.

### Allocations

The allocations dataset represents the modeled distribution of capacity to entities:

- `service_area`: Service area the allocation is associated with
- `entity_id`: Entity receiving the allocation
- `lat`: Latitude of the entity
- `lon`: Longitude of the entity
- `epoch`: Hour of the allocation
- `mbps`: Megabits per second allocated to the entity
- `satellite_id`: Satellite providing the allocation

This dataset required extensive preprocessing through an allocation algorithm that simulates how network capacity would be distributed among competing demand entities. The algorithm considers factors such as priority, fairness, and efficiency in bandwidth allocation.

The preprocessing pipeline for all datasets included data validation, temporal alignment, spatial normalization using the H3 grid system, and optimization for visualization performance. To ensure the visualizations remain responsive, the data was also structured to support progressive loading and level-of-detail adjustments based on zoom levels and user interaction patterns.

## Tasks (0.5 - 1 page) - Describe the chosen tasks and the audience for the project

This project focuses on rebuilding core satellite network visualization components to serve the specific needs of network analysts and capacity planners. The visualization tasks are designed to be focused, performant, and directly applicable to the daily workflows of these professionals.

### Primary Visualization Tasks

1. **Basic Demand Heatmap**
   - Create a geospatial heatmap using H3 hexagonal cells to visualize demand distribution
   - Implement efficient rendering of demand patterns across service areas
   - Provide intuitive color encoding to represent demand intensity

2. **Supply Configuration View**
   - Visualize capacity thresholds across the network
   - Display regional availability of bandwidth
   - Enable users to quickly identify areas of potential capacity constraints

3. **Satellite Beam Coverage Visualization**
   - Render coverage areas for individual satellites
   - Implement basic satellite selection functionality
   - Visualize the relationship between satellite positions and their service areas

4. **Demand vs Capacity Analysis**
   - Develop comparison metrics to evaluate demand against available capacity
   - Provide regional analysis tools to identify potential service gaps
   - Highlight areas where demand may exceed supply

5. **Configuration Comparison View**
   - Enable switching between different supply/demand scenarios
   - Implement side-by-side or overlay visualization options
   - Provide difference highlighting between baseline, peak demand, and optimized scenarios

### Target Audience

The visualizations are primarily designed for three key audience segments:

1. **Network Analysts** - Professionals who need to explore demand patterns quickly and make data-driven decisions about network optimization. They require faster exploration capabilities and an intuitive interface that reduces the time spent waiting for visualizations to load.

2. **Capacity Planners** - Team members responsible for ensuring sufficient bandwidth is available across all service areas. These users benefit from better coverage insights and clear visualization of potential capacity shortfalls.

3. **Service Quality Teams** - Personnel who monitor and respond to service quality issues across regions. The regional performance analysis features enable them to quickly identify and address potential service degradation before it impacts customers.

By focusing on these specific tasks and audience needs, the project aims to create visualizations that are not only more technically efficient but also more effective at supporting the critical decision-making processes within satellite network operations.

## Solution (2 - 4 pages) - Visualization design - Describe and justify the design choices and idioms used to accomplish listed tasks. Implementation - Briefly summarize key aspects of the implementation, show Pseudo code where necessary. Usage - very briefly outline software usage.

## Results (2 - 4 pages) - Include key snapshots as appropriate. You may also refer the time in submitted video where appropriate. Discuss the expressiveness and effectiveness of your solution. Discuss findings as well as key hurdles and challenges overcome. What are weakness in the solution and lessons learned?



