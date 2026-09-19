import React, { useState } from 'react';
import {
  RoadSegment,
  Incident,
  Vehicle,
  Delivery,
  Alert,
  OperationalEvent,
  RouteRecommendation
} from '@ner-sentinel/types';
import { KpiRibbon } from '../components/layout/KpiRibbon';
import { CommandMap } from '../components/map/CommandMap';
import { RoadDetailDrawer } from '../components/drawers/RoadDetailDrawer';
import { IncidentDetailModal } from '../components/drawers/IncidentDetailModal';
import {
  Bell,
  AlertTriangle,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Activity,
  History
} from 'lucide-react';

interface OverviewPageProps {
  segments: RoadSegment[];
  incidents: Incident[];
  vehicles: Vehicle[];
  deliveries: Delivery[];
  alerts: Alert[];
  activeRoute: RouteRecommendation | null;
  alternateRoute: RouteRecommendation | null;
  recentEvents: OperationalEvent[];
  onAcknowledgeAlert: (id: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  segments,
  incidents,
  vehicles,
  deliveries,
  alerts,
  activeRoute,
  alternateRoute,
  recentEvents,
  onAcknowledgeAlert,
  onNavigateTab
}) => {
  const [selectedSegment, setSelectedSegment] = useState<RoadSegment | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged_at);

  return (
    <div className="p-6 space-y-4 max-w-[1720px] mx-auto">
      {/* 1. KPI Ribbon */}
      <KpiRibbon
        segments={segments}
        incidents={incidents}
        vehicles={vehicles}
        deliveries={deliveries}
        alerts={alerts}
      />

      {/* 2. Main 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[640px]">
        {/* Left / Center (8 Columns) — GIS Command Map */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Regional Accessibility & Convoy GIS Canvas</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                (NH-6 & NH-27 Mountain Lifelines)
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('map')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1"
            >
              <span>Full Screen Map</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 min-h-[560px]">
            <CommandMap
              segments={segments}
              incidents={incidents}
              vehicles={vehicles}
              activeRoute={activeRoute}
              alternateRoute={alternateRoute}
              selectedSegmentId={selectedSegment?.id}
              onSelectSegment={(seg) => setSelectedSegment(seg)}
              onSelectIncident={(inc) => setSelectedIncident(inc)}
              showWeatherOverlay={true}
            />
          </div>
        </div>

        {/* Right (4 Columns) — Intelligence Action Panel */}
        <div className="lg:col-span-4 space-y-4 flex flex-col">
          {/* Critical Alerts Card */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Operational Alerts
                </h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {unacknowledgedAlerts.length} Active
              </span>
            </div>

            <div className="mt-3 space-y-2.5 flex-1 overflow-y-auto max-h-56 pr-1">
              {unacknowledgedAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-1.5" />
                  <span>No unacknowledged operational alerts.</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    All corridors operating within safe parameters.
                  </span>
                </div>
              ) : (
                unacknowledgedAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-xl border border-amber-500/40 bg-amber-950/20 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span className="text-xs font-bold text-amber-300">
                          {alert.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-800">
                        {alert.severity}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                      {alert.message}
                    </p>

                    {alert.expected_delay_text && (
                      <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Delay: {alert.expected_delay_text}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-amber-500/20">
                      <span className="text-[10px] text-slate-400 font-mono">
                        Target: {alert.target_id}
                      </span>
                      <button
                        onClick={() => onAcknowledgeAlert(alert.id)}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-black font-bold text-[10px] rounded transition-all active:scale-95"
                      >
                        Acknowledge
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Deliveries Card */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Active Essential Deliveries
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('logistics')}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-medium"
              >
                View All
              </button>
            </div>

            <div className="mt-3 space-y-2.5 flex-1 overflow-y-auto max-h-56 pr-1">
              {deliveries.slice(0, 3).map((del) => {
                const isMedicine = del.commodity === 'MEDICINE';
                const isRerouted = del.status === 'REROUTED';
                return (
                  <div
                    key={del.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isRerouted
                        ? 'border-amber-500/50 bg-amber-950/20'
                        : isMedicine
                        ? 'border-blue-500/40 bg-blue-950/20'
                        : 'border-slate-800 bg-[#151e33]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                            {del.id}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                              del.priority === 'CRITICAL'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-blue-950 text-blue-300 border border-blue-800'
                            }`}
                          >
                            {del.priority}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white mt-1 leading-snug">
                          {del.title}
                        </h4>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-xs font-bold text-emerald-400">
                          ETA {del.current_eta}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {del.distance_km} km
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-1 border-t border-slate-800/80">
                      <span>Vehicle: {del.vehicle_id}</span>
                      <span
                        className={`font-semibold ${
                          del.status === 'ON_TIME'
                            ? 'text-emerald-400'
                            : 'text-amber-400 font-bold'
                        }`}
                      >
                        {del.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operational Event Audit Stream Card */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Live Audit Timeline
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">SSE Log</span>
            </div>

            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto pr-1 text-xs">
              {recentEvents.slice(0, 4).map((evt) => (
                <div key={evt.id} className="text-[11px] p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="text-blue-400 font-bold">{evt.event_type}</span>
                    <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-slate-200 font-medium mt-0.5">{evt.title}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-1">{evt.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Road Segment Detail Drawer */}
      <RoadDetailDrawer
        segment={selectedSegment}
        onClose={() => setSelectedSegment(null)}
      />

      {/* Incident Detail Modal */}
      <IncidentDetailModal
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
      />
    </div>
  );
};
