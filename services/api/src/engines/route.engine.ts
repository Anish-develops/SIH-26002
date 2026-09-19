import {
  RoadSegment,
  RouteRecommendation,
  RouteStatus
} from '@ner-sentinel/types';

export interface RouteCalculationParams {
  originName?: string;
  destinationName?: string;
  blockedSegmentIds?: string[];
  activeSegments: RoadSegment[];
}

export class RouteEngine {
  private formatEta(minutes: number): string {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
  }

  calculateRoutes(params: RouteCalculationParams): {
    primary: RouteRecommendation;
    alternate: RouteRecommendation;
  } {
    const { blockedSegmentIds = [], activeSegments } = params;

    // Check if segment S-08 is blocked
    const s08Segment = activeSegments.find((s) => s.id === 'S-08');
    const isS08Blocked = blockedSegmentIds.includes('S-08') || s08Segment?.status === 'BLOCKED';

    // Corridor A coordinates (Guwahati -> Jowai -> Sonapur -> Silchar)
    const corridorAWaypoints: [number, number][] = [
      [91.7362, 26.1445], // Guwahati
      [91.8741, 26.0712], // Jorabat
      [91.8817, 25.9015], // Nongpoh
      [91.8953, 25.7533], // Umsning
      [92.0543, 25.5539], // Mawryngkneng
      [92.2038, 25.4485], // Jowai
      [92.3619, 25.3522], // Khliehriat
      [92.4285, 25.2631], // S-08 Pass / Tunnel
      [92.4921, 25.1482], // Malidor
      [92.5694, 25.0118], // Kalain
      [92.7959, 24.8333]  // Silchar Civil Hospital
    ];

    // Corridor B coordinates (Guwahati -> Nagaon -> Lumding -> Haflong -> Silchar)
    const corridorBWaypoints: [number, number][] = [
      [91.7362, 26.1445], // Guwahati
      [92.6840, 26.3475], // Nagaon
      [93.1703, 25.7523], // Lumding
      [93.0185, 25.1706], // Haflong
      [92.8611, 24.9810], // Harangajao
      [92.7959, 24.8333]  // Silchar Civil Hospital
    ];

    if (!isS08Blocked) {
      // Baseline / Normal State
      const primary: RouteRecommendation = {
        id: 'ROUTE-CORRIDOR-A',
        name: 'Corridor A Direct Lifeline (via Mountain Pass & Tunnel)',
        origin: 'Guwahati Regional Medical Depot',
        destination: 'Silchar District Civil Hospital',
        distance_km: 198,
        eta_minutes: 312,
        eta_formatted: '5h 12m',
        risk_score: s08Segment ? s08Segment.risk_score : 22,
        risk_level: s08Segment ? s08Segment.risk_level : 'LOW',
        status: 'ACTIVE',
        reasons: [
          'Optimal shortest distance corridor between Brahmaputra and Barak valleys',
          'All mountain segments currently verified OPEN and passable'
        ],
        waypoints: corridorAWaypoints
      };

      const alternate: RouteRecommendation = {
        id: 'ROUTE-CORRIDOR-B',
        name: 'Corridor B Alternate Bypass (via Lumding & Haflong)',
        origin: 'Guwahati Regional Medical Depot',
        destination: 'Silchar District Civil Hospital',
        distance_km: 206,
        eta_minutes: 363,
        eta_formatted: '6h 03m',
        risk_score: 28,
        risk_level: 'LOW',
        status: 'STANDBY',
        reasons: [
          'Secondary hill link available on standby for emergency diversion',
          'Currently adds 51m travel time compared to primary route'
        ],
        waypoints: corridorBWaypoints
      };

      return { primary, alternate };
    } else {
      // Blocked S-08 State -> Reroute Recommended
      const primary: RouteRecommendation = {
        id: 'ROUTE-CORRIDOR-A',
        name: 'Corridor A Direct Lifeline (BLOCKED)',
        origin: 'Guwahati Regional Medical Depot',
        destination: 'Silchar District Civil Hospital',
        distance_km: 198,
        eta_minutes: 999,
        eta_formatted: 'BLOCKED',
        risk_score: 95,
        risk_level: 'CRITICAL',
        status: 'IMPASSABLE',
        reasons: [
          'Critical slope failure and debris blockage on Segment S-08',
          'Carriageway fully impassable for all vehicle classifications'
        ],
        waypoints: corridorAWaypoints
      };

      const alternate: RouteRecommendation = {
        id: 'ROUTE-CORRIDOR-B',
        name: 'Corridor B Alternate Bypass (Recommended Diversion)',
        origin: 'Guwahati Regional Medical Depot',
        destination: 'Silchar District Civil Hospital',
        distance_km: 206,
        eta_minutes: 363,
        eta_formatted: '6h 03m',
        risk_score: 28,
        risk_level: 'LOW',
        status: 'RECOMMENDED',
        reasons: [
          'Avoids high-risk blocked corridor on Segment S-08',
          'Bypasses Sonapur Tunnel landslide blockage via NH-27 Lumding-Haflong Corridor',
          'Adds 51m travel time with 70% lower geotechnical disruption risk'
        ],
        waypoints: corridorBWaypoints
      };

      return { primary, alternate };
    }
  }
}
