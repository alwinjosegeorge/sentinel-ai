import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { GlassCard, SectionHeader, SeverityChip } from "@/components/ui-kit";
import { AgentReasoningStream } from "@/components/agent-reasoning-stream";
import { DecisionTimeline } from "@/components/decision-timeline";
import { ExplainabilityBars } from "@/components/explainability-bars";
import { alerts } from "@/data/kochi";
import { useState } from "react";
import { Siren, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "AI Alerts · Kochi | Project Sentinel" },
      { name: "description", content: "Prioritized AI alerts across Kochi with recommended actions, timelines and dispatch." },
      { property: "og:title", content: "AI Alerts · Kochi" },
      { property: "og:description", content: "Prioritized AI alerts and recommended actions for Kochi." },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const [selectedId, setSelectedId] = useState(alerts[0].id);
  const selected = alerts.find((a) => a.id === selectedId)!;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Respond · 03</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">AI Alerts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {alerts.filter((a) => a.severity === "critical").length} critical · {alerts.length} total · sorted by priority
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          <GlassCard className="lg:col-span-2">
            <SectionHeader title="Alert queue" />
            <ul className="space-y-2">
              {alerts.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => setSelectedId(a.id)}
                    className={`w-full rounded-2xl border p-3 text-left transition-colors ${a.id === selectedId ? "border-primary bg-accent" : "border-border hover:bg-secondary/60"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-bold">
                          {a.priority}
                        </span>
                        <p className="text-sm font-medium">{a.title}</p>
                      </div>
                      <SeverityChip severity={a.severity} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {a.location} · {a.confidence}% · {a.minutesAgo}m ago
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </GlassCard>

          <div className="space-y-4 lg:col-span-3">
            <GlassCard>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-bold">
                      {selected.priority}
                    </span>
                    <SeverityChip severity={selected.severity} />
                    <span className="text-[11px] text-muted-foreground">
                      {selected.confidence}% confidence
                    </span>
                  </div>
                  <h2 className="mt-2 font-display text-xl font-semibold">{selected.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selected.location} · {selected.department}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Assign</Button>
                  <Button size="sm" className="gap-1.5">
                    <Siren className="size-3.5" />
                    Dispatch
                  </Button>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-accent p-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-accent-foreground">
                  Recommended action
                </p>
                <p className="mt-1 text-sm text-foreground">{selected.recommendation}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-primary">
                  Explain reasoning <ArrowRight className="size-3" />
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <SectionHeader title="Multi-agent reasoning" />
              <AgentReasoningStream scenarioId={selected.severity === "warning" && selected.title.toLowerCase().includes("flood") ? "flood" : "default"} />
            </GlassCard>

            <GlassCard>
              <SectionHeader title="AI decision timeline" />
              <DecisionTimeline activeStep={selected.severity === "resolved" ? 8 : 5} />
            </GlassCard>

            <GlassCard>
              <ExplainabilityBars title={`Why · ${selected.title}`} />
            </GlassCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
