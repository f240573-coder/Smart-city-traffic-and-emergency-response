"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FinalResponse, PriorityLevel, SignalState } from "@/lib/traffic-system/types";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Route,
  Shield,
  Brain,
  Settings,
  Clock,
  ArrowRight,
  Zap,
  Target,
  Activity,
} from "lucide-react";

interface ResponseDisplayProps {
  response: FinalResponse | null;
}

export function ResponseDisplay({ response }: ResponseDisplayProps) {
  if (!response) {
    return (
      <Card className="border-border/50 h-full">
        <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Activity className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground font-medium">
            No Response Yet
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Submit a request to see system response
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    switch (response.status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-primary" />;
      case "partial":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-destructive" />;
    }
  };

  const getStatusStyles = () => {
    switch (response.status) {
      case "success":
        return "bg-primary/10 text-primary border-primary/20";
      case "partial":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "failed":
        return "bg-destructive/10 text-destructive border-destructive/20";
    }
  };

  const getPriorityStyles = (priority: PriorityLevel) => {
    switch (priority) {
      case PriorityLevel.LOW:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
      case PriorityLevel.NORMAL:
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case PriorityLevel.HIGH:
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case PriorityLevel.CRITICAL:
        return "bg-red-500/10 text-red-400 border-red-500/20";
    }
  };

  const getSignalStyles = (state: SignalState) => {
    switch (state) {
      case SignalState.GREEN:
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case SignalState.RED:
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case SignalState.EMERGENCY_OVERRIDE:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    }
  };

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="pb-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-base">System Response</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                ID: {response.requestId}
              </CardDescription>
            </div>
          </div>
          <Badge className={getStatusStyles()}>
            {response.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 space-y-4">
        {/* Decision Message */}
        <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Decision</h4>
              <p className="text-sm text-foreground">{response.decisionMessage}</p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {response.explanatoryText}
              </p>
            </div>
          </div>
        </div>

        {/* Module Results Accordion */}
        <Accordion type="multiple" className="w-full space-y-2">
          {/* Route Information */}
          {response.route && response.route.path.length > 0 && (
            <AccordionItem value="route" className="border border-border/50 rounded-lg px-4 bg-muted/10">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Route className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium text-sm">Route Information</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {response.route.path.length} stops
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <div className="space-y-4">
                  {/* Route Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MetricCard label="Algorithm" value={response.route.algorithm} />
                    <MetricCard label="Nodes Explored" value={response.route.nodesExplored} />
                    <MetricCard label="Distance" value={`${response.route.totalDistance} units`} />
                    <MetricCard label="Est. Time" value={`${response.route.estimatedTime} min`} />
                  </div>
                  
                  <Separator />
                  
                  {/* Path Visualization */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Route Path</p>
                    <div className="flex flex-wrap items-center gap-1">
                      {response.route.path.map((node, idx) => (
                        <span key={idx} className="flex items-center">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              idx === 0 ? "bg-primary/20 border-primary/30 text-primary" :
                              idx === response.route!.path.length - 1 ? "bg-destructive/20 border-destructive/30 text-destructive" :
                              "bg-muted"
                            }`}
                          >
                            {node.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                          </Badge>
                          {idx < response.route!.path.length - 1 && (
                            <ArrowRight className="mx-1 h-3 w-3 text-muted-foreground" />
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Priority Information */}
          {response.priority && (
            <AccordionItem value="priority" className="border border-border/50 rounded-lg px-4 bg-muted/10">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Brain className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium text-sm">ANN Priority Prediction</span>
                    <Badge className={`ml-2 text-xs ${getPriorityStyles(response.priority.predictedPriority)}`}>
                      {response.priority.predictedPriority.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MetricCard 
                    label="Priority Level" 
                    value={response.priority.predictedPriority.toUpperCase()} 
                  />
                  <MetricCard 
                    label="Classification" 
                    value={response.priority.binaryClassification.toUpperCase()} 
                  />
                  <MetricCard 
                    label="Confidence" 
                    value={`${Math.round(response.priority.confidence * 100)}%`} 
                  />
                  <MetricCard 
                    label="Urgency Score" 
                    value={`${Math.round(response.priority.urgencyScore * 100)}%`} 
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Policy Validation */}
          {response.policyValidation && (
            <AccordionItem value="policy" className="border border-border/50 rounded-lg px-4 bg-muted/10">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-green-400" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium text-sm">Policy Validation</span>
                    <Badge 
                      className={`ml-2 text-xs ${
                        response.policyValidation.isAuthorized 
                          ? "bg-primary/20 text-primary border-primary/30" 
                          : "bg-destructive/20 text-destructive border-destructive/30"
                      }`}
                    >
                      {response.policyValidation.policyStatus.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-4">
                {/* Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {response.policyValidation.allowedActions.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Allowed Actions</p>
                      <div className="flex flex-wrap gap-1">
                        {response.policyValidation.allowedActions.map((action, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs bg-primary/10 border-primary/20 text-primary">
                            {action.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {response.policyValidation.deniedActions.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Denied Actions</p>
                      <div className="flex flex-wrap gap-1">
                        {response.policyValidation.deniedActions.map((action, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs bg-destructive/10 border-destructive/20 text-destructive">
                            {action.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Reasoning Chain */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Reasoning Chain</p>
                  <ul className="space-y-1">
                    {response.policyValidation.reasoningChain.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs">
                        <span className="text-primary font-mono">{idx + 1}.</span>
                        <span className="text-muted-foreground">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Validation Rules */}
                {response.policyValidation.validationRules.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Applied Rules</p>
                    <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs space-y-1">
                      {response.policyValidation.validationRules.map((rule, idx) => (
                        <div key={idx} className="text-muted-foreground">{rule}</div>
                      ))}
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Control Plan */}
          {response.controlPlan && (
            <AccordionItem value="control" className="border border-border/50 rounded-lg px-4 bg-muted/10">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Settings className="h-4 w-4 text-orange-400" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium text-sm">CSP Control Allocation</span>
                    <Badge 
                      className={`ml-2 text-xs ${
                        response.controlPlan.isFeasible 
                          ? "bg-primary/20 text-primary border-primary/30" 
                          : "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                      }`}
                    >
                      {response.controlPlan.isFeasible ? "FEASIBLE" : "INFEASIBLE"}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-4">
                {/* Corridor Signals */}
                {response.controlPlan.corridorAllocation.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Corridor Signals</p>
                    <div className="flex flex-wrap gap-1">
                      {response.controlPlan.corridorAllocation.map((signal, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {signal}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Signal Assignments */}
                {response.controlPlan.signalAssignments.size > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Signal Assignments</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Array.from(response.controlPlan.signalAssignments.entries()).map(
                        ([signalId, state]) => (
                          <div
                            key={signalId}
                            className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-xs"
                          >
                            <span className="font-mono">{signalId}</span>
                            <Badge variant="outline" className={getSignalStyles(state)}>
                              {state}
                            </Badge>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Conflicts Resolved */}
                {response.controlPlan.conflictsResolved.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Conflicts Resolved</p>
                    <ul className="space-y-1">
                      {response.controlPlan.conflictsResolved.map((conflict, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs">
                          <CheckCircle2 className="h-3 w-3 text-primary" />
                          <span className="text-muted-foreground">{conflict}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {/* Footer Metadata */}
        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground border-t border-border/50">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Processing: {response.processingTime}ms</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            <span>{response.modulesUsed.join(" → ")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Metric Card Component
function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-3 bg-muted/30 rounded-lg">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold text-sm mt-0.5">{value}</p>
    </div>
  );
}
