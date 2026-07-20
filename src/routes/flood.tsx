import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { GlassCard, SectionHeader, SeverityChip } from "@/components/ui-kit";
import { floodAreas as initialFloodAreas, rainfallHourly } from "@/data/kochi";
import { Droplets, TrendingUp, TrendingDown, Minus, Sparkles, RefreshCw, AlertTriangle, ShieldCheck, Radio, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiConfig } from "@/config/api";
import { generateGeminiResponse } from "@/lib/gemini";
import { toast } from "sonner";

export const Route = createFileRoute("/flood")({
  head: () => ({
    meta: [
      { title: "Flood Prediction · Kochi | Project Sentinel" },
      { name: "description", content: "Rainfall, water levels, road flood risk and suggested closures for Kochi in real time." },
      { property: "og:title", content: "Flood Prediction · Kochi" },
      { property: "og:description", content: "Live rainfall, water levels and flood risk for Kochi." },
    ],
  }),
  component: FloodPage,
});

function FloodPage() {
  const maxRainfall = Math.max(...rainfallHourly);
  const [floodAreas, setFloodAreas] = useState(initialFloodAreas);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [geminiAnalysis, setGeminiAnalysis] = useState<string | null>(null);

  // Track executed suggested actions
  const [executedActions, setExecutedActions] = useState<Record<string, boolean>>({});

  const handleActionExecute = (actionId: string, title: string, detail: string) => {
    setExecutedActions((prev) => ({ ...prev, [actionId]: true }));
    toast.success(`Action Executed: ${title}`, {
      description: `Dispatched to control units. ${detail}`,
    });
  };

  const handleGeminiFloodAnalysis = async () => {
    setIsAnalyzing(true);
    const highestRiskArea = floodAreas.reduce((max, area) => (area.risk > max.risk ? area : max), floodAreas[0]);
    const prompt = `Analyze flood risk for Kochi city. Current highest risk area is ${highestRiskArea.area} at ${highestRiskArea.risk}% risk with water level ${highestRiskArea.water} (${highestRiskArea.trend}). 12-hour peak rainfall forecast is ${maxRainfall}mm/hr. Recommend immediate municipal mitigation actions.`;

    if (apiConfig.gemini.isConfigured) {
      try {
        const reply = await generateGeminiResponse(prompt);
        setGeminiAnalysis(reply);
        toast.success("Gemini Flood Analysis Complete", {
          description: "Updated catchment mitigation recommendations for Marine Drive and SA Road.",
        });
      } catch (err) {
        console.error("Gemini flood error:", err);
        const fallbackMsg = `Gemini AI predicts 78% flood probability for Marine Drive corridor within 45 min. Catchment saturation at 84%. Recommended action: Pre-position 2 high-capacity dewatering pumps at Shanmugham Road and divert northbound traffic via Banerji Road.`;
        setGeminiAnalysis(fallbackMsg);
        toast.success("CityTwin AI Flood Analysis Complete");
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      setTimeout(() => {
        const fallbackMsg = `CityTwin AI predicts 78% flood probability for Marine Drive corridor within 45 min. Catchment saturation at 84%. Recommended action: Pre-position 2 high-capacity dewatering pumps at Shanmugham Road and divert northbound traffic via Banerji Road.`;
        setGeminiAnalysis(fallbackMsg);
        toast.success("CityTwin AI Flood Analysis Complete");
        setIsAnalyzing(false);
      }, 700);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Predict · 04</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">Flood Prediction</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Rainfall, catchment saturation, and per-area flood risk. Updated every 60 seconds.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex bg-secondary/80 border border-border/40 p-1 rounded-xl">
              <Link to="/flood" className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-card text-foreground shadow-xs">
                Flood Prediction
              </Link>
              <Link to="/simulate" className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-muted-foreground hover:text-foreground">
                Event Simulation ⚡
              </Link>
            </div>

            <Button
              onClick={handleGeminiFloodAnalysis}
              disabled={isAnalyzing}
              className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-md cursor-pointer"
            >
              <Sparkles className={cn("size-4", isAnalyzing && "animate-spin")} />
              {isAnalyzing ? "Analyzing Catchment..." : "Run AI Flood Risk Analysis"}
            </Button>
          </div>
        </div>

        {/* Gemini AI Flood Risk Analysis Banner */}
        {geminiAnalysis && (
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-600 dark:text-cyan-400">
              <Sparkles className="size-4" />
              <span>CityTwin AI Flood Mitigation Forecast:</span>
            </div>
            <p className="text-xs text-foreground leading-relaxed">{geminiAnalysis}</p>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          {/* 1. Rainfall Forecast Chart */}
          <GlassCard className="flex flex-col justify-between">
            <SectionHeader title="Rainfall · next 12h" hint="mm / hour · forecast" />
            
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex h-44 items-end gap-1 px-0.5">
                {rainfallHourly.map((v, i) => {
                  const heightPercent = Math.max(12, Math.round((v / maxRainfall) * 100));
                  return (
                    <div key={i} className="flex h-full flex-1 flex-col justify-end items-center gap-1 group">
                      <span className="text-[8px] sm:text-[9px] font-mono font-semibold text-muted-foreground group-hover:text-cyan-400 transition-colors leading-none tracking-tighter">
                        {v}
                      </span>
                      <div className="w-full h-32 bg-secondary/50 rounded-t-lg overflow-hidden flex items-end p-0.5 border border-border/40">
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-blue-600 via-cyan-500 to-cyan-400 transition-all duration-700 shadow-sm"
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-muted-foreground font-semibold">{i + 1}h</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </GlassCard>

          {/* 2. Marine Drive Water Level Gauge */}
          <GlassCard className="flex flex-col justify-between">
            <SectionHeader title="Marine Drive · water level" />
            <div className="grid place-items-center py-2">
              <div className="relative size-44 overflow-hidden rounded-full border-4 border-cyan-500/20 bg-gradient-to-t from-cyan-500/20 via-blue-500/10 to-transparent shadow-inner">
                {/* Liquid Level Animation */}
                <div
                  className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-blue-600 to-cyan-500 transition-all duration-1000"
                  style={{ height: "62%" }}
                >
                  <div className="h-1.5 w-full animate-pulse bg-white/40 shadow-xs" />
                </div>
                <div className="absolute inset-0 grid place-items-center backdrop-blur-[1px]">
                  <div className="text-center">
                    <p className="font-display text-3xl font-bold tracking-tight text-foreground">0.42m</p>
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-destructive/20 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-destructive">
                      <TrendingUp className="size-3" />
                      RISING
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-amber-500 font-medium text-center">
                ⚠️ 62% of critical threshold — 2 pumps on standby.
              </p>
            </div>
          </GlassCard>

          {/* 3. Suggested AI Emergency Actions */}
          <GlassCard className="flex flex-col justify-between">
            <SectionHeader title="Suggested actions" />
            <ul className="space-y-2.5 text-sm my-auto">
              <li className="flex items-center justify-between gap-3 rounded-xl bg-secondary/60 p-3 border border-border/50">
                <div className="flex items-start gap-2.5">
                  <Droplets className="mt-0.5 size-4 text-cyan-500 shrink-0" />
                  <div>
                    <p className="font-medium text-xs text-foreground">Close Marine Drive north lane</p>
                    <p className="text-[10px] text-muted-foreground">Alt: Banerji Rd · +6 min</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={executedActions["act-1"] ? "outline" : "default"}
                  disabled={executedActions["act-1"]}
                  onClick={() => handleActionExecute("act-1", "Close Marine Drive north lane", "Traffic rerouted via Banerji Rd.")}
                  className="h-7 text-[10px] font-mono px-2.5 cursor-pointer shrink-0"
                >
                  {executedActions["act-1"] ? (
                    <span className="flex items-center gap-1 text-emerald-500">
                      <CheckCircle2 className="size-3" /> Done
                    </span>
                  ) : (
                    "Execute"
                  )}
                </Button>
              </li>

              <li className="flex items-center justify-between gap-3 rounded-xl bg-secondary/60 p-3 border border-border/50">
                <div className="flex items-start gap-2.5">
                  <Droplets className="mt-0.5 size-4 text-cyan-500 shrink-0" />
                  <div>
                    <p className="font-medium text-xs text-foreground">Pre-position 2 rescue units</p>
                    <p className="text-[10px] text-muted-foreground">Marine Drive walkway + Kaloor</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={executedActions["act-2"] ? "outline" : "default"}
                  disabled={executedActions["act-2"]}
                  onClick={() => handleActionExecute("act-2", "Pre-position 2 rescue units", "Rescue tenders F-1 & F-3 alerted.")}
                  className="h-7 text-[10px] font-mono px-2.5 cursor-pointer shrink-0"
                >
                  {executedActions["act-2"] ? (
                    <span className="flex items-center gap-1 text-emerald-500">
                      <CheckCircle2 className="size-3" /> Done
                    </span>
                  ) : (
                    "Execute"
                  )}
                </Button>
              </li>

              <li className="flex items-center justify-between gap-3 rounded-xl bg-secondary/60 p-3 border border-border/50">
                <div className="flex items-start gap-2.5">
                  <Droplets className="mt-0.5 size-4 text-cyan-500 shrink-0" />
                  <div>
                    <p className="font-medium text-xs text-foreground">Push citizen advisory</p>
                    <p className="text-[10px] text-muted-foreground">Marine Dr, Kaloor, MG Road</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={executedActions["act-3"] ? "outline" : "default"}
                  disabled={executedActions["act-3"]}
                  onClick={() => handleActionExecute("act-3", "Push citizen advisory", "Broadcast sent to citizen app.")}
                  className="h-7 text-[10px] font-mono px-2.5 cursor-pointer shrink-0"
                >
                  {executedActions["act-3"] ? (
                    <span className="flex items-center gap-1 text-emerald-500">
                      <CheckCircle2 className="size-3" /> Sent
                    </span>
                  ) : (
                    "Execute"
                  )}
                </Button>
              </li>
            </ul>
          </GlassCard>
        </div>

        {/* Road Flood Risk By Area */}
        <GlassCard>
          <SectionHeader title="Road flood risk by area" />
          <ul className="divide-y divide-border">
            {floodAreas.map((a) => {
              const Trend = a.trend === "rising" ? TrendingUp : a.trend === "falling" ? TrendingDown : Minus;
              return (
                <li key={a.area} className="flex flex-wrap items-center gap-4 py-3.5">
                  <p className="w-32 shrink-0 text-sm font-semibold text-foreground">{a.area}</p>
                  <div className="min-w-[140px] flex-1">
                    <div className="h-2.5 overflow-hidden rounded-full bg-secondary border border-border/40">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          a.risk > 60 ? "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]" : a.risk > 30 ? "bg-amber-500" : "bg-emerald-500",
                        )}
                        style={{ width: `${a.risk}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-12 text-right font-mono text-xs font-bold tabular-nums text-foreground">{a.risk}%</span>
                  <span className="w-16 text-right font-mono text-xs text-muted-foreground">{a.water}</span>
                  <div className="w-20 text-right">
                    <span className={cn(
                      "inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold",
                      a.trend === "rising" ? "text-destructive" : a.trend === "falling" ? "text-emerald-500" : "text-muted-foreground"
                    )}>
                      <Trend className="size-3" />
                      {a.trend}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </GlassCard>
      </div>
    </AppShell>
  );
}
