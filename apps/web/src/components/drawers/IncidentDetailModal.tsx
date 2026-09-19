import React from 'react';
import { X, AlertTriangle, MapPin, User, Calendar, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Incident } from '@ner-sentinel/types';

interface IncidentDetailModalProps {
  incident: Incident | null;
  onClose: () => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose
}) => {
  if (!incident) return null;

  const isCritical = incident.severity === 'CRITICAL';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0e1422] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#111827]">
          <div className="flex items-center space-x-2.5">
            <div
              className={`p-2 rounded-lg ${
                isCritical ? 'bg-rose-950/80 text-rose-400 border border-rose-800' : 'bg-amber-950/80 text-amber-400 border border-amber-800'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white font-sans">
                  {incident.type} Obstruction
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    isCritical
                      ? 'bg-rose-900/60 text-rose-300 border border-rose-700'
                      : 'bg-amber-900/60 text-amber-300 border border-amber-700'
                  }`}
                >
                  {incident.severity}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                ID: {incident.id} • Segment: {incident.segment_id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Incident Photograph */}
          {incident.photo_url && (
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 h-44 relative group">
              <img
                src={incident.photo_url}
                alt="Field Incident"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/80 backdrop-blur-md rounded text-[10px] font-mono text-slate-300 border border-white/10">
                FIELD PHOTO ATTACHMENT • GPS VERIFIED
              </div>
            </div>
          )}

          {/* Description */}
          <div className="bg-[#151e33] border border-slate-800 rounded-xl p-3.5 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Field Officer Notes
            </span>
            <p className="text-sm text-slate-200 leading-relaxed font-sans">
              {incident.notes}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-slate-300 font-mono text-xs">
            <div className="bg-[#151e33] p-3 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] mb-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>Coordinates</span>
              </div>
              <div className="font-semibold text-white">
                {incident.latitude.toFixed(4)}°N, {incident.longitude.toFixed(4)}°E
              </div>
            </div>

            <div className="bg-[#151e33] p-3 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] mb-1">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>Reporter</span>
              </div>
              <div className="font-semibold text-white">
                {incident.reporter.name} ({incident.reporter.role})
              </div>
            </div>
          </div>

          {/* Verification Badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300 font-medium">
                Verification Status: <span className="font-bold text-white">{incident.verification_status}</span>
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Source: {incident.source}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#111827] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors"
          >
            Close Inspection
          </button>
        </div>
      </div>
    </div>
  );
};
