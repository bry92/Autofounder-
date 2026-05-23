import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Rocket, Loader2, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const statusStyles = {
  Active: "bg-green-500/10 text-green-600 border-green-500/20",
  Generating: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Deploying: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Draft: "bg-muted text-muted-foreground border-border",
  Paused: "bg-muted text-muted-foreground border-border",
  Failed: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function BusinessHeader({ business, onDeploy, isDeploying }) {
  const colors = (business.brand_colors || "#6366F1, #8B5CF6").split(",").map(c => c.trim());

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 lg:p-8">
      <div 
        className="absolute top-0 left-0 right-0 h-1.5"
        style={{ background: `linear-gradient(90deg, ${colors[0]}, ${colors[1] || colors[0]})` }}
      />
      
      <div className="flex flex-col sm:flex-row items-start gap-6">
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-heading font-bold text-2xl shrink-0"
          style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1] || colors[0]})` }}
        >
          {business.name?.[0]?.toUpperCase() || "B"}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-heading font-bold truncate">{business.name}</h1>
            <Badge variant="outline" className={cn("shrink-0", statusStyles[business.status])}>
              {business.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">{business.tagline}</p>
          
          {business.ai_last_action && (
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <Bot className="w-3 h-3" />
              <span>{business.ai_last_action}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 shrink-0">
          {business.website_url && (
            <a href={business.website_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2 rounded-xl">
                <ExternalLink className="w-4 h-4" />
                Visit Site
              </Button>
            </a>
          )}
          <Button 
            className="gap-2 rounded-xl" 
            onClick={onDeploy} 
            disabled={isDeploying}
          >
            {isDeploying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                {business.website_url ? "Redeploy" : "Deploy"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}