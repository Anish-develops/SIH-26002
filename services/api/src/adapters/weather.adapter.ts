/**
 * Future Integration Adapter: India Meteorological Department (IMD)
 * Provides standardized interface for AWS and Doppler Weather Radar feeds.
 */

export interface WeatherObservation {
  station_id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  rainfall_1h_mm: number;
  rainfall_24h_mm: number;
  warning_code: 'GREEN' | 'YELLOW_WATCH' | 'ORANGE_ALERT' | 'RED_ALERT';
  recorded_at: string;
  source: 'synthetic' | 'imd_live_api';
}

export interface IWeatherProvider {
  getLatestObservation(latitude: number, longitude: number): Promise<WeatherObservation>;
  getCorridorPrecipitation(corridorId: string): Promise<WeatherObservation[]>;
}

export class DemoWeatherAdapter implements IWeatherProvider {
  private currentSurgeMmH: number = 12.0;

  setPrecipitationSurge(rainfallMmH: number): void {
    this.currentSurgeMmH = rainfallMmH;
  }

  async getLatestObservation(latitude: number, longitude: number): Promise<WeatherObservation> {
    return {
      station_id: 'IMD-KHL-DEMO',
      location_name: 'Khliehriat Mountain Ridge Observatory',
      latitude,
      longitude,
      rainfall_1h_mm: this.currentSurgeMmH,
      rainfall_24h_mm: this.currentSurgeMmH * 3.5,
      warning_code: this.currentSurgeMmH > 50 ? 'RED_ALERT' : this.currentSurgeMmH > 20 ? 'YELLOW_WATCH' : 'GREEN',
      recorded_at: new Date().toISOString(),
      source: 'synthetic'
    };
  }

  async getCorridorPrecipitation(corridorId: string): Promise<WeatherObservation[]> {
    return [
      await this.getLatestObservation(25.3522, 92.3619)
    ];
  }
}
