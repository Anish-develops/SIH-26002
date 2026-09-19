-- ============================================================================
-- NER Sentinel — Production Spatial Database Schema
-- Target: PostgreSQL 15+ with PostGIS 3.3+ extension
-- Designed for SIH Problem Statement 26002
-- ============================================================================

-- Enable PostGIS spatial extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. Road Corridors & Segments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS road_segments (
    id VARCHAR(64) PRIMARY KEY,
    corridor_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    geom GEOMETRY(LineString, 4326) NOT NULL,
    road_class VARCHAR(32) NOT NULL DEFAULT 'NATIONAL_HIGHWAY',
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- OPEN, RESTRICTED, BLOCKED, UNKNOWN
    risk_score NUMERIC(5,2) NOT NULL DEFAULT 0.0,
    risk_level VARCHAR(20) NOT NULL DEFAULT 'LOW', -- LOW, MEDIUM, HIGH, CRITICAL
    elevation_m NUMERIC(7,2),
    slope_deg NUMERIC(5,2),
    surface_condition VARCHAR(32) DEFAULT 'PAVED_GOOD',
    length_km NUMERIC(7,2),
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source VARCHAR(32) NOT NULL DEFAULT 'synthetic',
    environment VARCHAR(16) NOT NULL DEFAULT 'demo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spatial GIST Index for road network queries
CREATE INDEX IF NOT EXISTS idx_road_segments_geom ON road_segments USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_road_segments_status ON road_segments (status);
CREATE INDEX IF NOT EXISTS idx_road_segments_corridor ON road_segments (corridor_id);

-- ----------------------------------------------------------------------------
-- 2. Incidents & Obstructions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(64) PRIMARY KEY,
    type VARCHAR(32) NOT NULL, -- LANDSLIDE, FLOOD, ROAD_DAMAGE, BRIDGE_DAMAGE, etc.
    severity VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    geom GEOMETRY(Point, 4326) NOT NULL,
    segment_id VARCHAR(64) REFERENCES road_segments(id) ON DELETE SET NULL,
    photo_url TEXT,
    notes TEXT,
    reporter_id VARCHAR(64),
    reporter_name VARCHAR(128),
    reporter_role VARCHAR(32),
    reporter_phone VARCHAR(32),
    verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    source VARCHAR(32) NOT NULL DEFAULT 'synthetic',
    environment VARCHAR(16) NOT NULL DEFAULT 'demo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_incidents_geom ON incidents USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_incidents_segment_id ON incidents (segment_id);

-- ----------------------------------------------------------------------------
-- 3. Vehicle Telemetry Streams
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(64) PRIMARY KEY,
    trip_id VARCHAR(64) NOT NULL,
    vehicle_number VARCHAR(32) NOT NULL,
    driver_name VARCHAR(128) NOT NULL,
    driver_phone VARCHAR(32),
    geom GEOMETRY(Point, 4326) NOT NULL,
    speed_kmh NUMERIC(5,2) DEFAULT 0.0,
    heading_deg NUMERIC(5,2) DEFAULT 0.0,
    status VARCHAR(20) NOT NULL DEFAULT 'ON_ROUTE',
    current_corridor VARCHAR(64),
    telemetry_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_geom ON vehicles USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_vehicles_trip ON vehicles (trip_id);

-- ----------------------------------------------------------------------------
-- 4. Essential Deliveries
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deliveries (
    id VARCHAR(64) PRIMARY KEY,
    commodity VARCHAR(32) NOT NULL, -- MEDICINE, FOOD, etc.
    priority VARCHAR(20) NOT NULL, -- CRITICAL, HIGH, NORMAL
    title VARCHAR(255) NOT NULL,
    origin_name VARCHAR(255) NOT NULL,
    origin_geom GEOMETRY(Point, 4326) NOT NULL,
    destination_name VARCHAR(255) NOT NULL,
    destination_geom GEOMETRY(Point, 4326) NOT NULL,
    vehicle_id VARCHAR(64) REFERENCES vehicles(id) ON DELETE SET NULL,
    planned_eta VARCHAR(32) NOT NULL,
    current_eta VARCHAR(32) NOT NULL,
    eta_minutes INTEGER NOT NULL,
    distance_km NUMERIC(7,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ON_TIME',
    risk_exposure VARCHAR(20) NOT NULL DEFAULT 'LOW',
    active_corridor VARCHAR(64) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_vehicle_id ON deliveries (vehicle_id);

-- ----------------------------------------------------------------------------
-- 5. Operational Alerts
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(64) PRIMARY KEY,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    message_key VARCHAR(128) NOT NULL,
    target_id VARCHAR(64) NOT NULL,
    target_type VARCHAR(32) NOT NULL,
    affected_segment_id VARCHAR(64) REFERENCES road_segments(id) ON DELETE CASCADE,
    expected_delay_text VARCHAR(64),
    recommended_action TEXT,
    alternate_route_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by VARCHAR(128)
);

CREATE INDEX IF NOT EXISTS idx_alerts_target ON alerts (target_id);

-- ----------------------------------------------------------------------------
-- 6. Operational Events & Audit Trail
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS operational_events (
    id VARCHAR(64) PRIMARY KEY,
    event_type VARCHAR(64) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    source VARCHAR(64) NOT NULL,
    entity_type VARCHAR(32) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    environment VARCHAR(16) NOT NULL DEFAULT 'demo'
);

CREATE INDEX IF NOT EXISTS idx_operational_events_type ON operational_events (event_type);
CREATE INDEX IF NOT EXISTS idx_operational_events_timestamp ON operational_events (timestamp DESC);
