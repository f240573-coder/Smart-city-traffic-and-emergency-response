"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllRules, getAllPredicates } from "@/lib/traffic-system/modules/knowledge-base";
import { Scale, Code, GitBranch, BookOpen, CheckCircle, XCircle } from "lucide-react";

export function KnowledgeBaseDisplay() {
  const rules = getAllRules();
  const predicates = getAllPredicates();
  const [selectedRule, setSelectedRule] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <Card className="lg:col-span-2 border-border/50">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Scale className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-base">Logic / Knowledge Base</CardTitle>
              <CardDescription>
                Rule-based reasoning system for policy validation
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="rules" className="space-y-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="rules" className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Inference Rules
              </TabsTrigger>
              <TabsTrigger value="predicates" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Predicates
              </TabsTrigger>
            </TabsList>

            {/* Rules Tab */}
            <TabsContent value="rules">
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {rules.map((rule) => {
                    const isSelected = selectedRule === rule.id;
                    return (
                      <div 
                        key={rule.id} 
                        className={`p-4 rounded-lg border transition-all cursor-pointer ${
                          isSelected 
                            ? "bg-purple-500/10 border-purple-500/30" 
                            : "bg-muted/20 border-border/50 hover:bg-muted/30 hover:border-border"
                        }`}
                        onClick={() => setSelectedRule(isSelected ? null : rule.id)}
                      >
                        {/* Rule Header */}
                        <div className="flex items-center gap-3 mb-3">
                          <Badge 
                            variant="outline" 
                            className={isSelected 
                              ? "bg-purple-500/20 border-purple-500/30 text-purple-400" 
                              : ""
                            }
                          >
                            {rule.id}
                          </Badge>
                          <span className="font-medium text-sm">{rule.name}</span>
                        </div>
                        
                        {/* Rule Representation */}
                        <div className="font-mono text-xs bg-background/50 p-3 rounded-lg border border-border/50 mb-3">
                          {/* Antecedent */}
                          <div className="text-muted-foreground mb-2 flex flex-wrap items-center gap-1">
                            <span className="text-xs text-muted-foreground/70 mr-2">IF</span>
                            {rule.antecedent.map((pred, idx) => (
                              <span key={idx} className="flex items-center">
                                {!pred.value && (
                                  <XCircle className="h-3 w-3 text-destructive mr-0.5" />
                                )}
                                {pred.value && (
                                  <CheckCircle className="h-3 w-3 text-primary mr-0.5" />
                                )}
                                <span className="text-blue-400">{pred.name}</span>
                                <span className="text-muted-foreground">(</span>
                                <span className="text-orange-400">{pred.args.join(", ")}</span>
                                <span className="text-muted-foreground">)</span>
                                {idx < rule.antecedent.length - 1 && (
                                  <span className="mx-2 text-foreground font-bold">AND</span>
                                )}
                              </span>
                            ))}
                          </div>
                          
                          {/* Consequent */}
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground/70 mr-2">THEN</span>
                            {!rule.consequent.value && (
                              <XCircle className="h-3 w-3 text-destructive mr-0.5" />
                            )}
                            {rule.consequent.value && (
                              <CheckCircle className="h-3 w-3 text-primary mr-0.5" />
                            )}
                            <span className="text-green-400">{rule.consequent.name}</span>
                            <span className="text-muted-foreground">(</span>
                            <span className="text-orange-400">{rule.consequent.args.join(", ")}</span>
                            <span className="text-muted-foreground">)</span>
                          </div>
                        </div>
                        
                        {/* Description */}
                        <p className="text-xs text-muted-foreground">
                          {rule.description}
                        </p>

                        {/* Expanded Info */}
                        {isSelected && (
                          <div className="mt-4 pt-4 border-t border-border/50">
                            <div className="grid grid-cols-3 gap-3 text-xs">
                              <div className="p-2 bg-muted/30 rounded-lg">
                                <p className="text-muted-foreground">Conditions</p>
                                <p className="font-semibold">{rule.antecedent.length}</p>
                              </div>
                              <div className="p-2 bg-muted/30 rounded-lg">
                                <p className="text-muted-foreground">Variables</p>
                                <p className="font-semibold">
                                  {new Set([
                                    ...rule.antecedent.flatMap(p => p.args),
                                    ...rule.consequent.args
                                  ]).size}
                                </p>
                              </div>
                              <div className="p-2 bg-muted/30 rounded-lg">
                                <p className="text-muted-foreground">Type</p>
                                <p className="font-semibold">
                                  {rule.consequent.value ? "Positive" : "Negative"}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Predicates Tab */}
            <TabsContent value="predicates">
              <ScrollArea className="h-[500px] pr-4">
                <div className="grid gap-2">
                  {predicates.map((predicate, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-muted/20 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <code className="font-mono text-sm">
                          <span className="text-blue-400">{predicate.name}</span>
                          <span className="text-muted-foreground">(</span>
                          {predicate.arity > 0 && (
                            <span className="text-orange-400">
                              {Array.from({ length: predicate.arity }, (_, i) => `arg${i + 1}`).join(", ")}
                            </span>
                          )}
                          <span className="text-muted-foreground">)</span>
                        </code>
                        <Badge variant="outline" className="text-xs font-mono">
                          Arity: {predicate.arity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {predicate.description}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Side Panel */}
      <div className="space-y-6">
        {/* Quick Stats */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-400" />
              Knowledge Base Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm text-muted-foreground">Total Rules</span>
              <Badge variant="outline" className="font-mono">{rules.length}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm text-muted-foreground">Predicates</span>
              <Badge variant="outline" className="font-mono">{predicates.length}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="text-sm text-muted-foreground">Avg Conditions</span>
              <Badge variant="outline" className="font-mono">
                {(rules.reduce((acc, r) => acc + r.antecedent.length, 0) / rules.length).toFixed(1)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Logic Symbols */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Logic Notation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                <span className="font-mono font-bold text-lg">AND</span>
                <span className="text-muted-foreground">Conjunction (all must be true)</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">Positive predicate (true)</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
                <span className="text-muted-foreground">Negative predicate (false)</span>
              </div>
              <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                <span className="font-mono font-bold">IF...THEN</span>
                <span className="text-muted-foreground">Implication rule</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              The knowledge base uses forward chaining inference to derive new facts 
              from existing predicates. Rules are evaluated in order of specificity, 
              with emergency rules taking priority.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
