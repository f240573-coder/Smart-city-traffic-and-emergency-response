"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getNetworkArchitecture, getFeatureExplanation } from "@/lib/traffic-system/modules/ann-priority";
import { Brain, Layers, Zap, Info } from "lucide-react";

export function ANNVisualizer() {
  const architecture = getNetworkArchitecture();
  const features = getFeatureExplanation();
  const [hoveredLayer, setHoveredLayer] = useState<number | null>(null);

  const layerColors = [
    "#3b82f6", // Input - blue
    "#8b5cf6", // Hidden1 - purple
    "#ec4899", // Hidden2 - pink
    "#22c55e", // Output - green
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Network Visualization */}
      <Card className="lg:col-span-2 border-border/50">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Brain className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-base">Neural Network Architecture</CardTitle>
              <CardDescription>
                Multi-Layer Perceptron for Priority Prediction
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Network Visualization */}
          <div className="relative h-72 bg-muted/20 rounded-lg border border-border/50 overflow-hidden">
            {/* Grid Background */}
            <svg className="absolute inset-0 w-full h-full opacity-10">
              <defs>
                <pattern id="nn-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#nn-grid)" />
            </svg>

            <svg viewBox="0 0 500 220" className="relative w-full h-full">
              <defs>
                {layerColors.map((color, idx) => (
                  <linearGradient key={`gradient-${idx}`} id={`node-gradient-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.8" />
                    <stop offset="100%" stopColor={color} stopOpacity="1" />
                  </linearGradient>
                ))}
                <filter id="nn-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Connections */}
              {architecture.layers.map((layer, layerIdx) => {
                if (layerIdx === architecture.layers.length - 1) return null;
                const nextLayer = architecture.layers[layerIdx + 1];
                const x1 = 60 + layerIdx * 130;
                const x2 = 60 + (layerIdx + 1) * 130;
                const isHovered = hoveredLayer === layerIdx || hoveredLayer === layerIdx + 1;

                return (
                  <g key={`connections-${layerIdx}`} opacity={isHovered ? 0.5 : 0.15}>
                    {Array.from({ length: Math.min(layer.size, 6) }).map((_, i) => {
                      const y1 = 110 + (i - Math.min(layer.size, 6) / 2) * 28;
                      return Array.from({ length: Math.min(nextLayer.size, 6) }).map(
                        (_, j) => {
                          const y2 = 110 + (j - Math.min(nextLayer.size, 6) / 2) * 28;
                          return (
                            <line
                              key={`${i}-${j}`}
                              x1={x1}
                              y1={y1}
                              x2={x2}
                              y2={y2}
                              stroke={layerColors[layerIdx]}
                              strokeWidth={isHovered ? 1 : 0.5}
                              className="transition-all duration-300"
                            />
                          );
                        }
                      );
                    })}
                  </g>
                );
              })}

              {/* Nodes */}
              {architecture.layers.map((layer, layerIdx) => {
                const x = 60 + layerIdx * 130;
                const nodesToShow = Math.min(layer.size, 6);
                const showEllipsis = layer.size > 6;
                const isHovered = hoveredLayer === layerIdx;

                return (
                  <g 
                    key={`layer-${layerIdx}`}
                    onMouseEnter={() => setHoveredLayer(layerIdx)}
                    onMouseLeave={() => setHoveredLayer(null)}
                    className="cursor-pointer"
                  >
                    {/* Layer background highlight */}
                    {isHovered && (
                      <rect
                        x={x - 25}
                        y={25}
                        width="50"
                        height="170"
                        rx="8"
                        fill={layerColors[layerIdx]}
                        opacity={0.1}
                      />
                    )}

                    {Array.from({ length: nodesToShow }).map((_, i) => {
                      const y = 110 + (i - nodesToShow / 2) * 28;
                      return (
                        <g key={i}>
                          {/* Outer glow */}
                          {isHovered && (
                            <circle
                              cx={x}
                              cy={y}
                              r={14}
                              fill={layerColors[layerIdx]}
                              opacity={0.3}
                              filter="url(#nn-glow)"
                            />
                          )}
                          {/* Main node */}
                          <circle
                            cx={x}
                            cy={y}
                            r={isHovered ? 11 : 9}
                            fill={`url(#node-gradient-${layerIdx})`}
                            stroke={isHovered ? "#ffffff" : "transparent"}
                            strokeWidth={2}
                            className="transition-all duration-200"
                          />
                        </g>
                      );
                    })}

                    {showEllipsis && (
                      <text
                        x={x}
                        y={110 + (nodesToShow / 2 + 0.5) * 28}
                        textAnchor="middle"
                        fill="currentColor"
                        fontSize="14"
                        fontWeight="bold"
                      >
                        ...
                      </text>
                    )}

                    {/* Layer label */}
                    <text
                      x={x}
                      y={195}
                      textAnchor="middle"
                      fill="currentColor"
                      fontSize="11"
                      fontWeight="600"
                    >
                      {layer.name}
                    </text>
                    <text
                      x={x}
                      y={208}
                      textAnchor="middle"
                      fill="currentColor"
                      fontSize="9"
                      opacity={0.5}
                    >
                      {layer.size} nodes
                    </text>

                    {/* Activation label */}
                    {layer.activation !== "none" && (
                      <g>
                        <rect
                          x={x - 18}
                          y={14}
                          width="36"
                          height="16"
                          rx="4"
                          fill={layerColors[layerIdx]}
                          opacity={0.2}
                        />
                        <text
                          x={x}
                          y={25}
                          textAnchor="middle"
                          fill={layerColors[layerIdx]}
                          fontSize="9"
                          fontWeight="600"
                        >
                          {layer.activation}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Data flow arrows */}
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                </marker>
              </defs>
              {[0, 1, 2].map((idx) => (
                <line
                  key={`arrow-${idx}`}
                  x1={85 + idx * 130}
                  y1={110}
                  x2={120 + idx * 130}
                  y2={110}
                  stroke="#64748b"
                  strokeWidth="1.5"
                  markerEnd="url(#arrowhead)"
                  strokeDasharray="4 2"
                  opacity={0.4}
                />
              ))}
            </svg>
          </div>

          {/* Layer Info */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {architecture.layers.map((layer, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  hoveredLayer === idx 
                    ? "bg-muted/50 border-border" 
                    : "bg-muted/20 border-border/50"
                }`}
                onMouseEnter={() => setHoveredLayer(idx)}
                onMouseLeave={() => setHoveredLayer(null)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: layerColors[idx] }}
                  />
                  <span className="text-xs font-medium">{layer.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{layer.size} neurons</p>
                {layer.activation !== "none" && (
                  <Badge variant="outline" className="text-[10px] mt-1" style={{ borderColor: layerColors[idx], color: layerColors[idx] }}>
                    {layer.activation}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Side Panel - Features & Outputs */}
      <div className="space-y-6">
        {/* Input Features */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-400" />
              Input Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="p-2 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{feature.feature}</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {feature.range}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {feature.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Output Classes */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-400" />
              Output Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {[
                { level: "LOW", color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
                { level: "NORMAL", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
                { level: "HIGH", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
                { level: "CRITICAL", color: "bg-red-500/20 text-red-400 border-red-500/30" },
              ].map(({ level, color }) => (
                <div
                  key={level}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold text-center border ${color}`}
                >
                  {level}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                The neural network uses backpropagation with sigmoid activation 
                for hidden layers and softmax for classification output.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
