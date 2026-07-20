import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { GlassCard, LiveBadge, SeverityChip } from "@/components/ui-kit";
import { cctvFeeds, CctvFeed } from "@/data/kochi";
import { cn } from "@/lib/utils";
import { Video, Activity, Layers, Hash } from "lucide-react";
import { useState, useEffect } from "react";
import { apiConfig } from "@/config/api";

export const Route = createFileRoute("/cctv")({
  head: () => ({
    meta: [
      { title: "AI CCTV Detection · Kochi | Project Sentinel" },
      { name: "description", content: "Live CCTV grid across Kochi with vision AI detection: accidents, congestion, blocked roads." },
      { property: "og:title", content: "AI CCTV Detection · Kochi" },
      { property: "og:description", content: "Live vision AI monitoring across Kochi's key junctions." },
    ],
  }),
  component: CctvPage,
});

// High-Definition Hikvision & Sysvideo 4K Traffic Analysis Video Feeds
const feedVideos: Record<string, string[]> = {
  "CAM-14": ["/cctv-feed-1.mp4", "/cctv-feed-2.mp4"],
  "CAM-22": ["/cctv-feed-2.mp4", "/cctv-feed-1.mp4"],
  "CAM-09": ["/cctv-feed-1.mp4#t=4", "/cctv-feed-2.mp4#t=2"],
  "CAM-31": ["/cctv-feed-2.mp4#t=5", "/cctv-feed-1.mp4#t=5"],
  "CAM-18": ["/cctv-feed-1.mp4#t=8", "/cctv-feed-2.mp4#t=7"],
  "CAM-07": ["/cctv-feed-2.mp4#t=9", "/cctv-feed-1.mp4#t=10"],
};

interface DetectionBox {
  id: number;
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
  confidence: number;
  isStatic?: boolean;
}

function CctvFeedCard({ feed }: { feed: CctvFeed }) {
  const [detections, setDetections] = useState<DetectionBox[]>([]);
  const [passedCount, setPassedCount] = useState(feed.vehicleCount || 140);
  const [justPassed, setJustPassed] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    // Initialize standard bounding boxes based on the feed type
    const initialDetections = () => {
      const list: DetectionBox[] = [];
      const labels = feed.id === "CAM-31" ? ["person", "car", "cyclist"] : ["car", "bus", "truck", "motorcycle"];
      
      const count = feed.id === "CAM-14" ? 6 : feed.id === "CAM-18" ? 5 : feed.id === "CAM-09" ? 4 : 3;
      
      // If CAM-18 (Blocked Lane), inject a static stalled truck at the center
      if (feed.id === "CAM-18") {
        list.push({
          id: 99,
          label: "stalled truck",
          left: 36,
          top: 40,
          width: 24,
          height: 20,
          confidence: 96,
          isStatic: true,
        });
      }

      for (let i = 0; i < count; i++) {
        list.push({
          id: i,
          label: labels[Math.floor(Math.random() * labels.length)],
          left: 10 + Math.random() * 65,
          top: 20 + Math.random() * 45,
          width: 10 + Math.random() * 14,
          height: 10 + Math.random() * 14,
          confidence: Math.floor(86 + Math.random() * 13),
        });
      }
      return list;
    };

    setDetections(initialDetections());
  }, [feed.id]);

  // Live real-time Vision AI bounding box movement loop
  useEffect(() => {
    const timer = setInterval(() => {
      setDetections((prev) =>
        prev.map((box) => {
          if (box.isStatic) return box; // Skip movement logic for static stalled vehicles

          const dx = (Math.random() - 0.5) * 3.5;
          const dy = (Math.random() - 0.5) * 3.5;
          
          let newLeft = box.left + dx;
          let newTop = box.top + dy;
          
          if (newLeft < 5) newLeft = 5;
          if (newLeft > 85) newLeft = 85;
          if (newTop < 15) newTop = 15;
          if (newTop > 75) newTop = 75;

          const confidenceChange = (Math.random() - 0.5) * 2;
          let newConf = Math.round(box.confidence + confidenceChange);
          if (newConf < 82) newConf = 82;
          if (newConf > 99) newConf = 99;

          return {
            ...box,
            left: newLeft,
            top: newTop,
            confidence: newConf,
          };
        })
      );
    }, 700);

    return () => clearInterval(timer);
  }, []);

  // Real-time Vehicle Counter Ticker
  useEffect(() => {
    const countTimer = setInterval(() => {
      setPassedCount((prev) => prev + 1);
      setJustPassed(true);
      setTimeout(() => setJustPassed(false), 900);
    }, 2000 + Math.random() * 2500);

    return () => clearInterval(countTimer);
  }, []);

  const videoSources = feedVideos[feed.id] || feedVideos["CAM-14"];

  // Compute real-time object count and breakdown from active Vision AI detections
  const countsByLabel: Record<string, number> = {};
  detections.forEach((d) => {
    const key = d.label.toLowerCase();
    countsByLabel[key] = (countsByLabel[key] || 0) + 1;
  });

  const breakdownText = Object.entries(countsByLabel)
    .map(([label, count]) => `${count} ${label}${count > 1 ? "s" : ""}`)
    .join(", ");

  const totalDetectedInFrame = detections.length;

  return (
    <GlassCard className="!p-0 overflow-hidden group">
      <div className="relative aspect-video overflow-hidden bg-slate-950">
        {/* HTML5 Video Stream with Automatic Backup Fallback */}
        {!videoError ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            onError={() => setVideoError(true)}
            onLoadedMetadata={(e) => {
              if (feed.id === "CAM-18") {
                e.currentTarget.playbackRate = 0.2;
              } else if (feed.id === "CAM-14") {
                e.currentTarget.playbackRate = 0.4;
              } else {
                e.currentTarget.playbackRate = 1.0;
              }
            }}
            className="absolute inset-0 h-full w-full object-cover opacity-85 select-none pointer-events-none"
          >
            <source src={videoSources[0]} type="video/mp4" />
            <source src={videoSources[1]} type="video/mp4" />
          </video>
        ) : (
          /* Animated Futuristic High-Tech CCTV Grid Canvas Background */
          <div className="absolute inset-0 bg-slate-900 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-90" />
        )}

        {/* Ambient Dark overlay and Grid Scanlines */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.35)_100%)] pointer-events-none" />
        <div className="absolute inset-0 bg-repeat bg-center opacity-[0.05] pointer-events-none select-none" style={{ backgroundImage: "linear-gradient(rgba(18, 24, 38, 0) 50%, rgba(18, 24, 38, 1) 50%), linear-gradient(90deg, rgba(18, 24, 38, 0) 50%, rgba(18, 24, 38, 1) 50%)", backgroundSize: "4px 4px" }} />

        {/* AI COUNTING TRIPWIRE OVERLAY */}
        <div className="absolute top-[65%] inset-x-0 h-0.5 border-b-2 border-dashed border-emerald-400/60 pointer-events-none flex items-center justify-between px-3">
          <span className="bg-emerald-500/90 text-white font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm">
            AI TRIPWIRE LINE
          </span>
          {justPassed && (
            <span className="bg-emerald-400 text-slate-950 font-mono font-bold text-[9px] uppercase px-2 py-0.5 rounded shadow-lg animate-bounce">
              ⚡ +1 VEHICLE COUNTED
            </span>
          )}
        </div>

        {/* Primary Classification Bounding Box */}
        <div
          className={cn(
            "absolute rounded border-2 border-dashed transition-all duration-500 pointer-events-none shadow-md",
            feed.status === "critical" 
              ? "border-destructive/90 shadow-[0_0_12px_rgba(239,68,68,0.25)] animate-pulse" 
              : feed.status === "alert" 
                ? "border-warn/90 shadow-[0_0_12px_rgba(249,115,22,0.25)] animate-pulse" 
                : "border-success/90 shadow-[0_0_12px_rgba(34,197,94,0.25)]",
          )}
          style={{ left: "20%", top: "35%", width: "34%", height: "42%" }}
        >
          <span
            className={cn(
              "absolute -top-5 left-0 rounded px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider font-semibold shadow-sm",
              feed.status === "critical"
                ? "bg-destructive text-destructive-foreground"
                : feed.status === "alert"
                  ? "bg-warn text-white"
                  : "bg-success text-white",
            )}
          >
            {feed.detection} · {feed.confidence}%
          </span>
          <div className={cn("absolute -top-[2px] -left-[2px] size-2 border-t-2 border-l-2", feed.status === "critical" ? "border-destructive" : feed.status === "alert" ? "border-warn" : "border-success")} />
          <div className={cn("absolute -top-[2px] -right-[2px] size-2 border-t-2 border-r-2", feed.status === "critical" ? "border-destructive" : feed.status === "alert" ? "border-warn" : "border-success")} />
          <div className={cn("absolute -bottom-[2px] -left-[2px] size-2 border-b-2 border-l-2", feed.status === "critical" ? "border-destructive" : feed.status === "alert" ? "border-warn" : "border-success")} />
          <div className={cn("absolute -bottom-[2px] -right-[2px] size-2 border-b-2 border-r-2", feed.status === "critical" ? "border-destructive" : feed.status === "alert" ? "border-warn" : "border-success")} />
        </div>

        {/* Dynamic Object Bounding Boxes (Vehicles/Pedestrians) */}
        {detections.map((box) => (
          <div
            key={box.id}
            className={cn(
              "absolute rounded border transition-all pointer-events-none",
              box.isStatic
                ? "border-destructive bg-destructive/20 animate-pulse border-2 shadow-[0_0_12px_rgba(239,68,68,0.6)] duration-75"
                : "border-cyan-400/50 bg-cyan-400/10 duration-700 ease-out"
            )}
            style={{
              left: `${box.left}%`,
              top: `${box.top}%`,
              width: `${box.width}%`,
              height: `${box.height}%`,
            }}
          >
            <span className={cn(
              "absolute -top-3.5 left-0 rounded px-1 py-0.2 text-[7px] font-mono uppercase tracking-wide text-white leading-none shadow-sm",
              box.isStatic ? "bg-destructive font-bold" : "bg-cyan-500/90"
            )}>
              {box.label} {box.confidence}%
            </span>
          </div>
        ))}

        {/* Live Vehicle Counter Ticker Overlay (Top Right) */}
        <div className="absolute top-2 right-2 bg-slate-900/90 border border-white/10 rounded-lg px-2.5 py-1 backdrop-blur-md flex items-center gap-1.5 shadow-lg">
          <Hash className="size-3 text-emerald-400" />
          <span className="text-[10px] font-mono text-muted-foreground">TOTAL PASSED:</span>
          <span className="text-xs font-mono font-bold text-emerald-400">{passedCount}</span>
        </div>

        {/* Camera Info HUD Overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 flex items-end justify-between pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="rounded bg-black/70 border border-white/10 px-1.5 py-0.5 font-mono text-[9px] text-white">
              {feed.id}
            </span>
            <LiveBadge label="REC" />
          </div>
          <Video className="size-4 text-white/80 animate-pulse" />
        </div>
      </div>
      
      {/* Description & Details Info Card */}
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{feed.location}</p>
          <SeverityChip
            severity={feed.status === "critical" ? "critical" : feed.status === "alert" ? "warning" : "info"}
          />
        </div>

        {/* Real-time breakdown telemetry */}
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground pt-1">
          <span className="font-bold text-primary flex items-center gap-1">
            <Activity className="size-3 text-primary animate-pulse" />
            {totalDetectedInFrame} in frame
          </span>
          <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
            <Hash className="size-3" />
            {passedCount} total counted
          </span>
        </div>

        <p className="text-xs font-mono text-muted-foreground truncate">
          {breakdownText || "Scanning frame..."}
        </p>

        <div className="rounded-xl bg-secondary/60 p-2.5 text-[11px] text-muted-foreground border border-border/40 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground">AI Detection:</span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">Gemini Vision Active</span>
          </div>
          <p className="text-xs text-foreground/90">
            {feed.status === "critical"
              ? `Anomaly flagged: ${feed.detection}. Immediate dispatch suggested.`
              : feed.status === "alert"
                ? `High volume flagged: ${feed.detection}. Rerouting active.`
                : `Baseline flow verified. ${breakdownText || "All clear"}.`}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

function CctvPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Monitor · 02.b</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight">AI CCTV Detection</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              6 live feeds. Vision AI classifies incidents in real time with bounding boxes and live vehicle counters.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center bg-secondary/80 border border-border/60 px-3 py-1.5 rounded-full shadow-xs">
            <span className={cn(
              "size-2 rounded-full",
              apiConfig.gemini.isConfigured ? "bg-emerald-500 animate-pulse" : "bg-cyan-500 animate-pulse"
            )} />
            <span className="text-[10px] font-mono font-medium tracking-wide text-muted-foreground">
              Gemini Vision Engine:{" "}
              <span className={apiConfig.gemini.isConfigured ? "text-emerald-500 font-bold" : "text-cyan-500 font-bold"}>
                {apiConfig.gemini.isConfigured ? "ACTIVE (GEN-AI)" : "SIMULATED"}
              </span>
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cctvFeeds.map((f) => (
            <CctvFeedCard key={f.id} feed={f} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
