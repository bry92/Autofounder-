import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors = {
  Draft: "bg-muted text-muted-foreground",
  Review: "bg-amber-500/10 text-amber-600",
  Scheduled: "bg-blue-500/10 text-blue-600",
  Published: "bg-green-500/10 text-green-600",
};

export default function ContentList({ content }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!content || content.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No content generated yet</p>;
  }

  return (
    <div className="space-y-2">
      {content.map(piece => (
        <div key={piece.id} className="rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setExpandedId(expandedId === piece.id ? null : piece.id)}
            className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{piece.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-muted-foreground">{piece.type}</span>
                <Badge variant="secondary" className={cn("text-[10px]", statusColors[piece.status])}>
                  {piece.status}
                </Badge>
              </div>
            </div>
            {expandedId === piece.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {expandedId === piece.id && piece.body && (
            <div className="px-4 pb-4 border-t border-border">
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap mt-3 max-h-60 overflow-y-auto leading-relaxed">
                {piece.body}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}