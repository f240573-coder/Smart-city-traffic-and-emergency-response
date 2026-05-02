/**
 * Input & Preprocessing Module
 * 
 * This module is the entry point of the Smart City Traffic system.
 * It receives traffic requests, validates the submitted information,
 * normalizes field values, and builds a standard internal request object.
 * 
 * Key responsibilities:
 * - Validate request fields and structure
 * - Normalize road identifiers and control-zone labels
 * - Prepare ANN feature vectors for priority prediction
 * - Ensure clean and consistent inputs for downstream modules
 */

import {
  TrafficRequest,
  ProcessedRequest,
  VehicleType,
  RequestCategory,
  IncidentSeverity,
  TrafficDensity,
  PriorityLevel,
  ValidationResult,
} from "../types";
import { locationExists, defaultCityGraph, getNeighbors, calculateEdgeWeight } from "../city-graph";

// ============================================================================
// ENCODING MAPS FOR NORMALIZATION
// ============================================================================

const vehicleTypeCode: Record<VehicleType, number> = {
  [VehicleType.AMBULANCE]: 3,
  [VehicleType.FIRE_UNIT]: 3,
  [VehicleType.POLICE]: 2,
  [VehicleType.CIVILIAN]: 0,
};

const requestTypeCode: Record<RequestCategory, number> = {
  [RequestCategory.ROUTE_REQUEST]: 0,
  [RequestCategory.POLICY_CHECK]: 1,
  [RequestCategory.CONTROL_ALLOCATION_REQUEST]: 2,
  [RequestCategory.EMERGENCY_RESPONSE_REQUEST]: 3,
  [RequestCategory.INTEGRATED_CITY_SERVICE_REQUEST]: 4,
};

const severityCode: Record<IncidentSeverity, number> = {
  [IncidentSeverity.LOW]: 0,
  [IncidentSeverity.MEDIUM]: 1,
  [IncidentSeverity.HIGH]: 2,
  [IncidentSeverity.CRITICAL]: 3,
};

const densityCode: Record<TrafficDensity, number> = {
  [TrafficDensity.LOW]: 0,
  [TrafficDensity.MEDIUM]: 1,
  [TrafficDensity.HIGH]: 2,
  [TrafficDensity.CONGESTED]: 3,
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates the basic structure and required fields of a traffic request.
 * Returns a ValidationResult with errors and warnings.
 */
export function validateRequest(request: Partial<TrafficRequest>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!request.requestId || request.requestId.trim() === "") {
    errors.push("Request ID is required");
  }

  if (!request.vehicleType || !Object.values(VehicleType).includes(request.vehicleType)) {
    errors.push(`Invalid vehicle type. Must be one of: ${Object.values(VehicleType).join(", ")}`);
  }

  if (!request.requestCategory || !Object.values(RequestCategory).includes(request.requestCategory)) {
    errors.push(`Invalid request category. Must be one of: ${Object.values(RequestCategory).join(", ")}`);
  }

  if (!request.currentLocation || request.currentLocation.trim() === "") {
    errors.push("Current location is required");
  } else if (!locationExists(defaultCityGraph, request.currentLocation)) {
    errors.push(`Invalid current location: "${request.currentLocation}" not found in city graph`);
  }

  if (!request.destination || request.destination.trim() === "") {
    errors.push("Destination is required");
  } else if (!locationExists(defaultCityGraph, request.destination)) {
    errors.push(`Invalid destination: "${request.destination}" not found in city graph`);
  }

  // Validate severity for emergency requests
  if (
    request.requestCategory === RequestCategory.EMERGENCY_RESPONSE_REQUEST ||
    request.requestCategory === RequestCategory.INTEGRATED_CITY_SERVICE_REQUEST
  ) {
    if (!request.incidentSeverity) {
      warnings.push("Incident severity not specified for emergency request; defaulting to MEDIUM");
    }
  }

  // Validate time sensitivity
  if (request.timeSensitivity === undefined) {
    warnings.push("Time sensitivity not specified; defaulting to false");
  }

  // Check for logical consistency
  if (
    request.vehicleType === VehicleType.CIVILIAN &&
    (request.requestCategory === RequestCategory.EMERGENCY_RESPONSE_REQUEST ||
      request.requestCategory === RequestCategory.CONTROL_ALLOCATION_REQUEST)
  ) {
    warnings.push("Civilian vehicle requesting emergency/control services - will be subject to policy validation");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates control zone if specified in the request.
 */
export function validateControlZone(controlZone: string | undefined): boolean {
  if (!controlZone) return true;
  return locationExists(defaultCityGraph, controlZone);
}

// ============================================================================
// NORMALIZATION FUNCTIONS
// ============================================================================

/**
 * Normalizes location identifiers to lowercase and trims whitespace.
 */
export function normalizeLocationId(locationId: string): string {
  return locationId.toLowerCase().trim().replace(/\s+/g, "_");
}

/**
 * Estimates the distance between two locations using a simple path search.
 * Used for feature vector preparation.
 */
export function estimateDistance(
  fromLocation: string,
  toLocation: string
): number {
  // Simple BFS to find path and calculate distance
  if (fromLocation === toLocation) return 0;

  const visited = new Set<string>();
  const queue: { location: string; distance: number }[] = [
    { location: fromLocation, distance: 0 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (current.location === toLocation) {
      return current.distance;
    }

    if (visited.has(current.location)) continue;
    visited.add(current.location);

    const neighbors = getNeighbors(defaultCityGraph, current.location);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.locationId)) {
        const weight = calculateEdgeWeight(neighbor.road, false);
        queue.push({
          location: neighbor.locationId,
          distance: current.distance + weight,
        });
      }
    }
  }

  // Return a high value if no path found
  return 999;
}

// ============================================================================
// FEATURE VECTOR PREPARATION
// ============================================================================

/**
 * Prepares the feature vector for ANN priority prediction.
 * Features include:
 * - Vehicle type code (0-3)
 * - Request type code (0-4)
 * - Severity code (0-3)
 * - Time sensitivity (0-1)
 * - Traffic density code (0-3)
 * - Estimated distance (normalized)
 */
export function prepareFeatureVector(request: ProcessedRequest): number[] {
  const { normalizedData } = request;
  
  // Normalize estimated distance (assuming max distance of 50 units)
  const normalizedDistance = Math.min(
    (normalizedData.estimatedDistance || 0) / 50,
    1.0
  );

  return [
    normalizedData.vehicleTypeCode / 3,      // Vehicle type (normalized 0-1)
    normalizedData.requestTypeCode / 4,      // Request type (normalized 0-1)
    normalizedData.severityCode / 3,         // Severity (normalized 0-1)
    normalizedData.timeSensitivityCode,      // Time sensitivity (0 or 1)
    normalizedData.densityCode / 3,          // Traffic density (normalized 0-1)
    normalizedDistance,                       // Distance (normalized 0-1)
  ];
}

// ============================================================================
// MAIN PREPROCESSING FUNCTION
// ============================================================================

/**
 * Main preprocessing function that validates, normalizes, and prepares
 * a traffic request for downstream processing.
 * 
 * @param rawRequest - The raw traffic request input
 * @returns ProcessedRequest - The validated and normalized request
 */
export function preprocessRequest(rawRequest: Partial<TrafficRequest>): ProcessedRequest {
  // Step 1: Validate the request
  const validation = validateRequest(rawRequest);

  // Step 2: Create processed request with defaults
  const processedRequest: ProcessedRequest = {
    requestId: rawRequest.requestId || `REQ_${Date.now()}`,
    vehicleType: rawRequest.vehicleType || VehicleType.CIVILIAN,
    requestCategory: rawRequest.requestCategory || RequestCategory.ROUTE_REQUEST,
    currentLocation: normalizeLocationId(rawRequest.currentLocation || ""),
    destination: normalizeLocationId(rawRequest.destination || ""),
    incidentSeverity: rawRequest.incidentSeverity || IncidentSeverity.MEDIUM,
    timeSensitivity: rawRequest.timeSensitivity ?? false,
    trafficDensity: rawRequest.trafficDensity || TrafficDensity.MEDIUM,
    priorityClaim: rawRequest.priorityClaim,
    controlZone: rawRequest.controlZone ? normalizeLocationId(rawRequest.controlZone) : undefined,
    descriptionNote: rawRequest.descriptionNote,
    timestamp: rawRequest.timestamp || new Date(),
    isValid: validation.isValid,
    validationErrors: validation.errors,
    normalizedData: {
      vehicleTypeCode: 0,
      requestTypeCode: 0,
      severityCode: 0,
      timeSensitivityCode: 0,
      densityCode: 0,
    },
  };

  // Step 3: Encode normalized data
  if (validation.isValid) {
    const estimatedDist = estimateDistance(
      processedRequest.currentLocation,
      processedRequest.destination
    );

    processedRequest.normalizedData = {
      vehicleTypeCode: vehicleTypeCode[processedRequest.vehicleType],
      requestTypeCode: requestTypeCode[processedRequest.requestCategory],
      severityCode: severityCode[processedRequest.incidentSeverity!],
      timeSensitivityCode: processedRequest.timeSensitivity ? 1 : 0,
      densityCode: densityCode[processedRequest.trafficDensity!],
      estimatedDistance: estimatedDist,
    };

    // Step 4: Prepare feature vector for ANN
    processedRequest.featureVector = prepareFeatureVector(processedRequest);
  }

  return processedRequest;
}

/**
 * Checks if a request requires emergency processing.
 */
export function isEmergencyVehicle(vehicleType: VehicleType): boolean {
  return [
    VehicleType.AMBULANCE,
    VehicleType.FIRE_UNIT,
    VehicleType.POLICE,
  ].includes(vehicleType);
}

/**
 * Generates a unique request ID.
 */
export function generateRequestId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `REQ_${timestamp}_${random}`;
}

/**
 * Gets all valid location IDs for form validation.
 */
export function getValidLocations(): string[] {
  return Array.from(defaultCityGraph.locations.keys());
}
