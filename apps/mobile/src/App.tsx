import React, { useState } from 'react';
import { useDriverRealtime } from './hooks/useDriverRealtime';
import { translations, LanguageCode } from './i18n/languages';
import {
  Truck,
  Navigation,
  AlertTriangle,
  Camera,
  Layers,
  Globe,
  Wifi,
  WifiOff,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  Send,
  MapPin,
  Flame
} from 'lucide-react';
import { SyncReportItem } from '@ner-sentinel/types';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'trip' | 'alerts' | 'report' | 'queue'>('home');
  const [lang, setLang] = useState<LanguageCode>('en');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [syncQueue, setSyncQueue] = useState<SyncReportItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [acceptingRoute, setAcceptingRoute] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Form states for Incident Report
  const [reportType, setReportType] = useState<string>('LANDSLIDE');
  const [reportSeverity, setReportSeverity] = useState<string>('CRITICAL');
  const [reportNotes, setReportNotes] = useState<string>('Debris and mud blocking both highway lanes');

  const {
    activeScenario,
    vehicle,
    delivery,
    alerts,
    activeRoute,
    alternateRoute,
    connectionStatus,
    acceptAlternateRoute,
    submitReport,
    syncBatch
  } = useDriverRealtime();

  const t = translations[lang];

  const unackAlert = alerts.find((a) => !a.acknowledged_at);
  const isRerouteNeeded = activeScenario === 'LANDSLIDE' || activeScenario === 'BLOCK_ROAD';
  const isDriverRerouted = vehicle?.status === 'REROUTED';

  const handleSubmitReport = async () => {
    const reportItem: SyncReportItem = {
      id: `INC-MOB-${Date.now().toString(36).toUpperCase()}`,
      idempotency_key: `IDEMP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: reportType as any,
      severity: reportSeverity as any,
      latitude: vehicle?.latitude || 25.2631,
      longitude: vehicle?.longitude || 92.4285,
      segment_id: 'S-08',
      notes: reportNotes,
      photo_base64: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&auto=format&fit=crop&q=80',
      created_at: new Date().toISOString(),
      reporter: {
        id: vehicle?.id || 'V-101',
        name: vehicle?.driver_name || 'B. Barman',
        role: 'DRIVER',
        phone: vehicle?.driver_phone
      }
    };

    if (!isOnline) {
      setSyncQueue((prev) => [reportItem, ...prev]);
      setFeedbackMsg('Report saved in offline queue. Will sync automatically when online.');
      setTimeout(() => setFeedbackMsg(null), 3500);
      setCurrentScreen('queue');
    } else {
      try {
        await submitReport(reportItem);
        setFeedbackMsg('Report submitted to Command Center in real time.');
        setTimeout(() => setFeedbackMsg(null), 3500);
        setCurrentScreen('home');
      } catch (err) {
        setSyncQueue((prev) => [reportItem, ...prev]);
        setFeedbackMsg('Network error. Report saved to offline queue.');
        setTimeout(() => setFeedbackMsg(null), 3500);
      }
    }
  };

  const handleSyncQueue = async () => {
    if (syncQueue.length === 0 || !isOnline) return;
    setIsSyncing(true);
    try {
      await syncBatch(`BATCH-${Date.now()}`, syncQueue);
      setSyncQueue([]);
    } catch (err) {
      console.warn('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAcceptRoute = async () => {
    setAcceptingRoute(true);
    try {
      await acceptAlternateRoute(vehicle?.id || 'V-101');
    } finally {
      setAcceptingRoute(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 flex flex-col justify-between max-w-md mx-auto shadow-2xl border-x border-slate-800">
      {/* Top Mobile App Header */}
      <header className="bg-[#0e1627] border-b border-slate-800 px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Truck className="w-5 h-5 text-blue-400" />
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-sm font-bold text-white tracking-wide">NER SENTINEL</h1>
              <span className="text-[9px] font-mono px-1 py-0.2 bg-blue-950 text-blue-300 border border-blue-800 rounded">
                DRIVER
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Vehicle {vehicle?.vehicle_number || 'AS-01-EC-4210'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Simulated Network Toggle */}
          <button
            onClick={() => setIsOnline(!isOnline)}
            className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-800 text-[11px] font-mono"
            title="Toggle Online/Offline mode"
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">ONLINE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span className="text-rose-400 font-bold">OFFLINE</span>
              </>
            )}
          </button>

          {/* Multilingual Toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'as' : 'en')}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold border border-slate-700"
          >
            {lang === 'en' ? 'অসমীয়া' : 'English'}
          </button>
        </div>
      </header>

      {/* Connectivity Warning */}
      {!isOnline && (
        <div className="bg-rose-950 px-4 py-1.5 text-xs text-rose-300 flex items-center justify-between border-b border-rose-800">
          <span className="flex items-center space-x-1.5 font-mono text-[11px]">
            <WifiOff className="w-3.5 h-3.5" />
            <span>{t.offline}</span>
          </span>
          <span
            onClick={() => setCurrentScreen('queue')}
            className="underline cursor-pointer font-bold"
          >
            {syncQueue.length} {t.pending_sync}
          </span>
        </div>
      )}

      {/* Main Content View */}
      <main className="flex-1 p-4 overflow-y-auto space-y-4">
        {feedbackMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* --- SCREEN: HOME --- */}
        {currentScreen === 'home' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Driver Greeting Card */}
            <div className="bg-[#10182b] border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-md">
              <div>
                <span className="text-xs text-slate-400">{t.greeting}</span>
                <h2 className="text-base font-bold text-white mt-0.5">
                  {vehicle?.driver_name || 'B. Barman'}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-mono">Trip ID</span>
                <div className="text-xs font-mono font-bold text-blue-400 mt-0.5">
                  {vehicle?.trip_id || 'TRIP-MED-901'}
                </div>
              </div>
            </div>

            {/* Active Delivery Trip Card */}
            <div className="bg-gradient-to-br from-[#121c33] to-[#0c1324] border border-slate-700/80 p-5 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2.5 py-1 bg-blue-950 text-blue-300 rounded-lg border border-blue-800">
                  {t.active_trip}
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${isDriverRerouted
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    }`}
                >
                  {isDriverRerouted ? t.rerouted : t.on_route}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white leading-tight">
                  {t.cargo}
                </h3>
                <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    To: <strong className="text-slate-200">{t.destination}</strong>
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 font-mono">
                <div className="bg-[#080d1a] p-3 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">{t.eta}</div>
                  <div className="text-xl font-black text-emerald-400 mt-0.5">
                    {delivery?.current_eta || '5h 12m'}
                  </div>
                </div>
                <div className="bg-[#080d1a] p-3 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400">{t.distance}</div>
                  <div className="text-xl font-black text-white mt-0.5">
                    {delivery?.distance_km || 198} km
                  </div>
                </div>
              </div>

              {/* Resume Navigation Button */}
              <button
                onClick={() => setCurrentScreen('trip')}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center justify-center space-x-2 shadow-xl shadow-blue-600/30 transition-all active:scale-95"
              >
                <Navigation className="w-4 h-4 fill-current" />
                <span>{t.resume_navigation}</span>
              </button>
            </div>

            {/* Road Hazard Alert Banner if active */}
            {unackAlert && (
              <div
                onClick={() => setCurrentScreen('alerts')}
                className="p-4 bg-rose-950/40 border border-rose-600/70 rounded-2xl cursor-pointer hover:border-rose-500 transition-all space-y-2 animate-pulse shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{t.hazard_warning}</span>
                  </div>
                  <span className="text-xs font-mono text-rose-400 underline font-bold">
                    View Alert
                  </span>
                </div>
                <p className="text-xs text-white font-medium leading-snug">
                  {unackAlert.title}: {unackAlert.message}
                </p>
              </div>
            )}

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => setCurrentScreen('report')}
                className="p-4 bg-[#111827] border border-slate-800 hover:border-slate-700 rounded-2xl text-left space-y-1.5 shadow-md"
              >
                <Camera className="w-5 h-5 text-blue-400" />
                <div className="text-xs font-bold text-white">{t.report_incident}</div>
                <div className="text-[11px] text-slate-400">Capture GPS & notes</div>
              </button>

              <button
                onClick={() => setCurrentScreen('queue')}
                className="p-4 bg-[#111827] border border-slate-800 hover:border-slate-700 rounded-2xl text-left space-y-1.5 shadow-md relative"
              >
                <Layers className="w-5 h-5 text-purple-400" />
                <div className="text-xs font-bold text-white">{t.sync_queue}</div>
                <div className="text-[11px] text-slate-400">
                  {syncQueue.length > 0 ? `${syncQueue.length} pending sync` : 'All reports synced'}
                </div>
                {syncQueue.length > 0 && (
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* --- SCREEN: ACTIVE TRIP --- */}
        {currentScreen === 'trip' && (
          <div className="space-y-4 animate-in fade-in flex-1 flex flex-col">
            <button
              onClick={() => setCurrentScreen('home')}
              className="flex items-center space-x-1.5 text-slate-400 hover:text-white text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>

            {/* Turn-by-Turn Guidance Header */}
            <div className="bg-[#131c33] border border-slate-700 p-4 rounded-2xl flex items-center space-x-3.5 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl flex-shrink-0">
                ↗
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  {isDriverRerouted
                    ? 'Diverted via NH-27 Bypass Lumding'
                    : 'In 14 km, continue on Mountain Pass NH-6'}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Heading: {vehicle?.heading_deg || 140}° • Speed: {vehicle?.speed_kmh || 42} km/h
                </div>
              </div>
            </div>

            {/* Active Guidance Card */}
            <div className="bg-[#0d1424] border border-slate-800 rounded-2xl p-4 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">Live Route Guidance</span>
                  <span className="text-xs font-mono text-emerald-400">GPS TELEMETRY ACTIVE</span>
                </div>

                <div className="bg-[#070b14] p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
                  <div className="text-slate-400 text-[11px]">Active Transit Corridor</div>
                  <div className="font-bold text-white text-sm">
                    {isDriverRerouted ? 'Corridor B (Alternate Bypass)' : 'Corridor A (Mountain Lifeline)'}
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 text-slate-400 border-t border-slate-800">
                    <span>Current ETA: <strong className="text-emerald-400 text-sm">{delivery?.current_eta}</strong></span>
                    <span>Distance: <strong className="text-white">{delivery?.distance_km} km</strong></span>
                  </div>
                </div>
              </div>

              {/* Reroute Alert Dialog */}
              {isRerouteNeeded && !isDriverRerouted && (
                <div className="bg-rose-950/90 border-2 border-rose-500 p-4 rounded-2xl shadow-2xl space-y-3 animate-in zoom-in-95">
                  <div className="flex items-center space-x-2 text-rose-300 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    <span>{t.route_updated}</span>
                  </div>

                  <p className="text-xs text-white leading-relaxed">
                    {t.closure_detected} Physical landslide debris confirmed on S-08 approach.
                  </p>

                  <div className="bg-black/70 p-3 rounded-xl border border-white/10 font-mono text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-400">
                      <span>{t.previous_eta}:</span>
                      <span className="line-through">5h 12m (198 km)</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold text-sm">
                      <span>{t.new_eta}:</span>
                      <span>6h 03m (206 km)</span>
                    </div>
                    <div className="text-[11px] text-amber-300 pt-1">
                      {t.alt_corridor_b}
                    </div>
                  </div>

                  <button
                    onClick={handleAcceptRoute}
                    disabled={acceptingRoute}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl flex items-center justify-center space-x-2 shadow-xl active:scale-95 disabled:opacity-50"
                  >
                    {acceptingRoute ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{t.accept_route}</span>
                  </button>
                </div>
              )}

              {isDriverRerouted && (
                <div className="bg-emerald-950/60 border border-emerald-500/50 p-3.5 rounded-xl flex items-center space-x-3 text-xs">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-emerald-300 text-sm">Reroute Active</div>
                    <div className="text-xs text-slate-300 mt-0.5">
                      Navigating via NH-27 Lumding-Haflong bypass. (New ETA: 6h 03m)
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- SCREEN: ALERTS --- */}
        {currentScreen === 'alerts' && (
          <div className="space-y-4 animate-in fade-in">
            <button
              onClick={() => setCurrentScreen('home')}
              className="flex items-center space-x-1.5 text-slate-400 hover:text-white text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <h3 className="text-base font-bold text-white">Disaster & Route Alerts</h3>

            {alerts.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">
                Zero active hazard alerts. All corridors nominal.
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-[#111827] border border-amber-500/40 p-4 rounded-2xl space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 text-sm">{alert.title}</span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800 font-bold">
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-slate-200 leading-relaxed text-xs">{alert.message}</p>
                  {alert.expected_delay_text && (
                    <div className="text-xs font-mono text-slate-400">
                      Expected Delay: {alert.expected_delay_text}
                    </div>
                  )}
                  {alert.alternate_route_id && (
                    <button
                      onClick={() => setCurrentScreen('trip')}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl mt-2 text-xs"
                    >
                      View Alternate Route
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* --- SCREEN: REPORT INCIDENT --- */}
        {currentScreen === 'report' && (
          <div className="space-y-4 animate-in fade-in">
            <button
              onClick={() => setCurrentScreen('home')}
              className="flex items-center space-x-1.5 text-slate-400 hover:text-white text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <h3 className="text-base font-bold text-white">{t.report_incident}</h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-mono text-[11px]">
                  {t.incident_type}
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full bg-[#111827] border border-slate-700 rounded-xl p-3 text-white text-xs"
                >
                  <option value="LANDSLIDE">Landslide / Mudslide</option>
                  <option value="FLOOD">Water Inundation / Flash Flood</option>
                  <option value="ROAD_DAMAGE">Road Subsidence / Cut</option>
                  <option value="BRIDGE_DAMAGE">Bridge Damage</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-mono text-[11px]">
                  {t.severity}
                </label>
                <select
                  value={reportSeverity}
                  onChange={(e) => setReportSeverity(e.target.value)}
                  className="w-full bg-[#111827] border border-slate-700 rounded-xl p-3 text-white text-xs"
                >
                  <option value="CRITICAL">CRITICAL — Impassable</option>
                  <option value="HIGH">HIGH — Hazardous</option>
                  <option value="MEDIUM">MEDIUM — Passable with Caution</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-mono text-[11px]">
                  Field Notes
                </label>
                <textarea
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-[#111827] border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="bg-[#111827] p-3 rounded-xl border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
                <div>GPS Lock: {vehicle?.latitude.toFixed(4)}°N, {vehicle?.longitude.toFixed(4)}°E</div>
                <div>Location: S-08 Pass Approach</div>
                <div className="text-blue-400 font-semibold flex items-center space-x-1.5 pt-1">
                  <Camera className="w-4 h-4" />
                  <span>Photo Attachment: camera_sonapur.jpg</span>
                </div>
              </div>

              <button
                onClick={handleSubmitReport}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center space-x-2 shadow-xl transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>{isOnline ? t.submit : t.save_offline}</span>
              </button>
            </div>
          </div>
        )}

        {/* --- SCREEN: SYNC QUEUE --- */}
        {currentScreen === 'queue' && (
          <div className="space-y-4 animate-in fade-in">
            <button
              onClick={() => setCurrentScreen('home')}
              className="flex items-center space-x-1.5 text-slate-400 hover:text-white text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">{t.sync_queue}</h3>
              <span className="text-xs font-mono text-slate-400">
                {isOnline ? 'Online (Ready to Sync)' : 'Offline (Local Cache)'}
              </span>
            </div>

            {syncQueue.length === 0 ? (
              <div className="bg-[#10182b] p-8 rounded-2xl text-center space-y-2 border border-slate-800 text-xs text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <div className="font-bold text-white text-sm">{t.all_synced}</div>
                <p className="text-xs text-slate-400">
                  Zero pending reports in offline device storage.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>{syncQueue.length} {t.pending_sync}</span>
                  <button
                    onClick={handleSyncQueue}
                    disabled={!isOnline || isSyncing}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-lg text-xs transition-all disabled:opacity-40 flex items-center space-x-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Sync Now</span>
                  </button>
                </div>

                {syncQueue.map((item) => (
                  <div
                    key={item.idempotency_key}
                    className="bg-[#10182b] border border-amber-500/40 p-3.5 rounded-xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300 text-xs">{item.type}</span>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800">
                        QUEUED OFFLINE
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs">{item.notes}</p>
                    <div className="text-[10px] font-mono text-slate-500">
                      Key: {item.idempotency_key}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <footer className="bg-[#0b101c] border-t border-slate-800 px-6 py-2.5 flex items-center justify-around text-xs sticky bottom-0 z-30">
        <button
          onClick={() => setCurrentScreen('home')}
          className={`flex flex-col items-center py-1 ${currentScreen === 'home' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          <Truck className="w-5 h-5" />
          <span className="text-[11px] mt-0.5">Home</span>
        </button>

        <button
          onClick={() => setCurrentScreen('trip')}
          className={`flex flex-col items-center py-1 ${currentScreen === 'trip' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          <Navigation className="w-5 h-5" />
          <span className="text-[11px] mt-0.5">Trip</span>
        </button>

        <button
          onClick={() => setCurrentScreen('report')}
          className={`flex flex-col items-center py-1 ${currentScreen === 'report' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          <Camera className="w-5 h-5" />
          <span className="text-[11px] mt-0.5">Report</span>
        </button>

        <button
          onClick={() => setCurrentScreen('queue')}
          className={`flex flex-col items-center py-1 relative ${currentScreen === 'queue' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[11px] mt-0.5">Sync</span>
          {syncQueue.length > 0 && (
            <span className="absolute top-0 right-2 w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          )}
        </button>
      </footer>
    </div>
  );
};

export default App;
