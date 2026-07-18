import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { GlassCard, SectionHeader } from "@/components/ui-kit";
import { floodAreas, rainfallHourly } from "@/data/kochi";
import { Droplets, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const max = Math.max(...rainfallHourly);
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Predict · 04</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Flood Prediction</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rainfall, catchment saturation, and per-area flood risk. Updated every 60 seconds.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <GlassCard>
            <SectionHeader title="Rainfall · next 12h" hint="mm / hour · forecast" />
            <div className="flex h-40 items-end gap-1.5">
              {rainfallHourly.map((v, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary/40 transition-all"
                    style={{ height: `${(v / max) * 100}%` }}
                  />
                  <span className="text-[9px] text-muted-foreground">{i + 1}h</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <SectionHeader title="Marine Drive · water level" />
            <div className="grid place-items-center py-4">
              <div className="relative size-40 overflow-hidden rounded-full border-4 border-primary/10 bg-gradient-to-t from-primary/40 to-transparent">
                <div
                  className="absolute inset-x-0 bottom-0 bg-primary/50"
                  style={{ height: "62%" }}
                >
                  <div className="h-1 w-full animate-pulse-soft bg-white/40" />
                </div>
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <p className="font-display text-2xl font-semibold">0.42m</p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Rising</p>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-warn">
                62% of critical threshold — pumps on standby.
              </p>
            </div>
          </GlassCard>

          <GlassCard>
            <SectionHeader title="Suggested actions" />
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2 rounded-xl bg-secondary/60 p-3">
                <Droplets className="mt-0.5 size-4 text-primary" />
                <div>
                  <p className="font-medium">Close Marine Drive north lane</p>
                  <p className="text-xs text-muted-foreground">Alt: Banerji Rd · +6 min</p>
                </div>
              </li>
              <li className="flex items-start gap-2 rounded-xl bg-secondary/60 p-3">
                <Droplets className="mt-0.5 size-4 text-primary" />
                <div>
                  <p className="font-medium">Pre-position 2 rescue units</p>
                  <p className="text-xs text-muted-foreground">Marine Drive walkway + Kaloor</p>
                </div>
              </li>
              <li className="flex items-start gap-2 rounded-xl bg-secondary/60 p-3">
                <Droplets className="mt-0.5 size-4 text-primary" />
                <div>
                  <p className="font-medium">Push citizen advisory</p>
                  <p className="text-xs text-muted-foreground">Marine Dr, Kaloor, MG Road</p>
                </div>
              </li>
            </ul>
          </GlassCard>
        </div>

        <GlassCard>
          <SectionHeader title="Road flood risk by area" />
          <ul className="divide-y divide-border">
            {floodAreas.map((a) => {
              const Trend = a.trend === "rising" ? TrendingUp : a.trend === "falling" ? TrendingDown : Minus;
              return (
                <li key={a.area} className="flex flex-wrap items-center gap-4 py-3">
                  <p className="w-32 shrink-0 text-sm font-medium">{a.area}</p>
                  <div className="min-w-[140px] flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          a.risk > 60 ? "bg-destructive" : a.risk > 30 ? "bg-warn" : "bg-success",
                        )}
                        style={{ width: `${a.risk}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-12 text-right font-mono text-xs tabular-nums">{a.risk}%</span>
                  <span className="w-14 text-right font-mono text-xs text-muted-foreground">{a.water}</span>
                  <Trend className={cn("size-4", a.trend === "rising" ? "text-destructive" : a.trend === "falling" ? "text-success" : "text-muted-foreground")} />
                </li>
              );
            })}
          </ul>
        </GlassCard>
      </div>
    </AppShell>
  );
}
