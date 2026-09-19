import fs from 'fs';
import path from 'path';
import {
  RoadSegment,
  Incident,
  Vehicle,
  Delivery,
  Alert,
  OperationalEvent
} from '@ner-sentinel/types';
import { IStorageRepository } from './storage.interface';

export class MemoryStore implements IStorageRepository {
  private segments: Map<string, RoadSegment> = new Map();
  private incidents: Map<string, Incident> = new Map();
  private vehicles: Map<string, Vehicle> = new Map();
  private deliveries: Map<string, Delivery> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private operationalEvents: OperationalEvent[] = [];

  private demoDataDir: string;

  constructor() {
    this.demoDataDir = path.resolve(__dirname, '../../../../packages/demo-data');
    this.loadBaseline();
  }

  private readJson<T>(filename: string): T {
    const fullPath = path.join(this.demoDataDir, filename);
    const content = fs.readFileSync(fullPath, 'utf-8');
    return JSON.parse(content) as T;
  }

  private loadBaseline(): void {
    // 1. Clear maps
    this.segments.clear();
    this.incidents.clear();
    this.vehicles.clear();
    this.deliveries.clear();
    this.alerts.clear();
    this.operationalEvents = [];

    // 2. Load roads.geojson
    const roadsGeoJson = this.readJson<{ features: Array<{ id: string; properties: any; geometry: any }> }>('roads.geojson');
    for (const feature of roadsGeoJson.features) {
      const seg: RoadSegment = {
        id: feature.properties.id,
        corridor_id: feature.properties.corridor_id,
        name: feature.properties.name,
        geometry: feature.geometry,
        road_class: feature.properties.road_class,
        status: feature.properties.status,
        risk_score: feature.properties.risk_score,
        risk_level: feature.properties.risk_level,
        risk_factors: [
          {
            factor: 'Baseline mountain terrain exposure',
            points: Math.min(feature.properties.risk_score, 12),
            category: 'TERRAIN',
            description: `Elevation ${feature.properties.elevation_m}m with slope ${feature.properties.slope_deg}°`
          }
        ],
        elevation_m: feature.properties.elevation_m,
        slope_deg: feature.properties.slope_deg,
        surface_condition: feature.properties.surface_condition,
        verified_at: feature.properties.verified_at,
        source: 'synthetic',
        environment: 'demo',
        prototype_estimate: true
      };
      this.segments.set(seg.id, seg);
    }

    // 3. Load incidents.json (only baseline incidents)
    const incidentsSeed = this.readJson<Incident[]>('incidents.json');
    // For baseline, only seed INC-DEMO-01 (resolved)
    for (const inc of incidentsSeed) {
      if (inc.id === 'INC-DEMO-01') {
        this.incidents.set(inc.id, { ...inc });
      }
    }

    // 4. Load vehicles.json
    const vehiclesSeed = this.readJson<Vehicle[]>('vehicles.json');
    for (const veh of vehiclesSeed) {
      this.vehicles.set(veh.id, { ...veh });
    }

    // 5. Load deliveries.json
    const deliveriesSeed = this.readJson<Delivery[]>('deliveries.json');
    for (const del of deliveriesSeed) {
      this.deliveries.set(del.id, { ...del });
    }

    // 6. Record initialization audit event
    this.recordOperationalEvent({
      id: `EVT-INIT-${Date.now()}`,
      event_type: 'DEMO_RESET',
      severity: 'INFO',
      source: 'SCENARIO_ENGINE',
      entity_type: 'SYSTEM',
      entity_id: 'SYSTEM_BASELINE',
      title: 'Demo Environment Baseline Hydrated',
      description: 'Loaded deterministic synthetic seed dataset for NER Mountain Highway Lifeline Corridors.',
      timestamp: new Date().toISOString(),
      environment: 'demo'
    });
  }

  // --- Segments ---
  async getSegments(): Promise<RoadSegment[]> {
    return Array.from(this.segments.values());
  }

  async getSegmentById(id: string): Promise<RoadSegment | null> {
    return this.segments.get(id) || null;
  }

  async updateSegment(id: string, patch: Partial<RoadSegment>): Promise<RoadSegment> {
    const existing = this.segments.get(id);
    if (!existing) {
      throw new Error(`Road segment not found: ${id}`);
    }
    const updated = { ...existing, ...patch };
    this.segments.set(id, updated);
    return updated;
  }

  // --- Incidents ---
  async getIncidents(): Promise<Incident[]> {
    return Array.from(this.incidents.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async getIncidentById(id: string): Promise<Incident | null> {
    return this.incidents.get(id) || null;
  }

  async createIncident(incident: Incident): Promise<Incident> {
    this.incidents.set(incident.id, incident);
    return incident;
  }

  async updateIncident(id: string, patch: Partial<Incident>): Promise<Incident> {
    const existing = this.incidents.get(id);
    if (!existing) {
      throw new Error(`Incident not found: ${id}`);
    }
    const updated = { ...existing, ...patch };
    this.incidents.set(id, updated);
    return updated;
  }

  // --- Vehicles ---
  async getVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }

  async getVehicleById(id: string): Promise<Vehicle | null> {
    return this.vehicles.get(id) || null;
  }

  async updateVehicle(id: string, patch: Partial<Vehicle>): Promise<Vehicle> {
    const existing = this.vehicles.get(id);
    if (!existing) {
      throw new Error(`Vehicle not found: ${id}`);
    }
    const updated = { ...existing, ...patch };
    this.vehicles.set(id, updated);
    return updated;
  }

  // --- Deliveries ---
  async getDeliveries(): Promise<Delivery[]> {
    return Array.from(this.deliveries.values());
  }

  async getDeliveryById(id: string): Promise<Delivery | null> {
    return this.deliveries.get(id) || null;
  }

  async updateDelivery(id: string, patch: Partial<Delivery>): Promise<Delivery> {
    const existing = this.deliveries.get(id);
    if (!existing) {
      throw new Error(`Delivery not found: ${id}`);
    }
    const updated = { ...existing, ...patch };
    this.deliveries.set(id, updated);
    return updated;
  }

  // --- Alerts ---
  async getAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async createAlert(alert: Alert): Promise<Alert> {
    this.alerts.set(alert.id, alert);
    return alert;
  }

  async acknowledgeAlert(id: string, acknowledgedBy: string): Promise<Alert | null> {
    const alert = this.alerts.get(id);
    if (!alert) return null;
    alert.acknowledged_at = new Date().toISOString();
    alert.acknowledged_by = acknowledgedBy;
    this.alerts.set(id, alert);
    return alert;
  }

  // --- Audit / Operational Events ---
  async getOperationalEvents(limit: number = 50): Promise<OperationalEvent[]> {
    return this.operationalEvents
      .slice()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async recordOperationalEvent(event: OperationalEvent): Promise<OperationalEvent> {
    this.operationalEvents.unshift(event);
    if (this.operationalEvents.length > 200) {
      this.operationalEvents.pop();
    }
    return event;
  }

  // --- Reset ---
  async resetToBaseline(): Promise<void> {
    this.loadBaseline();
  }
}
