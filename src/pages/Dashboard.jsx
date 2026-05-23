import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Rocket, Building2, Zap, CheckCircle2, Bot } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import BusinessCard from "@/components/dashboard/BusinessCard";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import EmptyState from "@/components/dashboard/EmptyState";

export default function Dashboard() {
  const { data: businesses = [], isLoading: loadingBiz } = useQuery({
    queryKey: ["businesses"],
    queryFn: () => base44.entities.Business.list("-created_date"),
    staleTime: 0,
    retry: 1,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => base44.entities.AITask.list("-created_date", 50),
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["logs"],
    queryFn: () => base44.entities.AIDecisionLog.list("-created_date", 20),
  });

  const activeCount = businesses.filter(b => b.status === "Active").length;
  const completedTasks = tasks.filter(t => t.status === "Completed").length;
  const queuedTasks = tasks.filter(t => t.status === "Queued").length;

  if (loadingBiz) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="p-6 lg:p-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Your AI business command center</p>
          </div>
        </div>
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your AI business command center</p>
        </div>
        <Link to="/create">
          <Button className="gap-2 rounded-xl">
            <Rocket className="w-4 h-4" />
            New Business
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard icon={Building2} label="Businesses" value={businesses.length} sublabel={`${activeCount} active`} />
        <StatsCard icon={CheckCircle2} label="Tasks Done" value={completedTasks} sublabel={`${queuedTasks} in queue`} />
        <StatsCard icon={Bot} label="AI Actions" value={logs.length} sublabel="Total decisions" />
        <StatsCard icon={Zap} label="Health Avg" value={
          businesses.length > 0 
            ? Math.round(businesses.reduce((s, b) => s + (b.health_score || 0), 0) / businesses.length) + "%" 
            : "—"
        } />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Businesses */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-heading font-semibold mb-4">Your Businesses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {businesses.map(biz => (
              <BusinessCard key={biz.id} business={biz} />
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <h2 className="text-lg font-heading font-semibold mb-4">AI Activity</h2>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <ActivityFeed logs={logs} />
          </div>
        </div>
      </div>
    </div>
  );
}