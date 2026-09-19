import React from 'react';
import {
  Shield,
  Radio,
  RefreshCw,
  Sliders,
  MapPin,
  Truck,
  AlertTriangle,
  Layers,
  Smartphone,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ScenarioName } from '@ner-sentinel/types';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  activeScenario: ScenarioName;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  lastUpdated: string;
  onResetDemo: () => void;
  resetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  activeScenario,
  connectionStatus,
  lastUpdated,
  onResetDemo,
  resetting
}) => {
  const getScenarioBadge = () => {
    switch (activeScenario) {
      case 'NORMAL':
        return {
          label: 'NORMAL BASELINE',
          color: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80',
          dot: 'bg-emerald-400'
        };
      case 'HEAVY_RAIN':
        return {
          label: 'HEAVY RAIN SURGE',
          color: 'bg-amber-950/80 text-amber-400 border-amber-800/80',
          dot: 'bg-amber-400 animate-ping'
        };
      case 'LANDSLIDE':
      case 'BLOCK_ROAD':
        return {
          label: 'LANDSLIDE • REROUTE ACTIVE',
          color: 'bg-rose-950/90 text-rose-400 border-rose-800/90',
          dot: 'bg-rose-400 animate-ping'
        };
      case 'RECOVERY':
        return {
          label: 'CORRIDOR RECOVERY',
          color: 'bg-blue-950/80 text-blue-400 border-blue-800/80',
          dot: 'bg-blue-400'
        };
      default:
        return {
          label: activeScenario,
          color: 'bg-slate-800 text-slate-300 border-slate-700',
          dot: 'bg-slate-400'
        };
    }
  };

  const badge = getScenarioBadge();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'map', label: 'Live GIS Map', icon: MapPin },
    { id: 'logistics', label: 'Logistics', icon: Truck },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
    { id: 'corridors', label: 'Corridors', icon: Sliders },
    { id: 'scenarios', label: 'Scenario Console', icon: Radio },
    { id: 'dual', label: 'Dual View (Driver App)', icon: Smartphone }
  ];

  return (
    <header className="bg-[#0e1422] border-b border-slate-800 sticky top-0 z-50 shadow-xl">
      {/* Top Utility Ribbon */}
      <div className="bg-[#090d17] px-4 py-1 border-b border-slate-800/60 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          {/* Government Protocol Tag */}
          <div className="flex items-center space-x-1.5 text-slate-400 font-medium">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>MDoNER • Smart Logistics & Accessibility Intelligence Platform</span>
          </div>
          <span className="text-slate-600">|</span>
          {/* Strict Demo Tag */}
          <div className="flex items-center space-x-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded font-mono text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span>DEMO ENVIRONMENT • SYNTHETIC DATA</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* SSE Live Telemetry Indicator */}
          <div className="flex items-center space-x-1.5 font-mono text-[11px]">
            <span
              className={`w-2 h-2 rounded-full ${connectionStatus === 'connected'
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : connectionStatus === 'connecting'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-500'
                }`}
            ></span>
            <span className="text-slate-400">
              {connectionStatus === 'connected'
                ? 'LIVE SSE STREAM'
                : connectionStatus === 'connecting'
                  ? 'CONNECTING...'
                  : 'OFFLINE'}
            </span>
          </div>

          <span className="text-slate-600">|</span>

          {/* User Role Indicator */}
          <div className="text-slate-400 text-[11px]">
            Role: <span className="text-blue-400 font-semibold">Control Room Coordinator</span>
          </div>

          <span className="text-slate-600">|</span>

          {/* Reset Demo CTA */}
          <button
            onClick={onResetDemo}
            disabled={resetting}
            className="flex items-center space-x-1 px-2.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-all text-[11px] font-medium active:scale-95 disabled:opacity-50"
            title="Restore prototype back to Scenario 1 Baseline"
          >
            <RefreshCw className={`w-3 h-3 text-slate-400 ${resetting ? 'animate-spin' : ''}`} />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Main Header & Nav Bar */}
      <div className="px-6 py-2.5 flex items-center justify-between">
        {/* Branding */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white font-sans">
                NER SENTINEL
              </h1>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-blue-900/60 text-blue-300 rounded border border-blue-700/60">
                PROTOTYPE v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Predict disruption. Protect connectivity. Keep essential supplies moving.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 bg-[#131b2e] p-1 rounded-xl border border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.id === 'dual' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Active Scenario Status Pill */}
        <div className="flex items-center space-x-2">
          <div
            className={`flex items-center space-x-2 px-3 py-1 rounded-lg border text-xs font-mono font-semibold ${badge.color}`}
          >
            <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
            <span>{badge.label}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
