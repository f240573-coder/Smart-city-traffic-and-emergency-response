/**
 * CSP Scheduler / Control Allocation Module
 * 
 * This module handles constrained control decisions using Constraint
 * Satisfaction Problem (CSP) solving techniques.
 * 
 * Key responsibilities:
 * - Signal timing plan allocation
 * - Lane control adjustments
 * - Emergency corridor allocation
 * - Intersection sequence coordination
 * 
 * The module ensures control plans satisfy safety, timing, and conflict constraints.
 */

import {
  ProcessedRequest,
  CSPSolution,
  SignalState,
  PriorityLevel,
  ActionType,
} from "../types";
import { defaultCityGraph, getNeighbors, getSignalZone } from "../city-graph";

// ============================================================================
// CSP TYPES
// ============================================================================

interface Variable {
  id: string;
  domain: SignalState[];
  currentValue?: SignalState;
}

interface Constraint {
  id: string;
  type: "unary" | "binary" | "global";
  variables: string[];
  description: string;
  check: (assignment: Map<string, SignalState>) => boolean;
}

interface CSPProblem {
  variables: Map<string, Variable>;
  constraints: Constraint[];
  objective?: "minimize_wait" | "maximize_throughput" | "emergency_priority";
}

// ============================================================================
// CONSTRAINT DEFINITIONS
// ============================================================================

/**
 * Creates safety constraint: Adjacent signals cannot both be GREEN
 */
function createAdjacentConflictConstraint(
  signalId1: string,
  signalId2: string
): Constraint {
  return {
    id: `conflict_${signalId1}_${signalId2}`,
    type: "binary",
    variables: [signalId1, signalId2],
    description: `Signals ${signalId1} and ${signalId2} cannot both be GREEN`,
    check: (assignment) => {
      const val1 = assignment.get(signalId1);
      const val2 = assignment.get(signalId2);
      if (val1 === undefined || val2 === undefined) return true;
      // Both cannot be green simultaneously (potential collision)
      return !(val1 === SignalState.GREEN && val2 === SignalState.GREEN);
    },
  };
}

/**
 * Creates emergency override constraint: Signal must allow emergency passage
 */
function createEmergencyOverrideConstraint(signalId: string): Constraint {
  return {
    id: `emergency_${signalId}`,
    type: "unary",
    variables: [signalId],
    description: `Signal ${signalId} must be GREEN or EMERGENCY_OVERRIDE for emergency passage`,
    check: (assignment) => {
      const val = assignment.get(signalId);
      if (val === undefined) return true;
      return val === SignalState.GREEN || val === SignalState.EMERGENCY_OVERRIDE;
    },
  };
}

/**
 * Creates minimum green time constraint
 */
function createMinGreenTimeConstraint(
  signalIds: string[],
  minCount: number
): Constraint {
  return {
    id: `min_green_${signalIds.join("_")}`,
    type: "global",
    variables: signalIds,
    description: `At least ${minCount} signals must be GREEN`,
    check: (assignment) => {
      let greenCount = 0;
      for (const id of signalIds) {
        if (assignment.get(id) === SignalState.GREEN) {
          greenCount++;
        }
      }
      return greenCount >= minCount;
    },
  };
}

/**
 * Creates corridor clearance constraint: All signals in corridor must allow passage
 */
function createCorridorConstraint(corridorSignals: string[]): Constraint {
  return {
    id: `corridor_${corridorSignals.join("_")}`,
    type: "global",
    variables: corridorSignals,
    description: "All corridor signals must allow emergency passage",
    check: (assignment) => {
      for (const signalId of corridorSignals) {
        const val = assignment.get(signalId);
        if (val !== undefined && val !== SignalState.GREEN && val !== SignalState.EMERGENCY_OVERRIDE) {
          return false;
        }
      }
      return true;
    },
  };
}

// ============================================================================
// CSP SOLVER IMPLEMENTATION
// ============================================================================

/**
 * Checks if current assignment is consistent with all constraints
 */
function isConsistent(
  assignment: Map<string, SignalState>,
  constraints: Constraint[]
): boolean {
  for (const constraint of constraints) {
    if (!constraint.check(assignment)) {
      return false;
    }
  }
  return true;
}

/**
 * Backtracking search with constraint propagation
 */
function backtrackSearch(
  problem: CSPProblem,
  assignment: Map<string, SignalState>,
  unassigned: string[]
): Map<string, SignalState> | null {
  // Base case: all variables assigned
  if (unassigned.length === 0) {
    if (isConsistent(assignment, problem.constraints)) {
      return assignment;
    }
    return null;
  }

  // Select next variable (MRV heuristic - minimum remaining values)
  const varId = selectVariableMRV(problem, unassigned, assignment);
  const variable = problem.variables.get(varId)!;
  const remainingVars = unassigned.filter((v) => v !== varId);

  // Try each value in domain (LCV - least constraining value first)
  const orderedDomain = orderDomainValues(
    variable,
    assignment,
    problem.constraints
  );

  for (const value of orderedDomain) {
    // Create new assignment with this value
    const newAssignment = new Map(assignment);
    newAssignment.set(varId, value);

    // Check consistency
    if (isConsistent(newAssignment, problem.constraints)) {
      // Recurse
      const result = backtrackSearch(problem, newAssignment, remainingVars);
      if (result !== null) {
        return result;
      }
    }
  }

  // No valid assignment found
  return null;
}

/**
 * Minimum Remaining Values (MRV) heuristic
 */
function selectVariableMRV(
  problem: CSPProblem,
  unassigned: string[],
  assignment: Map<string, SignalState>
): string {
  let minVar = unassigned[0];
  let minValues = Infinity;

  for (const varId of unassigned) {
    const variable = problem.variables.get(varId)!;
    let validValues = 0;

    for (const value of variable.domain) {
      const testAssignment = new Map(assignment);
      testAssignment.set(varId, value);
      if (isConsistent(testAssignment, problem.constraints)) {
        validValues++;
      }
    }

    if (validValues < minValues) {
      minValues = validValues;
      minVar = varId;
    }
  }

  return minVar;
}

/**
 * Least Constraining Value (LCV) ordering
 */
function orderDomainValues(
  variable: Variable,
  assignment: Map<string, SignalState>,
  constraints: Constraint[]
): SignalState[] {
  const valueScores: { value: SignalState; score: number }[] = [];

  for (const value of variable.domain) {
    const testAssignment = new Map(assignment);
    testAssignment.set(variable.id, value);

    // Count how many constraints this value satisfies
    let score = 0;
    for (const constraint of constraints) {
      if (constraint.check(testAssignment)) {
        score++;
      }
    }
    valueScores.push({ value, score });
  }

  // Sort by score (higher = less constraining)
  valueScores.sort((a, b) => b.score - a.score);
  return valueScores.map((vs) => vs.value);
}

// ============================================================================
// CORRIDOR IDENTIFICATION
// ============================================================================

/**
 * Identifies signals along a path for emergency corridor allocation
 */
function identifyCorridorSignals(
  path: string[],
  isEmergency: boolean
): string[] {
  const corridorSignals: string[] = [];

  for (const locationId of path) {
    const signalZone = getSignalZone(defaultCityGraph, locationId);
    if (signalZone) {
      corridorSignals.push(signalZone.id);
    }
  }

  return corridorSignals;
}

/**
 * Gets all adjacent signal pairs for conflict constraints
 */
function getAdjacentSignalPairs(): [string, string][] {
  const pairs: [string, string][] = [];
  const signals = Array.from(defaultCityGraph.signals.values());

  for (let i = 0; i < signals.length; i++) {
    for (let j = i + 1; j < signals.length; j++) {
      const sig1 = signals[i];
      const sig2 = signals[j];

      // Check if signals are adjacent (share a road)
      const neighbors1 = getNeighbors(defaultCityGraph, sig1.locationId);
      const isAdjacent = neighbors1.some(
        (n) => n.locationId === sig2.locationId
      );

      if (isAdjacent) {
        pairs.push([sig1.id, sig2.id]);
      }
    }
  }

  return pairs;
}

// ============================================================================
// CSP PROBLEM CONSTRUCTION
// ============================================================================

/**
 * Creates a CSP problem for signal control allocation
 */
function createSignalControlProblem(
  corridorPath: string[],
  isEmergency: boolean,
  priorityLevel: PriorityLevel
): CSPProblem {
  const variables = new Map<string, Variable>();
  const constraints: Constraint[] = [];

  // Create variables for each signal
  defaultCityGraph.signals.forEach((signal, signalId) => {
    let domain: SignalState[] = [
      SignalState.RED,
      SignalState.GREEN,
      SignalState.YELLOW,
    ];

    // Emergency vehicles can trigger emergency override
    if (isEmergency) {
      domain.push(SignalState.EMERGENCY_OVERRIDE);
    }

    variables.set(signalId, {
      id: signalId,
      domain,
      currentValue: signal.currentState,
    });
  });

  // Add conflict constraints for adjacent signals
  const adjacentPairs = getAdjacentSignalPairs();
  for (const [sig1, sig2] of adjacentPairs) {
    constraints.push(createAdjacentConflictConstraint(sig1, sig2));
  }

  // Add corridor constraints for emergency vehicles
  if (isEmergency && corridorPath.length > 0) {
    const corridorSignals = identifyCorridorSignals(corridorPath, true);
    
    if (corridorSignals.length > 0) {
      constraints.push(createCorridorConstraint(corridorSignals));
      
      // Also add individual emergency override constraints
      for (const signalId of corridorSignals) {
        constraints.push(createEmergencyOverrideConstraint(signalId));
      }
    }
  }

  // Add minimum throughput constraint (at least 1 signal green for civilian traffic)
  const allSignalIds = Array.from(variables.keys());
  if (!isEmergency) {
    constraints.push(createMinGreenTimeConstraint(allSignalIds, 1));
  }

  return {
    variables,
    constraints,
    objective: isEmergency ? "emergency_priority" : "maximize_throughput",
  };
}

// ============================================================================
// MAIN ALLOCATION FUNCTIONS
// ============================================================================

/**
 * Allocates signal control for a traffic request.
 * 
 * @param request - The preprocessed traffic request
 * @param corridorPath - The route path for corridor allocation
 * @param priorityLevel - The priority level from ANN
 * @returns CSPSolution - The feasible signal assignment
 */
export function allocateSignalControl(
  request: ProcessedRequest,
  corridorPath: string[] = [],
  priorityLevel: PriorityLevel = PriorityLevel.NORMAL
): CSPSolution {
  const isEmergency =
    request.requestCategory === "Emergency_Response_Request" ||
    request.requestCategory === "Integrated_City_Service_Request" ||
    priorityLevel === PriorityLevel.CRITICAL ||
    priorityLevel === PriorityLevel.HIGH;

  // Create CSP problem
  const problem = createSignalControlProblem(
    corridorPath,
    isEmergency,
    priorityLevel
  );

  // Solve using backtracking search
  const unassigned = Array.from(problem.variables.keys());
  const initialAssignment = new Map<string, SignalState>();
  
  const solution = backtrackSearch(problem, initialAssignment, unassigned);

  // Build result
  const constraintDescriptions = problem.constraints.map((c) => c.description);
  const conflictsResolved: string[] = [];

  if (solution) {
    // Check which constraints required changes
    for (const constraint of problem.constraints) {
      const originalAssignment = new Map<string, SignalState>();
      problem.variables.forEach((v, id) => {
        if (v.currentValue) {
          originalAssignment.set(id, v.currentValue);
        }
      });

      if (!constraint.check(originalAssignment) && constraint.check(solution)) {
        conflictsResolved.push(
          `Resolved: ${constraint.description}`
        );
      }
    }

    // Identify corridor allocation
    const corridorSignals = identifyCorridorSignals(corridorPath, isEmergency);
    
    return {
      isFeasible: true,
      signalAssignments: solution,
      corridorAllocation: corridorSignals,
      constraints: constraintDescriptions,
      conflictsResolved,
    };
  }

  // No feasible solution - return current state
  const currentAssignment = new Map<string, SignalState>();
  problem.variables.forEach((v, id) => {
    currentAssignment.set(id, v.currentValue || SignalState.RED);
  });

  return {
    isFeasible: false,
    signalAssignments: currentAssignment,
    corridorAllocation: [],
    constraints: constraintDescriptions,
    conflictsResolved: ["No feasible solution found - using default assignment"],
  };
}

/**
 * Quick allocation for simple route requests (no full CSP solving)
 */
export function quickAllocation(
  request: ProcessedRequest
): CSPSolution {
  const signalAssignments = new Map<string, SignalState>();

  // Simply use current signal states
  defaultCityGraph.signals.forEach((signal, signalId) => {
    signalAssignments.set(signalId, signal.currentState);
  });

  return {
    isFeasible: true,
    signalAssignments,
    corridorAllocation: [],
    constraints: ["Standard traffic flow - no special allocation needed"],
    conflictsResolved: [],
  };
}

/**
 * Gets CSP problem details for visualization
 */
export function getCSPDetails(): {
  variables: { id: string; domain: string[]; current: string }[];
  constraints: { id: string; type: string; description: string }[];
} {
  const variables = Array.from(defaultCityGraph.signals.values()).map((signal) => ({
    id: signal.id,
    domain: [
      SignalState.RED,
      SignalState.GREEN,
      SignalState.YELLOW,
      SignalState.EMERGENCY_OVERRIDE,
    ],
    current: signal.currentState,
  }));

  const adjacentPairs = getAdjacentSignalPairs();
  const constraints = adjacentPairs.map(([sig1, sig2], idx) => ({
    id: `C${idx + 1}`,
    type: "binary",
    description: `${sig1} and ${sig2} cannot both be GREEN`,
  }));

  // Add global constraint
  constraints.push({
    id: `C${constraints.length + 1}`,
    type: "global",
    description: "At least one signal must allow traffic flow",
  });

  return { variables, constraints };
}

/**
 * Simulates the effect of a signal change
 */
export function simulateSignalChange(
  signalId: string,
  newState: SignalState
): {
  isValid: boolean;
  conflicts: string[];
} {
  const problem = createSignalControlProblem([], false, PriorityLevel.NORMAL);
  const assignment = new Map<string, SignalState>();

  // Set current states
  defaultCityGraph.signals.forEach((signal, id) => {
    assignment.set(id, id === signalId ? newState : signal.currentState);
  });

  // Check constraints
  const conflicts: string[] = [];
  for (const constraint of problem.constraints) {
    if (!constraint.check(assignment)) {
      conflicts.push(constraint.description);
    }
  }

  return {
    isValid: conflicts.length === 0,
    conflicts,
  };
}
