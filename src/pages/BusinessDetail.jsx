import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Zap, Bot, FileText, BarChart3, 
  Settings, Play, Loader2 
} from "lucide-react";
import BusinessHeader from "@/components/business/BusinessHeader";
import TasksList from "@/components/business/TasksList";
import ContentList from "@/components/business/ContentList";
import MetricsChart from "@/components/business/MetricsChart";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import StatsCard from "@/components/dashboard/StatsCard";

export default function BusinessDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = new URLSearchParams(window.location.search);
  const businessId = window.location.pathname.split("/business/")[1];
  
  const [isDeploying, setIsDeploying] = useState(false);
  const [isRunningAI, setIsRunningAI] = useState(false);

  const { data: businesses = [] } = useQuery({
    queryKey: ["businesses"],
    queryFn: () => base44.entities.Business.list(),
  });
  const business = businesses.find(b => b.id === businessId);

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", businessId],
    queryFn: () => base44.entities.AITask.filter({ business_id: businessId }, "-created_date"),
    enabled: !!businessId,
  });

  const { data: content = [] } = useQuery({
    queryKey: ["content", businessId],
    queryFn: () => base44.entities.ContentPiece.filter({ business_id: businessId }, "-created_date"),
    enabled: !!businessId,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["logs", businessId],
    queryFn: () => base44.entities.AIDecisionLog.filter({ business_id: businessId }, "-created_date"),
    enabled: !!businessId,
  });

  const { data: metrics = [] } = useQuery({
    queryKey: ["metrics", businessId],
    queryFn: () => base44.entities.BusinessMetric.filter({ business_id: businessId }, "-date"),
    enabled: !!businessId,
  });

  const handleDeploy = async () => {
    setIsDeploying(true);
    await base44.functions.invoke("deployBusiness", { business_id: businessId });
    queryClient.invalidateQueries({ queryKey: ["businesses"] });
    setIsDeploying(false);
  };

  const handleRunAI = async () => {
    setIsRunningAI(true);
    await base44.functions.invoke("runAIOperations", { business_id: businessId });
    queryClient.invalidateQueries();
    setIsRunningAI(false);
  };

  if (!business) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const completedTasks = tasks.filter(t => t.status === "Completed").length;
  const queuedTasks = tasks.filter(t => t.status === "Queued").length;

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      {/* Back nav */}
      <button 
        onClick={() => navigate("/")} 
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      {/* Header */}
      <BusinessHeader business={business} onDeploy={handleDeploy} isDeploying={isDeploying} />

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        <StatsCard icon={Zap} label="Health" value={`${business.health_score || 0}%`} />
        <StatsCard icon={Bot} label="AI Actions" value={logs.length} />
        <StatsCard icon={FileText} label="Content" value={content.length} />
        <StatsCard icon={BarChart3} label="Tasks Done" value={completedTasks} sublabel={`${queuedTasks} queued`} />
      </div>

      {/* Run AI Button */}
      <div className="mt-6">
        <Button 
          variant="outline" 
          className="gap-2 rounded-xl"
          onClick={handleRunAI}
          disabled={isRunningAI}
        >
          {isRunningAI ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running AI Operations...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run AI Cycle
            </>
          )}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="mt-8">
        <TabsList className="bg-muted rounded-xl p-1">
          <TabsTrigger value="tasks" className="rounded-lg text-sm">Tasks</TabsTrigger>
          <TabsTrigger value="content" className="rounded-lg text-sm">Content</TabsTrigger>
          <TabsTrigger value="activity" className="rounded-lg text-sm">AI Activity</TabsTrigger>
          <TabsTrigger value="metrics" className="rounded-lg text-sm">Metrics</TabsTrigger>
          <TabsTrigger value="details" className="rounded-lg text-sm">Details</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="tasks">
            <div className="rounded-2xl border border-border bg-card p-4">
              <TasksList tasks={tasks} />
            </div>
          </TabsContent>

          <TabsContent value="content">
            <div className="rounded-2xl border border-border bg-card p-4">
              <ContentList content={content} />
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <div className="rounded-2xl border border-border bg-card p-4">
              <ActivityFeed logs={logs} />
            </div>
          </TabsContent>

          <TabsContent value="metrics">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-sm font-heading font-semibold mb-4">Health Score Over Time</h3>
              <MetricsChart metrics={metrics} />
            </div>
          </TabsContent>

          <TabsContent value="details">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Idea", value: business.idea },
                  { label: "Niche", value: business.niche },
                  { label: "Target Audience", value: business.target_audience },
                  { label: "Value Proposition", value: business.value_proposition },
                  { label: "Business Model", value: business.business_model },
                  { label: "Revenue Goal", value: `$${(business.revenue_goal_monthly || 0).toLocaleString()}/mo` },
                  { label: "Brand Colors", value: business.brand_colors },
                  { label: "Stage", value: business.stage },
                ].map(item => item.value && (
                  <div key={item.label}>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
              
              {business.ai_strategy && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">AI Strategy</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{business.ai_strategy}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}