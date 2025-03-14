import {
  Allocation,
  DataSourceConfig,
  DataSourceType,
  DemandEntity,
  Experiment,
  SatelliteCoverage,
  ServiceArea,
  SupplyProjection
} from '../models/types';

/**
 * Data service class that abstracts data loading from different sources
 */
class DataService {
  private config: DataSourceConfig;
  
  constructor(config: DataSourceConfig) {
    this.config = config;
  }
  
  /**
   * Set data source configuration
   */
  setConfig(config: DataSourceConfig): void {
    this.config = config;
  }

  /**
   * Get demand data
   */
  async getDemandData(forecastId?: string, epoch?: number): Promise<DemandEntity[]> {
    if (this.config.type === DataSourceType.LOCAL) {
      // Load from local files
      try {
        const filePath = `${this.config.baseUrl || ''}/demand${forecastId ? `_${forecastId}` : ''}.json`;
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`Failed to load demand data: ${response.statusText}`);
        }
        const data: DemandEntity[] = await response.json();
        
        // Filter by epoch if provided
        if (epoch !== undefined) {
          return data.filter(item => item.epoch === epoch);
        }
        
        return data;
      } catch (error) {
        console.error('Error loading demand data:', error);
        return [];
      }
    } else {
      // Placeholder for Supabase implementation
      console.warn('Supabase data source not yet implemented');
      return [];
    }
  }

  /**
   * Get supply data
   */
  async getSupplyData(projectionId?: string): Promise<SupplyProjection[]> {
    if (this.config.type === DataSourceType.LOCAL) {
      try {
        const filePath = `${this.config.baseUrl || ''}/supply${projectionId ? `_${projectionId}` : ''}.json`;
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`Failed to load supply data: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Error loading supply data:', error);
        return [];
      }
    } else {
      // Placeholder for Supabase implementation
      console.warn('Supabase data source not yet implemented');
      return [];
    }
  }

  /**
   * Get satellite coverage data
   */
  async getSatelliteCoverage(satelliteId?: string): Promise<SatelliteCoverage[]> {
    if (this.config.type === DataSourceType.LOCAL) {
      try {
        const filePath = `${this.config.baseUrl || ''}/coverage${satelliteId ? `_${satelliteId}` : ''}.json`;
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`Failed to load coverage data: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Error loading satellite coverage data:', error);
        return [];
      }
    } else {
      // Placeholder for Supabase implementation
      console.warn('Supabase data source not yet implemented');
      return [];
    }
  }

  /**
   * Get allocation data
   */
  async getAllocationData(epoch?: number, serviceArea?: string): Promise<Allocation[]> {
    if (this.config.type === DataSourceType.LOCAL) {
      try {
        const filePath = `${this.config.baseUrl || ''}/allocations.json`;
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`Failed to load allocation data: ${response.statusText}`);
        }
        let data: Allocation[] = await response.json();
        
        // Apply filters if provided
        if (epoch !== undefined) {
          data = data.filter(item => item.epoch === epoch);
        }
        
        if (serviceArea) {
          data = data.filter(item => item.service_area === serviceArea);
        }
        
        return data;
      } catch (error) {
        console.error('Error loading allocation data:', error);
        return [];
      }
    } else {
      // Placeholder for Supabase implementation
      console.warn('Supabase data source not yet implemented');
      return [];
    }
  }

  /**
   * Get service area data
   */
  async getServiceAreas(): Promise<ServiceArea[]> {
    if (this.config.type === DataSourceType.LOCAL) {
      try {
        const filePath = `${this.config.baseUrl || ''}/service_areas.json`;
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`Failed to load service area data: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Error loading service area data:', error);
        return [];
      }
    } else {
      // Placeholder for Supabase implementation
      console.warn('Supabase data source not yet implemented');
      return [];
    }
  }

  /**
   * Get experiment configurations
   */
  async getExperiments(): Promise<Experiment[]> {
    if (this.config.type === DataSourceType.LOCAL) {
      try {
        const filePath = `${this.config.baseUrl || ''}/experiments.json`;
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`Failed to load experiment data: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Error loading experiment data:', error);
        return [];
      }
    } else {
      // Placeholder for Supabase implementation
      console.warn('Supabase data source not yet implemented');
      return [];
    }
  }

  /**
   * Get specific allocation data for a forecast-projection combination
   */
  async getAllocationDataForExperiment(forecastId: string, projectionId: string, epoch?: number): Promise<Allocation[]> {
    if (this.config.type === DataSourceType.LOCAL) {
      try {
        // Map forecast and projection to experiment name
        let experimentName = "";
        if (forecastId === "base_forecast" && projectionId === "baseline") {
          experimentName = "baseline";
        } else if (forecastId === "base_forecast" && projectionId === "optimized") {
          experimentName = "optimized";
        } else if (forecastId === "peak_forecast" && projectionId === "baseline") {
          experimentName = "peak_demand";
        } else if (forecastId === "peak_forecast" && projectionId === "optimized") {
          experimentName = "peak_optimized";
        } else {
          // Fallback to combined file
          console.warn(`No specific allocation file for ${forecastId} and ${projectionId}, using combined file`);
          return this.getAllocationData(epoch);
        }

        // Use new file naming pattern: allocation_{experiment_name}.json
        const filePath = `${this.config.baseUrl || ''}/allocation_${experimentName}.json`;
        
        console.log(`Fetching allocations from: ${filePath}`);
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`Failed to load allocation data: ${response.statusText}`);
        }
        let data: Allocation[] = await response.json();
        
        // Filter by epoch if provided
        if (epoch !== undefined) {
          data = data.filter(item => item.epoch === epoch);
        }
        
        return data;
      } catch (error) {
        console.error('Error loading allocation data:', error);
        return [];
      }
    } else {
      // Placeholder for Supabase implementation
      console.warn('Supabase data source not yet implemented');
      return [];
    }
  }
}

// Export singleton instance
export const dataService = new DataService({
  type: DataSourceType.LOCAL,
  baseUrl: '/data/mock'
});

export default DataService; 