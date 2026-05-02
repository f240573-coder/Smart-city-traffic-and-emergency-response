/**
 * Request Router Module
 * 
 * This module is the control-flow manager of the system.
 * It receives standardized requests and determines which processing path
 * should be followed based on request category.
 * 
 * Key responsibilities:
 * - Route requests to appropriate processing pipelines
 * - Orchestrate module execution sequence
 * - Prevent inappropriate module calls
 * - Preserve sequencing rules
 */

import {
  ProcessedRequest,
  RequestCategory,
  FinalResponse,
  PriorityLevel,
} from "../types";
import { predictPriorityEnhanced } from "./ann-priority";
import { validatePolicy } from "./knowledge-base";
import { allocateSignalControl, quickAllocation } from "./csp-scheduler";
import { findRoute, astar } from "./search-navigation";

// ============================================================================
// PIPELINE DEFINITIONS
// ============================================================================

type ProcessingStep = 
  | "preprocessing"
  | "ann_priority"
  | "knowledge_base"
  | "csp_scheduler"
  | "search_navigation"
  | "final_response";

interface Pipeline {
  category: RequestCategory;
  steps: ProcessingStep[];
  description: string;
}

const PIPELINES: Pipeline[] = [
  {
    category: RequestCategory.ROUTE_REQUEST,
    steps: ["preprocessing", "search_navigation", "final_response"],
    description: "Standard route guidance for normal traffic movement",
  },
  {
    category: RequestCategory.POLICY_CHECK,
    steps: ["preprocessing", "knowledge_base", "final_response"],
    description: "Validation of rule-based traffic or access conditions",
  },
  {
    category: RequestCategory.CONTROL_ALLOCATION_REQUEST,
    steps: ["preprocessing", "knowledge_base", "csp_scheduler", "final_response"],
    description: "Signal or lane-control assignment under constraints",
  },
  {
    category: RequestCategory.EMERGENCY_RESPONSE_REQUEST,
    steps: [
      "preprocessing",
      "ann_priority",
      "knowledge_base",
      "csp_scheduler",
      "search_navigation",
      "final_response",
    ],
    description: "Priority estimation, policy validation, and emergency routing",
  },
  {
    category: RequestCategory.INTEGRATED_CITY_SERVICE_REQUEST,
    steps: [
      "preprocessing",
      "ann_priority",
      "knowledge_base",
      "csp_scheduler",
      "search_navigation",
      "final_response",
    ],
    description: "Combined routing, control, and response support",
  },
];

// ============================================================================
// PIPELINE EXECUTOR
// ============================================================================

/**
 * Gets the pipeline configuration for a request category
 */
function getPipeline(category: RequestCategory): Pipeline {
  const pipeline = PIPELINES.find((p) => p.category === category);
  if (!pipeline) {
    // Default to route request pipeline
    return PIPELINES[0];
  }
  return pipeline;
}

/**
 * Executes the Route_Request pipeline
 * Steps: Preprocessing → Search → Final Response
 */
function executeRouteRequest(request: ProcessedRequest): FinalResponse {
  const startTime = Date.now();
  const modulesUsed: string[] = ["Input & Preprocessing", "Search & Navigation"];

  // Execute search
  const routeResult = findRoute(request);

  const processingTime = Date.now() - startTime;

  return {
    requestId: request.requestId,
    status: routeResult.path.length > 0 ? "success" : "failed",
    requestCategory: request.requestCategory,
    route: routeResult,
    decisionMessage: routeResult.path.length > 0
      ? `Route found from ${request.currentLocation} to ${request.destination}`
      : "No route available",
    explanatoryText: routeResult.path.length > 0
      ? `Optimal route calculated using ${routeResult.algorithm} algorithm. ` +
        `Total distance: ${routeResult.totalDistance} units. ` +
        `Estimated travel time: ${routeResult.estimatedTime} minutes.`
      : "Unable to find a valid route between the specified locations.",
    modulesUsed,
    processingTime,
    timestamp: new Date(),
  };
}

/**
 * Executes the Policy_Check pipeline
 * Steps: Preprocessing → Logic/KB → Final Response
 */
function executePolicyCheck(request: ProcessedRequest): FinalResponse {
  const startTime = Date.now();
  const modulesUsed: string[] = ["Input & Preprocessing", "Logic / Knowledge Base"];

  // Execute policy validation
  const policyResult = validatePolicy(request);

  const processingTime = Date.now() - startTime;

  return {
    requestId: request.requestId,
    status: policyResult.isAuthorized ? "success" : "failed",
    requestCategory: request.requestCategory,
    policyValidation: policyResult,
    decisionMessage: policyResult.isAuthorized
      ? "Policy check passed - action authorized"
      : "Policy check failed - action not authorized",
    explanatoryText:
      `Policy validation completed. ` +
      `Status: ${policyResult.policyStatus}. ` +
      `Allowed actions: ${policyResult.allowedActions.join(", ") || "none"}. ` +
      `Denied actions: ${policyResult.deniedActions.join(", ") || "none"}.`,
    modulesUsed,
    processingTime,
    timestamp: new Date(),
  };
}

/**
 * Executes the Control_Allocation_Request pipeline
 * Steps: Preprocessing → Logic/KB → CSP → Final Response
 */
function executeControlAllocation(request: ProcessedRequest): FinalResponse {
  const startTime = Date.now();
  const modulesUsed: string[] = [
    "Input & Preprocessing",
    "Logic / Knowledge Base",
    "CSP Scheduler",
  ];

  // Execute policy validation
  const policyResult = validatePolicy(request);

  if (!policyResult.isAuthorized) {
    return {
      requestId: request.requestId,
      status: "failed",
      requestCategory: request.requestCategory,
      policyValidation: policyResult,
      decisionMessage: "Control allocation denied - policy validation failed",
      explanatoryText: policyResult.reasoningChain.join(" → "),
      modulesUsed,
      processingTime: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  // Execute CSP allocation
  const cspResult = quickAllocation(request);

  const processingTime = Date.now() - startTime;

  return {
    requestId: request.requestId,
    status: cspResult.isFeasible ? "success" : "partial",
    requestCategory: request.requestCategory,
    policyValidation: policyResult,
    controlPlan: cspResult,
    decisionMessage: cspResult.isFeasible
      ? "Control allocation successful"
      : "Control allocation partially successful - some constraints not satisfied",
    explanatoryText:
      `Control allocation completed. ` +
      `Policy: ${policyResult.policyStatus}. ` +
      `Constraints applied: ${cspResult.constraints.length}. ` +
      `Conflicts resolved: ${cspResult.conflictsResolved.length}.`,
    modulesUsed,
    processingTime,
    timestamp: new Date(),
  };
}

/**
 * Executes the Emergency_Response_Request pipeline
 * Steps: Preprocessing → ANN → Logic/KB → CSP → Search → Final Response
 */
function executeEmergencyResponse(request: ProcessedRequest): FinalResponse {
  const startTime = Date.now();
  const modulesUsed: string[] = [
    "Input & Preprocessing",
    "ANN Priority Prediction",
    "Logic / Knowledge Base",
    "CSP Scheduler",
    "Search & Navigation",
  ];

  // Step 1: ANN Priority Prediction
  const priorityResult = predictPriorityEnhanced(request);

  // Step 2: Policy Validation
  const policyResult = validatePolicy(request, priorityResult.predictedPriority);

  if (!policyResult.isAuthorized) {
    return {
      requestId: request.requestId,
      status: "failed",
      requestCategory: request.requestCategory,
      priority: priorityResult,
      policyValidation: policyResult,
      decisionMessage: "Emergency response denied - authorization failed",
      explanatoryText:
        `Priority: ${priorityResult.predictedPriority} (${priorityResult.binaryClassification}). ` +
        `Authorization: ${policyResult.policyStatus}. ` +
        `Reason: ${policyResult.reasoningChain[policyResult.reasoningChain.length - 1]}`,
      modulesUsed,
      processingTime: Date.now() - startTime,
      timestamp: new Date(),
    };
  }

  // Step 3: Search for route first (needed for CSP corridor allocation)
  const routeResult = astar(request.currentLocation, request.destination, true);

  // Step 4: CSP Control Allocation with route path
  const cspResult = allocateSignalControl(
    request,
    routeResult.path,
    priorityResult.predictedPriority
  );

  const processingTime = Date.now() - startTime;

  return {
    requestId: request.requestId,
    status: routeResult.path.length > 0 ? "success" : "partial",
    requestCategory: request.requestCategory,
    route: routeResult,
    priority: priorityResult,
    policyValidation: policyResult,
    controlPlan: cspResult,
    decisionMessage:
      `Emergency response authorized - Priority: ${priorityResult.predictedPriority}`,
    explanatoryText:
      `Emergency priority validated: ${priorityResult.predictedPriority} ` +
      `(confidence: ${Math.round(priorityResult.confidence * 100)}%). ` +
      `Route calculated using ${routeResult.algorithm}: ${routeResult.path.length} nodes, ` +
      `${routeResult.totalDistance} units, ~${routeResult.estimatedTime} minutes. ` +
      `Corridor allocated: ${cspResult.corridorAllocation.length} signals coordinated.`,
    estimatedDelay: routeResult.estimatedTime,
    modulesUsed,
    processingTime,
    timestamp: new Date(),
  };
}

/**
 * Executes the Integrated_City_Service_Request pipeline
 * Steps: Preprocessing → ANN → Logic/KB → CSP → Search → Final Response
 */
function executeIntegratedService(request: ProcessedRequest): FinalResponse {
  const startTime = Date.now();
  const modulesUsed: string[] = [
    "Input & Preprocessing",
    "ANN Priority Prediction",
    "Logic / Knowledge Base",
    "CSP Scheduler",
    "Search & Navigation",
  ];

  // Step 1: ANN Priority Prediction
  const priorityResult = predictPriorityEnhanced(request);

  // Step 2: Policy Validation
  const policyResult = validatePolicy(request, priorityResult.predictedPriority);

  // Step 3: Search for route
  const routeResult = astar(request.currentLocation, request.destination, true);

  // Step 4: CSP Control Allocation
  const cspResult = allocateSignalControl(
    request,
    routeResult.path,
    priorityResult.predictedPriority
  );

  const processingTime = Date.now() - startTime;

  const isSuccess =
    policyResult.isAuthorized &&
    routeResult.path.length > 0 &&
    cspResult.isFeasible;

  return {
    requestId: request.requestId,
    status: isSuccess ? "success" : "partial",
    requestCategory: request.requestCategory,
    route: routeResult,
    priority: priorityResult,
    policyValidation: policyResult,
    controlPlan: cspResult,
    decisionMessage: isSuccess
      ? `Integrated city service request processed successfully`
      : `Integrated service partially processed - some components incomplete`,
    explanatoryText:
      `Full system integration: ` +
      `Priority ${priorityResult.predictedPriority} (${priorityResult.binaryClassification}). ` +
      `Policy: ${policyResult.policyStatus}. ` +
      `Route: ${routeResult.path.length} nodes via ${routeResult.algorithm}. ` +
      `Control: ${cspResult.corridorAllocation.length} signals, ` +
      `${cspResult.conflictsResolved.length} conflicts resolved. ` +
      `Total processing: ${processingTime}ms.`,
    estimatedDelay: routeResult.estimatedTime,
    modulesUsed,
    processingTime,
    timestamp: new Date(),
  };
}

// ============================================================================
// MAIN ROUTER FUNCTION
// ============================================================================

/**
 * Main request routing function.
 * Routes the request to the appropriate pipeline based on category.
 * 
 * @param request - The preprocessed traffic request
 * @returns FinalResponse - The complete response with all module outputs
 */
export function routeRequest(request: ProcessedRequest): FinalResponse {
  // Validate request first
  if (!request.isValid) {
    return {
      requestId: request.requestId,
      status: "failed",
      requestCategory: request.requestCategory,
      decisionMessage: "Request validation failed",
      explanatoryText: `Validation errors: ${request.validationErrors.join("; ")}`,
      modulesUsed: ["Input & Preprocessing"],
      processingTime: 0,
      timestamp: new Date(),
    };
  }

  // Route to appropriate pipeline
  switch (request.requestCategory) {
    case RequestCategory.ROUTE_REQUEST:
      return executeRouteRequest(request);

    case RequestCategory.POLICY_CHECK:
      return executePolicyCheck(request);

    case RequestCategory.CONTROL_ALLOCATION_REQUEST:
      return executeControlAllocation(request);

    case RequestCategory.EMERGENCY_RESPONSE_REQUEST:
      return executeEmergencyResponse(request);

    case RequestCategory.INTEGRATED_CITY_SERVICE_REQUEST:
      return executeIntegratedService(request);

    default:
      return {
        requestId: request.requestId,
        status: "failed",
        requestCategory: request.requestCategory,
        decisionMessage: "Unknown request category",
        explanatoryText: `Request category "${request.requestCategory}" is not recognized.`,
        modulesUsed: ["Request Router"],
        processingTime: 0,
        timestamp: new Date(),
      };
  }
}

/**
 * Gets pipeline information for a request category
 */
export function getPipelineInfo(category: RequestCategory): {
  steps: string[];
  description: string;
} {
  const pipeline = getPipeline(category);
  return {
    steps: pipeline.steps.map((step) =>
      step
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    ),
    description: pipeline.description,
  };
}

/**
 * Gets all available pipelines
 */
export function getAllPipelines(): {
  category: string;
  steps: string[];
  description: string;
}[] {
  return PIPELINES.map((p) => ({
    category: p.category,
    steps: p.steps.map((step) =>
      step
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    ),
    description: p.description,
  }));
}
