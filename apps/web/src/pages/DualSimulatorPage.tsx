import React, { useState } from 'react';
import {
  RoadSegment,
  Incident,
  Vehicle,
  Delivery,
  Alert,
  RouteRecommendation,
  ScenarioName
} from '@ner-sentinel/types';
import { CommandMap } from '../components/map/CommandMap';
import { DriverSimulator } from '../components/driver/DriverSimulator';
import {
  Smartphone,
  Layers,
  Radio,
  RefreshCw,
  CloudRain,
  Flame,
  CheckCircle2,
  ExternalLink,
  Info
} from 'lucide-react';

interface DualSimulatorPageProps {
  activeScenario: ScenarioName;
  segments: RoadSegment[];
  incidents: Incident[];
  vehicles: Vehicle[];
  deliveries: Delivery[];
  alerts: Alert[];
  activeRoute: RouteRecommendation | null;
  alternateRoute: RouteRecommendation | null;
  onTriggerScenario: (scenario: ScenarioName) => Promise<any>;
  onResetDemo: () => Promise<any>;
  onAcceptAlternateRoute: (vehicleId: string) => Promise<any>;
}

export const DualSimulatorPage: React.FC<DualSimulatorPageProps> = ({
  activeScenario,
  segments,
  incidents,
  vehicles,
  deliveries,
  alerts,
  activeRoute,
  alternateRoute,
  onTriggerScenario,
  onResetDemo,
  onAcceptAlternateRoute
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const vehicleV101 = vehicles.find((v) => v.id === 'V-101') || vehicles[0] || null;
  const deliveryMed = deliveries.find((d) => d.vehicle_id === 'V-101') || deliveries[0] || null;

  const handleTrigger = async (sc: ScenarioName) => {
    setLoadingAction(sc);
    try {
      await onTriggerScenario(sc);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReset = async () => {
    setLoadingAction('RESET');
    try {
      await onResetDemo();
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-[1720px] mx-auto">
      {/* Top Controller Bar */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white font-sans">
              Dual Screen Live Evaluation Mode
            </h2>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
              SYNCHRONIZED TWO-WAY SSE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Test how triggering a disruption in the Command Center instantly alerts the driver, alters the route, and recalculates ETA.
          </p>
        </div>

        {/* Quick Scenario Trigger Buttons */}
        <div className="flex items-center space-x-2 flex-wrap">
          <button
            onClick={() => handleTrigger('NORMAL')}
            disabled={loadingAction !== null}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeScenario === 'NORMAL'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            1. Normal
          </button>

          <button
            onClick={() => handleTrigger('HEAVY_RAIN')}
            disabled={loadingAction !== null}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeScenario === 'HEAVY_RAIN'
                ? 'bg-amber-600 text-black shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            2. Heavy Rain
          </button>

          <button
            onClick={() => handleTrigger('LANDSLIDE')}
            disabled={loadingAction !== null}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeScenario === 'LANDSLIDE' || activeScenario === 'BLOCK_ROAD'
                ? 'bg-rose-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            3. Landslide Block
          </button>

          <button
            onClick={handleReset}
            disabled={loadingAction !== null}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 font-bold transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAction === 'RESET' ? 'animate-spin' : ''}`} />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Split View Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side (7 Cols): Web Command Center Canvas */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Command Center GIS Network View
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Segment S-08 Status:{' '}
                <strong
                  className={
                    activeScenario === 'LANDSLIDE' || activeScenario === 'BLOCK_ROAD'
                      ? 'text-rose-400'
                      : activeScenario === 'HEAVY_RAIN'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }
                >
                  {activeScenario === 'LANDSLIDE' || activeScenario === 'BLOCK_ROAD'
                    ? 'BLOCKED'
                    : activeScenario === 'HEAVY_RAIN'
                    ? 'RESTRICTED'
                    : 'OPEN'}
                </strong>
              </span>
            </div>

            <div className="h-[520px] w-full">
              <CommandMap
                segments={segments}
                incidents={incidents}
                vehicles={vehicles}
                activeRoute={activeRoute}
                alternateRoute={alternateRoute}
                showWeatherOverlay={true}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
              <div className="bg-[#0b0f19] p-3 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[10px]">Primary Corridor A (NH-6)</div>
                <div className="font-bold text-white mt-0.5">
                  198 km • ETA 5h 12m ({activeRoute?.status || 'ACTIVE'})
                </div>
              </div>
              <div className="bg-[#0b0f19] p-3 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[10px]">Alternate Corridor B (NH-27)</div>
                <div className="font-bold text-amber-400 mt-0.5">
                  206 km • ETA 6h 03m ({alternateRoute?.status || 'STANDBY'})
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side (5 Cols): Live Driver Mobile Phone Simulator */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="text-center mb-2">
            <span className="text-xs font-bold text-slate-300 font-mono flex items-center justify-center space-x-1.5">
              <span>DRIVER MOBILE CLIENT VIEW</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              (Live SSE State Sync with Vehicle V-101)
            </span>
          </div>

          <DriverSimulator
            activeScenario={activeScenario}
            vehicle={vehicleV101}
            delivery={deliveryMed}
            alerts={alerts}
            activeRoute={activeRoute}
            alternateRoute={alternateRoute}
            onAcceptAlternateRoute={onAcceptAlternateRoute}
          />
        </div>
      </div>
    </div>
  );
};
