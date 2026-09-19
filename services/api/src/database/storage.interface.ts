import {
  RoadSegment,
  Incident,
  Vehicle,
  Delivery,
  Alert,
  OperationalEvent,
  RiskScoreResponse,
  RouteRecommendation
} from '@ner-sentinel/types';

export interface IStorageRepository {
  // Road segments
  getSegments(): Promise<RoadSegment[]>;
  getSegmentById(id: string): Promise<RoadSegment | null>;
  updateSegment(id: string, patch: Partial<RoadSegment>): Promise<RoadSegment>;

  // Incidents
  getIncidents(): Promise<Incident[]>;
  getIncidentById(id: string): Promise<Incident | null>;
  createIncident(incident: Incident): Promise<Incident>;
  updateIncident(id: string, patch: Partial<Incident>): Promise<Incident>;

  // Vehicles
  getVehicles(): Promise<Vehicle[]>;
  getVehicleById(id: string): Promise<Vehicle | null>;
  updateVehicle(id: string, patch: Partial<Vehicle>): Promise<Vehicle>;

  // Deliveries
  getDeliveries(): Promise<Delivery[]>;
  getDeliveryById(id: string): Promise<Delivery | null>;
  updateDelivery(id: string, patch: Partial<Delivery>): Promise<Delivery>;

  // Alerts
  getAlerts(): Promise<Alert[]>;
  createAlert(alert: Alert): Promise<Alert>;
  acknowledgeAlert(id: string, acknowledgedBy: string): Promise<Alert | null>;

  // Operational Events / Audit
  getOperationalEvents(limit?: number): Promise<OperationalEvent[]>;
  recordOperationalEvent(event: OperationalEvent): Promise<OperationalEvent>;

  // Snapshot / Reset
  resetToBaseline(): Promise<void>;
}
