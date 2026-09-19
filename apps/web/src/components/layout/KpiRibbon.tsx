import React from 'react';
import {
  CheckCircle,
  AlertTriangle,
  Flame,
  Truck,
  Clock,
  Bell
} from 'lucide-react';
import {
  RoadSegment,
  Incident,
  Vehicle,
  Delivery,
  Alert
} from '@ner-sentinel/types';

interface KpiRibbonProps {
  segments: RoadSegment[];
  incidents: Incident[];
  vehicles: Vehicle[];
  deliveries: Delivery[];
  alerts: Alert[];
}

export const KpiRibbon: React.FC<KpiRibbonProps> = ({
  segments,
  incidents,
  vehicles,
  deliveries,
  alerts
}) => {
  const totalSegments = segments.length || 1;
  const openSegments = segments.filter((s) => s.status === 'OPEN').length;
  const accessibilityPct = Math.round((openSegments / totalSegments) * 100);

  const highRiskCount = segments.filter(
    (s) => s.risk_level === 'HIGH' || s.risk_level === 'CRITICAL'
  ).length;

  const activeIncidents = incidents.filter(
    (i) => i.verification_status !== 'RESOLVED'
  ).length;

  const inTransitVehicles = vehicles.filter(
    (v) => v.status === 'ON_ROUTE' || v.status === 'REROUTED'
  ).length;

  const delayedDeliveries = deliveries.filter(
    (d) => d.status === 'DELAYED' || d.status === 'REROUTED'
  ).length;

  const unackAlerts = alerts.filter((a) => !a.acknowledged_at).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
      {/* 1. Accessibility */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-3 shadow-md hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-medium">Corridor Accessibility</span>
          <CheckCircle
            className={`w-4 h-4 ${accessibilityPct > 90 ? 'text-emerald-400' : 'text-amber-400'
              }`}
          />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-white">
            {accessibilityPct}%
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {openSegments}/{totalSegments} Open
          </span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${accessibilityPct > 90 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            style={{ width: `${accessibilityPct}%` }}
          ></div>
        </div>
      </div>

      {/* 2. High-Risk Corridors */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-3 shadow-md hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-medium">High-Risk Corridors</span>
          <AlertTriangle
            className={`w-4 h-4 ${highRiskCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-500'
              }`}
          />
        </div>
        <div className="flex items-baseline space-x-2">
          <span
            className={`text-2xl font-bold font-mono ${highRiskCount > 0 ? 'text-amber-400' : 'text-white'
              }`}
          >
            {highRiskCount}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {highRiskCount > 0 ? 'Action Recommended' : 'Nominal'}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 mt-2 flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          <span>Monitored via Risk Engine v1</span>
        </div>
      </div>

      {/* 3. Active Incidents */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-3 shadow-md hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-medium">Active Incidents</span>
          <Flame
            className={`w-4 h-4 ${activeIncidents > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-500'
              }`}
          />
        </div>
        <div className="flex items-baseline space-x-2">
          <span
            className={`text-2xl font-bold font-mono ${activeIncidents > 0 ? 'text-rose-400' : 'text-white'
              }`}
          >
            {activeIncidents}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {activeIncidents > 0 ? '1 Critical Blockage' : '0 Field Reports'}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 mt-2 flex items-center space-x-1">
          <span
            className={`w-1.5 h-1.5 rounded-full ${activeIncidents > 0 ? 'bg-rose-500 animate-ping' : 'bg-slate-600'
              }`}
          ></span>
          <span>{activeIncidents > 0 ? 'Disaster team alerted' : 'Passable'}</span>
        </div>
      </div>

      {/* 4. Vehicles in Transit */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-3 shadow-md hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-medium">Vehicles in Transit</span>
          <Truck className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-white">
            {inTransitVehicles}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            of {vehicles.length} Convoy Fleet
          </span>
        </div>
        <div className="text-[10px] text-emerald-400 mt-2 flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Live GPS Telemetry Active</span>
        </div>
      </div>

      {/* 5. Delayed Deliveries */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-3 shadow-md hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-medium">Delayed Deliveries</span>
          <Clock
            className={`w-4 h-4 ${delayedDeliveries > 0 ? 'text-amber-400' : 'text-slate-500'
              }`}
          />
        </div>
        <div className="flex items-baseline space-x-2">
          <span
            className={`text-2xl font-bold font-mono ${delayedDeliveries > 0 ? 'text-amber-400' : 'text-white'
              }`}
          >
            {delayedDeliveries}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {delayedDeliveries > 0 ? 'Rerouting Active' : 'All On-Time'}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 mt-2 flex items-center space-x-1">
          <span
            className={`w-1.5 h-1.5 rounded-full ${delayedDeliveries > 0 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
          ></span>
          <span>
            {delayedDeliveries > 0 ? 'V-101 Meds diverted' : 'Zero Delay'}
          </span>
        </div>
      </div>

      {/* 6. Critical Alerts */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-3 shadow-md hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-medium">Critical Alerts</span>
          <Bell
            className={`w-4 h-4 ${unackAlerts > 0 ? 'text-rose-400 animate-bounce' : 'text-slate-500'
              }`}
          />
        </div>
        <div className="flex items-baseline space-x-2">
          <span
            className={`text-2xl font-bold font-mono ${unackAlerts > 0 ? 'text-rose-400' : 'text-white'
              }`}
          >
            {unackAlerts}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Unacknowledged
          </span>
        </div>
        <div className="text-[10px] text-slate-400 mt-2 flex items-center space-x-1">
          <span
            className={`w-1.5 h-1.5 rounded-full ${unackAlerts > 0 ? 'bg-rose-400' : 'bg-slate-600'
              }`}
          ></span>
          <span>
            {unackAlerts > 0 ? 'Requires Driver/Op Action' : 'All Clear'}
          </span>
        </div>
      </div>
    </div>
  );
};
