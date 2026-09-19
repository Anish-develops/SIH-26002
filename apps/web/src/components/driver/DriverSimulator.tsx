import React, { useState, useEffect } from 'react';
import {
  RoadSegment,
  Vehicle,
  Delivery,
  Alert,
  RouteRecommendation,
  ScenarioName,
  SyncReportItem
} from '@ner-sentinel/types';
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
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  Send,
  MapPin,
  Flame,
  Volume2
} from 'lucide-react';
import { translations, LanguageCode } from '../../i18n/languages';

interface DriverSimulatorProps {
  activeScenario: ScenarioName;
  vehicle: Vehicle | null;
  delivery: Delivery | null;
  alerts: Alert[];
  activeRoute: RouteRecommendation | null;
  alternateRoute: RouteRecommendation | null;
  onAcceptAlternateRoute: (vehicleId: string) => Promise<any>;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const DriverSimulator: React.FC<DriverSimulatorProps> = ({
  activeScenario,
  vehicle,
  delivery,
  alerts,
  activeRoute,
  alternateRoute,
  onAcceptAlternateRoute
}) => {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'trip' | 'alerts' | 'report' | 'queue'>('home');
  const [lang, setLang] = useState<LanguageCode>('en');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [syncQueue, setSyncQueue] = useState<SyncReportItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [acceptingRoute, setAcceptingRoute] = useState<boolean>(false);
  const [audioPlayed, setAudioPlayed] = useState<boolean>(false);

  // Form states for Incident Report
  const [reportType, setReportType] = useState<string>('LANDSLIDE');
  const [reportSeverity, setReportSeverity] = useState<string>('CRITICAL');
  const [reportNotes, setReportNotes] = useState<string>('Mud and rock debris obstructing pass road');
  const [reportSubmittedMsg, setReportSubmittedMsg] = useState<string | null>(null);

  const t = translations[lang];

  const unackAlert = alerts.find((a) => !a.acknowledged_at);
  const isRerouteNeeded = activeScenario === 'LANDSLIDE' || activeScenario === 'BLOCK_ROAD';
  const isDriverRerouted = vehicle?.status === 'REROUTED';

  // Play synthetic audio chime on alert
  useEffect(() => {
    if (unackAlert && !audioPlayed) {
      setAudioPlayed(true);
    }
    if (!unackAlert) {
      setAudioPlayed(false);
    }
  }, [unackAlert, audioPlayed]);

  // Handle submitting incident report
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
      // Offline mode: Queue locally
      setSyncQueue((prev) => [reportItem, ...prev]);
      setReportSubmittedMsg('Report saved in offline queue. Will sync automatically when online.');
      setTimeout(() => setReportSubmittedMsg(null), 3000);
      setCurrentScreen('queue');
    } else {
      // Online mode: Send immediately to API
      try {
        const res = await fetch(`${API_BASE}/reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reportItem)
        });
        if (res.ok) {
          setReportSubmittedMsg('Report submitted to Command Center in real time.');
          setTimeout(() => setReportSubmittedMsg(null), 3000);
          setCurrentScreen('home');
        }
      } catch (err) {
        setSyncQueue((prev) => [reportItem, ...prev]);
        setReportSubmittedMsg('Network error. Report saved to offline queue.');
        setTimeout(() => setReportSubmittedMsg(null), 3000);
      }
    }
  };

  // Sync offline queue
  const handleSyncQueue = async () => {
    if (syncQueue.length === 0 || !isOnline) return;
    setIsSyncing(true);

    try {
      const res = await fetch(`${API_BASE}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: `BATCH-${Date.now()}`,
          reports: syncQueue
        })
      });
      if (res.ok) {
        setSyncQueue([]);
      }
    } catch (err) {
      console.warn('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Accept Reroute
  const handleAcceptRoute = async () => {
    setAcceptingRoute(true);
    try {
      await onAcceptAlternateRoute(vehicle?.id || 'V-101');
    } finally {
      setAcceptingRoute(false);
    }
  };

  return (
    <div className="w-[375px] h-[780px] bg-[#070b12] rounded-[48px] border-[10px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col relative font-sans select-none ring-1 ring-slate-700">
      {/* Phone Notch & Status Bar */}
      <div className="bg-[#0b101c] px-6 pt-3 pb-2 flex items-center justify-between text-white text-[11px] font-mono z-20">
        <span>10:30 PM</span>
        <div className="w-24 h-4 bg-black rounded-full mx-auto"></div>
        <div className="flex items-center space-x-2">
          {/* Online/Offline Toggle */}
          <button
            onClick={() => setIsOnline(!isOnline)}
            className="flex items-center space-x-1"
            title="Toggle Simulated Connectivity"
          >
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            )}
          </button>
          <span>5G</span>
          <div className="w-5 h-2.5 border border-white rounded-sm p-0.5">
            <div className="w-full h-full bg-emerald-400 rounded-2xs"></div>
          </div>
        </div>
      </div>

      {/* Driver App Header */}
      <div className="bg-[#0e1627] px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs z-10">
        <div className="flex items-center space-x-2">
          <Truck className="w-4 h-4 text-blue-400" />
          <span className="font-bold text-white tracking-wide">NER SENTINEL</span>
          <span className="text-[9px] font-mono px-1 py-0.2 bg-blue-950 text-blue-300 border border-blue-800 rounded">
            DRIVER
          </span>
        </div>

        {/* Language Switcher */}
        <button
          onClick={() => setLang(lang === 'en' ? 'as' : 'en')}
          className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white text-[10px] font-semibold border border-slate-700"
        >
          <Globe className="w-3 h-3 text-slate-400" />
          <span>{lang === 'en' ? 'অসমীয়া' : 'English'}</span>
        </button>
      </div>

      {/* Connectivity Banner if Offline */}
      {!isOnline && (
        <div className="bg-rose-950 text-rose-300 px-3 py-1 text-[10px] font-mono flex items-center justify-between border-b border-rose-800">
          <span className="flex items-center space-x-1">
            <WifiOff className="w-3 h-3 text-rose-400" />
            <span>{t.offline}</span>
          </span>
          <span className="underline cursor-pointer" onClick={() => setCurrentScreen('queue')}>
            {syncQueue.length} queued
          </span>
        </div>
      )}

      {/* Body: Screen Switcher */}
      <div className="flex-1 overflow-y-auto bg-[#070b12] text-slate-100 flex flex-col p-4 space-y-3">
        {/* ==================== SCREEN: HOME ==================== */}
        {currentScreen === 'home' && (
          <div className="space-y-3.5 animate-in fade-in">
            {/* Driver Greeting Card */}
            <div className="bg-[#10182b] border border-slate-800 p-3.5 rounded-2xl">
              <div className="text-[11px] text-slate-400">{t.greeting}</div>
              <div className="text-sm font-bold text-white mt-0.5">
                {vehicle?.driver_name || 'B. Barman'} ({vehicle?.vehicle_number || 'AS-01-EC-4210'})
              </div>
            </div>

            {/* Active Delivery Trip Card */}
            <div className="bg-gradient-to-br from-[#121c33] to-[#0c1324] border border-slate-700/70 p-4 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-blue-950 text-blue-300 rounded border border-blue-800">
                  {t.active_trip}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    isDriverRerouted
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {isDriverRerouted ? t.rerouted : t.on_route}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white leading-tight">
                  {t.cargo}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Destination: <span className="text-slate-200 font-semibold">{t.destination}</span>
                </p>
              </div>

              {/* ETA & Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 font-mono">
                <div className="bg-[#080d1a] p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">{t.eta}</div>
                  <div className="text-base font-black text-emerald-400 mt-0.5">
                    {delivery?.current_eta || '5h 12m'}
                  </div>
                </div>
                <div className="bg-[#080d1a] p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400">{t.distance}</div>
                  <div className="text-base font-black text-white mt-0.5">
                    {delivery?.distance_km || 198} km
                  </div>
                </div>
              </div>

              {/* Resume Navigation CTA */}
              <button
                onClick={() => setCurrentScreen('trip')}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95"
              >
                <Navigation className="w-4 h-4 fill-current" />
                <span>{t.resume_navigation}</span>
              </button>
            </div>

            {/* Road Hazard Alert Banner (if alert active) */}
            {unackAlert && (
              <div
                onClick={() => setCurrentScreen('alerts')}
                className="p-3.5 bg-rose-950/40 border border-rose-600/60 rounded-2xl cursor-pointer hover:border-rose-500 transition-all space-y-1.5 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-rose-400 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{t.hazard_warning}</span>
                  </div>
                  <span className="text-[10px] font-mono text-rose-400 underline">View</span>
                </div>
                <p className="text-xs text-slate-200 font-medium leading-snug">
                  {unackAlert.title}: {unackAlert.message}
                </p>
              </div>
            )}

            {/* Quick Reporting Link */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => setCurrentScreen('report')}
                className="p-3 bg-[#111827] border border-slate-800 hover:border-slate-700 rounded-xl text-left space-y-1"
              >
                <Camera className="w-4 h-4 text-blue-400" />
                <div className="text-xs font-bold text-white">{t.report_incident}</div>
                <div className="text-[10px] text-slate-400">Attach GPS & photo</div>
              </button>

              <button
                onClick={() => setCurrentScreen('queue')}
                className="p-3 bg-[#111827] border border-slate-800 hover:border-slate-700 rounded-xl text-left space-y-1 relative"
              >
                <Layers className="w-4 h-4 text-purple-400" />
                <div className="text-xs font-bold text-white">{t.sync_queue}</div>
                <div className="text-[10px] text-slate-400">
                  {syncQueue.length > 0 ? `${syncQueue.length} pending` : 'All synced'}
                </div>
                {syncQueue.length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400"></span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ==================== SCREEN: ACTIVE TRIP ==================== */}
        {currentScreen === 'trip' && (
          <div className="space-y-3 animate-in fade-in flex-1 flex flex-col">
            <button
              onClick={() => setCurrentScreen('home')}
              className="flex items-center space-x-1 text-slate-400 hover:text-white text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>

            {/* Turn-by-Turn Guidance Header */}
            <div className="bg-[#131c33] border border-slate-700 p-3.5 rounded-2xl flex items-center space-x-3 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-base flex-shrink-0">
                ↗
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  {isDriverRerouted
                    ? 'Follow NH-27 Bypass via Lumding'
                    : 'In 14 km, continue on Mountain Pass NH-6'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Heading: {vehicle?.heading_deg || 140}° • Speed: {vehicle?.speed_kmh || 42} km/h
                </div>
              </div>
            </div>

            {/* Simulated Live Route Canvas */}
            <div className="bg-[#0d1424] border border-slate-800 rounded-2xl p-4 flex-1 flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">Live Segment Guidance</span>
                  <span className="text-[10px] font-mono text-emerald-400">GPS LOCKED</span>
                </div>

                <div className="bg-[#070b14] p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs font-mono">
                  <div className="text-slate-400 text-[10px]">Current Corridor</div>
                  <div className="font-bold text-white">
                    {isDriverRerouted ? 'Corridor B (Alternate Bypass)' : 'Corridor A (Mountain Lifeline)'}
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-slate-800">
                    <span>ETA: <strong className="text-emerald-400">{delivery?.current_eta}</strong></span>
                    <span>Dist: <strong>{delivery?.distance_km} km</strong></span>
                  </div>
                </div>
              </div>

              {/* REROUTE PROMPT MODAL (if road closure triggered) */}
              {isRerouteNeeded && !isDriverRerouted && (
                <div className="bg-rose-950/90 border-2 border-rose-500 p-4 rounded-2xl shadow-2xl space-y-3 animate-in zoom-in-95">
                  <div className="flex items-center space-x-2 text-rose-300 font-bold text-xs">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    <span>{t.route_updated}</span>
                  </div>

                  <p className="text-xs text-white leading-relaxed">
                    {t.closure_detected} Physical landslide confirmed on S-08 approach.
                  </p>

                  <div className="bg-black/60 p-2.5 rounded-xl border border-white/10 font-mono text-[11px] space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>{t.previous_eta}:</span>
                      <span className="line-through">5h 12m (198 km)</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>{t.new_eta}:</span>
                      <span>6h 03m (206 km)</span>
                    </div>
                    <div className="text-[10px] text-amber-300 pt-0.5">
                      {t.alt_corridor_b}
                    </div>
                  </div>

                  <button
                    onClick={handleAcceptRoute}
                    disabled={acceptingRoute}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    {acceptingRoute ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>{t.accept_route}</span>
                  </button>
                </div>
              )}

              {/* If already rerouted */}
              {isDriverRerouted && (
                <div className="bg-emerald-950/60 border border-emerald-500/50 p-3 rounded-xl flex items-center space-x-2.5 text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-emerald-300">Reroute Active</div>
                    <div className="text-[10px] text-slate-300">
                      Navigating via NH-27 Lumding-Haflong bypass. (ETA: 6h 03m)
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== SCREEN: ALERTS ==================== */}
        {currentScreen === 'alerts' && (
          <div className="space-y-3 animate-in fade-in">
            <button
              onClick={() => setCurrentScreen('home')}
              className="flex items-center space-x-1 text-slate-400 hover:text-white text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <h3 className="text-sm font-bold text-white">Disaster & Route Alerts</h3>

            {alerts.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                No active hazard alerts.
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-[#111827] border border-amber-500/40 p-3.5 rounded-2xl space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300">{alert.title}</span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800">
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-slate-200 leading-relaxed">{alert.message}</p>
                  {alert.expected_delay_text && (
                    <div className="text-[11px] font-mono text-slate-400">
                      Delay: {alert.expected_delay_text}
                    </div>
                  )}
                  {alert.alternate_route_id && (
                    <button
                      onClick={() => setCurrentScreen('trip')}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg mt-1"
                    >
                      View Alternate Route
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ==================== SCREEN: REPORT INCIDENT ==================== */}
        {currentScreen === 'report' && (
          <div className="space-y-3 animate-in fade-in">
            <button
              onClick={() => setCurrentScreen('home')}
              className="flex items-center space-x-1 text-slate-400 hover:text-white text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <h3 className="text-sm font-bold text-white">{t.report_incident}</h3>

            {reportSubmittedMsg && (
              <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{reportSubmittedMsg}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-mono text-[11px]">
                  {t.incident_type}
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full bg-[#111827] border border-slate-700 rounded-xl p-2.5 text-white text-xs"
                >
                  <option value="LANDSLIDE">Landslide / Mudslide</option>
                  <option value="FLOOD">Water Inundation / Flash Flood</option>
                  <option value="ROAD_DAMAGE">Surface Collapse / Subsidence</option>
                  <option value="BRIDGE_DAMAGE">Bridge Approach Damage</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-mono text-[11px]">
                  {t.severity}
                </label>
                <select
                  value={reportSeverity}
                  onChange={(e) => setReportSeverity(e.target.value)}
                  className="w-full bg-[#111827] border border-slate-700 rounded-xl p-2.5 text-white text-xs"
                >
                  <option value="CRITICAL">CRITICAL — Fully Blocked</option>
                  <option value="HIGH">HIGH — Dangerous / Single Lane</option>
                  <option value="MEDIUM">MEDIUM — Minor Obstruction</option>
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
                  className="w-full bg-[#111827] border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="bg-[#111827] p-2.5 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                <div>GPS: {vehicle?.latitude.toFixed(4)}°N, {vehicle?.longitude.toFixed(4)}°E</div>
                <div>Location: S-08 Khliehriat – Pass Section</div>
                <div className="text-blue-400 font-semibold flex items-center space-x-1">
                  <Camera className="w-3 h-3" />
                  <span>Photo Attachment: camera_photo.jpg (Verified)</span>
                </div>
              </div>

              <button
                onClick={handleSubmitReport}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center space-x-2 shadow-lg transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>{isOnline ? t.submit : t.save_offline}</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================== SCREEN: SYNC QUEUE ==================== */}
        {currentScreen === 'queue' && (
          <div className="space-y-3 animate-in fade-in">
            <button
              onClick={() => setCurrentScreen('home')}
              className="flex items-center space-x-1 text-slate-400 hover:text-white text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{t.sync_queue}</h3>
              <span className="text-[10px] font-mono text-slate-400">
                {isOnline ? 'Network Connected' : 'Offline Mode'}
              </span>
            </div>

            {syncQueue.length === 0 ? (
              <div className="bg-[#10182b] p-6 rounded-2xl text-center space-y-2 border border-slate-800 text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="font-bold text-white">{t.all_synced}</div>
                <p className="text-[11px] text-slate-400">
                  Zero pending reports in local device storage.
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>{syncQueue.length} {t.pending_sync}</span>
                  <button
                    onClick={handleSyncQueue}
                    disabled={!isOnline || isSyncing}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-black font-bold rounded-lg text-[10px] transition-all disabled:opacity-40 flex items-center space-x-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Sync Now</span>
                  </button>
                </div>

                {syncQueue.map((item) => (
                  <div
                    key={item.idempotency_key}
                    className="bg-[#10182b] border border-amber-500/40 p-3 rounded-xl space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">{item.type}</span>
                      <span className="text-[10px] font-mono text-amber-400">QUEUED</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{item.notes}</p>
                    <div className="text-[10px] font-mono text-slate-500">
                      Key: {item.idempotency_key.substring(0, 16)}...
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Driver Bottom Navigation Bar */}
      <div className="bg-[#0b101c] border-t border-slate-800 px-4 py-2 flex items-center justify-around text-xs z-10">
        <button
          onClick={() => setCurrentScreen('home')}
          className={`flex flex-col items-center py-1 ${
            currentScreen === 'home' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        <button
          onClick={() => setCurrentScreen('trip')}
          className={`flex flex-col items-center py-1 ${
            currentScreen === 'trip' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Trip</span>
        </button>

        <button
          onClick={() => setCurrentScreen('report')}
          className={`flex flex-col items-center py-1 ${
            currentScreen === 'report' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Report</span>
        </button>

        <button
          onClick={() => setCurrentScreen('queue')}
          className={`flex flex-col items-center py-1 relative ${
            currentScreen === 'queue' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Sync</span>
          {syncQueue.length > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-amber-400"></span>
          )}
        </button>
      </div>
    </div>
  );
};
