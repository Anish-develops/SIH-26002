import React, { useState } from 'react';
import {
  Radio,
  RefreshCw,
  CloudRain,
  Flame,
  AlertOctagon,
  Truck,
  Wrench,
  CheckCircle2,
  Terminal,
  Play,
  ArrowRight,
  Info
} from 'lucide-react';
import { ScenarioName, OperationalEvent } from '@ner-sentinel/types';

interface ScenarioConsolePageProps {
  activeScenario: ScenarioName;
  onTriggerScenario: (scenario: ScenarioName) => Promise<any>;
  onResetDemo: () => Promise<any>;
  recentEvents: OperationalEvent[];
}

export const ScenarioConsolePage: React.FC<ScenarioConsolePageProps> = ({
  activeScenario,
  onTriggerScenario,
  onResetDemo,
  recentEvents
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [lastActionResult, setLastActionResult] = useState<any>(null);

  const handleTrigger = async (scenario: ScenarioName) => {
    setLoadingAction(scenario);
    try {
      const result = await onTriggerScenario(scenario);
      setLastActionResult({
        action: scenario,
        timestamp: new Date().toISOString(),
        result
      });
    } catch (err: any) {
      setLastActionResult({
        action: scenario,
        timestamp: new Date().toISOString(),
        error: err.message
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReset = async () => {
    setLoadingAction('RESET');
    try {
      const result = await onResetDemo();
      setLastActionResult({
        action: 'RESET_DEMO',
        timestamp: new Date().toISOString(),
        result
      });
    } catch (err: any) {
      setLastActionResult({
        action: 'RESET_DEMO',
        timestamp: new Date().toISOString(),
        error: err.message
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const scenarios = [
    {
      id: 'NORMAL' as ScenarioName,
      title: '1. Normal Baseline',
      desc: 'All corridors OPEN. Medicine Convoy V-101 is on schedule (ETA: 5h 12m, Risk: 22/100).',
      icon: CheckCircle2,
      color: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      border: 'border-emerald-500/40'
    },
    {
      id: 'HEAVY_RAIN' as ScenarioName,
      title: '2. Heavy Rainfall Surge',
      desc: 'Monsoon surge (65 mm/h) over S-08 Pass. Risk engine jumps to 78 (HIGH). Hazard caution alert pushed to driver.',
      icon: CloudRain,
      color: 'bg-amber-600 hover:bg-amber-500 text-black font-bold',
      border: 'border-amber-500/40'
    },
    {
      id: 'LANDSLIDE' as ScenarioName,
      title: '3. Landslide & Road Blockage',
      desc: 'Mud and boulder landslide at S-08 Tunnel Approach. Segment BLOCKED. Route engine recalculates Alternate Corridor B (ETA: 6h 03m).',
      icon: Flame,
      color: 'bg-rose-600 hover:bg-rose-500 text-white font-bold',
      border: 'border-rose-500/50'
    },
    {
      id: 'RECOVERY' as ScenarioName,
      title: '4. Corridor Clearance & Recovery',
      desc: 'PWD earthmovers clear single-lane emergency traffic. S-08 status transitions back to RESTRICTED then OPEN.',
      icon: Wrench,
      color: 'bg-blue-600 hover:bg-blue-500 text-white font-bold',
      border: 'border-blue-500/40'
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1720px] mx-auto">
      {/* Top Banner */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white font-sans">
              Deterministic Scenario Orchestration Console
            </h2>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
              SYNTHETIC TEST HARNESS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            This control station drives reproducible state changes strictly through the backend REST & SSE pipeline. Every action triggers the Risk Engine, recalculates the Route Engine, and pushes live updates to both the Command Center and the Driver Mobile App simultaneously.
          </p>
        </div>

        {/* Big Reset Button */}
        <button
          onClick={handleReset}
          disabled={loadingAction !== null}
          className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold border border-slate-700 shadow-xl transition-all active:scale-95 disabled:opacity-50 flex-shrink-0"
        >
          <RefreshCw className={`w-4 h-4 text-blue-400 ${loadingAction === 'RESET' ? 'animate-spin' : ''}`} />
          <span>RESET PROTOTYPE TO BASELINE</span>
        </button>
      </div>

      {/* Recommended Demo Sequence Guide */}
      <div className="bg-blue-950/20 border border-blue-800/40 rounded-xl p-4 text-xs space-y-2">
        <div className="flex items-center space-x-2 text-blue-300 font-bold font-mono">
          <Info className="w-4 h-4 text-blue-400" />
          <span>SIH EVALUATOR DEMO WALKTHROUGH FLOW</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-slate-300 pt-1">
          <div className="bg-[#0b0f19] p-3 rounded-lg border border-slate-800">
            <div className="font-bold text-emerald-400 font-mono text-[11px]">Step 1: Normal</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Show Driver App and Command Center in sync. Medicine Convoy V-101 has 5h 12m ETA on Corridor A.
            </p>
          </div>
          <div className="bg-[#0b0f19] p-3 rounded-lg border border-slate-800">
            <div className="font-bold text-amber-400 font-mono text-[11px]">Step 2: Heavy Rain</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Trigger Heavy Rain. Risk jumps to 78. Show transparent factor breakdown (Rainfall +30, Slope +22).
            </p>
          </div>
          <div className="bg-[#0b0f19] p-3 rounded-lg border border-slate-800">
            <div className="font-bold text-rose-400 font-mono text-[11px]">Step 3: Landslide</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Trigger Landslide. Road turns BLOCKED. Alternate Corridor B activates. Driver receives "ROUTE UPDATED" banner (ETA 6h 03m).
            </p>
          </div>
          <div className="bg-[#0b0f19] p-3 rounded-lg border border-slate-800">
            <div className="font-bold text-blue-400 font-mono text-[11px]">Step 4: Driver Accept & Reset</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Driver accepts route on phone &rarr; Web updates to REROUTED. Then click Reset to return to baseline.
            </p>
          </div>
        </div>
      </div>

      {/* Scenario Triggers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          const isCurrent = activeScenario === sc.id;
          const isLoading = loadingAction === sc.id;

          return (
            <div
              key={sc.id}
              className={`bg-[#111827] border rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all ${
                isCurrent
                  ? 'border-blue-500/80 ring-1 ring-blue-500/50 bg-blue-950/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <Icon className="w-5 h-5 text-blue-400" />
                  </div>
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-mono font-bold">
                      CURRENT ACTIVE
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white font-sans">
                  {sc.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {sc.desc}
                </p>
              </div>

              <button
                onClick={() => handleTrigger(sc.id)}
                disabled={loadingAction !== null || isCurrent}
                className={`mt-5 w-full py-2.5 px-4 rounded-xl text-xs font-mono transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-40 ${sc.color}`}
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>{isLoading ? 'EXECUTING...' : isCurrent ? 'ACTIVE STATE' : 'TRIGGER EVENT'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Terminal & Live SSE Event Log */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2 font-mono text-xs font-bold text-white">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>BACKEND EVENT EXECUTION LOG (Server-Sent Events)</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Endpoint: POST /scenario/events
          </span>
        </div>

        <div className="bg-[#0b0f19] rounded-xl p-4 font-mono text-xs text-slate-300 space-y-2 max-h-56 overflow-y-auto border border-slate-800/80">
          {recentEvents.length === 0 ? (
            <div className="text-slate-500 italic">No events triggered yet.</div>
          ) : (
            recentEvents.map((evt) => (
              <div key={evt.id} className="flex items-start space-x-3 text-[11px] py-0.5">
                <span className="text-slate-500 flex-shrink-0">
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={`font-bold flex-shrink-0 ${
                    evt.severity === 'CRITICAL'
                      ? 'text-rose-400'
                      : evt.severity === 'WARNING'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  [{evt.event_type}]
                </span>
                <span className="text-slate-400 flex-shrink-0">
                  [{evt.source}]
                </span>
                <span className="text-slate-200">{evt.title}:</span>
                <span className="text-slate-400">{evt.description}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
