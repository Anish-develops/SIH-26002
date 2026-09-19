import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Vehicle,
  Delivery,
  Alert,
  RouteRecommendation,
  ScenarioName,
  RealtimeStateDelta,
  SyncReportItem
} from '@ner-sentinel/types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function useDriverRealtime() {
  const [activeScenario, setActiveScenario] = useState<ScenarioName>('NORMAL');
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeRoute, setActiveRoute] = useState<RouteRecommendation | null>(null);
  const [alternateRoute, setAlternateRoute] = useState<RouteRecommendation | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/scenario/state`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setActiveScenario(data.active_scenario || 'NORMAL');
      const v = (data.vehicles || []).find((veh: Vehicle) => veh.id === 'V-101') || (data.vehicles || [])[0] || null;
      setVehicle(v);
      const d = (data.deliveries || []).find((del: Delivery) => del.vehicle_id === 'V-101') || (data.deliveries || [])[0] || null;
      setDelivery(d);
      setAlerts(data.alerts || []);
      setActiveRoute(data.active_route || null);
      setAlternateRoute(data.alternate_route || null);
      setConnectionStatus('connected');
    } catch (err) {
      console.warn('[useDriverRealtime] State fetch error:', err);
      setConnectionStatus('disconnected');
    }
  }, []);

  useEffect(() => {
    fetchState();

    const es = new EventSource(`${API_BASE}/events`);

    es.onopen = () => {
      setConnectionStatus('connected');
    };

    es.onerror = () => {
      setConnectionStatus('disconnected');
    };

    es.addEventListener('STATE_DELTA', (evt: MessageEvent) => {
      try {
        const delta: RealtimeStateDelta = JSON.parse(evt.data);
        if (delta.payload.active_scenario) {
          setActiveScenario(delta.payload.active_scenario);
        }
        if (delta.payload.vehicles) {
          const v = delta.payload.vehicles.find((veh) => veh.id === 'V-101');
          if (v) setVehicle(v);
        }
        if (delta.payload.deliveries) {
          const d = delta.payload.deliveries.find((del) => del.vehicle_id === 'V-101');
          if (d) setDelivery(d);
        }
        if (delta.payload.alerts) {
          setAlerts(delta.payload.alerts);
        }
        if (delta.payload.active_route !== undefined) {
          setActiveRoute(delta.payload.active_route);
        }
        if (delta.payload.alternate_route !== undefined) {
          setAlternateRoute(delta.payload.alternate_route);
        }
      } catch (err) {
        console.error('[useDriverRealtime] Parse error:', err);
      }
    });

    return () => {
      es.close();
    };
  }, [fetchState]);

  const acceptAlternateRoute = async (vehicleId: string = 'V-101') => {
    const res = await fetch(`${API_BASE}/trip/accept-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicle_id: vehicleId })
    });
    return await res.json();
  };

  const submitReport = async (report: SyncReportItem) => {
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report)
    });
    return await res.json();
  };

  const syncBatch = async (batchId: string, reports: SyncReportItem[]) => {
    const res = await fetch(`${API_BASE}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch_id: batchId, reports })
    });
    return await res.json();
  };

  return {
    activeScenario,
    vehicle,
    delivery,
    alerts,
    activeRoute,
    alternateRoute,
    connectionStatus,
    refresh: fetchState,
    acceptAlternateRoute,
    submitReport,
    syncBatch
  };
}
