import React, { useState } from 'react';
import {
  RoadSegment,
  Vehicle,
  Delivery,
  Incident
} from '@ner-sentinel/types';
import {
  Sliders,
  ShieldAlert,
  Mountain,
  CloudRain,
  Activity,
  AlertTriangle,
  Compass,
  Truck,
  Layers,
  Clock,
  ArrowRight
} from 'lucide-react';

interface CorridorDetailPageProps {
  segments: RoadSegment[];
  vehicles: Vehicle[];
  deliveries: Delivery[];
  incidents: Incident[];
}

export const CorridorDetailPage: React.FC<CorridorDetailPageProps> = ({
  segments,
  vehicles,
  deliveries,
  incidents
}) => {
  const [activeCorridorId, setActiveCorridorId] = useState<string>('CORRIDOR-A-PRIMARY');

  const corridorSegments = segments.filter((s) => s.corridor_id === activeCorridorId);
  const s08Segment = segments.find((s) => s.id === 'S-08');

  // Compute stats
  const totalLength = corridorSegments.reduce((acc, s) => acc + (s.elevation_m ? 18 : 15), 0);
  const blockedCount = corridorSegments.filter((s) => s.status === 'BLOCKED').length;
  const restrictedCount = corridorSegments.filter((s) => s.status === 'RESTRICTED').length;
  const isImpassable = blockedCount > 0;

  // Contributing factors for S-08 (The choke point)
  const factors = s08Segment?.risk_factors || [
    { factor: 'Heavy rainfall', points: 30, category: 'WEATHER', description: 'Monsoon intensity exceeding 60 mm/h' },
    { factor: 'Steep terrain', points: 22, category: 'TERRAIN', description: '32° mountain cut slope' },
    { factor: 'Recent incident', points: 18, category: 'INCIDENT_HISTORY', description: 'Slope displacement warnings' },
    { factor: 'Historical exposure', points: 8, category: 'SOIL_MOISTURE', description: 'High soil moisture saturation index' }
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1720px] mx-auto">
      {/* Header & Corridor Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
              CORRIDOR INTELLIGENCE
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Representative Mountain Logistics Lifelines
            </span>
          </div>
          <h2 className="text-xl font-bold text-white font-sans mt-1">
            {activeCorridorId === 'CORRIDOR-A-PRIMARY'
              ? 'Corridor A — Direct Mountain Highway Lifeline (via S-08 Pass)'
              : 'Corridor B — Alternate Hill Section Bypass (via NH-27 Lumding-Haflong)'}
          </h2>
        </div>

        {/* Switcher Buttons */}
        <div className="flex items-center space-x-1.5 bg-[#111827] p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveCorridorId('CORRIDOR-A-PRIMARY')}
            className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all ${activeCorridorId === 'CORRIDOR-A-PRIMARY'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            Corridor A (Lifeline)
          </button>
          <button
            onClick={() => setActiveCorridorId('CORRIDOR-B-ALTERNATE')}
            className={`px-3.5 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all ${activeCorridorId === 'CORRIDOR-B-ALTERNATE'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            Corridor B (Alternate Bypass)
          </button>
        </div>
      </div>

      {/* Corridor Overview Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl">
          <span className="text-slate-400 text-xs font-medium">Corridor Status</span>
          <div className="flex items-center space-x-2 mt-1.5">
            <span
              className={`w-3 h-3 rounded-full ${isImpassable
                  ? 'bg-rose-500 animate-ping'
                  : restrictedCount > 0
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
            ></span>
            <span
              className={`text-lg font-bold font-mono ${isImpassable
                  ? 'text-rose-400'
                  : restrictedCount > 0
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
            >
              {isImpassable ? 'IMPASSABLE' : restrictedCount > 0 ? 'RESTRICTED' : 'OPEN'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">
            {blockedCount} Blocked | {restrictedCount} Restricted
          </span>
        </div>

        <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl">
          <span className="text-slate-400 text-xs font-medium">Peak Segment Risk</span>
          <div className="flex items-baseline space-x-2 mt-1 font-mono">
            <span
              className={`text-2xl font-black ${s08Segment && s08Segment.risk_score >= 70
                  ? 'text-rose-400'
                  : s08Segment && s08Segment.risk_score >= 40
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
            >
              {activeCorridorId === 'CORRIDOR-A-PRIMARY'
                ? `${s08Segment?.risk_score || 22}/100`
                : '28/100'}
            </span>
            <span className="text-slate-400 text-xs">
              ({activeCorridorId === 'CORRIDOR-A-PRIMARY' ? s08Segment?.risk_level || 'LOW' : 'LOW'})
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">
            Choke point: S-08 Pass & Tunnel
          </span>
        </div>

        <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl">
          <span className="text-slate-400 text-xs font-medium">Corridor Transit Route</span>
          <div className="text-lg font-bold font-mono text-white mt-1">
            {activeCorridorId === 'CORRIDOR-A-PRIMARY' ? '198 km' : '206 km'}
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">
            Baseline ETA: {activeCorridorId === 'CORRIDOR-A-PRIMARY' ? '5h 12m' : '6h 03m'}
          </span>
        </div>

        <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl">
          <span className="text-slate-400 text-xs font-medium">Active Deliveries in Transit</span>
          <div className="text-lg font-bold font-mono text-blue-400 mt-1">
            {activeCorridorId === 'CORRIDOR-A-PRIMARY' ? '2 Shipments' : '1 Standby'}
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">
            Includes critical insulin (V-101)
          </span>
        </div>
      </div>

      {/* Main Analysis: WHY RISK INCREASED (Highlight Section) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Risk Explanation Section (7 Cols) */}
        <div className="lg:col-span-7 bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                WHY RISK CHANGED — Segment S-08 Multi-Factor Audit
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Engine: demo-risk-v1
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            The decision-support engine evaluates real-time hydrological saturation, digital elevation slope angles, and field incident feeds rather than black-box probabilities:
          </p>

          <div className="space-y-3.5 bg-[#0b0f19] p-4 rounded-xl border border-slate-800">
            {factors.map((f, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{f.factor}</span>
                  <span className="font-mono font-bold text-amber-400">
                    +{f.points} pts
                  </span>
                </div>
                {/* Visual Progress Meter Bars */}
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (f.points / 35) * 100)}%` }}
                  ></div>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>{f.description}</span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {f.category}
                  </span>
                </div>
              </div>
            ))}

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 font-mono">
                TOTAL COMPUTED RISK SCORE:
              </span>
              <span
                className={`text-lg font-black font-mono ${s08Segment && s08Segment.risk_score >= 70
                    ? 'text-rose-400'
                    : 'text-amber-400'
                  }`}
              >
                {s08Segment?.risk_score || 22}/100 ({s08Segment?.risk_level || 'LOW'})
              </span>
            </div>
          </div>

          {/* Operational Recommendation Box */}
          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/60 space-y-1.5">
            <div className="flex items-center space-x-2 text-blue-300 font-bold text-xs font-mono">
              <Compass className="w-4 h-4 text-blue-400" />
              <span>RECOMMENDED COMMAND ACTION</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {isImpassable
                ? 'Corridor A blocked at S-08. Primary recommendation: Issue electronic dispatch order to divert convoy V-101 to Corridor B (via NH-27 Lumding-Haflong). Expected detour adds 51 minutes but ensures 100% route clearance.'
                : s08Segment?.status === 'RESTRICTED'
                  ? 'Precipitation surge detected. Issue early warning advisory to drivers on Corridor A. Hold non-essential freight at Jorabat staging yard while keeping medical vehicles on alert.'
                  : 'All segments operating nominally. Maintain standard 15-minute telemetry intervals.'}
            </p>
          </div>
        </div>

        {/* Corridor Chainage Breakdown (5 Cols) */}
        <div className="lg:col-span-5 bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Chainage Segments ({corridorSegments.length})</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Elevation Profile</span>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 max-h-[480px] pr-1">
            {corridorSegments.map((seg) => {
              const isBlocked = seg.status === 'BLOCKED';
              const isRestricted = seg.status === 'RESTRICTED';

              return (
                <div
                  key={seg.id}
                  className={`p-3 rounded-xl border text-xs transition-all ${isBlocked
                      ? 'border-rose-600/70 bg-rose-950/20'
                      : isRestricted
                        ? 'border-amber-600/60 bg-amber-950/20'
                        : 'border-slate-800 bg-[#0e1422]'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-blue-400 text-[11px]">
                          {seg.id}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${isBlocked
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : isRestricted
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}
                        >
                          {seg.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-white mt-1">
                        {seg.name}
                      </h4>
                    </div>

                    <div className="text-right font-mono">
                      <div
                        className={`text-xs font-bold ${seg.risk_score >= 70
                            ? 'text-rose-400'
                            : seg.risk_score >= 40
                              ? 'text-amber-400'
                              : 'text-slate-400'
                          }`}
                      >
                        Risk: {seg.risk_score}/100
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Slope: {seg.slope_deg}°
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-1 border-t border-slate-800/80 font-mono">
                    <span>Elev: {seg.elevation_m}m</span>
                    <span>Surface: {seg.surface_condition}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
