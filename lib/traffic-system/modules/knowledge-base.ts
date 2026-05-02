/**
 * Logic / Knowledge Base Module
 * 
 * This module is responsible for policy validation and rule-based reasoning.
 * It implements the predicate logic system defined in the project specification.
 * 
 * Key responsibilities:
 * - Check if actions are allowed under traffic policy
 * - Validate emergency priority requests
 * - Verify signal override conditions
 * - Ensure logical consistency with knowledge base
 * 
 * The module acts as a gatekeeper before any constrained control allocation.
 */

import {
  ProcessedRequest,
  PolicyValidation,
  VehicleType,
  RequestCategory,
  IncidentSeverity,
  PriorityLevel,
  ActionType,
  Predicate,
  Rule,
} from "../types";
import { defaultCityGraph, getLocation, getHospitals } from "../city-graph";

// ============================================================================
// PREDICATE DEFINITIONS
// ============================================================================

/**
 * Evaluates Vehicle(v) - checks if v is a valid vehicle identifier
 */
function isVehicle(vehicleType: VehicleType): boolean {
  return Object.values(VehicleType).includes(vehicleType);
}

/**
 * Evaluates EmergencyVehicle(v) - checks if vehicle is an emergency type
 */
function isEmergencyVehicle(vehicleType: VehicleType): boolean {
  return [
    VehicleType.AMBULANCE,
    VehicleType.FIRE_UNIT,
    VehicleType.POLICE,
  ].includes(vehicleType);
}

/**
 * Evaluates CivilianVehicle(v) - checks if vehicle is civilian type
 */
function isCivilianVehicle(vehicleType: VehicleType): boolean {
  return vehicleType === VehicleType.CIVILIAN;
}

/**
 * Evaluates Location(l) - checks if location exists
 */
function isValidLocation(locationId: string): boolean {
  return defaultCityGraph.locations.has(locationId);
}

/**
 * Evaluates SignalZone(z) - checks if location has a signal zone
 */
function isSignalZone(locationId: string): boolean {
  return Array.from(defaultCityGraph.signals.values()).some(
    (signal) => signal.locationId === locationId
  );
}

/**
 * Evaluates Hospital(h) - checks if location is a hospital
 */
function isHospital(locationId: string): boolean {
  const location = getLocation(defaultCityGraph, locationId);
  return location?.type === "hospital";
}

/**
 * Evaluates IncidentSeverity(v, level) - checks severity level
 */
function hasIncidentSeverity(
  severity: IncidentSeverity | undefined,
  level: "high" | "critical"
): boolean {
  if (!severity) return false;
  if (level === "high") {
    return severity === IncidentSeverity.HIGH || severity === IncidentSeverity.CRITICAL;
  }
  return severity === IncidentSeverity.CRITICAL;
}

/**
 * Evaluates TimeSensitive(v) - checks if request is time sensitive
 */
function isTimeSensitive(timeSensitivity: boolean): boolean {
  return timeSensitivity === true;
}

// ============================================================================
// RULE IMPLEMENTATIONS
// ============================================================================

/**
 * Rule: EmergencyVehicle(v) ∧ IncidentSeverity(v, High) → Priority(v, Critical)
 */
function ruleCriticalPriority(request: ProcessedRequest): PriorityLevel | null {
  if (
    isEmergencyVehicle(request.vehicleType) &&
    hasIncidentSeverity(request.incidentSeverity, "high")
  ) {
    return PriorityLevel.CRITICAL;
  }
  return null;
}

/**
 * Rule: EmergencyVehicle(v) ∧ TimeSensitive(v) → Priority(v, High)
 */
function ruleHighPriority(request: ProcessedRequest): PriorityLevel | null {
  if (
    isEmergencyVehicle(request.vehicleType) &&
    isTimeSensitive(request.timeSensitivity)
  ) {
    return PriorityLevel.HIGH;
  }
  return null;
}

/**
 * Rule: CivilianVehicle(v) → Priority(v, Normal)
 */
function ruleNormalPriority(request: ProcessedRequest): PriorityLevel | null {
  if (isCivilianVehicle(request.vehicleType)) {
    return PriorityLevel.NORMAL;
  }
  return null;
}

/**
 * Determines priority based on rules
 */
function derivePriority(request: ProcessedRequest): PriorityLevel {
  // Check rules in order of precedence
  const critical = ruleCriticalPriority(request);
  if (critical) return critical;

  const high = ruleHighPriority(request);
  if (high) return high;

  const normal = ruleNormalPriority(request);
  if (normal) return normal;

  // Default to normal if no rule matches
  return PriorityLevel.NORMAL;
}

// ============================================================================
// AUTHORIZATION RULES
// ============================================================================

/**
 * Rule: EmergencyVehicle(v) ∧ SignalZone(z) → Authorized(v, SignalOverride(z))
 */
function isAuthorizedSignalOverride(
  vehicleType: VehicleType,
  controlZone?: string
): { authorized: boolean; reason: string } {
  if (!controlZone) {
    return { authorized: false, reason: "No control zone specified" };
  }

  if (!isSignalZone(controlZone)) {
    return { authorized: false, reason: `${controlZone} is not a signal zone` };
  }

  if (isEmergencyVehicle(vehicleType)) {
    return {
      authorized: true,
      reason: `Emergency vehicle authorized for signal override at ${controlZone}`,
    };
  }

  // Rule: CivilianVehicle(v) ∧ SignalZone(z) → ¬Authorized(v, SignalOverride(z))
  return {
    authorized: false,
    reason: "Civilian vehicles not authorized for signal override",
  };
}

/**
 * Rule: EmergencyVehicle(v) ∧ Destination(v, h) ∧ Hospital(h) → EmergencyCorridor(v)
 */
function isEmergencyCorridorAuthorized(
  vehicleType: VehicleType,
  destination: string
): { authorized: boolean; reason: string } {
  if (!isEmergencyVehicle(vehicleType)) {
    return {
      authorized: false,
      reason: "Only emergency vehicles can request emergency corridors",
    };
  }

  if (isHospital(destination)) {
    return {
      authorized: true,
      reason: `Emergency corridor authorized to hospital (${destination})`,
    };
  }

  // Still authorized for emergency vehicles, but note it's not a hospital
  return {
    authorized: true,
    reason: "Emergency corridor authorized (non-hospital destination)",
  };
}

/**
 * Rule: EmergencyCorridor(v) → Authorized(v, EmergencyRoute)
 */
function isEmergencyRouteAuthorized(
  vehicleType: VehicleType,
  destination: string
): { authorized: boolean; reason: string } {
  const corridorCheck = isEmergencyCorridorAuthorized(vehicleType, destination);
  
  if (corridorCheck.authorized) {
    return {
      authorized: true,
      reason: "Emergency route authorized via corridor access",
    };
  }

  return {
    authorized: false,
    reason: "Emergency route requires corridor authorization",
  };
}

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

/**
 * Rule: RequestType(req, Route_Request) → Approved(v, req)
 */
function validateRouteRequest(): { approved: boolean; reason: string } {
  return { approved: true, reason: "Route requests are always approved" };
}

/**
 * Rule: RequestType(req, Policy_Check) ∧ Authorized(v, action) → Approved(v, req)
 * Rule: RequestType(req, Policy_Check) ∧ ¬Authorized(v, action) → Rejected(v, req)
 */
function validatePolicyCheck(
  request: ProcessedRequest
): { approved: boolean; reason: string } {
  // Check signal override authorization
  const signalAuth = isAuthorizedSignalOverride(
    request.vehicleType,
    request.controlZone
  );

  if (signalAuth.authorized) {
    return { approved: true, reason: signalAuth.reason };
  }

  // Check emergency route authorization
  const routeAuth = isEmergencyRouteAuthorized(
    request.vehicleType,
    request.destination
  );

  if (routeAuth.authorized) {
    return { approved: true, reason: routeAuth.reason };
  }

  return {
    approved: false,
    reason: "Policy check failed: no authorized actions found",
  };
}

/**
 * Rule: RequestType(req, Control_Allocation_Request) ∧ AllowedAction(v, action) → Approved
 * Rule: RequestType(req, Control_Allocation_Request) ∧ ¬AllowedAction(v, action) → Rejected
 */
function validateControlAllocation(
  request: ProcessedRequest
): { approved: boolean; reason: string } {
  const signalAuth = isAuthorizedSignalOverride(
    request.vehicleType,
    request.controlZone
  );

  if (signalAuth.authorized) {
    return { approved: true, reason: signalAuth.reason };
  }

  return { approved: false, reason: signalAuth.reason };
}

/**
 * Rule: RequestType(req, Emergency_Response_Request) ∧ Priority(v, level) ∧ 
 *       Authorized(v, EmergencyRoute) → Approved(v, req)
 */
function validateEmergencyResponse(
  request: ProcessedRequest
): { approved: boolean; reason: string } {
  if (!isEmergencyVehicle(request.vehicleType)) {
    return {
      approved: false,
      reason: "Emergency response requires emergency vehicle type",
    };
  }

  const routeAuth = isEmergencyRouteAuthorized(
    request.vehicleType,
    request.destination
  );

  return {
    approved: routeAuth.authorized,
    reason: routeAuth.reason,
  };
}

/**
 * Rule: RequestType(req, Integrated_City_Service_Request) ∧ Priority(v, Critical) ∧
 *       Authorized(v, EmergencyRoute) ∧ AllowedAction(v, action) → Approved(v, req)
 */
function validateIntegratedService(
  request: ProcessedRequest,
  priority: PriorityLevel
): { approved: boolean; reason: string } {
  const reasons: string[] = [];

  // Check priority
  if (priority !== PriorityLevel.CRITICAL && priority !== PriorityLevel.HIGH) {
    reasons.push("Priority must be HIGH or CRITICAL for integrated services");
  }

  // Check emergency route
  const routeAuth = isEmergencyRouteAuthorized(
    request.vehicleType,
    request.destination
  );
  if (!routeAuth.authorized) {
    reasons.push(routeAuth.reason);
  }

  // Check control authorization
  if (request.controlZone) {
    const signalAuth = isAuthorizedSignalOverride(
      request.vehicleType,
      request.controlZone
    );
    if (!signalAuth.authorized) {
      reasons.push(signalAuth.reason);
    }
  }

  if (reasons.length === 0) {
    return {
      approved: true,
      reason: "Integrated city service request approved: all conditions met",
    };
  }

  return {
    approved: false,
    reason: reasons.join("; "),
  };
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Main policy validation function.
 * Validates a traffic request against the knowledge base rules.
 * 
 * @param request - The preprocessed traffic request
 * @param predictedPriority - Priority level from ANN (if available)
 * @returns PolicyValidation - Complete validation result with allowed/denied actions
 */
export function validatePolicy(
  request: ProcessedRequest,
  predictedPriority?: PriorityLevel
): PolicyValidation {
  const reasoningChain: string[] = [];
  const allowedActions: ActionType[] = [];
  const deniedActions: ActionType[] = [];
  const validationRules: string[] = [];

  // Step 1: Derive priority from rules
  const rulePriority = derivePriority(request);
  const finalPriority = predictedPriority || rulePriority;
  reasoningChain.push(
    `Priority derived: ${finalPriority} (Rule-based: ${rulePriority})`
  );

  // Step 2: Check authorization for each action type
  
  // Signal Override
  const signalAuth = isAuthorizedSignalOverride(
    request.vehicleType,
    request.controlZone || request.currentLocation
  );
  if (signalAuth.authorized) {
    allowedActions.push(ActionType.SIGNAL_OVERRIDE);
    validationRules.push("EmergencyVehicle(v) ∧ SignalZone(z) → Authorized(v, SignalOverride(z))");
  } else {
    deniedActions.push(ActionType.SIGNAL_OVERRIDE);
  }
  reasoningChain.push(`Signal Override: ${signalAuth.reason}`);

  // Emergency Route
  const routeAuth = isEmergencyRouteAuthorized(
    request.vehicleType,
    request.destination
  );
  if (routeAuth.authorized) {
    allowedActions.push(ActionType.EMERGENCY_ROUTE);
    validationRules.push("EmergencyCorridor(v) → Authorized(v, EmergencyRoute)");
  } else {
    deniedActions.push(ActionType.EMERGENCY_ROUTE);
  }
  reasoningChain.push(`Emergency Route: ${routeAuth.reason}`);

  // Emergency Corridor
  const corridorAuth = isEmergencyCorridorAuthorized(
    request.vehicleType,
    request.destination
  );
  if (corridorAuth.authorized) {
    allowedActions.push(ActionType.EMERGENCY_CORRIDOR);
    validationRules.push("EmergencyVehicle(v) ∧ Destination(v, h) ∧ Hospital(h) → EmergencyCorridor(v)");
  } else {
    deniedActions.push(ActionType.EMERGENCY_CORRIDOR);
  }
  reasoningChain.push(`Emergency Corridor: ${corridorAuth.reason}`);

  // Lane Control (authorized for all valid requests)
  if (request.isValid) {
    allowedActions.push(ActionType.LANE_CONTROL);
    reasoningChain.push("Lane Control: Authorized for valid requests");
  }

  // Step 3: Validate request based on category
  let validationResult: { approved: boolean; reason: string };

  switch (request.requestCategory) {
    case RequestCategory.ROUTE_REQUEST:
      validationResult = validateRouteRequest();
      validationRules.push("RequestType(req, Route_Request) → Approved(v, req)");
      break;

    case RequestCategory.POLICY_CHECK:
      validationResult = validatePolicyCheck(request);
      validationRules.push("RequestType(req, Policy_Check) ∧ Authorized(v, action) → Approved(v, req)");
      break;

    case RequestCategory.CONTROL_ALLOCATION_REQUEST:
      validationResult = validateControlAllocation(request);
      validationRules.push("RequestType(req, Control_Allocation_Request) ∧ AllowedAction(v, action) → Approved(v, req)");
      break;

    case RequestCategory.EMERGENCY_RESPONSE_REQUEST:
      validationResult = validateEmergencyResponse(request);
      validationRules.push("RequestType(req, Emergency_Response_Request) ∧ Authorized(v, EmergencyRoute) → Approved(v, req)");
      break;

    case RequestCategory.INTEGRATED_CITY_SERVICE_REQUEST:
      validationResult = validateIntegratedService(request, finalPriority);
      validationRules.push("RequestType(req, Integrated_City_Service_Request) ∧ Priority(v, Critical) → Approved(v, req)");
      break;

    default:
      validationResult = { approved: false, reason: "Unknown request category" };
  }

  reasoningChain.push(`Final Validation: ${validationResult.reason}`);

  return {
    isAuthorized: validationResult.approved,
    allowedActions,
    deniedActions,
    validationRules,
    policyStatus: validationResult.approved ? "approved" : "rejected",
    reasoningChain,
  };
}

/**
 * Gets all available rules for display/documentation
 */
export function getAllRules(): Rule[] {
  return [
    {
      id: "R1",
      name: "Critical Priority",
      antecedent: [
        { name: "EmergencyVehicle", args: ["v"], value: true },
        { name: "IncidentSeverity", args: ["v", "High"], value: true },
      ],
      consequent: { name: "Priority", args: ["v", "Critical"], value: true },
      description: "Emergency vehicles with high severity incidents get critical priority",
    },
    {
      id: "R2",
      name: "High Priority",
      antecedent: [
        { name: "EmergencyVehicle", args: ["v"], value: true },
        { name: "TimeSensitive", args: ["v"], value: true },
      ],
      consequent: { name: "Priority", args: ["v", "High"], value: true },
      description: "Time-sensitive emergency requests get high priority",
    },
    {
      id: "R3",
      name: "Normal Priority",
      antecedent: [{ name: "CivilianVehicle", args: ["v"], value: true }],
      consequent: { name: "Priority", args: ["v", "Normal"], value: true },
      description: "Civilian vehicles receive normal priority",
    },
    {
      id: "R4",
      name: "Signal Override Authorization",
      antecedent: [
        { name: "EmergencyVehicle", args: ["v"], value: true },
        { name: "SignalZone", args: ["z"], value: true },
      ],
      consequent: { name: "Authorized", args: ["v", "SignalOverride(z)"], value: true },
      description: "Emergency vehicles can override signals in signal zones",
    },
    {
      id: "R5",
      name: "Civilian Signal Override Denial",
      antecedent: [
        { name: "CivilianVehicle", args: ["v"], value: true },
        { name: "SignalZone", args: ["z"], value: true },
      ],
      consequent: { name: "Authorized", args: ["v", "SignalOverride(z)"], value: false },
      description: "Civilian vehicles cannot override signals",
    },
    {
      id: "R6",
      name: "Emergency Corridor",
      antecedent: [
        { name: "EmergencyVehicle", args: ["v"], value: true },
        { name: "Destination", args: ["v", "h"], value: true },
        { name: "Hospital", args: ["h"], value: true },
      ],
      consequent: { name: "EmergencyCorridor", args: ["v"], value: true },
      description: "Emergency vehicles heading to hospitals get corridor access",
    },
    {
      id: "R7",
      name: "Emergency Route from Corridor",
      antecedent: [{ name: "EmergencyCorridor", args: ["v"], value: true }],
      consequent: { name: "Authorized", args: ["v", "EmergencyRoute"], value: true },
      description: "Corridor access authorizes emergency routing",
    },
    {
      id: "R8",
      name: "Route Request Approval",
      antecedent: [{ name: "RequestType", args: ["req", "Route_Request"], value: true }],
      consequent: { name: "Approved", args: ["v", "req"], value: true },
      description: "Standard route requests are always approved",
    },
  ];
}

/**
 * Gets all predicates used in the system
 */
export function getAllPredicates(): { name: string; arity: number; description: string }[] {
  return [
    { name: "Vehicle", arity: 1, description: "v is a vehicle" },
    { name: "EmergencyVehicle", arity: 1, description: "v is an emergency vehicle" },
    { name: "CivilianVehicle", arity: 1, description: "v is a civilian vehicle" },
    { name: "Location", arity: 1, description: "l is a valid location" },
    { name: "SignalZone", arity: 1, description: "z is a signal zone" },
    { name: "Hospital", arity: 1, description: "h is a hospital" },
    { name: "Request", arity: 1, description: "req is a traffic request" },
    { name: "RequestType", arity: 2, description: "req has type t" },
    { name: "CurrentLocation", arity: 2, description: "v is at location l" },
    { name: "Destination", arity: 2, description: "v is heading to location l" },
    { name: "IncidentSeverity", arity: 2, description: "v has incident severity level" },
    { name: "TimeSensitive", arity: 1, description: "v has a time-sensitive request" },
    { name: "Priority", arity: 2, description: "v has priority level" },
    { name: "Authorized", arity: 2, description: "v is authorized for action" },
    { name: "AllowedAction", arity: 2, description: "action is allowed for v" },
    { name: "EmergencyCorridor", arity: 1, description: "v has corridor access" },
    { name: "EmergencyRoute", arity: 1, description: "v has emergency route access" },
    { name: "SignalOverride", arity: 1, description: "signal override for zone z" },
    { name: "Approved", arity: 2, description: "request req is approved for v" },
    { name: "Rejected", arity: 2, description: "request req is rejected for v" },
  ];
}
