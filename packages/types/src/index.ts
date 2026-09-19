/**
 * NER Sentinel - Shared TypeScript Domain Definitions
 * SIH Problem Statement 26002 | Decision-Support Platform for NER
 *
 * NOTE: All data is marked with environment: 'demo' and source: 'synthetic'.
 */

export type EnvironmentTag = 'demo';
export type SourceTag = 'synthetic' | 'field_report' | 'replayed';

export type RoadStatus = 'OPEN' | 'RESTRICTED' | 'BLOCKED' | 'UNKNOWN';
export type RoadClass = 'NATIONAL_HIGHWAY' | 'STATE_HIGHWAY' | 'DISTRICT_ROAD';
export type SurfaceCondition = 'PAVED_GOOD' | 'PAVED_DAMAGED' | 'UNPAVED' | 'MUD_OBSTRUCTION';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RiskType = 'LANDSLIDE' | 'FLOOD' | 'ROAD_DAMAGE' | 'NORMAL';
export type RiskCategory = 'WEATHER' | 'TERRAIN' | 'INCIDENT_HISTORY' | 'SOIL_MOISTURE';

export interface RiskFactorBreakdown {
  factor: string;
  points: number;
  category: RiskCategory;
  description: string;
}

export interface RiskScoreResponse {
  segment_id: string;
  score: number;
  level: RiskLevel;
  risk_type: RiskType;
  confidence: 'PROTOTYPE_ESTIMATE';
  factors: RiskFactorBreakdown[];
  engine_version: string;
  horizon: 'NEXT_6_HOURS';
  generated_at: string;
  source: SourceTag;
  environment: EnvironmentTag;
}

export interface RoadSegment {
  id: string;
  corridor_id: string;
  name: string;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][]; // [longitude, latitude]
  };
  road_class: RoadClass;
  status: RoadStatus;
  risk_score: number;
  risk_level: RiskLevel;
  risk_factors: RiskFactorBreakdown[];
  elevation_m: number;
  slope_deg: number;
  surface_condition: SurfaceCondition;
  verified_at: string;
  source: SourceTag;
  environment: EnvironmentTag;
  prototype_estimate: true;
}

export type IncidentType =
  | 'LANDSLIDE'
  | 'FLOOD'
  | 'ROAD_DAMAGE'
  | 'BRIDGE_DAMAGE'
  | 'TRAFFIC'
  | 'ACCIDENT'
  | 'OTHER';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'RESOLVED';

export interface ReporterInfo {
  id: string;
  name: string;
  role: 'DRIVER' | 'FIELD_OFFICER' | 'DISPATCH' | 'OPERATOR';
  phone?: string;
}

export interface Incident {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  latitude: number;
  longitude: number;
  segment_id: string;
  photo_url?: string;
  notes: string;
  created_at: string;
  reporter: ReporterInfo;
  verification_status: VerificationStatus;
  source: SourceTag;
  environment: EnvironmentTag;
}

export type VehicleStatus = 'ON_ROUTE' | 'DELAYED' | 'REROUTED' | 'IDLE';

export interface Vehicle {
  id: string;
  trip_id: string;
  vehicle_number: string;
  driver_name: string;
  driver_phone: string;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  heading_deg: number;
  telemetry_at: string;
  status: VehicleStatus;
  current_corridor: string;
}

export type CommodityType = 'MEDICINE' | 'FOOD' | 'CONSTRUCTION' | 'AGRICULTURAL' | 'OTHER';
export type DeliveryPriority = 'CRITICAL' | 'HIGH' | 'NORMAL';
export type DeliveryStatus = 'ON_TIME' | 'DELAYED' | 'REROUTED' | 'DELIVERED';

export interface LocationPoint {
  name: string;
  latitude: number;
  longitude: number;
}

export interface Delivery {
  id: string;
  commodity: CommodityType;
  priority: DeliveryPriority;
  title: string;
  origin: LocationPoint;
  destination: LocationPoint;
  vehicle_id: string;
  planned_eta: string;
  current_eta: string;
  eta_minutes: number;
  distance_km: number;
  status: DeliveryStatus;
  risk_exposure: RiskLevel;
  active_corridor: string;
  notes?: string;
}

export type RouteStatus = 'ACTIVE' | 'RECOMMENDED' | 'IMPASSABLE' | 'STANDBY';

export interface RouteRecommendation {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distance_km: number;
  eta_minutes: number;
  eta_formatted: string;
  risk_score: number;
  risk_level: RiskLevel;
  status: RouteStatus;
  reasons: string[];
  waypoints: [number, number][]; // [longitude, latitude]
}

export interface Alert {
  id: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  message_key: string;
  target_id: string;
  target_type: 'VEHICLE' | 'CORRIDOR';
  affected_segment_id: string;
  expected_delay_text: string;
  recommended_action: string;
  alternate_route_id?: string;
  created_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
}

export type OperationalEventType =
  | 'SCENARIO_TRIGGERED'
  | 'WEATHER_SURGE'
  | 'RISK_ESCALATED'
  | 'ROAD_BLOCKED'
  | 'ROAD_RESTRICTED'
  | 'ROUTE_RECALCULATED'
  | 'ALERT_DISPATCHED'
  | 'ALERT_ACKNOWLEDGED'
  | 'INCIDENT_REPORTED'
  | 'OFFLINE_SYNC_COMPLETED'
  | 'DEMO_RESET';

export interface OperationalEvent {
  id: string;
  event_type: OperationalEventType;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  source: 'SYSTEM_RISK_ENGINE' | 'ROUTE_ENGINE' | 'DRIVER_APP' | 'OPERATOR_CONSOLE' | 'SCENARIO_ENGINE';
  entity_type: 'ROAD_SEGMENT' | 'VEHICLE' | 'DELIVERY' | 'INCIDENT' | 'SYSTEM' | 'ALERT';
  entity_id: string;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  environment: EnvironmentTag;
}

export type ScenarioName =
  | 'NORMAL'
  | 'HEAVY_RAIN'
  | 'LANDSLIDE'
  | 'BLOCK_ROAD'
  | 'VEHICLE_DELAY'
  | 'RECOVERY'
  | 'RESET';

export interface ScenarioEventRequest {
  scenario: ScenarioName;
  target_segment_id?: string;
  rainfall_mm_h?: number;
  notes?: string;
}

export interface SyncReportItem {
  id: string;
  idempotency_key: string;
  type: IncidentType;
  severity: IncidentSeverity;
  latitude: number;
  longitude: number;
  segment_id?: string;
  notes: string;
  photo_base64?: string;
  created_at: string;
  reporter: ReporterInfo;
}

export interface SyncBatchRequest {
  batch_id: string;
  reports: SyncReportItem[];
}

export interface SyncBatchResponse {
  synced_count: number;
  duplicate_count: number;
  errors: Array<{ id: string; error: string }>;
  acknowledged_at: string;
}

export interface RealtimeStateDelta {
  type: 'STATE_DELTA' | 'OPERATIONAL_EVENT' | 'ALERT_EVENT';
  timestamp: string;
  payload: {
    active_scenario: ScenarioName;
    segments?: RoadSegment[];
    incidents?: Incident[];
    vehicles?: Vehicle[];
    deliveries?: Delivery[];
    alerts?: Alert[];
    active_route?: RouteRecommendation;
    alternate_route?: RouteRecommendation;
    event?: OperationalEvent;
  };
}
