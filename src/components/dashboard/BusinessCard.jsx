import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Zap, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const statusStyles = {
  Active: "bg-green-500/10 text-green-600 border-green-500/20",
  Generating: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Deploying: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Draft: "bg-muted text-muted-foreground border-border",
  Paused: "bg-muted text-muted-foreground border-border",
  Failed: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function BusinessCard({ business }) {
  const colors = (business.brand_colors || "#6366F1, #8B5CF6").split(",").map(c => c.trim());
  
  return (
    <Link to={`/business/${business.id}`} className="block group">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20">
        {/* Gradient accent bar */}
        <div 
          className="absolute top-0 left-0 right-0 h-1 opacity-60 group-hover:opacity-100 transition-opacity"
          style={{ background: `linear-gradient(90deg, ${colors[0]}, ${colors[1] || colors[0]})` }}
        />
        
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-heading font-bold text-sm shrink-0"
                style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1] || colors[0]})` }}
              >
                {business.name?.[0]?.toUpperCase() || "B"}
              </div>
              <div className="min-w-0">
                <h3 className="font-heading font-bold text-base truncate">{business.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{business.niche || business.tagline}</p>
              </div>
            </div>
          </div>
          <Badge variant="outline" className={cn("text-[10px] shrink-0", statusStyles[business.status])}>
            {business.status}
          </Badge>
        </div>

        {business.tagline && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{business.tagline}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {business.health_score > 0 && (
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-accent" />
                <span>{business.health_score}% health</span>
              </div>
            )}
            {business.website_url && (
              <a 
                href={business.website_url} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Live</span>
              </a>
            )}
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </Link>
  );
}