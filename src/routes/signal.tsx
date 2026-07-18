import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { GlassCard, SectionHeader } from "@/components/ui-kit";
import { useState, useEffect } from "react";
import { SlidersHorizontal, TrendingDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/signal")({
  head: () => ({
    meta: [
      { title: "Signal Control · Kochi | Project Sentinel" },
      { name: "description", content: "Reinforcement-learning adaptive signal timings across monitored Kochi intersections." },
    ],
  }),
  component: SignalControlPage,
});

function SignalControlPage() {
  const [junctions, setJunctions] = useState([
    { id: "silkboard", name: "Kundannoor Junction", mode: "AI adaptive", queues: [62, 48, 71, 39] },
    { id: "marathahalli", name: "Palarivattom Bridge", mode: "AI adaptive", queues: [44, 55, 30, 41] },
    { id: "hebbal", name: "Edapally Flyover", mode: "Fixed cycle", queues: [38, 29, 52, 33] },
    { id: "krpuram", name: "Kaloor", mode: "AI adaptive", queues: [27, 34, 40, 22] },
    { id: "yeshwantpur", name: "Aluva", mode: "Fixed cycle", queues: [19, 25, 31, 18] },
  ]);

  const [selectedIdx, setSelectedIdx] = useState(0);
  const j = junctions[selectedIdx];

  // Fluctuate queues dynamically for AI adaptive junctions
  useEffect(() => {
    const timer = setInterval(() => {
      setJunctions((prev) =>
        prev.map((item) => {
          if (item.mode !== "AI adaptive") return item;
          const newQueues = item.queues.map((q) => {
            const delta = Math.floor(Math.random() * 5) - 2; // -2, -1, 0, +1, +2
            return Math.max(10, Math.min(85, q + delta));
          });
          return { ...item, queues: newQueues };
        })
      );
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const toggleMode = (idx: number) => {
    setJunctions((prev) =>
      prev.map((item, i) =>
        i === idx
          ? { ...item, mode: item.mode === "AI adaptive" ? "Fixed cycle" : "AI adaptive" }
          : item
      )
    );
  };

  const calculateAiTime = (queue: number) => Math.max(15, Math.min(60, Math.round(18 + queue * 0.65)));
  const fixedTime = 30;
  const approaches = ["North", "East", "South", "West"];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Title */}
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Respond · 03.C</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900">Signal Control</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reinforcement-learning adaptive signal timings that prioritize public transit and emergency corridors.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid gap-4 lg:grid-cols-5">
          {/* Junctions Side Panel */}
          <GlassCard className="lg:col-span-2 space-y-4">
            <SectionHeader title="Monitored Intersections" />
            <ul className="space-y-2">
              {junctions.map((item, idx) => (
                <li key={item.id}>
                  <button
                    onClick={() => setSelectedIdx(idx)}
                    className={`w-full rounded-2xl border p-4 text-left transition-all ${
                      idx === selectedIdx
                        ? "border-primary bg-primary/5 shadow-xs"
                        : "border-slate-200/80 bg-white hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{item.name}</h4>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5 uppercase tracking-wider">{item.mode}</p>
                      </div>
                      <span className={cn(
                        "rounded-full px-2.5 py-0.5 text-[8.5px] font-bold uppercase",
                        item.mode === "AI adaptive" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                      )}>
                        {item.mode === "AI adaptive" ? "Adaptive" : "Fixed"}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </GlassCard>

          {/* Details Column */}
          <div className="lg:col-span-3 space-y-4">
            {/* Junction Controller Card */}
            <GlassCard className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
                <div>
                  <h2 className="font-display text-xl font-semibold text-slate-800">{j.name}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Control Mode: <span className="font-bold">{j.mode}</span></p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-muted-foreground">AI Adaptive Mode</span>
                  <Switch
                    checked={j.mode === "AI adaptive"}
                    onCheckedChange={() => toggleMode(selectedIdx)}
                  />
                </div>
              </div>

              {/* Approach Queue Length KPIs */}
              <div>
                <h3 className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-3">Live Queues</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {approaches.map((ap, i) => (
                    <div key={ap} className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 shadow-2xs">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-mono font-medium">{ap} Approach</span>
                      <p className="text-2xl font-bold font-mono text-slate-800 mt-1">{j.queues[i]}<small className="text-xs text-slate-450 font-normal ml-0.5">veh</small></p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cycle Timing Compare */}
              <div className="space-y-4">
                <h3 className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest font-mono">Fixed Cycle vs AI Recommended Green Time</h3>
                
                <div className="space-y-3.5">
                  {approaches.map((ap, idx) => {
                    const queue = j.queues[idx];
                    const aiTime = calculateAiTime(queue);

                    return (
                      <div key={ap} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-medium">
                          <span className="text-slate-600">{ap} Approach</span>
                          <span className="font-mono text-slate-800 font-bold">{fixedTime}s <span className="text-slate-400 font-normal">→</span> {aiTime}s</span>
                        </div>
                        <div className="flex gap-4 items-center">
                          {/* Fixed cycle */}
                          <div className="flex-1 space-y-1">
                            <span className="text-[9px] text-muted-foreground uppercase font-mono tracking-wider">Fixed Time</span>
                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40">
                              <div className="bg-slate-400 h-full rounded-full" style={{ width: `${(fixedTime / 60) * 100}%` }} />
                            </div>
                          </div>
                          {/* AI recommended */}
                          <div className="flex-1 space-y-1">
                            <span className="text-[9px] text-emerald-600 uppercase font-mono tracking-wider">AI Optimal</span>
                            <div className="w-full h-2.5 bg-emerald-50/50 rounded-full overflow-hidden border border-emerald-100">
                              <div className="bg-emerald-500 h-full rounded-full animate-pulse-soft" style={{ width: `${(aiTime / 60) * 100}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </GlassCard>

            {/* Overrides and Projected Impacts */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Priority Overrides */}
              <GlassCard className="space-y-4">
                <SectionHeader title="Priority Overrides" />
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="font-semibold text-slate-700">Bus Priority</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[8.5px] font-bold text-emerald-700 uppercase tracking-widest">Active</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="font-semibold text-slate-700">Ambulance Priority</span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[8.5px] font-bold text-blue-700 uppercase tracking-widest">Standby</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <span className="font-semibold text-slate-700">Pedestrian Extension</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[8.5px] font-bold text-emerald-700 uppercase tracking-widest">Active</span>
                  </div>
                </div>
              </GlassCard>

              {/* Projected Impact */}
              <GlassCard className="space-y-3 flex flex-col justify-between">
                <div>
                  <SectionHeader title="Projected Impact" />
                  <div className="mt-3 bg-emerald-50 border border-emerald-200/60 rounded-2xl p-4 flex items-center justify-between text-emerald-800">
                    <div>
                      <span className="text-[10px] uppercase font-mono font-medium tracking-wider text-emerald-700">Delay Reduction</span>
                      <p className="text-3xl font-bold font-mono mt-0.5">23%</p>
                    </div>
                    <TrendingDown className="size-8 text-emerald-600 animate-pulse-soft" />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Estimated via reinforcement learning simulation matching real-time queue data against historical fixed-cycle timing logs.
                </p>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
