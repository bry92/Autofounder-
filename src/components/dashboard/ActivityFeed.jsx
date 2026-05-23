import React from "react";
import { format } from "date-fns";
import { Bot, Zap, FileText, Target, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const typeIcons = {
  Strategy: Zap,
  Marketing: FileText,
  Sales: Target,
  Operations: Bot,
  Product: AlertCircle,
  Finance: AlertCircle,
};

export default function ActivityFeed({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        <Bot className="w-8 h-8 mx-auto mb-2 opacity-40" />
        No AI activity yet
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {logs.slice(0, 8).map((log, i) => {
        const Icon = typeIcons[log.decision_type] || Bot;
        return (
          <div key={log.id || i} className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{log.action_taken || log.trigger}</p>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {log.reasoning?.slice(0, 100)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {log.created_date ? format(new Date(log.created_date), "MMM d, h:mm a") : ""}
              </p>
            </div>
            {log.confidence_score && (
              <div className={cn(
                "text-[10px] font-bold px-2 py-1 rounded-full h-fit shrink-0",
                log.confidence_score >= 80 ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"
              )}>
                {log.confidence_score}%
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}