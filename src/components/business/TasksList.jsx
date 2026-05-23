import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig = {
  Queued: { icon: Clock, color: "text-muted-foreground", bg: "bg-muted" },
  "In Progress": { icon: Loader2, color: "text-blue-500", bg: "bg-blue-500/10", spin: true },
  Completed: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
  Failed: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
};

const priorityColors = {
  Critical: "bg-destructive/10 text-destructive border-destructive/20",
  High: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Medium: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Low: "bg-muted text-muted-foreground border-border",
};

export default function TasksList({ tasks }) {
  if (!tasks || tasks.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No tasks yet</p>;
  }

  return (
    <div className="space-y-2">
      {tasks.map(task => {
        const config = statusConfig[task.status] || statusConfig.Queued;
        const Icon = config.icon;
        return (
          <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5", config.bg)}>
              <Icon className={cn("w-3.5 h-3.5", config.color, config.spin && "animate-spin")} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{task.title}</p>
              {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{task.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="outline" className={cn("text-[10px]", priorityColors[task.priority])}>
                  {task.priority}
                </Badge>
                <span className="text-[10px] text-muted-foreground">{task.category}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}