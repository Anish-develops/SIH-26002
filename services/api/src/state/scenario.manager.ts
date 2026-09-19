import {
  ScenarioName,
  ScenarioEventRequest,
  RoadSegment,
  Incident,
  Vehicle,
  Delivery,
  Alert,
  OperationalEvent,
  RouteRecommendation,
  RealtimeStateDelta
} from '@ner-sentinel/types';
import { IStorageRepository } from '../database/storage.interface';
import { RiskEngine } from '../engines/risk.engine';
import { RouteEngine } from '../engines/route.engine';
import { SseBroker } from '../realtime/sse.broker';

export class ScenarioManager {
  private currentScenario: ScenarioName = 'NORMAL';

  constructor(
    private store: IStorageRepository,
    private riskEngine: RiskEngine,
    private routeEngine: RouteEngine,
    private sseBroker: SseBroker
  ) {}

  getCurrentScenario(): ScenarioName {
    return this.currentScenario;
  }

  async getFullState(): Promise<{
    active_scenario: ScenarioName;
    segments: RoadSegment[];
    incidents: Incident[];
    vehicles: Vehicle[];
    deliveries: Delivery[];
    alerts: Alert[];
    active_route: RouteRecommendation;
    alternate_route: RouteRecommendation;
    recent_events: OperationalEvent[];
  }> {
    const segments = await this.store.getSegments();
    const incidents = await this.store.getIncidents();
    const vehicles = await this.store.getVehicles();
    const deliveries = await this.store.getDeliveries();
    const alerts = await this.store.getAlerts();
    const recent_events = await this.store.getOperationalEvents(20);

    const blockedIds = segments.filter((s) => s.status === 'BLOCKED').map((s) => s.id);
    const routes = this.routeEngine.calculateRoutes({
      blockedSegmentIds: blockedIds,
      activeSegments: segments
    });

    return {
      active_scenario: this.currentScenario,
      segments,
      incidents,
      vehicles,
      deliveries,
      alerts,
      active_route: routes.primary,
      alternate_route: routes.alternate,
      recent_events
    };
  }

  async triggerScenario(request: ScenarioEventRequest): Promise<any> {
    const { scenario } = request;

    if (scenario === 'RESET' || scenario === 'NORMAL') {
      await this.store.resetToBaseline();
      this.currentScenario = 'NORMAL';

      const state = await this.getFullState();

      this.sseBroker.broadcast('STATE_DELTA', {
        type: 'STATE_DELTA',
        timestamp: new Date().toISOString(),
        payload: {
          active_scenario: 'NORMAL',
          segments: state.segments,
          incidents: state.incidents,
          vehicles: state.vehicles,
          deliveries: state.deliveries,
          alerts: state.alerts,
          active_route: state.active_route,
          alternate_route: state.alternate_route
        }
      });

      return { success: true, scenario: 'NORMAL', message: 'Demo reset to baseline state.' };
    }

    if (scenario === 'HEAVY_RAIN') {
      this.currentScenario = 'HEAVY_RAIN';

      // 1. Get S-08 segment
      const s08 = await this.store.getSegmentById('S-08');
      if (s08) {
        // Evaluate risk with 65 mm/h
        const riskEval = this.riskEngine.evaluateSegment({
          segment: s08,
          currentRainfallMmH: 65,
          hasActiveIncident: false
        });

        // Update S-08 segment
        await this.store.updateSegment('S-08', {
          status: 'RESTRICTED',
          risk_score: 78,
          risk_level: 'HIGH',
          risk_factors: riskEval.factors
        });
      }

      // 2. Create High-Priority Alert
      const alert: Alert = {
        id: `ALT-RAIN-${Date.now()}`,
        severity: 'HIGH',
        title: 'Landslide Risk Increased',
        message:
          'Corridor A / Segment S-08 has reached HIGH RISK due to heavy rainfall (65 mm/h). Expected delay: +2h 14m. Recommended action: Monitor corridor and standby for reroute.',
        message_key: 'alert_landslide_risk_high',
        target_id: 'V-101',
        target_type: 'VEHICLE',
        affected_segment_id: 'S-08',
        expected_delay_text: '+2h 14m',
        recommended_action: 'Prepare alternate route diversion via Corridor B',
        created_at: new Date().toISOString()
      };
      await this.store.createAlert(alert);

      // 3. Update Delivery Risk Exposure
      await this.store.updateDelivery('DEL-MED-01', {
        risk_exposure: 'HIGH'
      });

      // 4. Record Audit Event
      const auditEvt: OperationalEvent = {
        id: `EVT-RAIN-${Date.now()}`,
        event_type: 'WEATHER_SURGE',
        severity: 'WARNING',
        source: 'SYSTEM_RISK_ENGINE',
        entity_type: 'ROAD_SEGMENT',
        entity_id: 'S-08',
        title: 'Heavy Rainfall Surge Detected (65 mm/h)',
        description: 'Risk score escalated to 78/100 (HIGH) for Segment S-08. Pre-emptive alert dispatched to Vehicle V-101.',
        metadata: { rainfall_mm_h: 65, expected_delay: '+2h 14m' },
        timestamp: new Date().toISOString(),
        environment: 'demo'
      };
      await this.store.recordOperationalEvent(auditEvt);

      // 5. Broadcast to SSE clients
      const state = await this.getFullState();
      this.sseBroker.broadcast('STATE_DELTA', {
        type: 'STATE_DELTA',
        timestamp: new Date().toISOString(),
        payload: {
          active_scenario: 'HEAVY_RAIN',
          segments: state.segments,
          deliveries: state.deliveries,
          alerts: state.alerts,
          event: auditEvt
        }
      });

      return { success: true, scenario: 'HEAVY_RAIN', alert, state };
    }

    if (scenario === 'LANDSLIDE' || scenario === 'BLOCK_ROAD') {
      this.currentScenario = 'LANDSLIDE';

      // 1. Update S-08 segment to BLOCKED and CRITICAL risk (95)
      const s08 = await this.store.getSegmentById('S-08');
      if (s08) {
        const riskEval = this.riskEngine.evaluateSegment({
          segment: s08,
          currentRainfallMmH: 65,
          hasActiveIncident: true,
          incidentSeverity: 'CRITICAL'
        });

        await this.store.updateSegment('S-08', {
          status: 'BLOCKED',
          risk_score: 95,
          risk_level: 'CRITICAL',
          surface_condition: 'MUD_OBSTRUCTION',
          risk_factors: riskEval.factors
        });
      }

      // 2. Add verified incident INC-DEMO-02
      const landslideIncident: Incident = {
        id: 'INC-DEMO-02',
        type: 'LANDSLIDE',
        severity: 'CRITICAL',
        latitude: 25.2631,
        longitude: 92.4285,
        segment_id: 'S-08',
        photo_url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&auto=format&fit=crop&q=80',
        notes: 'Severe slope failure triggered by intense monsoon rainfall (65 mm/h). Mud and boulder mass covering both carriageway lanes near tunnel approach.',
        created_at: new Date().toISOString(),
        reporter: {
          id: 'OFF-409',
          name: 'K. Nath',
          role: 'FIELD_OFFICER',
          phone: '+91-94350-99881'
        },
        verification_status: 'VERIFIED',
        source: 'field_report',
        environment: 'demo'
      };
      await this.store.createIncident(landslideIncident);

      // 3. Recalculate routes: Primary is impassable, Alternate B is 6h 03m (206 km)
      const stateBefore = await this.getFullState();
      const routes = this.routeEngine.calculateRoutes({
        blockedSegmentIds: ['S-08'],
        activeSegments: stateBefore.segments
      });

      // 4. Update Delivery DEL-MED-01 with unified numbers
      await this.store.updateDelivery('DEL-MED-01', {
        status: 'DELAYED',
        current_eta: '6h 03m',
        eta_minutes: 363,
        distance_km: 206,
        risk_exposure: 'HIGH',
        notes: 'Corridor A blocked at Segment S-08. Alternate Corridor B (via NH-27 Lumding-Haflong) recommended.'
      });

      // 5. Generate Route Updated Alert
      const alert: Alert = {
        id: `ALT-ROUTE-UPDATE-${Date.now()}`,
        severity: 'HIGH',
        title: 'ROUTE UPDATED — Road Closure Detected Ahead',
        message:
          'Road closure detected ahead on Segment S-08. Previous ETA: 5h 12m. New ETA: 6h 03m. Recommended Route: Alternative Corridor B (206 km).',
        message_key: 'alert_route_updated_closure',
        target_id: 'V-101',
        target_type: 'VEHICLE',
        affected_segment_id: 'S-08',
        expected_delay_text: '+51m (New ETA: 6h 03m)',
        recommended_action: 'Accept Alternate Corridor B (via NH-27 Lumding-Haflong)',
        alternate_route_id: 'ROUTE-CORRIDOR-B',
        created_at: new Date().toISOString()
      };
      await this.store.createAlert(alert);

      // 6. Record Audit Events
      const auditEvtRoad: OperationalEvent = {
        id: `EVT-BLOCK-${Date.now()}`,
        event_type: 'ROAD_BLOCKED',
        severity: 'CRITICAL',
        source: 'SYSTEM_RISK_ENGINE',
        entity_type: 'ROAD_SEGMENT',
        entity_id: 'S-08',
        title: 'Corridor Closure: Segment S-08 BLOCKED',
        description: 'Physical road blockage confirmed at Sonapur Pass/Tunnel approach due to landslide debris.',
        metadata: { segment_id: 'S-08', status: 'BLOCKED', risk_score: 95 },
        timestamp: new Date().toISOString(),
        environment: 'demo'
      };
      await this.store.recordOperationalEvent(auditEvtRoad);

      const auditEvtReroute: OperationalEvent = {
        id: `EVT-REROUTE-${Date.now() + 1}`,
        event_type: 'ROUTE_RECALCULATED',
        severity: 'WARNING',
        source: 'ROUTE_ENGINE',
        entity_type: 'DELIVERY',
        entity_id: 'DEL-MED-01',
        title: 'Alternate Route Activated: Corridor B (206 km, ETA 6h 03m)',
        description: 'Optimized risk-aware bypass via NH-27 Lumding-Haflong corridor to avoid blocked section S-08.',
        metadata: { new_eta: '6h 03m', distance_km: 206, alternate_corridor: 'CORRIDOR-B-ALTERNATE' },
        timestamp: new Date().toISOString(),
        environment: 'demo'
      };
      await this.store.recordOperationalEvent(auditEvtReroute);

      // 7. Broadcast state delta
      const fullState = await this.getFullState();
      this.sseBroker.broadcast('STATE_DELTA', {
        type: 'STATE_DELTA',
        timestamp: new Date().toISOString(),
        payload: {
          active_scenario: 'LANDSLIDE',
          segments: fullState.segments,
          incidents: fullState.incidents,
          deliveries: fullState.deliveries,
          alerts: fullState.alerts,
          active_route: routes.primary,
          alternate_route: routes.alternate,
          event: auditEvtReroute
        }
      });

      return { success: true, scenario: 'LANDSLIDE', alert, routes, state: fullState };
    }

    if (scenario === 'RECOVERY') {
      this.currentScenario = 'RECOVERY';

      // S-08 returns to RESTRICTED (clearing underway)
      await this.store.updateSegment('S-08', {
        status: 'RESTRICTED',
        risk_score: 42,
        risk_level: 'MEDIUM',
        surface_condition: 'PAVED_DAMAGED'
      });

      const auditEvt: OperationalEvent = {
        id: `EVT-REC-${Date.now()}`,
        event_type: 'ROAD_RESTRICTED',
        severity: 'INFO',
        source: 'OPERATOR_CONSOLE',
        entity_type: 'ROAD_SEGMENT',
        entity_id: 'S-08',
        title: 'Emergency Single-Lane Clearance Underway',
        description: 'PWD earthmovers have cleared one lane on Segment S-08. Status transitioned from BLOCKED to RESTRICTED.',
        timestamp: new Date().toISOString(),
        environment: 'demo'
      };
      await this.store.recordOperationalEvent(auditEvt);

      const state = await this.getFullState();
      this.sseBroker.broadcast('STATE_DELTA', {
        type: 'STATE_DELTA',
        timestamp: new Date().toISOString(),
        payload: {
          active_scenario: 'RECOVERY',
          segments: state.segments,
          event: auditEvt
        }
      });

      return { success: true, scenario: 'RECOVERY', state };
    }

    return { error: 'Unknown scenario' };
  }

  async acceptAlternateRoute(vehicleId: string): Promise<any> {
    // 1. Update Vehicle V-101
    await this.store.updateVehicle(vehicleId, {
      status: 'REROUTED',
      current_corridor: 'CORRIDOR-B-ALTERNATE'
    });

    // 2. Update Delivery DEL-MED-01
    await this.store.updateDelivery('DEL-MED-01', {
      status: 'REROUTED',
      active_corridor: 'CORRIDOR-B-ALTERNATE',
      current_eta: '6h 03m',
      eta_minutes: 363,
      distance_km: 206
    });

    // 3. Acknowledge the alert
    const alerts = await this.store.getAlerts();
    const targetAlert = alerts.find((a) => a.target_id === vehicleId && !a.acknowledged_at);
    if (targetAlert) {
      await this.store.acknowledgeAlert(targetAlert.id, 'Driver B. Barman (AS-01-EC-4210)');
    }

    // 4. Record OperationalEvent
    const auditEvt: OperationalEvent = {
      id: `EVT-ACK-${Date.now()}`,
      event_type: 'ALERT_ACKNOWLEDGED',
      severity: 'INFO',
      source: 'DRIVER_APP',
      entity_type: 'VEHICLE',
      entity_id: vehicleId,
      title: 'Driver Accepted Alternate Route (Corridor B)',
      description: 'Driver B. Barman confirmed navigation diversion via NH-27 Lumding-Haflong corridor. Updated ETA: 6h 03m.',
      metadata: { vehicle_id: vehicleId, active_corridor: 'CORRIDOR-B-ALTERNATE', eta: '6h 03m' },
      timestamp: new Date().toISOString(),
      environment: 'demo'
    };
    await this.store.recordOperationalEvent(auditEvt);

    const fullState = await this.getFullState();
    this.sseBroker.broadcast('STATE_DELTA', {
      type: 'STATE_DELTA',
      timestamp: new Date().toISOString(),
      payload: {
        active_scenario: this.currentScenario,
        vehicles: fullState.vehicles,
        deliveries: fullState.deliveries,
        alerts: fullState.alerts,
        event: auditEvt
      }
    });

    return { success: true, message: 'Alternate route accepted', state: fullState };
  }
}
