import {
  RoadSegment,
  RiskScoreResponse,
  RiskFactorBreakdown,
  RiskLevel,
  RiskType
} from '@ner-sentinel/types';

export interface RiskEvaluationInput {
  segment: RoadSegment;
  currentRainfallMmH?: number;
  hasActiveIncident?: boolean;
  incidentSeverity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class RiskEngine {
  private readonly version = 'demo-risk-v1';

  evaluateSegment(input: RiskEvaluationInput): RiskScoreResponse {
    const { segment, currentRainfallMmH = 12.0, hasActiveIncident = false, incidentSeverity } = input;
    const factors: RiskFactorBreakdown[] = [];

    // 1. Weather Factor (0 - 35 points)
    let weatherPoints = 0;
    let weatherDesc = '';
    if (currentRainfallMmH >= 60) {
      weatherPoints = 30;
      weatherDesc = `Heavy rainfall (${currentRainfallMmH} mm/h) exceeding slope saturation limits`;
    } else if (currentRainfallMmH >= 30) {
      weatherPoints = 18;
      weatherDesc = `Moderate to heavy rain (${currentRainfallMmH} mm/h)`;
    } else if (currentRainfallMmH >= 15) {
      weatherPoints = 10;
      weatherDesc = `Moderate mountain drizzle (${currentRainfallMmH} mm/h)`;
    } else {
      weatherPoints = 4;
      weatherDesc = `Light or negligible precipitation (${currentRainfallMmH} mm/h)`;
    }
    factors.push({
      factor: 'Heavy rainfall',
      points: weatherPoints,
      category: 'WEATHER',
      description: weatherDesc
    });

    // 2. Terrain Factor (0 - 25 points)
    let terrainPoints = 0;
    let terrainDesc = '';
    if (segment.slope_deg >= 30) {
      terrainPoints = 22;
      terrainDesc = `Steep mountain grade (${segment.slope_deg}°) with high shear stress on cut slopes`;
    } else if (segment.slope_deg >= 20) {
      terrainPoints = 14;
      terrainDesc = `Moderate-steep terrain (${segment.slope_deg}°)`;
    } else {
      terrainPoints = 6;
      terrainDesc = `Mild terrain gradient (${segment.slope_deg}°)`;
    }
    factors.push({
      factor: 'Steep terrain',
      points: terrainPoints,
      category: 'TERRAIN',
      description: terrainDesc
    });

    // 3. Incident History & Active Blockage (0 - 35 points)
    let incidentPoints = 0;
    let incidentDesc = '';
    if (hasActiveIncident) {
      if (incidentSeverity === 'CRITICAL' || segment.status === 'BLOCKED') {
        incidentPoints = 35;
        incidentDesc = 'Confirmed major slope failure with debris actively obstructing carriageway';
      } else {
        incidentPoints = 18;
        incidentDesc = 'Field-reported minor displacement and active rockfall warnings';
      }
    } else if (segment.id === 'S-08') {
      incidentPoints = 18;
      incidentDesc = 'Recent field report indicating recurrent sub-base slippage';
    } else {
      incidentPoints = 2;
      incidentDesc = 'No active incidents reported in 24-hour window';
    }
    factors.push({
      factor: hasActiveIncident && incidentSeverity === 'CRITICAL' ? 'Confirmed Landslide' : 'Recent incident',
      points: incidentPoints,
      category: 'INCIDENT_HISTORY',
      description: incidentDesc
    });

    // 4. Soil Moisture / Historical Exposure (0 - 10 points)
    let soilPoints = segment.id === 'S-08' ? 8 : 4;
    factors.push({
      factor: 'Historical exposure',
      points: soilPoints,
      category: 'SOIL_MOISTURE',
      description: 'Antecedent moisture saturation and known geological faulting zone'
    });

    // Sum points
    const totalScore = Math.min(100, weatherPoints + terrainPoints + incidentPoints + soilPoints);

    let level: RiskLevel = 'LOW';
    if (totalScore >= 85) level = 'CRITICAL';
    else if (totalScore >= 65) level = 'HIGH';
    else if (totalScore >= 40) level = 'MEDIUM';
    else level = 'LOW';

    let riskType: RiskType = 'NORMAL';
    if (segment.slope_deg >= 20 && totalScore > 40) {
      riskType = 'LANDSLIDE';
    } else if (segment.elevation_m < 100 && totalScore > 40) {
      riskType = 'FLOOD';
    } else if (totalScore > 40) {
      riskType = 'ROAD_DAMAGE';
    }

    return {
      segment_id: segment.id,
      score: totalScore,
      level,
      risk_type: riskType,
      confidence: 'PROTOTYPE_ESTIMATE',
      factors,
      engine_version: this.version,
      horizon: 'NEXT_6_HOURS',
      generated_at: new Date().toISOString(),
      source: 'synthetic',
      environment: 'demo'
    };
  }
}
