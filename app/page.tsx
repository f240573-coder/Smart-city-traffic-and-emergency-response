"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { CityMap } from "@/components/traffic-system/city-map";
import { RequestForm } from "@/components/traffic-system/request-form";
import { ResponseDisplay } from "@/components/traffic-system/response-display";
import { ANNVisualizer } from "@/components/traffic-system/ann-visualizer";
import { KnowledgeBaseDisplay } from "@/components/traffic-system/knowledge-base-display";
import { SearchComparison } from "@/components/traffic-system/search-comparison";
import { PipelineDisplay } from "@/components/traffic-system/pipeline-display";
import { SystemInfo } from "@/components/traffic-system/system-info";

import { processTrafficRequest, TrafficRequest, FinalResponse } from "@/lib/traffic-system";

import { 
  Map, 
  FileText, 
  Brain, 
  Scale, 
  Route, 
  Settings2,
  Info,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Radio
} from "lucide-react";

export default function TrafficSystemDashboard() {
  const [response, setResponse] = useState<FinalResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [systemTime, setSystemTime] = useState(new Date());
  const [requestHistory, setRequestHistory] = useState<{
    request: Partial<TrafficRequest>;
    response: FinalResponse;
    timestamp: Date;
  }[]>([]);

  // Update system time every second
  useEffect(() => {
    const timer = setInterval(() => setSystemTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmitRequest = (request: Partial<TrafficRequest>) => {
    setIsLoading(true);
    setTimeout(() => {
      const result = processTrafficRequest(request);
      setResponse(result);
      setRequestHistory((prev) => [
        { request, response: result, timestamp: new Date() },
        ...prev.slice(0, 9),
      ]);
      setIsLoading(false);
    }, 800);
  };

  const stats = {
    totalRequests: requestHistory.length,
    successRate: requestHistory.length > 0 
      ? Math.round((requestHistory.filter(r => r.response.status === "success").length / requestHistory.length) * 100) 
      : 0,
    avgProcessingTime: requestHistory.length > 0 
      ? Math.round(requestHistory.reduce((acc, r) => acc + r.response.processingTime, 0) / requestHistory.length) 
      : 0,
    emergencyCount: requestHistory.filter(r => 
      r.request.requestCategory === "emergency_response_request" || 
      r.request.requestCategory === "integrated_city_service_request"
    ).length
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Radio className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-balance">
                    Smart City Traffic Control
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Emergency Response AI System
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* System Status Indicators */}
              <div className="hidden md:flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  <span className="text-muted-foreground">System Online</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="font-mono">{systemTime.toLocaleTimeString()}</span>
                </div>
              </div>
              
              <Badge variant="outline" className="text-xs font-mono">
                AL-2002 Lab Project
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Navigation Tabs */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Map className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="request" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Request</span>
              </TabsTrigger>
              <TabsTrigger value="ann" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">ANN</span>
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Scale className="h-4 w-4" />
                <span className="hidden sm:inline">Logic/KB</span>
              </TabsTrigger>
              <TabsTrigger value="search" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Route className="h-4 w-4" />
                <span className="hidden sm:inline">Search</span>
              </TabsTrigger>
              <TabsTrigger value="pipelines" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Settings2 className="h-4 w-4" />
                <span className="hidden sm:inline">Pipelines</span>
              </TabsTrigger>
              <TabsTrigger value="about" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Info className="h-4 w-4" />
                <span className="hidden sm:inline">About</span>
              </TabsTrigger>
            </TabsList>

            {/* Quick Stats */}
            <div className="hidden lg:flex items-center gap-3">
              <QuickStat icon={<Activity className="h-4 w-4" />} label="Requests" value={stats.totalRequests} />
              <QuickStat icon={<CheckCircle className="h-4 w-4" />} label="Success" value={`${stats.successRate}%`} color="text-primary" />
              <QuickStat icon={<Zap className="h-4 w-4" />} label="Avg Time" value={`${stats.avgProcessingTime}ms`} />
              <QuickStat icon={<AlertTriangle className="h-4 w-4" />} label="Emergency" value={stats.emergencyCount} color="text-destructive" />
            </div>
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Total Requests"
                value={stats.totalRequests}
                icon={<Activity className="h-5 w-5" />}
                description="Processed this session"
              />
              <StatCard
                title="Success Rate"
                value={`${stats.successRate}%`}
                icon={<CheckCircle className="h-5 w-5" />}
                description="Successfully completed"
                accent="primary"
              />
              <StatCard
                title="Avg Processing"
                value={`${stats.avgProcessingTime}ms`}
                icon={<Zap className="h-5 w-5" />}
                description="Response time"
              />
              <StatCard
                title="Emergency Calls"
                value={stats.emergencyCount}
                icon={<AlertTriangle className="h-5 w-5" />}
                description="Priority requests"
                accent="destructive"
              />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Request Form Column */}
              <div className="lg:col-span-4">
                <RequestForm onSubmit={handleSubmitRequest} isLoading={isLoading} />
              </div>

              {/* Map and Response Column */}
              <div className="lg:col-span-8 space-y-6">
                {/* City Map */}
                <Card className="border-border/50 overflow-hidden">
                  <CardHeader className="pb-2 border-b border-border/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Map className="h-4 w-4 text-primary" />
                          City Network Map
                        </CardTitle>
                        <CardDescription>
                          Real-time traffic network visualization
                        </CardDescription>
                      </div>
                      {response?.route?.path && response.route.path.length > 0 && (
                        <Badge className="bg-primary/20 text-primary border-primary/30">
                          Route Active
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 h-[400px]">
                    <CityMap
                      highlightedPath={response?.route?.path || []}
                      currentLocation={
                        requestHistory.length > 0
                          ? requestHistory[0].request.currentLocation
                          : undefined
                      }
                      destination={
                        requestHistory.length > 0
                          ? requestHistory[0].request.destination
                          : undefined
                      }
                    />
                  </CardContent>
                </Card>

                {/* Response Display */}
                <ResponseDisplay response={response} />
              </div>
            </div>

            {/* Request History */}
            {requestHistory.length > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {requestHistory.slice(0, 5).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full ${
                            item.response.status === "success" ? "bg-primary" :
                            item.response.status === "partial" ? "bg-yellow-500" : "bg-destructive"
                          }`} />
                          <span className="font-medium">
                            {item.request.currentLocation?.replace(/_/g, " ")}
                          </span>
                          <span className="text-muted-foreground">to</span>
                          <span className="font-medium">
                            {item.request.destination?.replace(/_/g, " ")}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {item.request.requestCategory?.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground text-xs">
                          <span>{item.response.processingTime}ms</span>
                          <span>{item.timestamp.toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Request Tab */}
          <TabsContent value="request">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RequestForm onSubmit={handleSubmitRequest} isLoading={isLoading} />
              <ResponseDisplay response={response} />
            </div>
          </TabsContent>

          {/* ANN Tab */}
          <TabsContent value="ann">
            <ANNVisualizer />
          </TabsContent>

          {/* Knowledge Base Tab */}
          <TabsContent value="knowledge">
            <KnowledgeBaseDisplay />
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search">
            <SearchComparison />
          </TabsContent>

          {/* Pipelines Tab */}
          <TabsContent value="pipelines">
            <PipelineDisplay />
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SystemInfo />
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    Project Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The Smart City Traffic and Emergency Response AI System models traffic 
                    management as an integrated AI problem, combining multiple techniques 
                    that activate based on request type.
                  </p>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Core Capabilities</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        "Traffic Routing",
                        "Emergency Priority",
                        "Signal Coordination",
                        "Density Analysis",
                        "Policy Validation",
                        "Constraint Solving"
                      ].map((cap) => (
                        <div key={cap} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3 w-3 text-primary" />
                          <span className="text-muted-foreground">{cap}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">AI Modules</h4>
                    <div className="space-y-2 text-sm">
                      <ModuleInfo name="ANN Priority" desc="Neural network urgency prediction" />
                      <ModuleInfo name="Knowledge Base" desc="Rule-based reasoning with predicates" />
                      <ModuleInfo name="CSP Scheduler" desc="Constraint satisfaction for signals" />
                      <ModuleInfo name="Search Engine" desc="BFS, UCS, A* pathfinding" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-8">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>AL-2002 Artificial Intelligence Lab - Final Project</span>
          <span className="font-mono">v1.0.0</span>
        </div>
      </footer>
    </div>
  );
}

// Quick Stat Component
function QuickStat({ icon, label, value, color = "text-foreground" }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-md">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-xs text-muted-foreground">{label}:</span>
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  icon, 
  description, 
  accent 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  description: string;
  accent?: "primary" | "destructive";
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${
              accent === "primary" ? "text-primary" : 
              accent === "destructive" ? "text-destructive" : ""
            }`}>
              {value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className={`p-2 rounded-lg ${
            accent === "primary" ? "bg-primary/20 text-primary" : 
            accent === "destructive" ? "bg-destructive/20 text-destructive" : 
            "bg-muted text-muted-foreground"
          }`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Module Info Component
function ModuleInfo({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="flex items-start gap-2">
      <Badge variant="outline" className="text-xs shrink-0">{name}</Badge>
      <span className="text-muted-foreground">{desc}</span>
    </div>
  );
}
