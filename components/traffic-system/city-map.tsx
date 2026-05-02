"use client";

import { useMemo, useState } from "react";
import { defaultCityGraph, getNeighbors } from "@/lib/traffic-system/city-graph";
import { SignalState } from "@/lib/traffic-system/types";

interface CityMapProps {
  highlightedPath?: string[];
  signalStates?: Map<string, SignalState>;
  currentLocation?: string;
  destination?: string;
}

export function CityMap({
  highlightedPath = [],
  signalStates,
  currentLocation,
  destination,
}: CityMapProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

  const locations = useMemo(
    () => Array.from(defaultCityGraph.locations.values()),
    []
  );

  const edges = useMemo(() => {
    const edgeSet = new Set<string>();
    const edgeList: {
      id: string;
      from: { x: number; y: number; id: string };
      to: { x: number; y: number; id: string };
      road: { distance: number; trafficDensity: string };
    }[] = [];

    locations.forEach((loc) => {
      const neighbors = getNeighbors(defaultCityGraph, loc.id);
      neighbors.forEach((n) => {
        const edgeKey = [loc.id, n.locationId].sort().join("-");
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          const toLoc = defaultCityGraph.locations.get(n.locationId);
          if (toLoc?.coordinates && loc.coordinates) {
            edgeList.push({
              id: edgeKey,
              from: { ...loc.coordinates, id: loc.id },
              to: { ...toLoc.coordinates, id: n.locationId },
              road: {
                distance: n.road.distance,
                trafficDensity: n.road.trafficDensity,
              },
            });
          }
        }
      });
    });

    return edgeList;
  }, [locations]);

  const isEdgeInPath = (fromId: string, toId: string): boolean => {
    for (let i = 0; i < highlightedPath.length - 1; i++) {
      if (
        (highlightedPath[i] === fromId && highlightedPath[i + 1] === toId) ||
        (highlightedPath[i] === toId && highlightedPath[i + 1] === fromId)
      ) {
        return true;
      }
    }
    return false;
  };

  const getNodeColor = (locationId: string): string => {
    if (locationId === currentLocation) return "#22c55e";
    if (locationId === destination) return "#ef4444";
    if (highlightedPath.includes(locationId)) return "#3b82f6";
    
    const loc = defaultCityGraph.locations.get(locationId);
    switch (loc?.type) {
      case "hospital":
        return "#f97316";
      case "station":
        return "#8b5cf6";
      case "junction":
        return "#475569";
      default:
        return "#64748b";
    }
  };

  const getTrafficColor = (density: string): string => {
    switch (density) {
      case "low":
        return "#22c55e";
      case "medium":
        return "#eab308";
      case "high":
        return "#f97316";
      case "congested":
        return "#ef4444";
      default:
        return "#64748b";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "hospital":
        return "H";
      case "station":
        return "S";
      case "junction":
        return "J";
      default:
        return "";
    }
  };

  return (
    <div className="relative w-full h-full bg-muted/20 overflow-hidden">
      {/* Grid Pattern Background */}
      <svg className="absolute inset-0 w-full h-full opacity-20">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Main Map SVG */}
      <svg viewBox="0 0 600 500" className="relative w-full h-full">
        <defs>
          {/* Gradient for highlighted path */}
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Node glow filter */}
          <filter id="nodeGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background Edges */}
        {edges.map((edge) => {
          const inPath = isEdgeInPath(edge.from.id, edge.to.id);
          const isHovered = hoveredEdge === edge.id;
          
          return (
            <g key={edge.id}>
              {/* Shadow/glow for path edges */}
              {inPath && (
                <line
                  x1={edge.from.x}
                  y1={edge.from.y}
                  x2={edge.to.x}
                  y2={edge.to.y}
                  stroke="#3b82f6"
                  strokeWidth={8}
                  strokeOpacity={0.3}
                  filter="url(#glow)"
                />
              )}
              
              {/* Main edge line */}
              <line
                x1={edge.from.x}
                y1={edge.from.y}
                x2={edge.to.x}
                y2={edge.to.y}
                stroke={inPath ? "url(#pathGradient)" : getTrafficColor(edge.road.trafficDensity)}
                strokeWidth={inPath ? 4 : isHovered ? 3 : 2}
                strokeOpacity={inPath ? 1 : isHovered ? 0.9 : 0.5}
                strokeLinecap="round"
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredEdge(edge.id)}
                onMouseLeave={() => setHoveredEdge(null)}
              />

              {/* Animated flow for path edges */}
              {inPath && (
                <line
                  x1={edge.from.x}
                  y1={edge.from.y}
                  x2={edge.to.x}
                  y2={edge.to.y}
                  stroke="#ffffff"
                  strokeWidth={2}
                  strokeDasharray="8 12"
                  strokeOpacity={0.6}
                  className="animate-flow"
                />
              )}
            </g>
          );
        })}

        {/* Edge Labels (distance) */}
        {edges.map((edge) => {
          const inPath = isEdgeInPath(edge.from.id, edge.to.id);
          const isHovered = hoveredEdge === edge.id;
          
          if (!inPath && !isHovered) return null;
          
          return (
            <g key={`label-${edge.id}`}>
              <rect
                x={(edge.from.x + edge.to.x) / 2 - 12}
                y={(edge.from.y + edge.to.y) / 2 - 18}
                width="24"
                height="14"
                rx="3"
                fill="rgba(0,0,0,0.7)"
              />
              <text
                x={(edge.from.x + edge.to.x) / 2}
                y={(edge.from.y + edge.to.y) / 2 - 8}
                fontSize="9"
                fill="#ffffff"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {edge.road.distance}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {locations.map((loc) => {
          if (!loc.coordinates) return null;
          const isInPath = highlightedPath.includes(loc.id);
          const isStart = loc.id === currentLocation;
          const isEnd = loc.id === destination;
          const isHovered = hoveredNode === loc.id;
          const nodeColor = getNodeColor(loc.id);
          const size = isStart || isEnd ? 18 : isInPath ? 15 : isHovered ? 14 : 12;

          return (
            <g 
              key={loc.id}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredNode(loc.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* Outer glow for important nodes */}
              {(isStart || isEnd || isInPath) && (
                <circle
                  cx={loc.coordinates.x}
                  cy={loc.coordinates.y}
                  r={size + 6}
                  fill={nodeColor}
                  opacity={0.2}
                  filter="url(#nodeGlow)"
                />
              )}

              {/* Pulse ring for start/end */}
              {(isStart || isEnd) && (
                <circle
                  cx={loc.coordinates.x}
                  cy={loc.coordinates.y}
                  r={size + 4}
                  fill="none"
                  stroke={nodeColor}
                  strokeWidth={2}
                  opacity={0.5}
                  className="animate-ping"
                  style={{ transformOrigin: `${loc.coordinates.x}px ${loc.coordinates.y}px` }}
                />
              )}
              
              {/* Main node circle */}
              <circle
                cx={loc.coordinates.x}
                cy={loc.coordinates.y}
                r={size}
                fill={nodeColor}
                stroke={isInPath || isHovered ? "#ffffff" : "transparent"}
                strokeWidth={isInPath ? 3 : 2}
                className="transition-all duration-200"
              />
              
              {/* Type indicator */}
              {loc.type !== "junction" && (
                <text
                  x={loc.coordinates.x}
                  y={loc.coordinates.y + 4}
                  fontSize="11"
                  fill="white"
                  textAnchor="middle"
                  fontWeight="bold"
                  fontFamily="system-ui"
                >
                  {getTypeIcon(loc.type)}
                </text>
              )}
              
              {/* Label */}
              <text
                x={loc.coordinates.x}
                y={loc.coordinates.y + size + 14}
                fontSize={isInPath || isHovered ? "11" : "10"}
                fill="currentColor"
                textAnchor="middle"
                fontWeight={isInPath ? "600" : "400"}
                className="transition-all duration-200"
              >
                {loc.name}
              </text>

              {/* Hover tooltip */}
              {isHovered && (
                <g>
                  <rect
                    x={loc.coordinates.x - 50}
                    y={loc.coordinates.y - size - 35}
                    width="100"
                    height="24"
                    rx="4"
                    fill="rgba(0,0,0,0.85)"
                  />
                  <text
                    x={loc.coordinates.x}
                    y={loc.coordinates.y - size - 18}
                    fontSize="10"
                    fill="#ffffff"
                    textAnchor="middle"
                  >
                    {loc.type.charAt(0).toUpperCase() + loc.type.slice(1)}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Path step indicators */}
        {highlightedPath.length > 1 && highlightedPath.map((nodeId, idx) => {
          const loc = defaultCityGraph.locations.get(nodeId);
          if (!loc?.coordinates || idx === 0 || idx === highlightedPath.length - 1) return null;
          
          return (
            <g key={`step-${nodeId}`}>
              <circle
                cx={loc.coordinates.x}
                cy={loc.coordinates.y - 24}
                r="8"
                fill="#1e293b"
                stroke="#3b82f6"
                strokeWidth="2"
              />
              <text
                x={loc.coordinates.x}
                y={loc.coordinates.y - 21}
                fontSize="8"
                fill="#3b82f6"
                textAnchor="middle"
                fontWeight="bold"
              >
                {idx}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-card/95 backdrop-blur-sm border border-border/50 p-3 rounded-lg text-xs space-y-2 shadow-lg">
        <div className="font-semibold text-foreground mb-2">Traffic Density</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <LegendItem color="#22c55e" label="Low" />
          <LegendItem color="#eab308" label="Medium" />
          <LegendItem color="#f97316" label="High" />
          <LegendItem color="#ef4444" label="Congested" />
        </div>
        <div className="border-t border-border/50 pt-2 mt-2 space-y-1.5">
          <LegendItem color="#f97316" label="Hospital" icon="H" />
          <LegendItem color="#8b5cf6" label="Station" icon="S" />
        </div>
      </div>

      {/* Route Info Panel */}
      {highlightedPath.length > 0 && (
        <div className="absolute top-3 right-3 bg-card/95 backdrop-blur-sm border border-border/50 p-3 rounded-lg text-xs shadow-lg">
          <div className="font-semibold text-primary mb-2">Active Route</div>
          <div className="space-y-1 text-muted-foreground">
            <div>Stops: {highlightedPath.length}</div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
              <span>{currentLocation?.replace(/_/g, " ")}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
              <span>{destination?.replace(/_/g, " ")}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label, icon }: { color: string; label: string; icon?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div 
        className="w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-bold text-white" 
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
