import React, { useState } from 'react';
import { useRealtime } from './hooks/useRealtime';
import { Header } from './components/layout/Header';
import { OverviewPage } from './pages/OverviewPage';
import { LiveMapPage } from './pages/LiveMapPage';
import { LogisticsPage } from './pages/LogisticsPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { CorridorDetailPage } from './pages/CorridorDetailPage';
import { ScenarioConsolePage } from './pages/ScenarioConsolePage';
import { DualSimulatorPage } from './pages/DualSimulatorPage';
import { Shield, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [resetting, setResetting] = useState<boolean>(false);

  const {
    active_scenario,
    segments,
    incidents,
    vehicles,
    deliveries,
    alerts,
    active_route,
    alternate_route,
    recent_events,
    connectionStatus,
    lastUpdated,
    loading,
    triggerScenario,
    resetDemo,
    acknowledgeAlert,
    acceptAlternateRoute
  } = useRealtime();

  const handleResetDemo = async () => {
    setResetting(true);
    try {
      await resetDemo();
    } finally {
      setResetting(false);
    }
  };

  if (loading && segments.length === 0) {
    return (
      <div className="w-screen h-screen bg-[#0b0f19] flex flex-col items-center justify-center space-y-4 text-white font-sans">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-xl shadow-blue-500/20 border border-blue-400/30 animate-pulse">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold">NER SENTINEL COMMAND CENTER</h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Hydrating synthetic mountain highway network & telemetry streams...
          </p>
        </div>
        <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col">
      {/* Command Center Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeScenario={active_scenario}
        connectionStatus={connectionStatus}
        lastUpdated={lastUpdated}
        onResetDemo={handleResetDemo}
        resetting={resetting}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'overview' && (
          <OverviewPage
            segments={segments}
            incidents={incidents}
            vehicles={vehicles}
            deliveries={deliveries}
            alerts={alerts}
            activeRoute={active_route}
            alternateRoute={alternate_route}
            recentEvents={recent_events}
            onAcknowledgeAlert={acknowledgeAlert}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'map' && (
          <LiveMapPage
            segments={segments}
            incidents={incidents}
            vehicles={vehicles}
            activeRoute={active_route}
            alternateRoute={alternate_route}
            recentEvents={recent_events}
          />
        )}

        {currentTab === 'logistics' && (
          <LogisticsPage
            deliveries={deliveries}
            vehicles={vehicles}
            activeRoute={active_route}
            alternateRoute={alternate_route}
          />
        )}

        {currentTab === 'incidents' && (
          <IncidentsPage incidents={incidents} />
        )}

        {currentTab === 'corridors' && (
          <CorridorDetailPage
            segments={segments}
            vehicles={vehicles}
            deliveries={deliveries}
            incidents={incidents}
          />
        )}

        {currentTab === 'scenarios' && (
          <ScenarioConsolePage
            activeScenario={active_scenario}
            onTriggerScenario={triggerScenario}
            onResetDemo={handleResetDemo}
            recentEvents={recent_events}
          />
        )}

        {currentTab === 'dual' && (
          <DualSimulatorPage
            activeScenario={active_scenario}
            segments={segments}
            incidents={incidents}
            vehicles={vehicles}
            deliveries={deliveries}
            alerts={alerts}
            activeRoute={active_route}
            alternateRoute={alternate_route}
            onTriggerScenario={triggerScenario}
            onResetDemo={handleResetDemo}
            onAcceptAlternateRoute={acceptAlternateRoute}
          />
        )}
      </main>
    </div>
  );
};

export default App;
