import React, { useState, useMemo } from 'react';
import {
  RoadSegment,
  Incident,
  Vehicle,
  RouteRecommendation,
  OperationalEvent
} from '@ner-sentinel/types';
import { CommandMap } from '../components/map/CommandMap';
import { RoadDetailDrawer } from '../components/drawers/RoadDetailDrawer';
import { IncidentDetailModal } from '../components/drawers/IncidentDetailModal';
import { Search, Filter, Layers, Clock, AlertCircle } from 'lucide-react';

interface LiveMapPageProps {
  segments: RoadSegment[];
  incidents: Incident[];
  vehicles: Vehicle[];
  activeRoute: RouteRecommendation | null;
  alternateRoute: RouteRecommendation | null;
  recentEvents: OperationalEvent[];
}

export const LiveMapPage: React.FC<LiveMapPageProps> = ({
  segments,
  incidents,
  vehicles,
  activeRoute,
  alternateRoute,
  recentEvents
}) => {
  const [selectedSegment, setSelectedSegment] = useState<RoadSegment | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');

  const filteredSegments = useMemo(() => {
    return segments.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
      const matchesRisk = riskFilter === 'ALL' || s.risk_level === riskFilter;
      return matchesSearch && matchesStatus && matchesRisk;
    });
  }, [segments, searchQuery, statusFilter, riskFilter]);

  return (
    <div className="relative w-full h-[calc(100vh-100px)] flex flex-col overflow-hidden">
      {/* Top Filter & Search Bar */}
      <div className="bg-[#111827] border-b border-slate-800 px-6 py-2.5 flex items-center justify-between z-10 shadow-md">
        <div className="flex items-center space-x-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search segment (e.g. S-08, Jowai, Sonapur)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0b0f19] border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-72 transition-colors font-sans"
            />
          </div>

          <span className="text-slate-700">|</span>

          {/* Status Filter */}
          <div className="flex items-center space-x-1 text-xs">
            <span className="text-slate-400 font-medium mr-1">Status:</span>
            {['ALL', 'OPEN', 'RESTRICTED', 'BLOCKED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white font-bold shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <span className="text-slate-700">|</span>

          {/* Risk Filter */}
          <div className="flex items-center space-x-1 text-xs">
            <span className="text-slate-400 font-medium mr-1">Risk:</span>
            {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((rk) => (
              <button
                key={rk}
                onClick={() => setRiskFilter(rk)}
                className={`px-2 py-1 rounded-md text-[11px] font-mono transition-colors ${
                  riskFilter === rk
                    ? 'bg-indigo-600 text-white font-bold shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {rk}
              </button>
            ))}
          </div>
        </div>

        {/* Live Segment Count */}
        <div className="text-xs font-mono text-slate-400">
          Showing <span className="font-bold text-white">{filteredSegments.length}</span> of{' '}
          {segments.length} Segments
        </div>
      </div>

      {/* Full Screen GIS Map Canvas */}
      <div className="flex-1 w-full h-full relative">
        <CommandMap
          segments={filteredSegments}
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

      {/* Bottom Floating Live Event Ticker */}
      <div className="absolute bottom-4 right-4 max-w-md bg-[#0e1422]/95 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-2xl z-10 text-xs">
        <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1.5 border-b border-slate-800">
          <span className="font-bold uppercase tracking-wider text-slate-300 font-mono">
            Live Field Feed
          </span>
          <span className="text-emerald-400 font-mono text-[10px]">Realtime SSE</span>
        </div>
        <div className="mt-2 space-y-1.5 max-h-24 overflow-y-auto pr-1">
          {recentEvents.slice(0, 3).map((evt) => (
            <div key={evt.id} className="text-[11px] text-slate-300">
              <span className="text-blue-400 font-mono font-semibold mr-1">
                [{new Date(evt.timestamp).toLocaleTimeString()}]
              </span>
              <span>{evt.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Drawer */}
      <RoadDetailDrawer
        segment={selectedSegment}
        onClose={() => setSelectedSegment(null)}
      />

      {/* Incident Modal */}
      <IncidentDetailModal
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
      />
    </div>
  );
};
