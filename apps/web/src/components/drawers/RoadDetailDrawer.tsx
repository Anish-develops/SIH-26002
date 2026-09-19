import React, { useEffect, useState } from 'react';
import {
  X,
  ShieldAlert,
  Mountain,
  Gauge,
  Clock,
  Compass,
  FileText,
  AlertTriangle,
  Layers,
  ChevronRight
} from 'lucide-react';
import { RoadSegment, RiskScoreResponse } from '@ner-sentinel/types';

interface RoadDetailDrawerProps {
  segment: RoadSegment | null;
  onClose: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const RoadDetailDrawer: React.FC<RoadDetailDrawerProps> = ({
  segment,
  onClose
}) => {
  const [riskData, setRiskData] = useState<RiskScoreResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!segment) {
      setRiskData(null);
      return;
    }

    setLoading(true);
    fetch(`${API_BASE}/risk/${segment.id}`)
      .then((res) => res.json())
      .then((data) => {
        setRiskData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Failed to fetch segment risk detail:', err);
        setLoading(false);
      });
  }, [segment]);

  if (!segment) return null;

  const getStatusBadge = () => {
    switch (segment.status) {
      case 'OPEN':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-700/80';
      case 'RESTRICTED':
        return 'bg-amber-950/80 text-amber-400 border-amber-700/80';
      case 'BLOCKED':
        return 'bg-rose-950/90 text-rose-400 border-rose-700/90 animate-pulse';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-rose-400';
    if (score >= 60) return 'text-amber-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-emerald-400';
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0e1422] border-l border-slate-800 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-start justify-between bg-[#111827]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
              {segment.id}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {segment.corridor_id}
            </span>
          </div>
          <h2 className="text-base font-bold text-white mt-1 leading-snug">
            {segment.name}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Status & Risk Summary Card */}
        <div className="bg-[#151e33] border border-slate-800 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Operational Status</span>
            <span
              className={`px-2.5 py-0.5 rounded-full border text-xs font-bold font-mono ${getStatusBadge()}`}
            >
              {segment.status}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <span className="text-slate-400 font-medium">Disruption Risk Score</span>
            <div className="flex items-baseline space-x-1.5 font-mono">
              <span className={`text-2xl font-black ${getRiskColor(segment.risk_score)}`}>
                {segment.risk_score}
              </span>
              <span className="text-slate-500 text-xs">/100</span>
              <span className={`text-[11px] font-bold uppercase ml-1 ${getRiskColor(segment.risk_score)}`}>
                ({segment.risk_level})
              </span>
            </div>
          </div>

          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${segment.risk_score >= 70
                  ? 'bg-rose-500'
                  : segment.risk_score >= 40
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
              style={{ width: `${segment.risk_score}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 font-mono">
            <span>Model: {riskData?.engine_version || 'demo-risk-v1'}</span>
            <span>Horizon: Next 6 Hours</span>
          </div>
        </div>

        {/* WHY RISK CHANGED - Explainable Factors */}
        <div className="bg-[#151e33] border border-slate-800 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 font-bold text-slate-200">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Contributing Risk Factors</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Confidence: {riskData?.confidence || 'PROTOTYPE'}
            </span>
          </div>

          {loading ? (
            <div className="py-4 text-center text-slate-400 animate-pulse">
              Computing factor explanations...
            </div>
          ) : riskData?.factors && riskData.factors.length > 0 ? (
            <div className="space-y-2.5">
              {riskData.factors.map((f, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 font-medium">{f.factor}</span>
                    <span className="font-mono font-bold text-amber-400">
                      +{f.points} pts
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full"
                      style={{ width: `${Math.min(100, (f.points / 35) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    {f.description}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-400 text-xs py-2">
              No elevated risk factors detected. Corridor operating at baseline.
            </div>
          )}
        </div>

        {/* Physical & Geotechnical Characteristics */}
        <div className="bg-[#151e33] border border-slate-800 rounded-xl p-3.5 space-y-2.5">
          <div className="font-bold text-slate-200 flex items-center space-x-1.5">
            <Mountain className="w-4 h-4 text-blue-400" />
            <span>Terrain & Corridor Profile</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div className="bg-[#0e1422] p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400">Elevation</span>
              <div className="text-sm font-bold font-mono text-white mt-0.5">
                {segment.elevation_m} m
              </div>
            </div>

            <div className="bg-[#0e1422] p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400">Slope Gradient</span>
              <div className="text-sm font-bold font-mono text-white mt-0.5">
                {segment.slope_deg}°
              </div>
            </div>

            <div className="bg-[#0e1422] p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400">Surface State</span>
              <div className="text-xs font-semibold text-slate-200 mt-0.5">
                {segment.surface_condition}
              </div>
            </div>

            <div className="bg-[#0e1422] p-2 rounded-lg border border-slate-800/80">
              <span className="text-[10px] text-slate-400">Road Class</span>
              <div className="text-xs font-semibold text-slate-200 mt-0.5">
                {segment.road_class}
              </div>
            </div>
          </div>
        </div>

        {/* Action Recommendation */}
        <div className="bg-blue-950/40 border border-blue-800/60 rounded-xl p-3.5 space-y-1.5">
          <div className="flex items-center space-x-1.5 text-blue-300 font-bold">
            <Compass className="w-4 h-4 text-blue-400" />
            <span>Recommended Operational Action</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {segment.status === 'BLOCKED'
              ? 'Segment fully blocked by slope debris. Route engine has activated Alternate Corridor B (via NH-27 Lumding-Haflong). Diversion alerts dispatched to convoy vehicles.'
              : segment.status === 'RESTRICTED'
                ? 'Heavy precipitation active. Delay potential: +2h 14m. Advise field patrols to monitor cut slopes and instruct drivers to standby for reroute.'
                : 'Corridor fully open with normal traffic flow. Continue standard telemetry monitoring.'}
          </p>
        </div>

        {/* Synthetic Data Notice */}
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[10px] text-slate-500 font-mono">
          Environment: DEMO • Source: SYNTHETIC TOPOLOGY • ID: {segment.id}
        </div>
      </div>
    </div>
  );
};
