import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

export default function MetricsChart({ metrics }) {
  if (!metrics || metrics.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No metrics data yet</p>;
  }

  const data = metrics
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(m => ({
      date: m.date,
      label: format(new Date(m.date), "MMM d"),
      health: m.health_score || 0,
      tasks: m.tasks_completed || 0,
      actions: m.ai_actions_taken || 0,
    }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip 
            contentStyle={{ 
              background: "hsl(var(--card))", 
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
              fontSize: "12px"
            }} 
          />
          <Area type="monotone" dataKey="health" stroke="hsl(var(--primary))" fill="url(#healthGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}