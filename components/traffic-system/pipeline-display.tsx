"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAllPipelines } from "@/lib/traffic-system/modules/request-router";
import { 
  ArrowRight, 
  Route, 
  Shield, 
  Settings, 
  AlertTriangle, 
  Building,
  FileInput,
  Brain,
  Scale,
  Cog,
  Navigation,
  MessageSquare,
  ChevronRight
} from "lucide-react";

const categoryIcons: Record<string, React.ReactNode> = {
  "Route_Request": <Route className="h-4 w-4" />,
  "Policy_Check": <Shield className="h-4 w-4" />,
  "Control_Allocation_Request": <Settings className="h-4 w-4" />,
  "Emergency_Response_Request": <AlertTriangle className="h-4 w-4" />,
  "Integrated_City_Service_Request": <Building className="h-4 w-4" />,
};

const stepIcons: Record<string, React.ReactNode> = {
  "Preprocessing": <FileInput className="h-3 w-3" />,
  "AnnPriorityModule": <Brain className="h-3 w-3" />,
  "KnowledgeBase": <Scale className="h-3 w-3" />,
  "CspScheduler": <Cog className="h-3 w-3" />,
  "SearchNavigation": <Navigation className="h-3 w-3" />,
  "FinalResponse": <MessageSquare className="h-3 w-3" />,
};

export function PipelineDisplay() {
  const pipelines = getAllPipelines();
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);

  const getCategoryStyles = (category: string): { bg: string; text: string; border: string; icon: string } => {
    const styles: Record<string, { bg: string; text: string; border: string; icon: string }> = {
      "Route_Request": { 
        bg: "bg-blue-500/10", 
        text: "text-blue-400", 
        border: "border-blue-500/30",
        icon: "bg-blue-500/20"
      },
      "Policy_Check": { 
        bg: "bg-purple-500/10", 
        text: "text-purple-400", 
        border: "border-purple-500/30",
        icon: "bg-purple-500/20"
      },
      "Control_Allocation_Request": { 
        bg: "bg-orange-500/10", 
        text: "text-orange-400", 
        border: "border-orange-500/30",
        icon: "bg-orange-500/20"
      },
      "Emergency_Response_Request": { 
        bg: "bg-red-500/10", 
        text: "text-red-400", 
        border: "border-red-500/30",
        icon: "bg-red-500/20"
      },
      "Integrated_City_Service_Request": { 
        bg: "bg-emerald-500/10", 
        text: "text-emerald-400", 
        border: "border-emerald-500/30",
        icon: "bg-emerald-500/20"
      },
    };
    return styles[category] || { bg: "bg-muted", text: "text-foreground", border: "border-border", icon: "bg-muted" };
  };

  const getStepStyles = (step: string): { bg: string; text: string } => {
    if (step.includes("Preprocessing")) return { bg: "bg-slate-500/20", text: "text-slate-300" };
    if (step.includes("Ann") || step.includes("Priority")) return { bg: "bg-blue-500/20", text: "text-blue-400" };
    if (step.includes("Knowledge") || step.includes("Logic")) return { bg: "bg-purple-500/20", text: "text-purple-400" };
    if (step.includes("Csp") || step.includes("Scheduler")) return { bg: "bg-orange-500/20", text: "text-orange-400" };
    if (step.includes("Search") || step.includes("Navigation")) return { bg: "bg-green-500/20", text: "text-green-400" };
    if (step.includes("Final") || step.includes("Response")) return { bg: "bg-emerald-500/20", text: "text-emerald-400" };
    return { bg: "bg-muted", text: "text-muted-foreground" };
  };

  const getStepIcon = (step: string) => {
    if (step.includes("Preprocessing")) return stepIcons["Preprocessing"];
    if (step.includes("Ann") || step.includes("Priority")) return stepIcons["AnnPriorityModule"];
    if (step.includes("Knowledge") || step.includes("Logic")) return stepIcons["KnowledgeBase"];
    if (step.includes("Csp") || step.includes("Scheduler")) return stepIcons["CspScheduler"];
    if (step.includes("Search") || step.includes("Navigation")) return stepIcons["SearchNavigation"];
    if (step.includes("Final") || step.includes("Response")) return stepIcons["FinalResponse"];
    return null;
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <Settings className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-base">Processing Pipelines</CardTitle>
              <CardDescription>
                Request routing and module activation patterns
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {pipelines.map((pipeline) => {
            const styles = getCategoryStyles(pipeline.category);
            const isSelected = selectedPipeline === pipeline.category;
            
            return (
              <div 
                key={pipeline.category} 
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  isSelected 
                    ? `${styles.bg} ${styles.border}` 
                    : "border-border/50 hover:border-border bg-muted/10 hover:bg-muted/20"
                }`}
                onClick={() => setSelectedPipeline(isSelected ? null : pipeline.category)}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${styles.icon} flex items-center justify-center`}>
                      <span className={styles.text}>{categoryIcons[pipeline.category]}</span>
                    </div>
                    <div>
                      <Badge className={`${styles.bg} ${styles.text} ${styles.border}`}>
                        {pipeline.category.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isSelected ? "rotate-90" : ""}`} />
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-4">{pipeline.description}</p>
                
                {/* Pipeline Flow */}
                <div className="flex flex-wrap items-center gap-2">
                  {pipeline.steps.map((step, idx) => {
                    const stepStyles = getStepStyles(step);
                    return (
                      <div key={idx} className="flex items-center">
                        <div
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${stepStyles.bg} ${stepStyles.text}`}
                        >
                          {getStepIcon(step)}
                          <span>{step}</span>
                        </div>
                        {idx < pipeline.steps.length - 1 && (
                          <ArrowRight className="h-3 w-3 mx-1.5 text-muted-foreground" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Expanded Details */}
                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-2 bg-muted/30 rounded-lg">
                        <p className="text-muted-foreground">Total Steps</p>
                        <p className="font-semibold">{pipeline.steps.length}</p>
                      </div>
                      <div className="p-2 bg-muted/30 rounded-lg">
                        <p className="text-muted-foreground">AI Modules</p>
                        <p className="font-semibold">
                          {pipeline.steps.filter(s => 
                            s.includes("Ann") || s.includes("Knowledge") || s.includes("Csp") || s.includes("Search")
                          ).length}
                        </p>
                      </div>
                      <div className="p-2 bg-muted/30 rounded-lg">
                        <p className="text-muted-foreground">Priority</p>
                        <p className="font-semibold">
                          {pipeline.category.includes("Emergency") ? "Critical" : 
                           pipeline.category.includes("Control") ? "High" : "Normal"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Module Legend */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Module Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(stepIcons).map(([name, icon]) => {
              const styles = getStepStyles(name);
              return (
                <div key={name} className="flex items-center gap-2 p-2 bg-muted/20 rounded-lg">
                  <div className={`w-6 h-6 rounded ${styles.bg} flex items-center justify-center`}>
                    <span className={styles.text}>{icon}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{name.replace(/([A-Z])/g, " $1").trim()}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
