/**
 * City Graph Model
 * 
 * This module defines the city road network as a graph structure.
 * Contains predefined locations, roads, and signal zones for the
 * Smart City Traffic simulation.
 */

import {
  Location,
  Road,
  SignalZone,
  CityGraph,
  TrafficDensity,
  SignalState,
} from "./types";

// ============================================================================
// CITY LOCATIONS
// ============================================================================

const locations: Location[] = [
  { id: "central_junction", name: "Central Junction", type: "junction", coordinates: { x: 300, y: 250 } },
  { id: "city_hospital", name: "City Hospital", type: "hospital", coordinates: { x: 500, y: 100 } },
  { id: "fire_station", name: "Fire Station", type: "station", coordinates: { x: 100, y: 100 } },
  { id: "police_hq", name: "Police Headquarters", type: "station", coordinates: { x: 100, y: 400 } },
  { id: "district_a", name: "District A", type: "district", coordinates: { x: 500, y: 400 } },
  { id: "district_b", name: "District B", type: "district", coordinates: { x: 300, y: 450 } },
  { id: "intersection_1", name: "Intersection 1", type: "intersection", coordinates: { x: 200, y: 175 } },
  { id: "intersection_2", name: "Intersection 2", type: "intersection", coordinates: { x: 400, y: 175 } },
  { id: "intersection_3", name: "Intersection 3", type: "intersection", coordinates: { x: 200, y: 325 } },
  { id: "intersection_4", name: "Intersection 4", type: "intersection", coordinates: { x: 400, y: 325 } },
  { id: "market_square", name: "Market Square", type: "district", coordinates: { x: 300, y: 100 } },
  { id: "university", name: "University", type: "district", coordinates: { x: 500, y: 250 } },
];

// ============================================================================
// CITY ROADS (Edges with weights)
// ============================================================================

const roads: Road[] = [
  // Central Junction connections
  { id: "r1", from: "central_junction", to: "intersection_1", distance: 2, trafficDensity: TrafficDensity.MEDIUM, hasSignal: true, speedLimit: 50 },
  { id: "r2", from: "central_junction", to: "intersection_2", distance: 2, trafficDensity: TrafficDensity.MEDIUM, hasSignal: true, speedLimit: 50 },
  { id: "r3", from: "central_junction", to: "intersection_3", distance: 2, trafficDensity: TrafficDensity.HIGH, hasSignal: true, speedLimit: 40 },
  { id: "r4", from: "central_junction", to: "intersection_4", distance: 2, trafficDensity: TrafficDensity.MEDIUM, hasSignal: true, speedLimit: 50 },
  
  // Fire Station connections
  { id: "r5", from: "fire_station", to: "intersection_1", distance: 3, trafficDensity: TrafficDensity.LOW, hasSignal: true, speedLimit: 60 },
  { id: "r6", from: "fire_station", to: "market_square", distance: 4, trafficDensity: TrafficDensity.MEDIUM, hasSignal: false, speedLimit: 50 },
  
  // Hospital connections
  { id: "r7", from: "city_hospital", to: "intersection_2", distance: 3, trafficDensity: TrafficDensity.MEDIUM, hasSignal: true, speedLimit: 40 },
  { id: "r8", from: "city_hospital", to: "university", distance: 2, trafficDensity: TrafficDensity.LOW, hasSignal: false, speedLimit: 50 },
  { id: "r9", from: "city_hospital", to: "market_square", distance: 4, trafficDensity: TrafficDensity.MEDIUM, hasSignal: true, speedLimit: 40 },
  
  // Police HQ connections
  { id: "r10", from: "police_hq", to: "intersection_3", distance: 3, trafficDensity: TrafficDensity.LOW, hasSignal: true, speedLimit: 60 },
  { id: "r11", from: "police_hq", to: "district_b", distance: 4, trafficDensity: TrafficDensity.MEDIUM, hasSignal: false, speedLimit: 50 },
  
  // District connections
  { id: "r12", from: "district_a", to: "intersection_4", distance: 3, trafficDensity: TrafficDensity.HIGH, hasSignal: true, speedLimit: 40 },
  { id: "r13", from: "district_a", to: "university", distance: 3, trafficDensity: TrafficDensity.MEDIUM, hasSignal: false, speedLimit: 50 },
  { id: "r14", from: "district_b", to: "intersection_3", distance: 2, trafficDensity: TrafficDensity.HIGH, hasSignal: true, speedLimit: 40 },
  { id: "r15", from: "district_b", to: "intersection_4", distance: 3, trafficDensity: TrafficDensity.MEDIUM, hasSignal: true, speedLimit: 50 },
  
  // Market Square connections
  { id: "r16", from: "market_square", to: "intersection_1", distance: 2, trafficDensity: TrafficDensity.MEDIUM, hasSignal: true, speedLimit: 40 },
  { id: "r17", from: "market_square", to: "intersection_2", distance: 2, trafficDensity: TrafficDensity.MEDIUM, hasSignal: true, speedLimit: 40 },
  
  // University connections
  { id: "r18", from: "university", to: "intersection_2", distance: 2, trafficDensity: TrafficDensity.MEDIUM, hasSignal: true, speedLimit: 50 },
  { id: "r19", from: "university", to: "intersection_4", distance: 2, trafficDensity: TrafficDensity.LOW, hasSignal: true, speedLimit: 50 },
  
  // Inter-intersection connections
  { id: "r20", from: "intersection_1", to: "intersection_2", distance: 3, trafficDensity: TrafficDensity.HIGH, hasSignal: true, speedLimit: 40 },
  { id: "r21", from: "intersection_1", to: "intersection_3", distance: 2, trafficDensity: TrafficDensity.MEDIUM, hasSignal: true, speedLimit: 50 },
  { id: "r22", from: "intersection_2", to: "intersection_4", distance: 2, trafficDensity: TrafficDensity.MEDIUM, hasSignal: true, speedLimit: 50 },
  { id: "r23", from: "intersection_3", to: "intersection_4", distance: 3, trafficDensity: TrafficDensity.HIGH, hasSignal: true, speedLimit: 40 },
];

// ============================================================================
// SIGNAL ZONES
// ============================================================================

const signalZones: SignalZone[] = [
  { id: "sig_central", locationId: "central_junction", currentState: SignalState.GREEN, canOverride: true, cycleTime: 60 },
  { id: "sig_int1", locationId: "intersection_1", currentState: SignalState.GREEN, canOverride: true, cycleTime: 45 },
  { id: "sig_int2", locationId: "intersection_2", currentState: SignalState.RED, canOverride: true, cycleTime: 45 },
  { id: "sig_int3", locationId: "intersection_3", currentState: SignalState.GREEN, canOverride: true, cycleTime: 45 },
  { id: "sig_int4", locationId: "intersection_4", currentState: SignalState.RED, canOverride: true, cycleTime: 45 },
  { id: "sig_hospital", locationId: "city_hospital", currentState: SignalState.GREEN, canOverride: true, cycleTime: 30 },
  { id: "sig_market", locationId: "market_square", currentState: SignalState.GREEN, canOverride: false, cycleTime: 60 },
];

// ============================================================================
// CITY GRAPH BUILDER
// ============================================================================

/**
 * Creates and returns the complete city graph structure
 * with all locations, roads, and signal zones.
 */
export function createCityGraph(): CityGraph {
  const locationMap = new Map<string, Location>();
  const roadMap = new Map<string, Road>();
  const signalMap = new Map<string, SignalZone>();

  locations.forEach((loc) => locationMap.set(loc.id, loc));
  roads.forEach((road) => roadMap.set(road.id, road));
  signalZones.forEach((signal) => signalMap.set(signal.id, signal));

  return {
    locations: locationMap,
    roads: roadMap,
    signals: signalMap,
  };
}

/**
 * Gets all neighbor locations for a given location ID
 */
export function getNeighbors(
  cityGraph: CityGraph,
  locationId: string
): { locationId: string; road: Road }[] {
  const neighbors: { locationId: string; road: Road }[] = [];

  cityGraph.roads.forEach((road) => {
    if (road.from === locationId) {
      neighbors.push({ locationId: road.to, road });
    } else if (road.to === locationId) {
      neighbors.push({ locationId: road.from, road });
    }
  });

  return neighbors;
}

/**
 * Calculates edge weight based on distance and traffic density
 */
export function calculateEdgeWeight(road: Road, isEmergency: boolean): number {
  const densityMultiplier = {
    [TrafficDensity.LOW]: 1.0,
    [TrafficDensity.MEDIUM]: 1.5,
    [TrafficDensity.HIGH]: 2.5,
    [TrafficDensity.CONGESTED]: 4.0,
  };

  // Emergency vehicles have reduced impact from traffic
  const multiplier = isEmergency
    ? Math.max(1.0, densityMultiplier[road.trafficDensity] * 0.5)
    : densityMultiplier[road.trafficDensity];

  return road.distance * multiplier;
}

/**
 * Heuristic function for A* search (Euclidean distance)
 */
export function heuristicDistance(
  cityGraph: CityGraph,
  fromId: string,
  toId: string
): number {
  const from = cityGraph.locations.get(fromId);
  const to = cityGraph.locations.get(toId);

  if (!from?.coordinates || !to?.coordinates) {
    return 0; // Return 0 if coordinates are not available
  }

  const dx = to.coordinates.x - from.coordinates.x;
  const dy = to.coordinates.y - from.coordinates.y;

  // Scale down the Euclidean distance to make it admissible
  return Math.sqrt(dx * dx + dy * dy) / 100;
}

/**
 * Gets all location IDs as an array
 */
export function getAllLocationIds(cityGraph: CityGraph): string[] {
  return Array.from(cityGraph.locations.keys());
}

/**
 * Checks if a location exists in the city graph
 */
export function locationExists(cityGraph: CityGraph, locationId: string): boolean {
  return cityGraph.locations.has(locationId);
}

/**
 * Gets location details by ID
 */
export function getLocation(cityGraph: CityGraph, locationId: string): Location | undefined {
  return cityGraph.locations.get(locationId);
}

/**
 * Gets all hospitals in the city
 */
export function getHospitals(cityGraph: CityGraph): Location[] {
  return Array.from(cityGraph.locations.values()).filter(
    (loc) => loc.type === "hospital"
  );
}

/**
 * Gets signal zone for a location
 */
export function getSignalZone(
  cityGraph: CityGraph,
  locationId: string
): SignalZone | undefined {
  return Array.from(cityGraph.signals.values()).find(
    (signal) => signal.locationId === locationId
  );
}

// Export default city graph instance
export const defaultCityGraph = createCityGraph();
