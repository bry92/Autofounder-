import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Rocket, Sparkles } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6">
        <Sparkles className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-2xl font-heading font-bold mb-2">No businesses yet</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        Launch your first AI-powered business in minutes. Describe your idea and we'll handle the rest — 
        branding, content, strategy, and deployment.
      </p>
      <Link to="/create">
        <Button size="lg" className="gap-2 rounded-xl px-8">
          <Rocket className="w-4 h-4" />
          Launch Your First Business
        </Button>
      </Link>
    </div>
  );
}