import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  Incident,
  SyncBatchRequest,
  SyncBatchResponse,
  ScenarioEventRequest,
  OperationalEvent
} from '@ner-sentinel/types';

import { MemoryStore } from './database/memory.store';
import { RiskEngine } from './engines/risk.engine';
import { RouteEngine } from './engines/route.engine';
import { SseBroker } from './realtime/sse.broker';
import { ScenarioManager } from './state/scenario.manager';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// 1. Initialize Core Services
const store = new MemoryStore();
const riskEngine = new RiskEngine();
const routeEngine = new RouteEngine();
const sseBroker = new SseBroker();
const scenarioManager = new ScenarioManager(store, riskEngine, routeEngine, sseBroker);

// 2. Processed Idempotency Keys Cache for Offline Sync
const processedSyncKeys = new Set<string>();

// ----------------------------------------------------------------------------
// Health Check Endpoint
// ----------------------------------------------------------------------------
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'ner-sentinel-api',
    version: '1.0.0',
    environment: 'demo',
    timestamp: new Date().toISOString()
  });
});

// ----------------------------------------------------------------------------
// Realtime Stream (Server-Sent Events)
// ----------------------------------------------------------------------------
app.get('/events', (req: Request, res: Response) => {
  sseBroker.registerClient(res);
});

// ----------------------------------------------------------------------------
// Unified State & Scenario Control
// ----------------------------------------------------------------------------
app.get('/scenario/state', async (req: Request, res: Response) => {
  try {
    const state = await scenarioManager.getFullState();
    res.json({
      environment: 'demo',
      source: 'synthetic',
      ...state
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/scenario/events', async (req: Request, res: Response) => {
  try {
    const payload: ScenarioEventRequest = req.body;
    const result = await scenarioManager.triggerScenario(payload);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/scenario/reset', async (req: Request, res: Response) => {
  try {
    const result = await scenarioManager.triggerScenario({ scenario: 'RESET' });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// Map & Road Segments
// ----------------------------------------------------------------------------
app.get('/map/segments', async (req: Request, res: Response) => {
  try {
    const { status, corridor_id } = req.query;
    let segments = await store.getSegments();

    if (status) {
      segments = segments.filter((s) => s.status === status);
    }
    if (corridor_id) {
      segments = segments.filter((s) => s.corridor_id === corridor_id);
    }

    res.json({
      type: 'FeatureCollection',
      environment: 'demo',
      source: 'synthetic',
      features: segments.map((s) => ({
        type: 'Feature',
        id: s.id,
        properties: s,
        geometry: s.geometry
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/risk/:segmentId', async (req: Request, res: Response) => {
  try {
    const { segmentId } = req.params;
    const segment = await store.getSegmentById(segmentId);
    if (!segment) {
      return res.status(404).json({ error: `Segment not found: ${segmentId}` });
    }

    const currentScenario = scenarioManager.getCurrentScenario();
    const rainfall = currentScenario === 'HEAVY_RAIN' || currentScenario === 'LANDSLIDE' ? 65 : 12;
    const hasIncident = currentScenario === 'LANDSLIDE' && segmentId === 'S-08';

    const evalResult = riskEngine.evaluateSegment({
      segment,
      currentRainfallMmH: rainfall,
      hasActiveIncident: hasIncident,
      incidentSeverity: hasIncident ? 'CRITICAL' : undefined
    });

    res.json(evalResult);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// Incidents & Field Reporting
// ----------------------------------------------------------------------------
app.get('/incidents', async (req: Request, res: Response) => {
  try {
    const incidents = await store.getIncidents();
    res.json({
      environment: 'demo',
      incidents
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/reports', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const incident: Incident = {
      id: body.id || `INC-FIELD-${Date.now().toString(36).toUpperCase()}`,
      type: body.type || 'ROAD_DAMAGE',
      severity: body.severity || 'MEDIUM',
      latitude: Number(body.latitude) || 25.3522,
      longitude: Number(body.longitude) || 92.3619,
      segment_id: body.segment_id || 'S-08',
      photo_url: body.photo_url || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&auto=format&fit=crop&q=80',
      notes: body.notes || 'Field observation reported by mobile patrol.',
      created_at: new Date().toISOString(),
      reporter: body.reporter || {
        id: 'DRIVER-101',
        name: 'B. Barman',
        role: 'DRIVER'
      },
      verification_status: 'VERIFIED',
      source: 'field_report',
      environment: 'demo'
    };

    await store.createIncident(incident);

    // Record audit event
    const auditEvt: OperationalEvent = {
      id: `EVT-INC-${Date.now()}`,
      event_type: 'INCIDENT_REPORTED',
      severity: incident.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
      source: 'DRIVER_APP',
      entity_type: 'INCIDENT',
      entity_id: incident.id,
      title: `Field Incident Reported: ${incident.type}`,
      description: `${incident.notes} (Reported by ${incident.reporter.name})`,
      metadata: { incident_id: incident.id, severity: incident.severity },
      timestamp: new Date().toISOString(),
      environment: 'demo'
    };
    await store.recordOperationalEvent(auditEvt);

    // Broadcast update
    const state = await scenarioManager.getFullState();
    sseBroker.broadcast('STATE_DELTA', {
      type: 'STATE_DELTA',
      timestamp: new Date().toISOString(),
      payload: {
        active_scenario: state.active_scenario,
        incidents: state.incidents,
        event: auditEvt
      }
    });

    res.status(201).json({ success: true, incident });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// Offline Sync (Idempotent Batch Processing)
// ----------------------------------------------------------------------------
app.post('/sync', async (req: Request, res: Response) => {
  try {
    const payload: SyncBatchRequest = req.body;
    const { batch_id, reports = [] } = payload;

    let syncedCount = 0;
    let duplicateCount = 0;
    const errors: Array<{ id: string; error: string }> = [];

    for (const item of reports) {
      if (!item.idempotency_key) {
        errors.push({ id: item.id, error: 'Missing idempotency_key' });
        continue;
      }

      // Check idempotency key to prevent duplicates
      if (processedSyncKeys.has(item.idempotency_key)) {
        duplicateCount++;
        continue;
      }

      const incident: Incident = {
        id: item.id || `INC-SYNC-${uuidv4().substring(0, 8).toUpperCase()}`,
        type: item.type,
        severity: item.severity,
        latitude: item.latitude,
        longitude: item.longitude,
        segment_id: item.segment_id || 'S-08',
        photo_url: item.photo_base64 || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&auto=format&fit=crop&q=80',
        notes: `[OFFLINE SYNCED] ${item.notes}`,
        created_at: item.created_at || new Date().toISOString(),
        reporter: item.reporter,
        verification_status: 'VERIFIED',
        source: 'field_report',
        environment: 'demo'
      };

      await store.createIncident(incident);
      processedSyncKeys.add(item.idempotency_key);
      syncedCount++;
    }

    if (syncedCount > 0) {
      const auditEvt: OperationalEvent = {
        id: `EVT-SYNC-${Date.now()}`,
        event_type: 'OFFLINE_SYNC_COMPLETED',
        severity: 'INFO',
        source: 'DRIVER_APP',
        entity_type: 'SYSTEM',
        entity_id: batch_id || 'SYNC_BATCH',
        title: `Offline Reports Synced (${syncedCount} items)`,
        description: `Successfully ingested ${syncedCount} queued reports from offline driver cache. Duplicates filtered: ${duplicateCount}.`,
        metadata: { synced_count: syncedCount, duplicate_count: duplicateCount },
        timestamp: new Date().toISOString(),
        environment: 'demo'
      };
      await store.recordOperationalEvent(auditEvt);

      const state = await scenarioManager.getFullState();
      sseBroker.broadcast('STATE_DELTA', {
        type: 'STATE_DELTA',
        timestamp: new Date().toISOString(),
        payload: {
          active_scenario: state.active_scenario,
          incidents: state.incidents,
          event: auditEvt
        }
      });
    }

    const response: SyncBatchResponse = {
      synced_count: syncedCount,
      duplicate_count: duplicateCount,
      errors,
      acknowledged_at: new Date().toISOString()
    };
    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// Vehicles & Logistics Deliveries
// ----------------------------------------------------------------------------
app.get('/vehicles', async (req: Request, res: Response) => {
  try {
    const vehicles = await store.getVehicles();
    res.json({ environment: 'demo', vehicles });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/deliveries', async (req: Request, res: Response) => {
  try {
    const deliveries = await store.getDeliveries();
    res.json({ environment: 'demo', deliveries });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/trip/accept-route', async (req: Request, res: Response) => {
  try {
    const { vehicle_id = 'V-101' } = req.body;
    const result = await scenarioManager.acceptAlternateRoute(vehicle_id);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// Routing
// ----------------------------------------------------------------------------
app.post('/route', async (req: Request, res: Response) => {
  try {
    const segments = await store.getSegments();
    const blockedIds = segments.filter((s) => s.status === 'BLOCKED').map((s) => s.id);
    const routes = routeEngine.calculateRoutes({
      blockedSegmentIds: blockedIds,
      activeSegments: segments
    });
    res.json(routes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// Alerts
// ----------------------------------------------------------------------------
app.get('/alerts', async (req: Request, res: Response) => {
  try {
    const alerts = await store.getAlerts();
    res.json({ environment: 'demo', alerts });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/alerts/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { acknowledged_by = 'Operator / Driver' } = req.body;
    const alert = await store.acknowledgeAlert(id, acknowledged_by);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const state = await scenarioManager.getFullState();
    sseBroker.broadcast('STATE_DELTA', {
      type: 'STATE_DELTA',
      timestamp: new Date().toISOString(),
      payload: {
        active_scenario: state.active_scenario,
        alerts: state.alerts
      }
    });

    res.json({ success: true, alert });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// Operational Events / Live Audit Feed
// ----------------------------------------------------------------------------
app.get('/audit', async (req: Request, res: Response) => {
  try {
    const events = await store.getOperationalEvents(50);
    res.json({ environment: 'demo', events });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(` NER Sentinel Backend Service running on port ${PORT}`);
  console.log(` Environment: DEMO / SYNTHETIC DATA`);
  console.log(` Realtime SSE Stream available at http://localhost:${PORT}/events`);
  console.log(`========================================================`);
});
