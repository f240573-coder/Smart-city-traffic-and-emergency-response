/**
 * Smart City Traffic & Emergency Response AI System
 * Main Entry Point
 * 
 * This file exports all modules and provides the main system interface.
 */

// Types
export * from "./types";

// City Graph
export * from "./city-graph";

// Modules
export { preprocessRequest, getValidLocations, generateRequestId, isEmergencyVehicle } from "./modules/preprocessing";
export { predictPriority, predictPriorityEnhanced, getNetworkArchitecture, getFeatureExplanation } from "./modules/ann-priority";
export { validatePolicy, getAllRules, getAllPredicates } from "./modules/knowledge-base";
export { allocateSignalControl, quickAllocation, getCSPDetails, simulateSignalChange } from "./modules/csp-scheduler";
export { findRoute, findRouteWithAlgorithm, compareAlgorithms, getAllLocations, getPathVisualization, bfs, ucs, astar } from "./modules/search-navigation";
export { routeRequest, getPipelineInfo, getAllPipelines } from "./modules/request-router";

// ============================================================================
// MAIN SYSTEM INTERFACE
// ============================================================================

import { TrafficRequest, FinalResponse } from "./types";
import { preprocessRequest } from "./modules/preprocessing";
import { routeRequest } from "./modules/request-router";

/**
 * Main entry point for processing traffic requests.
 * This function handles the complete workflow from raw request to final response.
 * 
 * @param rawRequest - The raw traffic request from user input
 * @returns FinalResponse - The complete system response
 */
export function processTrafficRequest(rawRequest: Partial<TrafficRequest>): FinalResponse {
  // Step 1: Preprocess the request
  const processedRequest = preprocessRequest(rawRequest);
  
  // Step 2: Route through appropriate pipeline
  const response = routeRequest(processedRequest);
  
  return response;
}

/**
 * System information for display
 */
export const SYSTEM_INFO = {
  name: "Smart City Traffic & Emergency Response AI System",
  version: "1.0.0",
  modules: [
    {
      name: "Input & Preprocessing",
      description: "Validates and normalizes traffic requests",
      weight: 10,
    },
    {
      name: "ANN Priority Prediction",
      description: "Neural network for urgency estimation",
      weight: 20,
    },
    {
      name: "Logic / Knowledge Base",
      description: "Rule-based policy validation",
      weight: 20,
    },
    {
      name: "CSP Scheduler",
      description: "Constraint satisfaction for signal control",
      weight: 15,
    },
    {
      name: "Search & Navigation",
      description: "BFS, UCS, A* pathfinding algorithms",
      weight: 15,
    },
    {
      name: "Final Response",
      description: "Output aggregation and formatting",
      weight: 10,
    },
  ],
  requestCategories: [
    "Route_Request",
    "Policy_Check",
    "Control_Allocation_Request",
    "Emergency_Response_Request",
    "Integrated_City_Service_Request",
  ],
};
