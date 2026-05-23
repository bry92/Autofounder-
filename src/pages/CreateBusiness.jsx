import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Rocket, Sparkles, ArrowRight, ArrowLeft, Loader2, 
  Lightbulb, Target, DollarSign, CheckCircle2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  { icon: Lightbulb, title: "Your Idea", subtitle: "What's the big vision?" },
  { icon: Target, title: "Details", subtitle: "Who's it for?" },
  { icon: DollarSign, title: "Goals", subtitle: "Revenue targets" },
  { icon: Rocket, title: "Launch", subtitle: "Let AI build it" },
];

export default function CreateBusiness() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchStatus, setLaunchStatus] = useState("");
  const [form, setForm] = useState({
    idea: "",
    niche: "",
    target_audience: "",
    revenue_goal: 10000,
  });

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    if (step === 0) return form.idea.trim().length > 10;
    return true;
  };

  const handleLaunch = async () => {
    setIsLaunching(true);
    setLaunchStatus("AI is analyzing your idea...");
    
    const response = await base44.functions.invoke("buildBusiness", {
      idea: form.idea,
      niche: form.niche,
      target_audience: form.target_audience,
      revenue_goal: form.revenue_goal,
    });

    setLaunchStatus("Business created! Redirecting...");
    
    setTimeout(() => {
      navigate(`/business/${response.data.business_id}`);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                i === step ? "bg-primary text-primary-foreground" :
                i < step ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {i < step ? <CheckCircle2 className="w-3 h-3" /> : <s.icon className="w-3 h-3" />}
                <span className="hidden sm:inline">{s.title}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn(
                  "w-8 h-px transition-colors",
                  i < step ? "bg-primary" : "bg-border"
                )} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {step === 0 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                    <Lightbulb className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-3xl font-heading font-bold">What's your business idea?</h2>
                  <p className="text-muted-foreground mt-2">Describe it in as much detail as you'd like. The AI will fill in the gaps.</p>
                </div>
                <Textarea
                  placeholder="e.g. A SaaS platform that helps freelancers automate their invoicing and get paid faster using AI-powered payment reminders..."
                  className="min-h-[160px] text-base rounded-xl resize-none"
                  value={form.idea}
                  onChange={e => updateForm("idea", e.target.value)}
                />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-3xl font-heading font-bold">Who's it for?</h2>
                  <p className="text-muted-foreground mt-2">Help the AI understand your market. Leave blank to auto-detect.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Industry / Niche</Label>
                    <Input
                      placeholder="e.g. FinTech, Healthcare, E-commerce..."
                      className="rounded-xl"
                      value={form.niche}
                      onChange={e => updateForm("niche", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Target Audience</Label>
                    <Textarea
                      placeholder="e.g. Small business owners aged 25-45 who struggle with cash flow management..."
                      className="rounded-xl resize-none min-h-[100px]"
                      value={form.target_audience}
                      onChange={e => updateForm("target_audience", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-3xl font-heading font-bold">Revenue Goal</h2>
                  <p className="text-muted-foreground mt-2">Set a monthly revenue target for the AI to optimize toward.</p>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Monthly Revenue Target ($)</Label>
                  <Input
                    type="number"
                    className="rounded-xl text-2xl font-heading font-bold text-center h-16"
                    value={form.revenue_goal}
                    onChange={e => updateForm("revenue_goal", parseInt(e.target.value) || 0)}
                  />
                  <div className="flex justify-center gap-2 mt-3">
                    {[1000, 5000, 10000, 50000, 100000].map(v => (
                      <button
                        key={v}
                        onClick={() => updateForm("revenue_goal", v)}
                        className={cn(
                          "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                          form.revenue_goal === v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        ${v >= 1000 ? `${v / 1000}k` : v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                    <Rocket className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-3xl font-heading font-bold">Ready to Launch</h2>
                  <p className="text-muted-foreground mt-2">The AI will generate everything: strategy, branding, content, and tasks.</p>
                </div>

                {/* Summary */}
                <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Idea</p>
                    <p className="text-sm">{form.idea}</p>
                  </div>
                  {form.niche && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Niche</p>
                      <p className="text-sm">{form.niche}</p>
                    </div>
                  )}
                  {form.target_audience && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Target Audience</p>
                      <p className="text-sm">{form.target_audience}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Revenue Goal</p>
                    <p className="text-sm font-heading font-bold">${form.revenue_goal.toLocaleString()}/mo</p>
                  </div>
                </div>

                {isLaunching && (
                  <div className="flex items-center justify-center gap-3 py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">{launchStatus}</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10">
          <Button
            variant="ghost"
            className="gap-2 rounded-xl"
            onClick={() => step === 0 ? navigate("/") : setStep(step - 1)}
            disabled={isLaunching}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {step < 3 ? (
            <Button
              className="gap-2 rounded-xl px-8"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              className="gap-2 rounded-xl px-8"
              onClick={handleLaunch}
              disabled={isLaunching}
            >
              {isLaunching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Building...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Launch with AI
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}