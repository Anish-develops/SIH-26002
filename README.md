# NER Sentinel — AI-Based Smart Logistics & Accessibility Intelligence Platform
**SIH Problem Statement 26002 | Ministry of Development of North Eastern Region (MDoNER)**
*Predict disruption. Protect connectivity. Keep essential supplies moving.*

> **DEMO ENVIRONMENT NOTICE:** All data presented in this prototype represents synthetic mountain logistics corridors, simulated vehicle telemetry, and prototype risk estimates. No real-time government or meteorological measurements are claimed.

---

## 1. Project Overview
The North Eastern Region (NER) of India faces severe monsoonal disruptions, heavy rainfall, and recurrent slope failures that frequently sever critical mountain highway lifelines (such as the Guwahati–Shillong–Jowai–Silchar corridor connecting Brahmaputra Valley with Barak Valley, Tripura, and Mizoram).

**NER Sentinel** is a dual-interface decision-support platform designed to protect essential-goods supply chains:
1. **Web Command Center**: An operational GIS command dashboard used by regional logistics dispatchers and emergency coordinators to monitor network accessibility, risk escalations, and delivery delays.
2. **Driver Mobile App**: An operational, glanceable application used by drivers transporting essential medicines, rations, and equipment, featuring turn-by-turn guidance, hazard alerts, one-tap rerouting, and offline incident reporting.

Both interfaces are synchronized through a unified TypeScript backend service using real-time Server-Sent Events (SSE).

---

## 2. System Architecture

```text
       ┌───────────────────────────────┐
       │   Scenario Console / Trigger  │
       └──────────────┬────────────────┘
                      │ POST /scenario/events
                      ▼
       ┌───────────────────────────────┐
       │     Backend (services/api)    │
       │   Port 4000 (Express + SSE)   │
       └──────┬───────────────┬────────┘
              │               │
     ┌────────┴────────┐      │
     │   Risk Engine   │      │
     │  (Multi-Factor) │      │
     └────────┬────────┘      │
              │               │
     ┌────────┴────────┐      │
     │  Route Engine   │      │
     │  (Risk-Aware)   │      │
     └────────┬────────┘      │
              │               │
              ▼               ▼
       ┌───────────────────────────────┐
       │       SSE Event Broker        │
       │   (Realtime Event Stream)     │
       └──────┬───────────────┬────────┘
              │               │
              ▼               ▼
     ┌─────────────────┐  ┌─────────────────┐
     │   Command Map   │  │ Driver App      │
     │   & Dashboard   │  │ (Port 3001)     │
     │   (Port 3000)   │  │ Active Guidance │
     └─────────────────┘  └─────────────────┘
```

---

## 3. Repository Structure

```text
ner-sentinel/
├── apps/
│   ├── web/                     # Web Command Center (Next.js/Vite, Tailwind, Leaflet)
│   │   └── src/
│   │       ├── components/      # GIS Command Map, KPI Ribbon, Drawers, Simulator
│   │       ├── pages/           # Overview, Live Map, Logistics, Incidents, Corridors, Scenarios
│   │       └── hooks/           # useRealtime SSE client hook
│   └── mobile/                  # Driver Mobile App (Expo / Web target on :3001)
│       └── src/
│           ├── screens/         # Home, Active Trip, Hazard Detail, Report, Sync Queue
│           ├── i18n/            # English & Assamese (অসমীয়া) language packs
│           └── hooks/           # useDriverRealtime SSE client hook
├── services/
│   └── api/                     # Backend Intelligence Service (Port 4000)
│       └── src/
│           ├── adapters/        # Integration boundaries (IMD, MoRTH, NRSC/Bhuvan, OSRM)
│           ├── database/        # MemoryStore snapshot repo & schema.sql for PostGIS
│           ├── engines/         # Multi-factor Risk Engine & Risk-Aware Route Engine
│           ├── state/           # ScenarioManager state machine
│           └── realtime/        # SseBroker live stream broadcaster
└── packages/
    ├── types/                   # Shared TypeScript domain contracts
    └── demo-data/               # Deterministic synthetic seed datasets
```

---

## 4. How to Run

### Prerequisites
- Node.js v18+ (tested on Node v24)
- npm v9+

### Quick Start (All Services)
1. **Install dependencies across the monorepo:**
   ```bash
   npm install
   ```

2. **Start the Backend Intelligence Service (Port 4000):**
   ```bash
   npm run dev:api
   ```

3. **Start the Web Command Center (Port 3000):**
   ```bash
   npm run dev:web
   ```

4. **Start the Driver Mobile App (Port 3001):**
   ```bash
   npm run dev:mobile
   ```

Open in your browser:
- **Web Command Center:** [http://localhost:3000](http://localhost:3000)
- **Driver Mobile App:** [http://localhost:3001](http://localhost:3001)
- **Embedded Dual View:** [http://localhost:3000](http://localhost:3000) &rarr; navigate to **Dual View (Driver App)** tab to see both Command Center and Phone side-by-side!

---

## 5. Environment Variables

Create `.env` in project root (or reference `.env.example`):
```ini
PORT=4000
API_URL=http://localhost:4000
VITE_API_URL=http://localhost:4000
EXPO_PUBLIC_API_URL=http://localhost:4000
```

---

## 6. How to Seed Demo Data
To validate and hydrate the deterministic seed datasets:
```bash
npm run seed-demo
```
This loads 16 mountain corridor road segments, 3 vehicle telemetry feeds, 3 essential deliveries, and baseline incidents.

---

## 7. How to Reset Demo
To restore the prototype back to the exact initial Scenario 1 baseline:
```bash
npm run reset-demo
```
Or click the **Reset Demo** button directly in the Web Command Center header or Scenario Console.

---

## 8. Evaluator Demonstration Walkthrough (Deterministic Flow)

The prototype demonstrates a complete, deterministic 5-step loop:

| Step | State | Action / Event | Judge-Visible Effect |
| :--- | :--- | :--- | :--- |
| **1** | **Normal Baseline** | Vehicle V-101 carrying critical insulin departs Guwahati for Silchar. | All road segments `OPEN` (Green). Trip ETA is **5h 12m** (198 km), Risk **22/100 (LOW)**. |
| **2** | **Heavy Rain Surge** | Operator clicks **"2. Heavy Rain"** in Scenario Console. | Rainfall surges to 65 mm/h. Segment S-08 jumps to **78/100 (HIGH)**. Factor breakdown displays: Rainfall (+30), Slope (+22), Incident (+18), Moisture (+8). Driver receives Hazard Warning with +2h 14m potential delay. |
| **3** | **Landslide Blockage** | Operator clicks **"3. Landslide Block"** or field officer submits photo report. | Segment S-08 turns **BLOCKED** (Crimson red). Primary corridor becomes impassable. Route Engine evaluates graph and activates **Alternate Corridor B** (via NH-27 Lumding-Haflong). |
| **4** | **Dual Notification & Reroute** | Backend pushes `ROUTE_UPDATED` via SSE. | Driver App receives **"ROUTE UPDATED"** modal: Previous ETA 5h 12m &rarr; New ETA **6h 03m** (206 km, +51m delta). Driver taps **[ ACCEPT NEW ROUTE ]**. Web dashboard updates delivery to `REROUTED`. |
| **5** | **Offline Incident Capture & Sync** | Driver toggles **OFFLINE**, submits field report, then toggles **ONLINE**. | Report queues in local offline storage with idempotency key. Upon reconnection, auto-syncs via `POST /sync` and appears on Command Center live audit feed. |
| **6** | **Clean Reset** | Operator clicks **[ RESET DEMO ]**. | Instantly restores baseline state across backend, GIS map, deliveries, and phone without manual database edits. |

---

## 9. API Overview

| Endpoint | Method | Purpose | Key Parameters |
| :--- | :--- | :--- | :--- |
| `/events` | `GET` | Server-Sent Events (SSE) live push stream | Realtime connection |
| `/scenario/state` | `GET` | Unified full state (segments, vehicles, deliveries, alerts) | None |
| `/scenario/events` | `POST` | Trigger deterministic scenario events | `{ "scenario": "HEAVY_RAIN" \| "LANDSLIDE" }` |
| `/scenario/reset` | `POST` | Deterministic baseline restore | None |
| `/map/segments` | `GET` | GeoJSON FeatureCollection of road segments | `status`, `corridor_id` |
| `/risk/:segmentId` | `GET` | Explainable multi-factor risk breakdown | `segmentId` (e.g. `S-08`) |
| `/incidents` | `GET` | Field incident feed with photo URLs and severity | None |
| `/reports` | `POST` | Create incident report with GPS coordinates & photo | `SyncReportItem` payload |
| `/sync` | `POST` | Idempotent batch ingestion for offline queue | `{ "batch_id", "reports": [...] }` |
| `/vehicles` | `GET` | Vehicle telemetry streams & driver details | None |
| `/deliveries` | `GET` | Priority deliveries, commodities, and current ETAs | None |
| `/trip/accept-route` | `POST` | Driver accepts alternate corridor diversion | `{ "vehicle_id": "V-101" }` |
| `/alerts/:id/acknowledge`| `POST` | Acknowledge operational alert | `{ "acknowledged_by": "..." }` |
| `/audit` | `GET` | OperationalEvent audit timeline feed | None |

---

## 10. Future Real Data Integration Points

The architecture isolates external data behind modular adapters located in `services/api/src/adapters/`:

1. **Weather Feeds (`IWeatherProvider` &rarr; `weather.adapter.ts`):**
   - *Future Source:* India Meteorological Department (IMD) AWS & Doppler Weather Radar APIs.
2. **Road Network & Conditions (`IRoadProvider` &rarr; `road.adapter.ts`):**
   - *Future Source:* Ministry of Road Transport and Highways (MoRTH) RAMS, State PWD GIS, and OpenStreetMap extracts.
3. **Hazard & Disaster Zonation (`IDisasterProvider` &rarr; `disaster.adapter.ts`):**
   - *Future Source:* ISRO / NRSC NDEM & Bhuvan Geoportal landslide hazard zonation and flood inundation layers.
4. **GIS Graph Routing (`IRoutingProvider` &rarr; `routing.adapter.ts`):**
   - *Future Source:* Dedicated OSRM / GraphHopper instance running on regional NER road network extracts.
5. **Database Migration (`IStorageRepository` &rarr; `schema.sql`):**
   - Turnkey PostgreSQL 15+ with PostGIS 3.3+ DDL schema is provided at `services/api/src/database/schema.sql` with spatial GIST indexes.
