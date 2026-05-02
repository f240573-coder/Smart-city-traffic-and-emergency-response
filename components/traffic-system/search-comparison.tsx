"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { compareAlgorithms, getAllLocations } from "@/lib/traffic-system/modules/search-navigation";
import { RouteResult } from "@/lib/traffic-system/types";
import { 
  Route, 
  Play, 
  Trophy, 
  MapPin, 
  Target, 
  Zap, 
  Clock, 
  GitBranch,
  ArrowRight,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

export function SearchComparison() {
  const locations = getAllLocations();
  const [start, setStart] = useState("");
  const [goal, setGoal] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    bfs: RouteResult;
    ucs: RouteResult;
    astar: RouteResult;
    comparison: {
      fastestAlgorithm: string;
      shortestPath: string;
      fewestNodesExplored: string;
    };
  } | null>(null);

  const handleCompare = () => {
    if (!start || !goal) return;

    setIsLoading(true);
    setTimeout(() => {
      const comparisonResult = compareAlgorithms(start, goal, isEmergency);
      setResults(comparisonResult);
      setIsLoading(false);
    }, 600);
  };

  const algorithms = [
    {
      key: "bfs",
      name: "BFS",
      fullName: "Breadth-First Search",
      color: "blue",
      description: "Finds shortest path by number of edges (unweighted)",
      icon: <GitBranch className="h-4 w-4" />,
    },
    {
      key: "ucs",
      name: "UCS",
      fullName: "Uniform Cost Search",
      color: "purple",
      description: "Finds minimum cost path considering edge weights",
      icon: <Route className="h-4 w-4" />,
    },
    {
      key: "astar",
      name: "A*",
      fullName: "A-Star Search",
      color: "green",
      description: "Uses heuristic to guide search, often most efficient",
      icon: <Zap className="h-4 w-4" />,
    },
  ];

  const getAlgorithmColorClasses = (color: string, isBest: boolean) => {
    const baseClasses = {
      blue: isBest ? "border-blue-500/50 bg-blue-500/10" : "border-border/50 bg-muted/20",
      purple: isBest ? "border-purple-500/50 bg-purple-500/10" : "border-border/50 bg-muted/20",
      green: isBest ? "border-green-500/50 bg-green-500/10" : "border-border/50 bg-muted/20",
    };
    return baseClasses[color as keyof typeof baseClasses];
  };

  const getAlgorithmIconColor = (color: string) => {
    const colors = {
      blue: "text-blue-400",
      purple: "text-purple-400",
      green: "text-green-400",
    };
    return colors[color as keyof typeof colors];
  };

  const getAlgorithmBgColor = (color: string) => {
    const colors = {
      blue: "bg-blue-500/20",
      purple: "bg-purple-500/20",
      green: "bg-green-500/20",
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <Route className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-base">Search Algorithm Comparison</CardTitle>
              <CardDescription>
                Compare BFS, UCS, and A* pathfinding algorithms
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Start Location */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <MapPin className="h-3 w-3 text-primary" />
                Start Location
              </Label>
              <Select value={start} onValueChange={setStart}>
                <SelectTrigger className="bg-muted/30">
                  <SelectValue placeholder="Select start" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Goal Location */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Target className="h-3 w-3 text-destructive" />
                Goal Location
              </Label>
              <Select value={goal} onValueChange={setGoal}>
                <SelectTrigger className="bg-muted/30">
                  <SelectValue placeholder="Select goal" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Emergency Toggle */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Mode
              </Label>
              <div className="flex items-center gap-3 h-10 px-3 bg-muted/30 rounded-md border border-border/50">
                <Switch
                  id="emergency"
                  checked={isEmergency}
                  onCheckedChange={setIsEmergency}
                />
                <Label htmlFor="emergency" className="text-sm cursor-pointer flex items-center gap-2">
                  {isEmergency && <AlertTriangle className="h-3 w-3 text-destructive" />}
                  {isEmergency ? "Emergency" : "Normal"}
                </Label>
              </div>
            </div>

            {/* Compare Button */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Action
              </Label>
              <Button 
                onClick={handleCompare} 
                disabled={!start || !goal || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Compare Algorithms
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-border/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fastest Route</p>
                    <p className="font-bold text-lg">{results.comparison.fastestAlgorithm}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Route className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Shortest Path</p>
                    <p className="font-bold text-lg">{results.comparison.shortestPath}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Most Efficient</p>
                    <p className="font-bold text-lg">{results.comparison.fewestNodesExplored}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Algorithm Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {algorithms.map((algo) => {
              const result = results[algo.key as keyof typeof results] as RouteResult;
              const isBestFastest = results.comparison.fastestAlgorithm === algo.name;
              const isBestShortest = results.comparison.shortestPath === algo.name;
              const isBestEfficient = results.comparison.fewestNodesExplored === algo.name;
              const isBest = isBestFastest || isBestShortest || isBestEfficient;

              return (
                <Card 
                  key={algo.key} 
                  className={`border-2 transition-all ${getAlgorithmColorClasses(algo.color, isBest)}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${getAlgorithmBgColor(algo.color)} flex items-center justify-center`}>
                          <span className={getAlgorithmIconColor(algo.color)}>{algo.icon}</span>
                        </div>
                        <div>
                          <CardTitle className="text-base">{algo.name}</CardTitle>
                          <CardDescription className="text-xs">{algo.fullName}</CardDescription>
                        </div>
                      </div>
                      {isBest && (
                        <Trophy className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.path.length > 0 ? (
                      <>
                        {/* Metrics */}
                        <div className="grid grid-cols-2 gap-2">
                          <MetricItem 
                            label="Distance" 
                            value={`${result.totalDistance} units`} 
                            highlight={isBestShortest}
                          />
                          <MetricItem 
                            label="Est. Time" 
                            value={`${result.estimatedTime} min`} 
                            highlight={isBestFastest}
                          />
                          <MetricItem 
                            label="Nodes" 
                            value={result.nodesExplored.toString()} 
                            highlight={isBestEfficient}
                          />
                          <MetricItem 
                            label="Path Length" 
                            value={`${result.path.length} stops`} 
                          />
                        </div>

                        <Separator />

                        {/* Path */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Route Path</p>
                          <div className="flex flex-wrap items-center gap-1">
                            {result.path.map((node, idx) => (
                              <span key={idx} className="flex items-center">
                                <Badge 
                                  variant="outline" 
                                  className={`text-[10px] ${
                                    idx === 0 ? "bg-primary/20 border-primary/30 text-primary" :
                                    idx === result.path.length - 1 ? "bg-destructive/20 border-destructive/30 text-destructive" :
                                    "bg-muted"
                                  }`}
                                >
                                  {node.replace(/_/g, " ").split(" ").map(w => w[0]).join("")}
                                </Badge>
                                {idx < result.path.length - 1 && (
                                  <ArrowRight className="mx-0.5 h-2 w-2 text-muted-foreground" />
                                )}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1">
                          {isBestFastest && (
                            <Badge className="text-[10px] bg-blue-500/20 text-blue-400 border-blue-500/30">
                              <Clock className="h-2 w-2 mr-1" /> Fastest
                            </Badge>
                          )}
                          {isBestShortest && (
                            <Badge className="text-[10px] bg-purple-500/20 text-purple-400 border-purple-500/30">
                              <Route className="h-2 w-2 mr-1" /> Shortest
                            </Badge>
                          )}
                          {isBestEfficient && (
                            <Badge className="text-[10px] bg-green-500/20 text-green-400 border-green-500/30">
                              <Zap className="h-2 w-2 mr-1" /> Efficient
                            </Badge>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
                        No path found
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Algorithm Explanation */}
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {algorithms.map((algo) => (
                  <div key={algo.key} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className={`w-8 h-8 rounded-lg ${getAlgorithmBgColor(algo.color)} flex items-center justify-center shrink-0`}>
                      <span className={getAlgorithmIconColor(algo.color)}>{algo.icon}</span>
                    </div>
                    <div>
                      <p className="font-medium">{algo.name}</p>
                      <p className="text-xs text-muted-foreground">{algo.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!results && (
        <Card className="border-border/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Route className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground font-medium">No Comparison Yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Select start and goal locations to compare algorithms
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricItem({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-2 rounded-lg ${highlight ? "bg-primary/10 border border-primary/20" : "bg-muted/30"}`}>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}
