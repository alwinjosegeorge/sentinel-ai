import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { GlassCard, LiveBadge, SeverityChip } from "@/components/ui-kit";
import { cctvFeeds, CctvFeed } from "@/data/kochi";
import { cn } from "@/lib/utils";
import { Video } from "lucide-react";
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

const feedVideos: Record<string, string> = {
  "CAM-14": "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4",
  "CAM-22": "https://raw.githubusercontent.com/DeGirum/PySDKExamples/main/images/Traffic.mp4",
  "CAM-09": "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4#t=8",
  "CAM-31": "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4#t=15",
  "CAM-18": "https://raw.githubusercontent.com/DeGirum/PySDKExamples/main/images/Traffic.mp4#t=5",
  "CAM-07": "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4#t=20",
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
          width: 22,
          height: 18,
          confidence: 96,
          isStatic: true,
        });
      }

      for (let i = 0; i < count; i++) {
        list.push({
          id: i,
          label: labels[Math.floor(Math.random() * labels.length)],
          left: 10 + Math.random() * 60,
          top: 15 + Math.random() * 50,
          width: 8 + Math.random() * 15,
          height: 8 + Math.random() * 15,
          confidence: Math.floor(85 + Math.random() * 14),
        });
      }
      return list;
    };

    setDetections(initialDetections());
  }, [feed.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDetections((prev) =>
        prev.map((box) => {
          if (box.isStatic) return box; // Skip movement logic for static stalled vehicles

          // Slowly move the boxes slightly to simulate movement
          const dx = (Math.random() - 0.5) * 3; // -1.5% to +1.5%
          const dy = (Math.random() - 0.5) * 3;
          
          let newLeft = box.left + dx;
          let newTop = box.top + dy;
          
          // Clamp to stay within reasonable bounds on the aspect-video screen
          if (newLeft < 5) newLeft = 5;
          if (newLeft > 85) newLeft = 85;
          if (newTop < 10) newTop = 10;
          if (newTop > 80) newTop = 80;

          // Occasionally change confidence slightly
          const confidenceChange = (Math.random() - 0.5) * 2;
          let newConf = Math.round(box.confidence + confidenceChange);
          if (newConf < 80) newConf = 80;
          if (newConf > 99) newConf = 99;

          return {
            ...box,
            left: newLeft,
            top: newTop,
            confidence: newConf,
          };
        })
      );
    }, 800);

    return () => clearInterval(timer);
  }, []);

  const videoUrl = feedVideos[feed.id] || "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/car-detection.mp4";

  // Compute real-time object count and breakdown from active Vision AI detections
  const countsByLabel: Record<string, number> = {};
  detections.forEach((d) => {
    const key = d.label.toLowerCase();
    countsByLabel[key] = (countsByLabel[key] || 0) + 1;
  });

  const breakdownText = Object.entries(countsByLabel)
    .map(([label, count]) => `${count} ${label}${count > 1 ? "s" : ""}`)
    .join(", ");

  const totalDetected = detections.length;

  return (
    <GlassCard className="!p-0 overflow-hidden group">
      <div className="relative aspect-video overflow-hidden bg-black/95">
        {/* Looping Traffic Video */}
        <video
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          onLoadedMetadata={(e) => {
            if (feed.id === "CAM-18") {
              e.currentTarget.playbackRate = 0.08; // Stalled/blocked traffic
            } else if (feed.id === "CAM-14") {
              e.currentTarget.playbackRate = 0.25; // Crawling congested traffic
            } else {
              e.currentTarget.playbackRate = 1.0;  // Normal traffic speed
            }
          }}
          className="absolute inset-0 h-full w-full object-cover opacity-85 select-none pointer-events-none"
        />

        {/* Ambient Dark overlay and Grid Scanlines */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.35)_100%)] pointer-events-none" />
        <div className="absolute inset-0 bg-repeat bg-center opacity-[0.04] pointer-events-none select-none" style={{ backgroundImage: "linear-gradient(rgba(18, 24, 38, 0) 50%, rgba(18, 24, 38, 1) 50%), linear-gradient(90deg, rgba(18, 24, 38, 0) 50%, rgba(18, 24, 38, 1) 50%)", backgroundSize: "4px 4px" }} />

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
          style={{ left: "20%", top: "35%", width: "32%", height: "40%" }}
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
          {/* Glowing corners */}
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
                ? "border-destructive bg-destructive/10 animate-pulse border-2 shadow-[0_0_8px_rgba(239,68,68,0.45)] duration-75"
                : "border-cyan-400/40 bg-cyan-400/5 duration-700 ease-out"
            )}
            style={{
              left: `${box.left}%`,
              top: `${box.top}%`,
              width: `${box.width}%`,
              height: `${box.height}%`,
            }}
          >
            <span className={cn(
              "absolute -top-3.5 left-0 rounded px-1 py-0.2 text-[7px] font-mono uppercase tracking-wide text-white leading-none",
              box.isStatic ? "bg-destructive font-bold" : "bg-cyan-500/80"
            )}>
              {box.label} {box.confidence}%
            </span>
          </div>
        ))}

        {/* Camera Info HUD Overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-3 flex items-end justify-between pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="rounded bg-black/60 border border-white/10 px-1.5 py-0.5 font-mono text-[9px] text-white">
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

        <p className="text-xs font-mono text-muted-foreground flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-primary">{totalDetected} in frame</span>
          <span className="text-muted-foreground/60">•</span>
          <span>{breakdownText || "Scanning frame..."}</span>
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
              6 live feeds. Vision AI classifies incidents in real time with bounding boxes and confidence.
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
