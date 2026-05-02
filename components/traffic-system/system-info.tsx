"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SYSTEM_INFO } from "@/lib/traffic-system";
import { 
  FileInput, 
  Brain, 
  Scale, 
  Settings, 
  Route, 
  MessageSquare,
  Server,
  Cpu,
  Activity,
  ArrowRight
} from "lucide-react";

const moduleIcons: Record<string, React.ReactNode> = {
  "Input & Preprocessing": <FileInput className="h-4 w-4" />,
  "ANN Priority Prediction": <Brain className="h-4 w-4" />,
  "Logic / Knowledge Base": <Scale className="h-4 w-4" />,
  "CSP Scheduler": <Settings className="h-4 w-4" />,
  "Search & Navigation": <Route className="h-4 w-4" />,
  "Final Response": <MessageSquare className="h-4 w-4" />,
};

const moduleColors: Record<string, string> = {
  "Input & Preprocessing": "text-slate-400 bg-slate-500/20",
  "ANN Priority Prediction": "text-blue-400 bg-blue-500/20",
  "Logic / Knowledge Base": "text-purple-400 bg-purple-500/20",
  "CSP Scheduler": "text-orange-400 bg-orange-500/20",
  "Search & Navigation": "text-green-400 bg-green-500/20",
  "Final Response": "text-emerald-400 bg-emerald-500/20",
};

export function SystemInfo() {
  return (
    <Card className="border-border/50">
      <CardHeader className="border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Server className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{SYSTEM_INFO.name}</CardTitle>
              <p className="text-xs text-muted-foreground">AL-2002 AI Lab Project</p>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            v{SYSTEM_INFO.version}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Modules Overview */}
        <div>
          <h4 className="font-medium text-sm mb-4 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            System Modules
          </h4>
          <div className="space-y-4">
            {SYSTEM_INFO.modules.map((module) => {
              const colors = moduleColors[module.name] || "text-muted-foreground bg-muted";
              return (
                <div key={module.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg ${colors.split(" ")[1]} flex items-center justify-center`}>
                        <span className={colors.split(" ")[0]}>{moduleIcons[module.name]}</span>
                      </div>
                      <span className="text-sm font-medium">{module.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs font-mono">
                      {module.weight}%
                    </Badge>
                  </div>
                  <Progress value={module.weight} className="h-1.5" />
                  <p className="text-xs text-muted-foreground pl-9">{module.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Request Categories */}
        <div>
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Request Categories
          </h4>
          <div className="flex flex-wrap gap-2">
            {SYSTEM_INFO.requestCategories.map((category) => (
              <Badge 
                key={category} 
                variant="secondary"
                className="text-xs bg-muted/50"
              >
                {category.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        </div>

        {/* Architecture Flow */}
        <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
          <h4 className="font-medium text-sm mb-4 text-center">System Architecture</h4>
          <div className="flex items-center justify-center gap-1 text-[10px] flex-wrap">
            {[
              { label: "Traffic Request", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
              { label: "Preprocessing", color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
              { label: "Request Router", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
              { label: "AI Modules", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
              { label: "Final Response", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
            ].map((step, idx, arr) => (
              <div key={step.label} className="flex items-center">
                <div className={`px-2 py-1.5 rounded-lg border ${step.color}`}>
                  {step.label}
                </div>
                {idx < arr.length - 1 && (
                  <ArrowRight className="h-3 w-3 mx-1 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
