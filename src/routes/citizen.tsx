import { createFileRoute, Link } from "@tanstack/react-router";
import { useSentinelStore } from "@/lib/store";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  AlertTriangle,
  MapPin,
  MessageSquare,
  User,
  Settings,
  Plus,
  Send,
  Sparkles,
  ShieldCheck,
  Droplets,
  CloudRain,
  Phone,
  Compass,
  X,
  UploadCloud,
  CheckCircle,
  CheckCircle2,
  Check,
  Shield,
  ChevronRight,
  Laptop,
  Camera,
  Video,
  Mic
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CityMap } from "@/components/city-map";
import { apiConfig } from "@/config/api";
import { generateGeminiResponse } from "@/lib/gemini";
import { replyFor } from "@/data/kochi";
import { toast } from "sonner";

export const Route = createFileRoute("/citizen")({
  head: () => ({
    meta: [
      { title: "Citizen Portal · Kochi | CityTwin AI" },
      { name: "description", content: "Kochi digital twin citizen portal. Report incidents, trigger SOS alerts, track active hazards, and view safe routes." },
    ],
  }),
  component: CitizenPortalPage,
});

type Tab = "home" | "report" | "map" | "alerts" | "reports" | "assistant" | "profile" | "settings";

function CitizenPortalPage() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [showSosModal, setShowSosModal] = useState(false);
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const { triggerSOS, incidents } = useSentinelStore();

  // Fetch current GPS location on mount
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentGps({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn("GPS access denied:", err.message);
          setGpsError(err.message);
          // Fallback to Kochi Center
          setCurrentGps({ lat: 9.9822, lng: 76.3116 });
        }
      );
    }
  }, []);

  const handleTriggerSOS = (type: "police" | "ambulance" | "fire" | "disaster") => {
    if (currentGps) {
      triggerSOS(type, currentGps);
      setShowSosModal(false);
      alert(`🚨 SOS ALERT SENT: Dispatching nearest ${type.toUpperCase()} unit to your location!`);
    } else {
      alert("GPS location loading... Please try again in a moment.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f6] text-slate-800 font-sans selection:bg-primary selection:text-primary-foreground flex flex-col">
      
      {/* Header Bar - Full Width on Desktop, Sticky on Mobile */}
      <header className="sticky top-0 w-full py-4 px-5 md:px-8 border-b border-slate-200/60 bg-white/90 backdrop-blur-xl flex justify-between items-center z-45 shrink-0 shadow-xs">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25">
              <span className="font-display font-bold text-sm">C</span>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900">Kochi Citizen</h1>
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">CityTwin AI Portal</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <button 
              onClick={() => setActiveTab("home")} 
              className={cn("px-3 py-2 rounded-xl transition-all hover:text-slate-900 cursor-pointer", activeTab === "home" && "bg-slate-100 text-slate-900")}
            >
              Home
            </button>
            <button 
              onClick={() => setActiveTab("map")} 
              className={cn("px-3 py-2 rounded-xl transition-all hover:text-slate-900 cursor-pointer", activeTab === "map" && "bg-slate-100 text-slate-900")}
            >
              Live Map
            </button>
            <button 
              onClick={() => setActiveTab("report")} 
              className={cn("px-3 py-2 rounded-xl transition-all hover:text-slate-900 cursor-pointer", activeTab === "report" && "bg-slate-100 text-slate-900")}
            >
              Report
            </button>
            <button 
              onClick={() => setActiveTab("alerts")} 
              className={cn("px-3 py-2 rounded-xl transition-all hover:text-slate-900 cursor-pointer", activeTab === "alerts" && "bg-slate-100 text-slate-900")}
            >
              Alerts
            </button>
            <button 
              onClick={() => setActiveTab("reports")} 
              className={cn("px-3 py-2 rounded-xl transition-all hover:text-slate-900 cursor-pointer", activeTab === "reports" && "bg-slate-100 text-slate-900")}
            >
              My Reports
            </button>
            <button 
              onClick={() => setActiveTab("assistant")} 
              className={cn("px-3 py-2 rounded-xl transition-all hover:text-slate-900 cursor-pointer", activeTab === "assistant" && "bg-slate-100 text-slate-900")}
            >
              Assistant
            </button>
          </nav>
        </div>

        {/* Header Right Panel */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab("profile")} 
            className={cn("hidden md:flex size-8 rounded-full bg-slate-100 items-center justify-center border border-slate-200 text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-900 cursor-pointer", activeTab === "profile" && "bg-primary text-white border-primary hover:bg-primary hover:text-white")}
            title="Profile"
          >
            <User className="size-4" />
          </button>
          <button 
            onClick={() => setActiveTab("settings")} 
            className={cn("hidden md:flex size-8 rounded-full bg-slate-100 items-center justify-center border border-slate-200 text-slate-600 transition-all hover:bg-slate-200 hover:text-slate-900 cursor-pointer", activeTab === "settings" && "bg-primary text-white border-primary hover:bg-primary hover:text-white")}
            title="Settings"
          >
            <Settings className="size-4" />
          </button>
          <Link
            to="/"
            className="text-xs flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-2 text-slate-700 border border-slate-200 hover:bg-slate-200 hover:-translate-y-0.5 transition-all font-semibold"
          >
            <Laptop className="size-3.5 text-slate-500" />
            Command Center
          </Link>
        </div>
      </header>

      {/* Main Responsive Grid Container */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-8 py-6 pb-24 md:pb-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {activeTab === "home" && <HomeScreen setActiveTab={setActiveTab} currentGps={currentGps} />}
            {activeTab === "report" && <ReportIncidentScreen currentGps={currentGps} />}
            {activeTab === "map" && <LiveMapScreen />}
            {activeTab === "alerts" && <AlertsScreen />}
            {activeTab === "reports" && <MyReportsScreen />}
            {activeTab === "assistant" && <AiAssistantScreen />}
            {activeTab === "profile" && <ProfileScreen />}
            {activeTab === "settings" && <SettingsScreen />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating SOS Trigger Button */}
      <button
        onClick={() => setShowSosModal(true)}
        className="fixed bottom-20 md:bottom-6 right-6 z-40 size-14 rounded-full bg-destructive flex items-center justify-center text-white shadow-lg shadow-destructive/30 border border-white/10 cursor-pointer animate-pulse-soft transition-transform hover:scale-105"
      >
        <span className="font-display font-bold text-xs uppercase tracking-wider">SOS</span>
      </button>

      {/* Mobile Bottom Tab Navigation Bar */}
      <nav className="fixed md:hidden bottom-0 inset-x-0 h-16 bg-white/95 border-t border-slate-200 backdrop-blur-xl flex justify-around items-center z-40 px-2 shrink-0 shadow-lg">
        <TabButton tab="home" label="Home" Icon={Home} activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton tab="map" label="Live Map" Icon={MapPin} activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton tab="report" label="Report" Icon={Plus} activeTab={activeTab} setActiveTab={setActiveTab} isMiddle />
        <TabButton tab="alerts" label="Alerts" Icon={AlertTriangle} activeTab={activeTab} setActiveTab={setActiveTab} badge={incidents.filter(i => i.severity === 'critical').length} />
        <TabButton tab="reports" label="Reports" Icon={CheckCircle} activeTab={activeTab} setActiveTab={setActiveTab} />
      </nav>

      {/* SOS Modal overlay */}
      {showSosModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-rise">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-destructive flex items-center gap-1.5">
                <AlertTriangle className="size-4 animate-bounce" />
                EMERGENCY SOS DISPATCH
              </h3>
              <button
                onClick={() => setShowSosModal(false)}
                className="size-7 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              CityTwin AI will immediately capture your GPS coordinates and broadcast an emergency SOS request directly to the Command Center. Select your emergency service below:
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <SosButton label="Police" desc="Crime & safety" color="bg-blue-600/90 hover:bg-blue-600" onClick={() => handleTriggerSOS("police")} />
              <SosButton label="Ambulance" desc="Medical support" color="bg-emerald-600/90 hover:bg-emerald-600" onClick={() => handleTriggerSOS("ambulance")} />
              <SosButton label="Fire Force" desc="Fire & rescue" color="bg-orange-600/90 hover:bg-orange-600" onClick={() => handleTriggerSOS("fire")} />
              <SosButton label="Disaster Ops" desc="Flood & rescue" color="bg-red-600/90 hover:bg-red-600" onClick={() => handleTriggerSOS("disaster")} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ----------------- TAB SUB-COMPONENTS -----------------

// Navigation Tab Button
function TabButton({
  tab,
  label,
  Icon,
  activeTab,
  setActiveTab,
  isMiddle = false,
  badge = 0
}: {
  tab: Tab;
  label: string;
  Icon: any;
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
  isMiddle?: boolean;
  badge?: number;
}) {
  const active = activeTab === tab;
  return (
    <button
      onClick={() => setActiveTab(tab)}
      className={cn(
        "flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer relative",
        isMiddle ? "bg-primary text-white size-10 rounded-2xl mx-1 max-w-[40px] shadow-lg shadow-primary/25 hover:scale-105" : "text-slate-400 hover:text-slate-700"
      )}
    >
      {!isMiddle ? (
        <>
          <Icon className={cn("size-5", active ? "text-primary" : "text-slate-400")} />
          <span className={cn("text-[9px] mt-0.5 font-medium", active ? "text-primary" : "text-slate-400")}>{label}</span>
          {badge > 0 && (
            <span className="absolute top-0.5 right-3 bg-destructive text-white text-[8px] font-bold px-1 rounded-full">
              {badge}
            </span>
          )}
        </>
      ) : (
        <Icon className="size-5 text-white" />
      )}
    </button>
  );
}

// SOS Selection Button
function SosButton({ label, desc, color, onClick }: { label: string; desc: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 rounded-2xl text-left border border-slate-100/10 transition-all text-white flex flex-col justify-between h-20 shadow-sm cursor-pointer",
        color
      )}
    >
      <span className="font-semibold text-xs uppercase tracking-wider">{label}</span>
      <span className="text-[9px] text-white/80">{desc}</span>
    </button>
  );
}

// ============================================
// 1. HOME SCREEN (RESPONSIVE LIGHT COLOR SCHEMA)
// ============================================
function HomeScreen({ setActiveTab, currentGps }: { setActiveTab: (t: Tab) => void; currentGps: any }) {
  const { incidents } = useSentinelStore();
  const today = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const activeIncidents = incidents.filter((i) => i.severity !== "resolved");

  return (
    <div className="space-y-5 pb-6">
      {/* Welcome Header */}
      <div className="flex justify-between items-end pt-1 pb-3 border-b border-slate-200/60">
        <div>
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{today} · Kochi, Kerala</p>
          <h2 className="text-2xl font-bold font-display tracking-tight text-slate-900">Hello, Resident</h2>
          <p className="text-xs text-slate-500 mt-1">Sentinel Digital Twin Citizens Portal is active.</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left Side: Stats and Gauges */}
        <div className="space-y-4 lg:col-span-1">
          {/* Safety Status */}
          <div className="rounded-3xl p-4 bg-emerald-50 flex items-center justify-between border border-emerald-200 text-emerald-800 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-emerald-100 flex items-center justify-center border border-emerald-200 text-emerald-600">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-800">Local Safety Status</h4>
                <p className="text-[9px] text-emerald-600 font-mono mt-0.5">
                  {currentGps ? `${currentGps.lat.toFixed(4)}° N, ${currentGps.lng.toFixed(4)}° E` : "Locating..."}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-200/60 px-3 py-1 text-[9px] font-bold text-emerald-700 uppercase tracking-widest">
              SAFE
            </span>
          </div>

          {/* Weather Widget */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-3xl p-3.5 border border-slate-200/60 flex items-center gap-2.5 shadow-xs">
              <CloudRain className="size-6 text-primary animate-pulse-soft shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] text-slate-400 block font-medium">Weather</span>
                <p className="text-xs font-bold text-slate-800 truncate">28°C · Rain</p>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-3.5 border border-slate-200/60 flex items-center gap-2.5 shadow-xs">
              <Droplets className="size-6 text-sky-500 shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] text-slate-400 block font-medium">Flood Risk</span>
                <p className="text-xs font-bold text-sky-600 truncate">Elevated (Walkway)</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <QuickActionCard
                title="Report Incident"
                desc="Vision AI classified"
                Icon={Plus}
                color="border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
                onClick={() => setActiveTab("report")}
              />
              <QuickActionCard
                title="Live Map"
                desc="Real-time map"
                Icon={Compass}
                color="border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-xs"
                onClick={() => setActiveTab("map")}
              />
            </div>
          </div>

          {/* Support Contacts */}
          <div className="rounded-3xl p-4 bg-red-50 border border-red-200">
            <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="size-3.5 animate-pulse-soft" />
              Emergency Support Hotlines
            </h4>
            <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-700">
              <a href="tel:112" className="flex items-center gap-1.5 p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-all"><span className="text-red-600 font-mono">112</span> Police Help</a>
              <a href="tel:108" className="flex items-center gap-1.5 p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-all"><span className="text-emerald-600 font-mono">108</span> Ambulance</a>
            </div>
          </div>
        </div>

        {/* Right Side: Map & Feed */}
        <div className="space-y-4 lg:col-span-2">
          {/* Map Preview */}
          <div className="bg-white rounded-3xl border border-slate-200/60 p-4 space-y-2 shadow-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Kochi Safety Twin</h3>
              <span className="text-[10px] text-primary hover:underline cursor-pointer font-semibold" onClick={() => setActiveTab("map")}>Open full screen →</span>
            </div>
            <div className="h-[280px] rounded-2xl overflow-hidden border border-slate-200">
              <CityMap height="100%" activeLayers={["traffic", "flood", "cctv"]} />
            </div>
          </div>

          {/* Active Incidents */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">Nearby Active Incidents</h3>
              <span className="text-[10px] text-slate-500 font-medium">Showing {activeIncidents.length} active</span>
            </div>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {activeIncidents.slice(0, 4).map((i) => (
                <li key={i.id} className="bg-white rounded-2xl p-3.5 border border-slate-200/60 flex items-center justify-between hover:bg-slate-50 transition-colors shadow-xs">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "size-2 rounded-full",
                      i.severity === "critical" ? "bg-destructive animate-pulse-soft" : i.severity === "warning" ? "bg-warn" : "bg-primary"
                    )} />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{i.title}</h4>
                      <p className="text-[9.5px] text-slate-500 mt-0.5 font-medium">{i.location} · {i.minutesAgo}m ago</p>
                    </div>
                  </div>
                  <span className="text-[9.5px] font-mono font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                    {i.confidence}%
                  </span>
                </li>
              ))}
              {activeIncidents.length === 0 && (
                <p className="col-span-2 text-xs text-slate-400 text-center py-6">All clear. No active incidents nearby.</p>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({
  title,
  desc,
  Icon,
  color,
  onClick
}: {
  title: string;
  desc: string;
  Icon: any;
  color: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 rounded-2xl border cursor-pointer hover:-translate-y-0.5 transition-transform shadow-xs",
        color
      )}
    >
      <Icon className="size-5 mb-1.5 animate-pulse-soft" />
      <h4 className="text-xs font-bold text-slate-800">{title}</h4>
      <p className="text-[9px] text-slate-400 mt-0.5">{desc}</p>
    </div>
  );
}

// ============================================
// 2. REPORT INCIDENT SCREEN
// ============================================
function ReportIncidentScreen({ currentGps }: { currentGps: any }) {
  const { addCitizenReport } = useSentinelStore();
  const [desc, setDesc] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // AI analysis auto-filled details card
  const [aiAnalysis, setAiAnalysis] = useState<{
    type: string;
    severity: Incident["severity"];
    priority: "high" | "medium" | "low";
    department: string;
    summary: string;
  } | null>(null);

  // Cycle through placeholder AI processing states before showing structured object
  const runAiAnalysis = () => {
    if (!desc.trim()) return;
    
    setProcessingState("Analyzing...");
    
    // Cycle to next state after 800ms
    setTimeout(() => {
      setProcessingState("Preparing AI Summary...");
      
      // Cycle to final state after another 800ms
      setTimeout(() => {
        setProcessingState("Waiting for AI...");
        
        // Output final structured object after another 800ms
        setTimeout(() => {
          setProcessingState(null);
          
          const text = desc.toLowerCase();
          let type = "Road Damage";
          let severity: Incident["severity"] = "warning";
          let priority: "high" | "medium" | "low" = "medium";
          let dept = "PWD Dept";
          let summary = "Civic damage report. Road maintenance required.";

          if (text.includes("accident") || text.includes("crash") || text.includes("hit")) {
            type = "Road Accident";
            severity = "critical";
            priority = "high";
            dept = "Emergency + Traffic";
            summary = "Vehicle collision telemetry matches critical priority response.";
          } else if (text.includes("flood") || text.includes("water") || text.includes("clog")) {
            type = "Water Logging";
            severity = "warning";
            priority = "high";
            dept = "Municipal Corp";
            summary = "Ponding hazards detected. High risk of pedestrian/vehicle obstruction.";
          } else if (text.includes("fire") || text.includes("smoke")) {
            type = "Fire Emergency";
            severity = "critical";
            priority = "high";
            dept = "Fire Force";
            summary = "Active fire hazard. High level dispatch required.";
          }

          // Structured incident object ready for future Gemini integration
          setAiAnalysis({
            type,
            severity,
            priority,
            department: dept,
            summary,
          });
        }, 800);
      }, 800);
    }, 800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim() || !aiAnalysis) return;

    addCitizenReport({
      title: aiAnalysis.type,
      citizen: "Citizen User",
      location: "Coordinates near current view",
      priority: aiAnalysis.priority,
      department: aiAnalysis.department,
      latitude: currentGps?.lat || 9.9822,
      longitude: currentGps?.lng || 76.3116,
      severity: aiAnalysis.severity,
      description: desc,
    });

    toast.success("Report live-synced to Kochi Command Center (http://localhost:8080/)!");
    setSubmitted(true);
    setDesc("");
    setAiAnalysis(null);
  };

  if (submitted) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-4 pt-12">
        <div className="size-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 animate-bounce">
          <CheckCircle className="size-8" />
        </div>
        <h3 className="text-lg font-bold font-display text-slate-800">Incident Reported!</h3>
        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
          Your report has been successfully processed and synchronized with the Project Sentinel Command Center. Emergency services are being alerted.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="rounded-full bg-primary text-white px-5 py-2.5 text-xs font-semibold hover:brightness-110 cursor-pointer"
        >
          Report Another Issue
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <h3 className="text-sm font-bold tracking-tight uppercase text-slate-300">Report an Incident</h3>
      
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Left: Input fields */}
        <form onSubmit={handleSubmit} className="space-y-4 lg:col-span-1">
          {/* Media simulation */}
          <div className="grid grid-cols-4 gap-2">
            <MediaIconButton label="Camera" Icon={Camera} onClick={() => setSelectedMedia("image_simulated.jpg")} />
            <MediaIconButton label="Video" Icon={Video} onClick={() => setSelectedMedia("video_simulated.mp4")} />
            <MediaIconButton label="Voice" Icon={Mic} onClick={() => setSelectedMedia("voice_audio.mp3")} />
            <MediaIconButton label="Upload" Icon={UploadCloud} onClick={() => setSelectedMedia("gallery_file.jpg")} />
          </div>

          {selectedMedia && (
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-3 py-2 text-xs text-slate-700">
              <span>Attached: {selectedMedia}</span>
              <button onClick={() => setSelectedMedia(null)} className="text-destructive hover:underline">Remove</button>
            </div>
          )}

          {/* Text Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">Describe the emergency</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              onBlur={runAiAnalysis}
              placeholder="Type incident details (e.g. 'Car accident at Kundannoor flyover' or 'Water logging on MG road')"
              className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs outline-none focus:border-primary min-h-[100px] text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* GPS location preview */}
          <div className="rounded-2xl border border-slate-200/60 bg-white p-3 flex items-start gap-3 shadow-xs">
            <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-slate-700">Incident GPS Location</p>
              <p className="text-[10px] text-slate-500 font-mono">
                {currentGps ? `${currentGps.lat.toFixed(6)}° N, ${currentGps.lng.toFixed(6)}° E` : "Locating GPS..."}
              </p>
              <p className="text-[9px] text-slate-400">Auto-detected via Browser Geolocation API</p>
            </div>
          </div>

          {/* Gemini AI Auto Classification Output Placeholders */}
          {processingState && (
            <div className="rounded-2xl p-4 bg-white border border-slate-200 flex items-center justify-center gap-2 shadow-xs">
              <Sparkles className="size-4 text-primary animate-spin" />
              <span className="text-xs text-slate-500 font-mono">{processingState}</span>
            </div>
          )}

          {aiAnalysis && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl p-4 bg-primary/5 border border-primary/20 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-wider">
                  <Sparkles className="size-3.5" />
                  Structured Incident Object (Ready for Gemini)
                </span>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[8px] font-bold uppercase text-white",
                  aiAnalysis.severity === "critical" ? "bg-destructive animate-pulse-soft" : "bg-warn"
                )}>
                  {aiAnalysis.severity}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600">
                <div>Type: <strong className="text-slate-800">{aiAnalysis.type}</strong></div>
                <div>Priority: <strong className="text-slate-800 uppercase">{aiAnalysis.priority}</strong></div>
                <div className="col-span-2">Department: <strong className="text-slate-800">{aiAnalysis.department}</strong></div>
              </div>

              <div className="bg-slate-100/85 p-2.5 rounded-xl text-[10.5px] leading-relaxed text-slate-600 border border-slate-200">
                <strong>Summary Slot:</strong> {aiAnalysis.summary}
              </div>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={!desc.trim() || !!processingState}
            className="w-full bg-primary text-white py-2.5 rounded-2xl font-bold text-xs hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-primary/20"
          >
            Submit Report to Command Center
          </button>
        </form>

        {/* Right: GPS verified Mapbox location selection */}
        <div className="bg-white rounded-3xl border border-slate-200/60 p-4 space-y-3 flex flex-col justify-between lg:col-span-1 min-h-[360px] shadow-xs">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="size-4 text-primary animate-pulse-soft" />
              Adjust Location on Map
            </h4>
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
              Verify your coordinates by checking the interactive map below. Double click or drag pins if manual correction is needed.
            </p>
          </div>
          <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200 relative">
            <CityMap height="100%" activeLayers={["cctv"]} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MediaIconButton({ label, Icon, onClick }: { label: string; Icon: any; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-2.5 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
    >
      <Icon className="size-4.5 text-slate-500" />
      <span className="text-[9px] font-medium text-slate-500">{label}</span>
    </button>
  );
}

// ============================================
// 3. LIVE MAP SCREEN
// ============================================
function LiveMapScreen() {
  const layers = [
    { key: "traffic", label: "Traffic" },
    { key: "flood", label: "Flood" },
    { key: "cctv", label: "CCTV" },
    { key: "transit", label: "Transit" },
  ];
  const [active, setActive] = useState<string[]>(["traffic", "flood", "cctv"]);
  const toggle = (k: string) =>
    setActive((a) => (a.includes(k) ? a.filter((x) => x !== k) : [...a, k]));

  return (
    <div className="h-full flex flex-col space-y-3 pb-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold tracking-tight uppercase text-slate-450">Live Digital Twin Map</h3>
        <div className="flex gap-1">
          {layers.map((l) => (
            <button
              key={l.key}
              onClick={() => toggle(l.key)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[9px] font-bold transition-all cursor-pointer",
                active.includes(l.key)
                  ? "border-primary bg-primary text-white shadow-sm shadow-primary/20"
                  : "border-slate-200 bg-white text-slate-500 hover:text-slate-800"
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[500px] md:min-h-[560px] rounded-3xl overflow-hidden border border-slate-200 relative">
        <CityMap height="100%" activeLayers={active} />
      </div>
    </div>
  );
}

// ============================================
// 4. ALERTS SCREEN
// ============================================
function AlertsScreen() {
  const { incidents } = useSentinelStore();
  const activeAlerts = incidents.filter((i) => i.severity !== "resolved");

  return (
    <div className="space-y-4 pb-4">
      <h3 className="text-sm font-bold tracking-tight uppercase text-slate-350">Public Alerts</h3>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {activeAlerts.map((alt) => (
          <div
            key={alt.id}
            className={cn(
              "rounded-2xl p-4 border flex flex-col justify-between space-y-3 hover:bg-slate-50 transition-colors shadow-xs bg-white",
              alt.severity === "critical" ? "border-red-200/60" : "border-slate-200"
            )}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[8px] font-bold uppercase text-white",
                  alt.severity === "critical" ? "bg-destructive animate-pulse-soft" : "bg-warn"
                )}>
                  {alt.severity}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">{alt.minutesAgo}m ago</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">{alt.title}</h4>
                <p className="text-[10.5px] text-slate-500 mt-0.5 font-medium">{alt.location}</p>
              </div>
            </div>
            <div className="text-[9.5px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <strong>Traffic Advisory:</strong> Prioritized routing active. Follow signals override rules.
            </div>
          </div>
        ))}

        {activeAlerts.length === 0 && (
          <p className="col-span-full text-xs text-slate-500 text-center py-12">All clear. No active alerts reported for Kochi.</p>
        )}
      </div>
    </div>
  );
}

// ============================================
// 5. MY REPORTS (TIMELINE LAYOUT)
// ============================================
function MyReportsScreen() {
  const { citizenReports } = useSentinelStore();
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  const getStatusIndex = (status: string) => {
    switch (status) {
      case "verifying": return 0;
      case "verified": return 1;
      case "assigned": return 2;
      case "resolved": return 4;
      default: return 3; // response started
    }
  };

  const steps = [
    { label: "Submitted", sub: "Ticket Logged" },
    { label: "AI Verified", sub: "Vision Validated" },
    { label: "Assigned", sub: "Dept Notified" },
    { label: "Response", sub: "Unit En Route" },
    { label: "Resolved", sub: "Issue Closed" },
  ];

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/60 pb-3">
        <div>
          <h3 className="text-base font-display font-bold text-slate-800 tracking-tight uppercase">My Submitted Reports</h3>
          <p className="text-xs text-slate-500">Track real-time resolution progress, AI verification, and field team response across Kochi.</p>
        </div>
        <span className="self-start sm:self-center rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-mono font-bold text-primary">
          {citizenReports.length} Active Tickets
        </span>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {citizenReports.map((rep) => {
          const activeIndex = getStatusIndex(rep.status);
          
          return (
            <div
              key={rep.id}
              className="group relative bg-white/95 rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-5"
            >
              {/* Top Bar: Title, ID & Status Badge */}
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600 border border-slate-200">
                        {rep.id}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-medium">
                        {rep.minutesAgo}m ago
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">
                      {rep.title}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <MapPin className="size-3.5 text-slate-400 shrink-0" />
                      {rep.location}
                    </p>
                  </div>

                  <span className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border shrink-0 shadow-2xs",
                    rep.status === "resolved" 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                      : rep.status === "assigned"
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-cyan-50 border-cyan-200 text-cyan-700"
                  )}>
                    {rep.status === "resolved" && <CheckCircle2 className="size-3 text-emerald-600" />}
                    {rep.status === "assigned" && <Shield className="size-3 text-blue-600" />}
                    {rep.status !== "resolved" && rep.status !== "assigned" && <Sparkles className="size-3 text-cyan-600" />}
                    {rep.status}
                  </span>
                </div>

                {/* Ultra-Clean Stepper Progress Bar */}
                <div className="pt-2 pb-1 px-1">
                  <div className="flex justify-between items-center relative">
                    {/* Background Track Line */}
                    <div className="absolute left-3 right-3 h-1 bg-slate-100 -translate-y-1/2 top-3 -z-10 rounded-full" />
                    {/* Active Gradient Connector Line */}
                    <div 
                      className="absolute left-3 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 -translate-y-1/2 top-3 -z-10 transition-all duration-700 rounded-full" 
                      style={{ width: `${(activeIndex / 4) * 92}%` }}
                    />

                    {steps.map((step, idx) => {
                      const isDone = idx <= activeIndex;
                      const isCurrent = idx === activeIndex;
                      return (
                        <div key={step.label} className="flex flex-col items-center">
                          <div className={cn(
                            "size-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all shadow-xs",
                            isCurrent
                              ? "bg-primary text-white scale-110 ring-4 ring-primary/20 shadow-md animate-pulse-soft"
                              : isDone
                                ? "bg-primary text-white"
                                : "bg-white border-2 border-slate-200 text-slate-400"
                          )}>
                            {isDone ? <Check className="size-3.5 stroke-[3]" /> : idx + 1}
                          </div>
                          <span className={cn(
                            "text-[9.5px] mt-1.5 font-semibold text-center leading-tight",
                            isCurrent ? "text-primary font-bold" : isDone ? "text-slate-700" : "text-slate-400"
                          )}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer Info & Details */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-xs">
                    Department: <strong className="text-slate-800 font-semibold">{rep.department}</strong>
                  </span>
                  <span className={cn(
                    "rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                    rep.priority === "high" ? "bg-rose-100 text-rose-700" : rep.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                  )}>
                    {rep.priority} priority
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    toast.info(`Tracking Report ${rep.id}`, {
                      description: `Assigned to ${rep.department} field unit. Resolution ETA: 25 min.`,
                    });
                  }}
                  className="h-8 gap-1 text-[11px] font-semibold text-primary border-primary/30 hover:bg-primary/5 cursor-pointer rounded-xl"
                >
                  Track <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// 6. AI ASSISTANT SCREEN (LIGHT CHAT BUBBLES)
// ============================================
function AiAssistantScreen() {
  const [messages, setMessages] = useState<any[]>([
    { id: "greet", role: "assistant", text: "Hello! I'm CityTwin AI, your Kochi City assistant. How can I help you navigate safety or report hazards today?" },
  ]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const prompts = ["Is this road safe?", "Nearest hospital", "Report emergency", "Flood status"];

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    const userMsg = { id: Math.random().toString(), role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    if (apiConfig.gemini.isConfigured) {
      try {
        const reply = await generateGeminiResponse(text);
        setMessages((m) => [...m, { id: Math.random().toString(), role: "assistant", text: reply }]);
      } catch (err: any) {
        console.error("Gemini citizen assistant error:", err);
        setMessages((m) => [
          ...m,
          {
            id: Math.random().toString(),
            role: "assistant",
            text: replyFor(text),
          },
        ]);
      }
    } else {
      setTimeout(() => {
        setMessages((m) => [...m, { id: Math.random().toString(), role: "assistant", text: replyFor(text) }]);
      }, 500);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="max-w-2xl mx-auto h-[560px] flex flex-col justify-between pb-4 bg-white border border-slate-200/60 rounded-3xl p-4 shadow-xs">
      <h3 className="text-sm font-bold tracking-tight uppercase text-slate-350 font-mono">CityTwin AI Assistant</h3>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 py-4 pr-1">
        {messages.map((m) => (
          <div key={m.id} className={cn("flex gap-2 text-xs", m.role === "user" && "flex-row-reverse")}>
            <div className={cn(
              "p-3 rounded-2xl max-w-[80%] leading-relaxed shadow-2xs",
              m.role === "user" ? "bg-primary text-white rounded-tr-sm" : "bg-slate-50 border border-slate-200 text-slate-700 rounded-tl-sm"
            )}>
              <span className="whitespace-pre-line font-medium">{m.text}</span>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 shrink-0">
        {prompts.map((p) => (
          <button
            key={p}
            onClick={() => handleSend(p)}
            className="text-[10px] border border-slate-200 bg-white text-slate-600 px-3.5 py-1.5 rounded-full whitespace-nowrap hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs font-semibold"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shrink-0 shadow-2xs">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
          placeholder="Ask CityTwin AI..."
          className="flex-1 bg-transparent px-2 text-xs outline-none text-slate-700 placeholder-slate-400"
        />
        <button
          onClick={() => handleSend(input)}
          className="size-8 rounded-xl bg-primary flex items-center justify-center text-white cursor-pointer hover:brightness-110"
        >
          <Send className="size-3.5 text-white" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// 7. PROFILE SCREEN
// ============================================
function ProfileScreen() {
  return (
    <div className="max-w-md mx-auto space-y-4 pb-4">
      <h3 className="text-sm font-bold tracking-tight uppercase text-slate-350 font-mono">My Profile</h3>

      <div className="bg-white rounded-3xl p-4 border border-slate-200/60 text-center space-y-2 shadow-xs">
        <div className="size-16 rounded-full bg-slate-100 border border-slate-200 mx-auto flex items-center justify-center text-slate-600 text-lg font-bold">
          RS
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-800">Rahul Sharma</h4>
          <p className="text-[10px] text-slate-500 font-mono">+91 98456 22104</p>
        </div>
      </div>

      <div className="space-y-2.5">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">Emergency Contacts</h4>
        <div className="bg-white rounded-2xl p-3 border border-slate-200/60 text-xs flex justify-between items-center shadow-xs">
          <div>
            <p className="font-semibold text-slate-700">Sita Sharma (Spouse)</p>
            <p className="text-[9px] text-slate-500 font-mono">+91 94567 11203</p>
          </div>
          <a href="tel:9456711203" className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center hover:bg-emerald-500/20"><Phone className="size-3.5" /></a>
        </div>
      </div>

      <div className="space-y-2.5">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">Saved Locations</h4>
        <div className="bg-white rounded-2xl p-3 border border-slate-200/60 text-xs space-y-2 shadow-xs text-slate-700">
          <div className="flex justify-between items-center">
            <span>🏠 Home: MG Road, Ernakulam</span>
            <span className="text-[9px] text-primary hover:underline cursor-pointer">Edit</span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-100 pt-2">
            <span>🏢 Work: Kakkanad Infopark</span>
            <span className="text-[9px] text-primary hover:underline cursor-pointer">Edit</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 8. SETTINGS SCREEN
// ============================================
function SettingsScreen() {
  const { mapboxToken, setMapboxToken } = useSentinelStore();
  const [tokenInput, setTokenInput] = useState(mapboxToken);

  const handleSaveToken = () => {
    setMapboxToken(tokenInput);
    alert("Mapbox Access Token saved successfully!");
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-4">
      <h3 className="text-sm font-bold tracking-tight uppercase text-slate-350 font-mono">Settings</h3>

      <div className="space-y-3">
        {/* API Integration Status dashboard */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/60 space-y-3 shadow-xs">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="size-4 text-primary" />
            API Connection Dashboard
          </h4>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Sentinel interfaces with multiple external telemetry and AI networks. Review your secret key statuses below:
          </p>

          <div className="space-y-2 text-[10.5px]">
            {/* Mapbox */}
            <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200/50">
              <div>
                <span className="font-semibold block text-slate-700 font-mono">Mapbox SDK & Directions</span>
                <span className="text-[9px] text-slate-400">Map rendering and routing geometry</span>
              </div>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase",
                apiConfig.mapbox.isConfigured ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
              )}>
                {apiConfig.mapbox.isConfigured ? "Custom Key Connected" : "Using CartoDB Fallback"}
              </span>
            </div>

            {/* Gemini */}
            <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200/50">
              <div>
                <span className="font-semibold block text-slate-700 font-mono">Gemini AI Engine</span>
                <span className="text-[9px] text-slate-400 font-medium">Automated classification & chat responses</span>
              </div>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase",
                apiConfig.gemini.isConfigured ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              )}>
                {apiConfig.gemini.isConfigured ? "Gemini Key Loaded" : "Simulation Mode"}
              </span>
            </div>

            {/* OpenWeather */}
            <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200/50">
              <div>
                <span className="font-semibold block text-slate-700 font-mono">OpenWeather Telemetry</span>
                <span className="text-[9px] text-slate-400">Real-time local environmental sensors</span>
              </div>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase",
                apiConfig.openWeather.isConfigured ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              )}>
                {apiConfig.openWeather.isConfigured ? "Weather Key Loaded" : "Simulation Mode"}
              </span>
            </div>

            {/* Firebase Placeholder */}
            <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200/50 opacity-60">
              <div>
                <span className="font-semibold block text-slate-700 font-mono">Firebase Operations (Future Slot)</span>
                <span className="text-[9px] text-slate-400 font-medium">Database synchronization & alerts push</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase bg-slate-200 text-slate-500">
                Placeholder Slot
              </span>
            </div>

            {/* Supabase Placeholder */}
            <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200/50 opacity-60">
              <div>
                <span className="font-semibold block text-slate-700 font-mono">Supabase Platform (Future Slot)</span>
                <span className="text-[9px] text-slate-400 font-medium">Public logs bucket & auth database</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase bg-slate-200 text-slate-500">
                Placeholder Slot
              </span>
            </div>
          </div>

          {/* Friendly Key Setup Guide */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/50 text-[9.5px] leading-relaxed text-slate-500">
            <strong className="text-slate-700 block mb-1">🔑 Setup environment variables locally:</strong>
            Create a <code className="bg-slate-100 px-1 py-0.5 rounded border border-slate-250 text-slate-700">.env</code> file at your project root and supply keys:
            <pre className="mt-1 text-[8.5px] font-mono text-slate-650 bg-slate-100/60 p-2 rounded-xl border border-slate-200 overflow-x-auto">
{`VITE_MAPBOX_ACCESS_TOKEN=your_token_here
VITE_GEMINI_API_KEY=your_key_here
VITE_OPENWEATHER_API_KEY=your_key_here`}
            </pre>
            Restart your dev server to apply. CityTwin AI runs safely with open-source fallbacks if keys are left blank.
          </div>
        </div>

        {/* Mapbox Token config */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/60 space-y-3 shadow-xs">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Compass className="size-4 text-primary" />
            Quick Mapbox Token Override
          </h4>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Enter a temporary token here to override environment settings. Saves in browser local storage.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="pk.eyJ1I..."
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10.5px] outline-none focus:border-primary text-slate-700 shadow-2xs"
            />
            <button
              onClick={handleSaveToken}
              className="bg-primary text-white px-4 rounded-xl text-xs font-semibold hover:brightness-110 cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>

        {/* Toggle options */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/60 space-y-3 text-xs shadow-xs text-slate-700">
          <div className="flex justify-between items-center">
            <span>Location Permissions</span>
            <span className="text-emerald-600 font-bold">GRANTED</span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-100 pt-2.5">
            <span>Push Notifications</span>
            <span className="text-emerald-600 font-bold">ENABLED</span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-100 pt-2.5">
            <span>Portal Language</span>
            <span className="text-slate-500">English (Malayalam toggle)</span>
          </div>
        </div>

        <div className="text-center text-[9px] text-slate-400 font-medium">
          CityTwin AI Citizen app · v1.4.0 (Kochi Metro Ops)
        </div>
      </div>
    </div>
  );
}
