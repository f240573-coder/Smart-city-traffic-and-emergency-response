/**
 * Search & Navigation Module
 * 
 * This module performs route generation over the city road network.
 * Implements BFS, UCS, and A* search algorithms for pathfinding.
 * 
 * Key features:
 * - BFS for unweighted route problems
 * - UCS for weighted problems
 * - A* for weighted problems with heuristic guidance
 * - Emergency routing with reduced traffic impact
 */

import {
  ProcessedRequest,
  RouteResult,
  SearchState,
  VehicleType,
} from "../types";
import {
  defaultCityGraph,
  getNeighbors,
  calculateEdgeWeight,
  heuristicDistance,
  locationExists,
  getLocation,
} from "../city-graph";

// ============================================================================
// PRIORITY QUEUE IMPLEMENTATION
// ============================================================================

class PriorityQueue<T> {
  private items: { element: T; priority: number }[] = [];

  enqueue(element: T, priority: number): void {
    const item = { element, priority };
    let added = false;

    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].priority > priority) {
        this.items.splice(i, 0, item);
        added = true;
        break;
      }
    }

    if (!added) {
      this.items.push(item);
    }
  }

  dequeue(): T | undefined {
    return this.items.shift()?.element;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }
}

// ============================================================================
// BFS IMPLEMENTATION (Unweighted Search)
// ============================================================================

/**
 * Breadth-First Search for unweighted route problems.
 * Finds the shortest path in terms of number of edges.
 * 
 * @param start - Starting location ID
 * @param goal - Goal location ID
 * @returns RouteResult with path and statistics
 */
export function bfs(start: string, goal: string): RouteResult {
  // Validate inputs
  if (!locationExists(defaultCityGraph, start)) {
    return createEmptyResult("BFS", `Invalid start location: ${start}`);
  }
  if (!locationExists(defaultCityGraph, goal)) {
    return createEmptyResult("BFS", `Invalid goal location: ${goal}`);
  }
  if (start === goal) {
    return {
      path: [start],
      totalDistance: 0,
      estimatedTime: 0,
      algorithm: "BFS",
      nodesExplored: 1,
    };
  }

  const visited = new Set<string>();
  const queue: SearchState[] = [{ nodeId: start, cost: 0, path: [start] }];
  let nodesExplored = 0;

  while (queue.length > 0) {
    const current = queue.shift()!;
    nodesExplored++;

    if (current.nodeId === goal) {
      // Calculate total distance along path
      const totalDistance = calculatePathDistance(current.path, false);
      
      return {
        path: current.path,
        totalDistance,
        estimatedTime: estimateTime(totalDistance, false),
        algorithm: "BFS",
        nodesExplored,
      };
    }

    if (visited.has(current.nodeId)) continue;
    visited.add(current.nodeId);

    const neighbors = getNeighbors(defaultCityGraph, current.nodeId);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.locationId)) {
        queue.push({
          nodeId: neighbor.locationId,
          cost: current.cost + 1,
          path: [...current.path, neighbor.locationId],
        });
      }
    }
  }

  return createEmptyResult("BFS", "No path found");
}

// ============================================================================
// UCS IMPLEMENTATION (Weighted Search)
// ============================================================================

/**
 * Uniform Cost Search for weighted route problems.
 * Finds the minimum cost path considering edge weights.
 * 
 * @param start - Starting location ID
 * @param goal - Goal location ID
 * @param isEmergency - Whether this is an emergency vehicle
 * @returns RouteResult with path and statistics
 */
export function ucs(
  start: string,
  goal: string,
  isEmergency: boolean = false
): RouteResult {
  // Validate inputs
  if (!locationExists(defaultCityGraph, start)) {
    return createEmptyResult("UCS", `Invalid start location: ${start}`);
  }
  if (!locationExists(defaultCityGraph, goal)) {
    return createEmptyResult("UCS", `Invalid goal location: ${goal}`);
  }
  if (start === goal) {
    return {
      path: [start],
      totalDistance: 0,
      estimatedTime: 0,
      algorithm: "UCS",
      nodesExplored: 1,
    };
  }

  const visited = new Set<string>();
  const frontier = new PriorityQueue<SearchState>();
  frontier.enqueue({ nodeId: start, cost: 0, path: [start] }, 0);
  let nodesExplored = 0;

  while (!frontier.isEmpty()) {
    const current = frontier.dequeue()!;
    nodesExplored++;

    if (current.nodeId === goal) {
      return {
        path: current.path,
        totalDistance: Math.round(current.cost * 100) / 100,
        estimatedTime: estimateTime(current.cost, isEmergency),
        algorithm: "UCS",
        nodesExplored,
      };
    }

    if (visited.has(current.nodeId)) continue;
    visited.add(current.nodeId);

    const neighbors = getNeighbors(defaultCityGraph, current.nodeId);
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.locationId)) {
        const edgeCost = calculateEdgeWeight(neighbor.road, isEmergency);
        const newCost = current.cost + edgeCost;

        frontier.enqueue(
          {
            nodeId: neighbor.locationId,
            cost: newCost,
            path: [...current.path, neighbor.locationId],
          },
          newCost
        );
      }
    }
  }

  return createEmptyResult("UCS", "No path found");
}

// ============================================================================
// A* IMPLEMENTATION (Heuristic Search)
// ============================================================================

/**
 * A* Search for weighted route problems with heuristic guidance.
 * Finds the optimal path using admissible heuristic (Euclidean distance).
 * 
 * @param start - Starting location ID
 * @param goal - Goal location ID
 * @param isEmergency - Whether this is an emergency vehicle
 * @returns RouteResult with path and statistics
 */
export function astar(
  start: string,
  goal: string,
  isEmergency: boolean = false
): RouteResult {
  // Validate inputs
  if (!locationExists(defaultCityGraph, start)) {
    return createEmptyResult("A*", `Invalid start location: ${start}`);
  }
  if (!locationExists(defaultCityGraph, goal)) {
    return createEmptyResult("A*", `Invalid goal location: ${goal}`);
  }
  if (start === goal) {
    return {
      path: [start],
      totalDistance: 0,
      estimatedTime: 0,
      algorithm: "A*",
      nodesExplored: 1,
    };
  }

  const visited = new Set<string>();
  const gScores = new Map<string, number>();
  const frontier = new PriorityQueue<SearchState>();
  
  const startH = heuristicDistance(defaultCityGraph, start, goal);
  frontier.enqueue(
    { nodeId: start, cost: 0, path: [start], heuristic: startH },
    startH
  );
  gScores.set(start, 0);
  
  let nodesExplored = 0;

  while (!frontier.isEmpty()) {
    const current = frontier.dequeue()!;
    nodesExplored++;

    if (current.nodeId === goal) {
      return {
        path: current.path,
        totalDistance: Math.round(current.cost * 100) / 100,
        estimatedTime: estimateTime(current.cost, isEmergency),
        algorithm: "A*",
        nodesExplored,
      };
    }

    if (visited.has(current.nodeId)) continue;
    visited.add(current.nodeId);

    const neighbors = getNeighbors(defaultCityGraph, current.nodeId);
    for (const neighbor of neighbors) {
      const neighborId = neighbor.locationId;
      
      if (visited.has(neighborId)) continue;

      const edgeCost = calculateEdgeWeight(neighbor.road, isEmergency);
      const tentativeG = current.cost + edgeCost;
      
      const currentG = gScores.get(neighborId) ?? Infinity;
      
      if (tentativeG < currentG) {
        gScores.set(neighborId, tentativeG);
        const h = heuristicDistance(defaultCityGraph, neighborId, goal);
        const f = tentativeG + h;

        frontier.enqueue(
          {
            nodeId: neighborId,
            cost: tentativeG,
            path: [...current.path, neighborId],
            heuristic: h,
          },
          f
        );
      }
    }
  }

  return createEmptyResult("A*", "No path found");
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates an empty result for failed searches
 */
function createEmptyResult(
  algorithm: "BFS" | "UCS" | "A*",
  error: string
): RouteResult {
  console.warn(`[${algorithm}] ${error}`);
  return {
    path: [],
    totalDistance: 0,
    estimatedTime: 0,
    algorithm,
    nodesExplored: 0,
  };
}

/**
 * Calculates the total distance along a path
 */
function calculatePathDistance(path: string[], isEmergency: boolean): number {
  let totalDistance = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const neighbors = getNeighbors(defaultCityGraph, path[i]);
    const nextNode = neighbors.find((n) => n.locationId === path[i + 1]);
    
    if (nextNode) {
      totalDistance += calculateEdgeWeight(nextNode.road, isEmergency);
    }
  }

  return Math.round(totalDistance * 100) / 100;
}

/**
 * Estimates travel time based on distance and vehicle type
 * Assumes average speed of 30 km/h for normal traffic, 60 km/h for emergency
 */
function estimateTime(distance: number, isEmergency: boolean): number {
  const avgSpeed = isEmergency ? 60 : 30; // km/h
  const timeInHours = distance / avgSpeed;
  const timeInMinutes = timeInHours * 60;
  return Math.round(timeInMinutes * 100) / 100;
}

// ============================================================================
// MAIN NAVIGATION FUNCTION
// ============================================================================

/**
 * Main navigation function that selects appropriate algorithm based on request.
 * 
 * @param request - The preprocessed traffic request
 * @returns RouteResult with optimal path
 */
export function findRoute(request: ProcessedRequest): RouteResult {
  const isEmergency = [
    VehicleType.AMBULANCE,
    VehicleType.FIRE_UNIT,
    VehicleType.POLICE,
  ].includes(request.vehicleType);

  // For simple route requests, use BFS first to check reachability
  const bfsResult = bfs(request.currentLocation, request.destination);
  
  if (bfsResult.path.length === 0) {
    return bfsResult; // No path exists
  }

  // Use A* for weighted optimal path
  return astar(request.currentLocation, request.destination, isEmergency);
}

/**
 * Finds route with specific algorithm selection
 */
export function findRouteWithAlgorithm(
  start: string,
  goal: string,
  algorithm: "BFS" | "UCS" | "A*",
  isEmergency: boolean = false
): RouteResult {
  switch (algorithm) {
    case "BFS":
      return bfs(start, goal);
    case "UCS":
      return ucs(start, goal, isEmergency);
    case "A*":
      return astar(start, goal, isEmergency);
    default:
      return astar(start, goal, isEmergency);
  }
}

/**
 * Compares all three algorithms for educational purposes
 */
export function compareAlgorithms(
  start: string,
  goal: string,
  isEmergency: boolean = false
): {
  bfs: RouteResult;
  ucs: RouteResult;
  astar: RouteResult;
  comparison: {
    fastestAlgorithm: string;
    shortestPath: string;
    fewestNodesExplored: string;
  };
} {
  const bfsResult = bfs(start, goal);
  const ucsResult = ucs(start, goal, isEmergency);
  const astarResult = astar(start, goal, isEmergency);

  // Determine fastest (lowest distance with emergency consideration)
  const fastestAlgorithm = 
    astarResult.totalDistance <= ucsResult.totalDistance ? "A*" : "UCS";

  // Shortest path (fewest nodes)
  const pathLengths = [
    { name: "BFS", length: bfsResult.path.length },
    { name: "UCS", length: ucsResult.path.length },
    { name: "A*", length: astarResult.path.length },
  ].filter((p) => p.length > 0);
  
  const shortestPath = pathLengths.length > 0
    ? pathLengths.reduce((a, b) => (a.length <= b.length ? a : b)).name
    : "None";

  // Fewest nodes explored
  const nodesExplored = [
    { name: "BFS", nodes: bfsResult.nodesExplored },
    { name: "UCS", nodes: ucsResult.nodesExplored },
    { name: "A*", nodes: astarResult.nodesExplored },
  ].filter((n) => n.nodes > 0);
  
  const fewestNodesExplored = nodesExplored.length > 0
    ? nodesExplored.reduce((a, b) => (a.nodes <= b.nodes ? a : b)).name
    : "None";

  return {
    bfs: bfsResult,
    ucs: ucsResult,
    astar: astarResult,
    comparison: {
      fastestAlgorithm,
      shortestPath,
      fewestNodesExplored,
    },
  };
}

/**
 * Gets all locations for dropdown/selection
 */
export function getAllLocations(): { id: string; name: string; type: string }[] {
  return Array.from(defaultCityGraph.locations.values()).map((loc) => ({
    id: loc.id,
    name: loc.name,
    type: loc.type,
  }));
}

/**
 * Gets path visualization data
 */
export function getPathVisualization(path: string[]): {
  nodes: { id: string; name: string; x: number; y: number }[];
  edges: { from: string; to: string; distance: number }[];
} {
  const nodes = path.map((locationId) => {
    const location = getLocation(defaultCityGraph, locationId);
    return {
      id: locationId,
      name: location?.name || locationId,
      x: location?.coordinates?.x || 0,
      y: location?.coordinates?.y || 0,
    };
  });

  const edges: { from: string; to: string; distance: number }[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const neighbors = getNeighbors(defaultCityGraph, path[i]);
    const nextNode = neighbors.find((n) => n.locationId === path[i + 1]);
    if (nextNode) {
      edges.push({
        from: path[i],
        to: path[i + 1],
        distance: nextNode.road.distance,
      });
    }
  }

  return { nodes, edges };
}
