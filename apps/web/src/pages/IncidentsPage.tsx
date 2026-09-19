import React, { useState } from 'react';
import { Incident } from '@ner-sentinel/types';
import {
  AlertTriangle,
  Camera,
  MapPin,
  CheckCircle2,
  Clock,
  User,
  ExternalLink,
  ShieldCheck,
  Flame,
  Filter
} from 'lucide-react';
import { IncidentDetailModal } from '../components/drawers/IncidentDetailModal';

interface IncidentsPageProps {
  incidents: Incident[];
}

export const IncidentsPage: React.FC<IncidentsPageProps> = ({ incidents }) => {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const filteredIncidents = incidents.filter((i) => {
    return severityFilter === 'ALL' || i.severity === severityFilter;
  });

  return (
    <div className="p-6 space-y-6 max-w-[1720px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-sans flex items-center space-x-2">
            <Flame className="w-5 h-5 text-rose-400" />
            <span>Field Incidents & Disaster Reports</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time feed of field officer submissions, landslide alerts, and road hazard observations.
          </p>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center space-x-1.5 bg-[#111827] p-1 rounded-xl border border-slate-800 text-xs">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-3 py-1.5 rounded-lg font-mono text-[11px] transition-colors ${
                severityFilter === s
                  ? 'bg-rose-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredIncidents.map((inc) => {
          const isCritical = inc.severity === 'CRITICAL';
          const isResolved = inc.verification_status === 'RESOLVED';

          return (
            <div
              key={inc.id}
              onClick={() => setSelectedIncident(inc)}
              className={`bg-[#111827] border rounded-2xl p-5 shadow-xl hover:border-slate-600 transition-all cursor-pointer flex flex-col justify-between ${
                isCritical && !isResolved
                  ? 'border-rose-600/60 bg-rose-950/10'
                  : 'border-slate-800'
              }`}
            >
              <div>
                {/* Photo Preview */}
                {inc.photo_url && (
                  <div className="h-40 rounded-xl overflow-hidden bg-slate-950 mb-3.5 relative border border-slate-800">
                    <img
                      src={inc.photo_url}
                      alt={inc.type}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/80 backdrop-blur-md rounded text-[10px] font-mono text-white font-semibold">
                      ATTACHED PHOTO
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        {inc.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                          isCritical
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1.5 font-sans">
                      {inc.type} Incident
                    </h3>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      isResolved
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}
                  >
                    {inc.verification_status}
                  </span>
                </div>

                <p className="text-xs text-slate-300 mt-2.5 leading-relaxed line-clamp-3">
                  {inc.notes}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-[11px] font-mono text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Segment: {inc.segment_id}</span>
                  <span>{new Date(inc.created_at).toLocaleTimeString()}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Reporter: {inc.reporter.name}</span>
                  <span className="text-blue-400 font-sans font-medium flex items-center space-x-1">
                    <span>Inspect</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Incident Modal */}
      <IncidentDetailModal
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
      />
    </div>
  );
};
