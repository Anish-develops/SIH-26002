import { useState, useEffect, useCallback, useRef } from 'react';
import {
  RoadSegment,
  Incident,
  Vehicle,
  Delivery,
  Alert,
  OperationalEvent,
  RouteRecommendation,
  ScenarioName,
  RealtimeStateDelta
} from '@ner-sentinel/types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export interface StateStore {
  active_scenario: ScenarioName;
  segments: RoadSegment[];
  incidents: Incident[];
  vehicles: Vehicle[];
  deliveries: Delivery[];
  alerts: Alert[];
  active_route: RouteRecommendation | null;
  alternate_route: RouteRecommendation | null;
  recent_events: OperationalEvent[];
}

export function useRealtime() {
  const [store, setStore] = useState<StateStore>({
    active_scenario: 'NORMAL',
    segments: [],
    incidents: [],
    vehicles: [],
    deliveries: [],
    alerts: [],
    active_route: null,
    alternate_route: null,
    recent_events: []
  });

  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());
  const [loading, setLoading] = useState<boolean>(true);
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchFullState = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/scenario/state`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStore({
        active_scenario: data.active_scenario,
        segments: data.segments || [],
        incidents: data.incidents || [],
        vehicles: data.vehicles || [],
        deliveries: data.deliveries || [],
        alerts: data.alerts || [],
        active_route: data.active_route || null,
        alternate_route: data.alternate_route || null,
        recent_events: data.recent_events || []
      });
      setLastUpdated(new Date().toISOString());
      setLoading(false);
    } catch (err) {
      console.warn('[useRealtime] Failed to fetch state from backend:', err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFullState();

    const sseUrl = `${API_BASE}/events`;
    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnectionStatus('connected');
    };

    es.onerror = () => {
      setConnectionStatus('disconnected');
    };

    es.addEventListener('connected', () => {
      setConnectionStatus('connected');
    });

    es.addEventListener('STATE_DELTA', (event: MessageEvent) => {
      try {
        const delta: RealtimeStateDelta = JSON.parse(event.data);
        setStore((prev) => ({
          active_scenario: delta.payload.active_scenario || prev.active_scenario,
          segments: delta.payload.segments || prev.segments,
          incidents: delta.payload.incidents || prev.incidents,
          vehicles: delta.payload.vehicles || prev.vehicles,
          deliveries: delta.payload.deliveries || prev.deliveries,
          alerts: delta.payload.alerts || prev.alerts,
          active_route: delta.payload.active_route !== undefined ? delta.payload.active_route : prev.active_route,
          alternate_route: delta.payload.alternate_route !== undefined ? delta.payload.alternate_route : prev.alternate_route,
          recent_events: delta.payload.event
            ? [delta.payload.event, ...prev.recent_events].slice(0, 30)
            : prev.recent_events
        }));
        setLastUpdated(new Date().toISOString());
      } catch (err) {
        console.error('[useRealtime] Error processing STATE_DELTA:', err);
      }
    });

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [fetchFullState]);

  const triggerScenario = async (scenario: ScenarioName) => {
    try {
      const res = await fetch(`${API_BASE}/scenario/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario })
      });
      return await res.json();
    } catch (err: any) {
      console.error('[triggerScenario] Failed:', err);
      throw err;
    }
  };

  const resetDemo = async () => {
    try {
      const res = await fetch(`${API_BASE}/scenario/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return await res.json();
    } catch (err: any) {
      console.error('[resetDemo] Failed:', err);
      throw err;
    }
  };

  const acknowledgeAlert = async (id: string, acknowledgedBy: string = 'Command Center Operator') => {
    try {
      const res = await fetch(`${API_BASE}/alerts/${id}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acknowledged_by: acknowledgedBy })
      });
      return await res.json();
    } catch (err: any) {
      console.error('[acknowledgeAlert] Failed:', err);
      throw err;
    }
  };

  const acceptAlternateRoute = async (vehicleId: string = 'V-101') => {
    try {
      const res = await fetch(`${API_BASE}/trip/accept-route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle_id: vehicleId })
      });
      return await res.json();
    } catch (err: any) {
      console.error('[acceptAlternateRoute] Failed:', err);
      throw err;
    }
  };

  return {
    ...store,
    connectionStatus,
    lastUpdated,
    loading,
    refreshState: fetchFullState,
    triggerScenario,
    resetDemo,
    acknowledgeAlert,
    acceptAlternateRoute
  };
}
