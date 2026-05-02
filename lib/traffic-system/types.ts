/**
 * Smart City Traffic & Emergency Response AI System
 * Core Type Definitions
 * 
 * This file contains all the type definitions for the traffic management system
 * including request types, vehicle types, locations, and system responses.
 */

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export enum VehicleType {
  AMBULANCE = "ambulance",
  FIRE_UNIT = "fire_unit",
  POLICE = "police",
  CIVILIAN = "civilian",
}

export enum RequestCategory {
  ROUTE_REQUEST = "Route_Request",
  POLICY_CHECK = "Policy_Check",
  CONTROL_ALLOCATION_REQUEST = "Control_Allocation_Request",
  EMERGENCY_RESPONSE_REQUEST = "Emergency_Response_Request",
  INTEGRATED_CITY_SERVICE_REQUEST = "Integrated_City_Service_Request",
}

export enum IncidentSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum PriorityLevel {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum TrafficDensity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CONGESTED = "congested",
}

export enum SignalState {
  RED = "red",
  YELLOW = "yellow",
  GREEN = "green",
  EMERGENCY_OVERRIDE = "emergency_override",
}

export enum ActionType {
  SIGNAL_OVERRIDE = "signal_override",
  EMERGENCY_ROUTE = "emergency_route",
  EMERGENCY_CORRIDOR = "emergency_corridor",
  LANE_CONTROL = "lane_control",
}

// ============================================================================
// LOCATION AND GRAPH TYPES
// ============================================================================

export interface Location {
  id: string;
  name: string;
  type: "junction" | "hospital" | "station" | "district" | "intersection";
  coordinates?: { x: number; y: number };
}

export interface Road {
  id: string;
  from: string;
  to: string;
  distance: number;
  trafficDensity: TrafficDensity;
  hasSignal: boolean;
  speedLimit: number;
}

export interface SignalZone {
  id: string;
  locationId: string;
  currentState: SignalState;
  canOverride: boolean;
  cycleTime: number; // in seconds
}

export interface CityGraph {
  locations: Map<string, Location>;
  roads: Map<string, Road>;
  signals: Map<string, SignalZone>;
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface TrafficRequest {
  requestId: string;
  vehicleType: VehicleType;
  requestCategory: RequestCategory;
  currentLocation: string;
  destination: string;
  incidentSeverity?: IncidentSeverity;
  timeSensitivity: boolean;
  trafficDensity?: TrafficDensity;
  priorityClaim?: PriorityLevel;
  controlZone?: string;
  descriptionNote?: string;
  timestamp: Date;
}

export interface ProcessedRequest extends TrafficRequest {
  isValid: boolean;
  validationErrors: string[];
  normalizedData: {
    vehicleTypeCode: number;
    requestTypeCode: number;
    severityCode: number;
    timeSensitivityCode: number;
    densityCode: number;
    estimatedDistance?: number;
  };
  featureVector?: number[];
}

// ============================================================================
// MODULE OUTPUT TYPES
// ============================================================================

export interface ANNPrediction {
  predictedPriority: PriorityLevel;
  confidence: number;
  urgencyScore: number;
  binaryClassification: "urgent" | "non-urgent";
}

export interface PolicyValidation {
  isAuthorized: boolean;
  allowedActions: ActionType[];
  deniedActions: ActionType[];
  validationRules: string[];
  policyStatus: "approved" | "rejected" | "pending";
  reasoningChain: string[];
}

export interface CSPSolution {
  isFeasible: boolean;
  signalAssignments: Map<string, SignalState>;
  corridorAllocation: string[];
  constraints: string[];
  conflictsResolved: string[];
}

export interface RouteResult {
  path: string[];
  totalDistance: number;
  estimatedTime: number;
  algorithm: "BFS" | "UCS" | "A*";
  nodesExplored: number;
}

// ============================================================================
// FINAL RESPONSE TYPES
// ============================================================================

export interface FinalResponse {
  requestId: string;
  status: "success" | "partial" | "failed";
  requestCategory: RequestCategory;
  
  // Route information (if applicable)
  route?: RouteResult;
  
  // Priority information (if applicable)
  priority?: ANNPrediction;
  
  // Policy validation (if applicable)
  policyValidation?: PolicyValidation;
  
  // Control allocation (if applicable)
  controlPlan?: CSPSolution;
  
  // Summary
  decisionMessage: string;
  explanatoryText: string;
  estimatedDelay?: number;
  
  // Metadata
  modulesUsed: string[];
  processingTime: number;
  timestamp: Date;
}

// ============================================================================
// PREDICATE TYPES FOR KNOWLEDGE BASE
// ============================================================================

export interface Predicate {
  name: string;
  args: string[];
  value: boolean;
}

export interface Rule {
  id: string;
  name: string;
  antecedent: Predicate[];
  consequent: Predicate;
  description: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface GraphNode {
  id: string;
  neighbors: { nodeId: string; weight: number }[];
}

export interface SearchState {
  nodeId: string;
  cost: number;
  path: string[];
  heuristic?: number;
}
