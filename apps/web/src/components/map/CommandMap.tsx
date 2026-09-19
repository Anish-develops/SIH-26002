import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  RoadSegment,
  Incident,
  Vehicle,
  RouteRecommendation
} from '@ner-sentinel/types';
import { Layers, Eye, EyeOff, Navigation, AlertTriangle, ShieldCheck, CloudRain } from 'lucide-react';

interface CommandMapProps {
  segments: RoadSegment[];
  incidents: Incident[];
  vehicles: Vehicle[];
  activeRoute: RouteRecommendation | null;
  alternateRoute: RouteRecommendation | null;
  selectedSegmentId?: string;
  onSelectSegment?: (segment: RoadSegment) => void;
  onSelectIncident?: (incident: Incident) => void;
  onSelectVehicle?: (vehicle: Vehicle) => void;
  showWeatherOverlay?: boolean;
}

export const CommandMap: React.FC<CommandMapProps> = ({
  segments,
  incidents,
  vehicles,
  activeRoute,
  alternateRoute,
  selectedSegmentId,
  onSelectSegment,
  onSelectIncident,
  onSelectVehicle,
  showWeatherOverlay = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    segmentsLayer?: L.LayerGroup;
    vehiclesLayer?: L.LayerGroup;
    incidentsLayer?: L.LayerGroup;
    routesLayer?: L.LayerGroup;
    weatherLayer?: L.LayerGroup;
  }>({});

  const [layersVisible, setLayersVisible] = useState({
    segments: true,
    vehicles: true,
    incidents: true,
    routes: true,
    weather: showWeatherOverlay
  });

  // Sync external weather prop
  useEffect(() => {
    setLayersVisible((prev) => ({ ...prev, weather: showWeatherOverlay }));
  }, [showWeatherOverlay]);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [25.5, 92.4],
      zoom: 8.5,
      zoomControl: false,
      attributionControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Dark Matter Carto Tiles for professional government GIS command aesthetic
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      subdomains: 'abcd'
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Render Road Segments
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (layersRef.current.segmentsLayer) {
      map.removeLayer(layersRef.current.segmentsLayer);
    }

    if (!layersVisible.segments) return;

    const segmentsGroup = L.layerGroup();

    segments.forEach((seg) => {
      // Leaflet expects [latitude, longitude], GeoJSON coordinates are [longitude, latitude]
      const latLngs = seg.geometry.coordinates.map((coord) => [coord[1], coord[0]] as [number, number]);

      let color = '#10B981'; // OPEN
      let weight = 5;
      let dashArray = undefined;

      if (seg.status === 'RESTRICTED') {
        color = '#F59E0B'; // Amber
        weight = 6;
      } else if (seg.status === 'BLOCKED') {
        color = '#EF4444'; // Red
        weight = 8;
      }

      if (seg.id === selectedSegmentId) {
        color = '#3B82F6'; // Highlighted
        weight = 9;
      }

      const polyline = L.polyline(latLngs, {
        color,
        weight,
        opacity: 0.9,
        dashArray,
        lineCap: 'round',
        lineJoin: 'round'
      });

      // Hover Tooltip
      polyline.bindTooltip(
        `<div class="p-1.5 font-sans text-xs bg-slate-900 border border-slate-700 rounded shadow-xl text-white">
          <div class="font-bold text-slate-100">${seg.name}</div>
          <div class="flex items-center space-x-2 mt-1">
            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${
              seg.status === 'OPEN'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                : seg.status === 'RESTRICTED'
                ? 'bg-amber-950 text-amber-300 border border-amber-700'
                : 'bg-rose-950 text-rose-300 border border-rose-700'
            }">${seg.status}</span>
            <span class="text-slate-400 font-mono text-[10px]">Risk: ${seg.risk_score}/100 (${seg.risk_level})</span>
          </div>
          <div class="text-[10px] text-slate-400 mt-1">Elev: ${seg.elevation_m}m | Slope: ${seg.slope_deg}°</div>
        </div>`,
        { sticky: true, opacity: 0.95 }
      );

      polyline.on('click', () => {
        onSelectSegment?.(seg);
      });

      polyline.addTo(segmentsGroup);
    });

    segmentsGroup.addTo(map);
    layersRef.current.segmentsLayer = segmentsGroup;
  }, [segments, selectedSegmentId, layersVisible.segments, onSelectSegment]);

  // 3. Render Vehicles
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (layersRef.current.vehiclesLayer) {
      map.removeLayer(layersRef.current.vehiclesLayer);
    }

    if (!layersVisible.vehicles) return;

    const vehiclesGroup = L.layerGroup();

    vehicles.forEach((veh) => {
      const isMedicine = veh.id === 'V-101';
      const isRerouted = veh.status === 'REROUTED';

      const customIcon = L.divIcon({
        className: 'vehicle-marker-wrapper',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="absolute w-8 h-8 rounded-full ${
              isRerouted
                ? 'bg-amber-500/30 animate-ping'
                : isMedicine
                ? 'bg-blue-500/40 animate-ping'
                : 'bg-emerald-500/30'
            }"></div>
            <div class="w-7 h-7 rounded-full ${
              isRerouted ? 'bg-amber-500 border-amber-300' : isMedicine ? 'bg-blue-600 border-blue-300' : 'bg-slate-700 border-slate-500'
            } border-2 flex items-center justify-center text-white shadow-lg z-10">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </div>
            <div class="absolute -bottom-5 whitespace-nowrap px-1.5 py-0.5 bg-slate-950/90 border border-slate-800 rounded text-[10px] font-mono text-white font-semibold shadow">
              ${veh.vehicle_number}
            </div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker([veh.latitude, veh.longitude], { icon: customIcon });

      marker.bindTooltip(
        `<div class="p-2 font-sans text-xs bg-slate-900 border border-slate-700 rounded text-white">
          <div class="font-bold text-blue-300">${veh.vehicle_number} (${veh.driver_name})</div>
          <div class="text-[11px] text-slate-300 mt-0.5">Speed: ${veh.speed_kmh} km/h | Status: <span class="font-semibold text-emerald-400">${veh.status}</span></div>
          <div class="text-[10px] text-slate-400 mt-1">Trip: ${veh.trip_id}</div>
        </div>`,
        { sticky: true }
      );

      marker.on('click', () => {
        onSelectVehicle?.(veh);
      });

      marker.addTo(vehiclesGroup);
    });

    vehiclesGroup.addTo(map);
    layersRef.current.vehiclesLayer = vehiclesGroup;
  }, [vehicles, layersVisible.vehicles, onSelectVehicle]);

  // 4. Render Incidents
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (layersRef.current.incidentsLayer) {
      map.removeLayer(layersRef.current.incidentsLayer);
    }

    if (!layersVisible.incidents) return;

    const incidentsGroup = L.layerGroup();

    incidents.forEach((inc) => {
      const isCritical = inc.severity === 'CRITICAL';
      const isResolved = inc.verification_status === 'RESOLVED';

      const customIcon = L.divIcon({
        className: 'incident-marker-wrapper',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer">
            ${
              isCritical && !isResolved
                ? '<div class="absolute w-9 h-9 rounded-full bg-rose-500/40 animate-ping"></div>'
                : ''
            }
            <div class="w-7 h-7 rounded-full ${
              isResolved
                ? 'bg-slate-700 border-slate-500'
                : isCritical
                ? 'bg-rose-600 border-rose-300'
                : 'bg-amber-500 border-amber-200'
            } border-2 flex items-center justify-center text-white shadow-xl z-10">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([inc.latitude, inc.longitude], { icon: customIcon });

      marker.bindTooltip(
        `<div class="p-2 font-sans text-xs bg-slate-900 border border-slate-700 rounded text-white max-w-xs">
          <div class="font-bold ${isCritical ? 'text-rose-400' : 'text-amber-400'}">${inc.type} (${inc.severity})</div>
          <div class="text-[11px] text-slate-300 mt-1 line-clamp-2">${inc.notes}</div>
          <div class="text-[10px] text-slate-400 mt-1">Reporter: ${inc.reporter.name} (${inc.reporter.role})</div>
        </div>`,
        { sticky: true }
      );

      marker.on('click', () => {
        onSelectIncident?.(inc);
      });

      marker.addTo(incidentsGroup);
    });

    incidentsGroup.addTo(map);
    layersRef.current.incidentsLayer = incidentsGroup;
  }, [incidents, layersVisible.incidents, onSelectIncident]);

  // 5. Render Active and Alternate Route Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (layersRef.current.routesLayer) {
      map.removeLayer(layersRef.current.routesLayer);
    }

    if (!layersVisible.routes) return;

    const routesGroup = L.layerGroup();

    // Alternate Corridor B Route (dashed line)
    if (alternateRoute && alternateRoute.waypoints.length > 0) {
      const altLatLngs = alternateRoute.waypoints.map((wp) => [wp[1], wp[0]] as [number, number]);
      const isAltRecommended = alternateRoute.status === 'RECOMMENDED';

      const altLine = L.polyline(altLatLngs, {
        color: isAltRecommended ? '#F59E0B' : '#64748B',
        weight: isAltRecommended ? 5 : 3,
        opacity: isAltRecommended ? 0.95 : 0.6,
        dashArray: '8, 8',
        lineCap: 'round'
      });

      altLine.bindTooltip(
        `<div class="p-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-white">
          <div class="font-bold text-amber-400">Alternate Route (Corridor B)</div>
          <div class="text-[11px] text-slate-300">Status: <span class="font-semibold">${alternateRoute.status}</span></div>
          <div class="text-[10px] text-slate-400">Distance: ${alternateRoute.distance_km} km | ETA: ${alternateRoute.eta_formatted}</div>
        </div>`
      );

      altLine.addTo(routesGroup);
    }

    // Primary Corridor A Route
    if (activeRoute && activeRoute.waypoints.length > 0) {
      const priLatLngs = activeRoute.waypoints.map((wp) => [wp[1], wp[0]] as [number, number]);
      const isBlocked = activeRoute.status === 'IMPASSABLE';

      const priLine = L.polyline(priLatLngs, {
        color: isBlocked ? '#EF4444' : '#3B82F6',
        weight: 5,
        opacity: isBlocked ? 0.8 : 0.9,
        lineCap: 'round'
      });

      priLine.bindTooltip(
        `<div class="p-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-white">
          <div class="font-bold ${isBlocked ? 'text-rose-400' : 'text-blue-400'}">Primary Route (Corridor A)</div>
          <div class="text-[11px] text-slate-300">Status: <span class="font-semibold">${activeRoute.status}</span></div>
          <div class="text-[10px] text-slate-400">Distance: ${activeRoute.distance_km} km | ETA: ${activeRoute.eta_formatted}</div>
        </div>`
      );

      priLine.addTo(routesGroup);
    }

    routesGroup.addTo(map);
    layersRef.current.routesLayer = routesGroup;
  }, [activeRoute, alternateRoute, layersVisible.routes]);

  // 6. Weather Overlay Simulation
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (layersRef.current.weatherLayer) {
      map.removeLayer(layersRef.current.weatherLayer);
    }

    if (!layersVisible.weather) return;

    const weatherGroup = L.layerGroup();

    // Radar Cloud Circle centered around Khliehriat / Sonapur S-08 (25.3, 92.4)
    const radarCircle = L.circle([25.32, 92.38], {
      radius: 35000,
      color: '#3B82F6',
      fillColor: '#60A5FA',
      fillOpacity: 0.25,
      weight: 1.5,
      dashArray: '4, 4'
    });

    const stormEye = L.circle([25.2631, 92.4285], {
      radius: 14000,
      color: '#EF4444',
      fillColor: '#F87171',
      fillOpacity: 0.45,
      weight: 2
    });

    radarCircle.bindTooltip('Synthetic Doppler Radar: Orographic Precipitation Zone (35-65 mm/h)');
    stormEye.bindTooltip('Radar Core: High Cloudburst Cell over S-08 Mountain Pass');

    radarCircle.addTo(weatherGroup);
    stormEye.addTo(weatherGroup);

    weatherGroup.addTo(map);
    layersRef.current.weatherLayer = weatherGroup;
  }, [layersVisible.weather]);

  return (
    <div className="relative w-full h-full min-h-[460px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-[#0b0f19]">
      {/* Leaflet DOM container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[460px] z-0" />

      {/* Floating Layer Controls */}
      <div className="absolute top-3 right-3 z-10 bg-[#0e1422]/90 backdrop-blur-md border border-slate-800/90 rounded-xl p-2.5 shadow-xl text-xs space-y-1.5 min-w-[170px]">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5 pb-1 border-b border-slate-800">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>GIS Layers</span>
        </div>

        <button
          onClick={() => setLayersVisible((p) => ({ ...p, segments: !p.segments }))}
          className="w-full flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-800/80 transition-colors text-slate-300"
        >
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-1 bg-emerald-400 rounded"></span>
            <span>Road Segments</span>
          </span>
          {layersVisible.segments ? <Eye className="w-3.5 h-3.5 text-blue-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
        </button>

        <button
          onClick={() => setLayersVisible((p) => ({ ...p, vehicles: !p.vehicles }))}
          className="w-full flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-800/80 transition-colors text-slate-300"
        >
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>Live Vehicles</span>
          </span>
          {layersVisible.vehicles ? <Eye className="w-3.5 h-3.5 text-blue-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
        </button>

        <button
          onClick={() => setLayersVisible((p) => ({ ...p, incidents: !p.incidents }))}
          className="w-full flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-800/80 transition-colors text-slate-300"
        >
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Hazards & Blocks</span>
          </span>
          {layersVisible.incidents ? <Eye className="w-3.5 h-3.5 text-blue-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
        </button>

        <button
          onClick={() => setLayersVisible((p) => ({ ...p, routes: !p.routes }))}
          className="w-full flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-800/80 transition-colors text-slate-300"
        >
          <span className="flex items-center space-x-1.5">
            <Navigation className="w-3 h-3 text-amber-400" />
            <span>Route Guidance</span>
          </span>
          {layersVisible.routes ? <Eye className="w-3.5 h-3.5 text-blue-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
        </button>

        <button
          onClick={() => setLayersVisible((p) => ({ ...p, weather: !p.weather }))}
          className="w-full flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-800/80 transition-colors text-slate-300"
        >
          <span className="flex items-center space-x-1.5">
            <CloudRain className="w-3 h-3 text-sky-400" />
            <span>Weather Radar</span>
          </span>
          {layersVisible.weather ? <Eye className="w-3.5 h-3.5 text-blue-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-[#0e1422]/90 backdrop-blur-md border border-slate-800/90 rounded-xl p-2.5 shadow-xl text-xs flex items-center space-x-4">
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-1.5 bg-emerald-500 rounded"></span>
          <span className="text-slate-300 text-[11px]">Open</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-1.5 bg-amber-500 rounded"></span>
          <span className="text-slate-300 text-[11px]">Restricted</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-1.5 bg-rose-500 rounded"></span>
          <span className="text-slate-300 text-[11px]">Blocked</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-400"></span>
          <span className="text-slate-300 text-[11px]">Alternate Bypass</span>
        </div>
      </div>
    </div>
  );
};
