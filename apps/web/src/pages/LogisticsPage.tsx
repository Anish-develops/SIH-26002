import React, { useState } from 'react';
import {
  Delivery,
  Vehicle,
  RouteRecommendation
} from '@ner-sentinel/types';
import {
  Truck,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Filter,
  MapPin,
  ExternalLink,
  Thermometer,
  ShieldCheck,
  ChevronRight,
  X
} from 'lucide-react';

interface LogisticsPageProps {
  deliveries: Delivery[];
  vehicles: Vehicle[];
  activeRoute: RouteRecommendation | null;
  alternateRoute: RouteRecommendation | null;
}

export const LogisticsPage: React.FC<LogisticsPageProps> = ({
  deliveries,
  vehicles,
  activeRoute,
  alternateRoute
}) => {
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [commodityFilter, setCommodityFilter] = useState<string>('ALL');

  const filteredDeliveries = deliveries.filter((d) => {
    return commodityFilter === 'ALL' || d.commodity === commodityFilter;
  });

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'CRITICAL':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      case 'HIGH':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'ON_TIME':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-800';
      case 'DELAYED':
        return 'bg-amber-950/80 text-amber-400 border-amber-800 animate-pulse';
      case 'REROUTED':
        return 'bg-indigo-950/80 text-indigo-400 border-indigo-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getCommodityColor = (c: string) => {
    switch (c) {
      case 'MEDICINE':
        return 'text-rose-400 bg-rose-950/40 border-rose-800/60';
      case 'FOOD':
        return 'text-amber-400 bg-amber-950/40 border-amber-800/60';
      case 'CONSTRUCTION':
        return 'text-sky-400 bg-sky-950/40 border-sky-800/60';
      default:
        return 'text-slate-300 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1720px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-sans flex items-center space-x-2">
            <Truck className="w-5 h-5 text-blue-400" />
            <span>Essential Goods Logistics Operations</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time delivery coordination for priority healthcare and nutritional supplies across NER.
          </p>
        </div>

        {/* Commodity Filter */}
        <div className="flex items-center space-x-1.5 bg-[#111827] p-1 rounded-xl border border-slate-800 text-xs">
          {['ALL', 'MEDICINE', 'FOOD', 'CONSTRUCTION'].map((c) => (
            <button
              key={c}
              onClick={() => setCommodityFilter(c)}
              className={`px-3 py-1.5 rounded-lg font-mono text-[11px] transition-colors ${commodityFilter === c
                  ? 'bg-blue-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Deliveries Operations Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b0f19] border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Delivery ID</th>
                <th className="px-5 py-3.5">Commodity & Title</th>
                <th className="px-5 py-3.5">Priority</th>
                <th className="px-5 py-3.5">Vehicle & Driver</th>
                <th className="px-5 py-3.5">Transit Corridor</th>
                <th className="px-5 py-3.5">Planned / Current ETA</th>
                <th className="px-5 py-3.5">Risk Exposure</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-sans">
              {filteredDeliveries.map((del) => {
                const assignedVehicle = vehicles.find((v) => v.id === del.vehicle_id);
                const isDelayed = del.status === 'DELAYED' || del.status === 'REROUTED';

                return (
                  <tr
                    key={del.id}
                    onClick={() => setSelectedDelivery(del)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4 font-mono font-bold text-blue-400">
                      {del.id}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getCommodityColor(
                            del.commodity
                          )}`}
                        >
                          {del.commodity}
                        </span>
                        <span className="font-semibold text-white">
                          {del.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>
                          {del.origin.name} → {del.destination.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${getPriorityBadge(
                          del.priority
                        )}`}
                      >
                        {del.priority}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-mono font-bold text-slate-200">
                        {del.vehicle_id}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {assignedVehicle?.driver_name || 'Convoy Driver'} ({assignedVehicle?.vehicle_number})
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono text-[11px] text-slate-300">
                      {del.active_corridor}
                    </td>

                    <td className="px-5 py-4 font-mono">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-slate-400 line-through text-[11px]">
                          {del.planned_eta}
                        </span>
                        <span
                          className={`font-bold ${isDelayed ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                        >
                          {del.current_eta}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {del.distance_km} km
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${del.risk_exposure === 'HIGH'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}
                      >
                        {del.risk_exposure}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-mono border ${getStatusBadge(
                          del.status
                        )}`}
                      >
                        {del.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button className="text-blue-400 hover:text-blue-300 font-medium text-xs flex items-center space-x-1 ml-auto">
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delivery Focused Modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0e1422] border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#111827]">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                    {selectedDelivery.id}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Vehicle: {selectedDelivery.vehicle_id}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  {selectedDelivery.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDelivery(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Route Summary */}
              <div className="bg-[#151e33] border border-slate-800 rounded-xl p-3.5 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Transit Details
                </span>
                <div className="grid grid-cols-2 gap-3 text-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400">Origin Depot</span>
                    <div className="font-semibold text-white mt-0.5">
                      {selectedDelivery.origin.name}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Destination</span>
                    <div className="font-semibold text-white mt-0.5">
                      {selectedDelivery.destination.name}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Distance</span>
                    <div className="font-mono font-bold text-white mt-0.5">
                      {selectedDelivery.distance_km} km
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Current ETA</span>
                    <div className="font-mono font-bold text-emerald-400 mt-0.5">
                      {selectedDelivery.current_eta} (Planned: {selectedDelivery.planned_eta})
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Handling / Notes */}
              {selectedDelivery.notes && (
                <div className="bg-blue-950/30 border border-blue-800/50 rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center space-x-1.5 text-blue-300 font-bold">
                    <Thermometer className="w-4 h-4 text-blue-400" />
                    <span>Handling & Dispatch Protocol</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {selectedDelivery.notes}
                  </p>
                </div>
              )}

              {/* Reroute Alert if applicable */}
              {selectedDelivery.status === 'REROUTED' && (
                <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center space-x-1.5 text-amber-300 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Active Route Recalculation Notice</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Primary route via Segment S-08 is currently blocked. Diverted via Alternate Corridor B (via NH-27 Lumding-Haflong). Updated ETA: 6h 03m.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-[#111827] flex justify-end">
              <button
                onClick={() => setSelectedDelivery(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
