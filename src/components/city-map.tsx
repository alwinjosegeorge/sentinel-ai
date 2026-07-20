import { useEffect, useRef, useState } from "react";
import { type Incident } from "@/data/kochi";
import { cn } from "@/lib/utils";
import { useSentinelStore, schematicToLngLat } from "@/lib/store";
import { ShieldAlert, Video, Eye, Navigation, CheckCircle, Zap } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface Props {
  height?: number | string;
  className?: string;
  pins?: Incident[];
  interactive?: boolean;
  routingMode?: boolean;
  startLocation?: { lng: number; lat: number };
  endLocation?: { lng: number; lat: number };
  activeLayers?: string[];
}

export function CityMap({
  height = 480,
  className,
  pins,
  interactive = true,
  routingMode = false,
  startLocation,
  endLocation,
  activeLayers = ["traffic", "flood", "cctv", "transit", "emergency"],
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const { incidents, resolveIncident, greenCorridorActive } = useSentinelStore();

  // Selected marker details for popups
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedCctv, setSelectedCctv] = useState<any | null>(null);
  const [showAiExplanation, setShowAiExplanation] = useState(false);

  // Routing metrics
  const [routeInfo, setRouteInfo] = useState<{
    distanceKm: number;
    durationMin: number;
    timeSavedMin: number;
    geometry: [number, number][];
  } | null>(null);

  // Dynamic light/dark theme tracking
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  // Use either custom pins or the store incidents
  const displayPins = pins || incidents;

  // Track theme changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let L: any;
    let isCancelled = false;

    import("leaflet").then((leafletModule) => {
      if (isCancelled || !mapContainerRef.current) return;
      L = leafletModule.default ?? leafletModule;

      // Clean up previous map instance if any
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const kochiCenter: [number, number] = [9.9822, 76.3116]; // [lat, lng] for Leaflet

      const map = L.map(mapContainerRef.current, {
        center: kochiCenter,
        zoom: 12,
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: interactive,
        doubleClickZoom: interactive,
        attributionControl: false,
      });

      mapRef.current = map;

      // Add Tile Layer (CartoDB Voyager for light / CartoDB Dark Matter for dark)
      const tileUrl = isDarkMode
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      // Create Layer Groups
      const layerGroup = L.layerGroup().addTo(map);
      const routeLayer = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      routeLayerRef.current = routeLayer;

      // Fix container resize glitches
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 200);
    });

    return () => {
      isCancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isDarkMode]);

  // Update Overlays and Markers when activeLayers or pins change
  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current || !layerGroupRef.current) return;

    import("leaflet").then((leafletModule) => {
      const L = leafletModule.default ?? leafletModule;
      const layerGroup = layerGroupRef.current;
      if (!layerGroup) return;

      layerGroup.clearLayers();

      // 1. Flood Polygons (Marine Drive & Low Catchments)
      if (activeLayers.includes("flood")) {
        const marineDrivePolygon: [number, number][] = [
          [9.988, 76.270],
          [9.986, 76.278],
          [9.975, 76.275],
          [9.978, 76.268],
        ];

        const kundannoorPolygon: [number, number][] = [
          [9.932, 76.308],
          [9.934, 76.315],
          [9.928, 76.316],
          [9.926, 76.309],
        ];

        L.polygon(marineDrivePolygon, {
          color: "#0284c7",
          fillColor: "#38bdf8",
          fillOpacity: 0.35,
          weight: 2,
        }).addTo(layerGroup);

        L.polygon(kundannoorPolygon, {
          color: "#0284c7",
          fillColor: "#38bdf8",
          fillOpacity: 0.3,
          weight: 2,
        }).addTo(layerGroup);
      }

      // 2. Transit Line (Kochi Metro)
      if (activeLayers.includes("transit")) {
        const metroCoords: [number, number][] = [
          [10.080, 76.350], // Aluva
          [10.024, 76.316], // Edappally
          [10.003, 76.299], // Palarivattom
          [9.972, 76.282],  // MG Road
          [9.967, 76.321],  // Vytilla
          [9.955, 76.345],  // Tripunithura
        ];

        L.polyline(metroCoords, {
          color: "#a855f7",
          weight: 4,
          opacity: 0.8,
          dashArray: "6, 6",
        }).addTo(layerGroup);
      }

      // 3. Add Incident Markers
      displayPins.forEach((p) => {
        const lng = p.lng ?? schematicToLngLat(p.x, p.y)[0];
        const lat = p.lat ?? schematicToLngLat(p.x, p.y)[1];

        const colorClass =
          p.severity === "critical"
            ? "bg-destructive"
            : p.severity === "warning"
              ? "bg-warn"
              : p.severity === "resolved"
                ? "bg-success"
                : "bg-primary";

        const isPulse = p.severity === "critical" || p.severity === "warning";

        const html = `
          <div class="relative flex items-center justify-center cursor-pointer">
            <span class="relative flex h-5 w-5">
              ${isPulse ? `<span class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${colorClass}"></span>` : ""}
              <span class="relative inline-flex rounded-full h-5 w-5 border-2 border-white dark:border-black ${colorClass} shadow-md"></span>
            </span>
          </div>
        `;

        const icon = L.divIcon({
          html,
          className: "custom-div-icon",
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        const marker = L.marker([lat, lng], { icon }).addTo(layerGroup);

        marker.on("click", () => {
          setSelectedIncident(p);
          setSelectedCctv(null);
          setShowAiExplanation(false);
          mapRef.current?.flyTo([lat, lng], 14, { duration: 0.8 });
        });
      });

      // 4. CCTV Cameras (if active)
      if (activeLayers.includes("cctv")) {
        const cctvFeeds = [
          { id: "CAM-14", location: "Vytilla Junction", lng: 76.3218, lat: 9.9678, status: "alert" },
          { id: "CAM-22", location: "MG Road", lng: 76.2828, lat: 9.9722, status: "normal" },
          { id: "CAM-09", location: "Kundannoor", lng: 76.3116, lat: 9.9366, status: "critical" },
          { id: "CAM-18", location: "Edappally NH-66", lng: 76.3090, lat: 10.0250, status: "critical" },
          { id: "CAM-07", location: "Kakkanad", lng: 76.3533, lat: 10.0159, status: "normal" },
        ];

        cctvFeeds.forEach((cam) => {
          const bgClass =
            cam.status === "critical"
              ? "bg-destructive text-white"
              : cam.status === "alert"
                ? "bg-warn text-white"
                : "bg-primary text-primary-foreground";

          const html = `
            <div class="grid size-7 place-items-center rounded-lg border border-white dark:border-black ${bgClass} shadow-lg cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
            </div>
          `;

          const icon = L.divIcon({
            html,
            className: "custom-cctv-icon",
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          const marker = L.marker([cam.lat, cam.lng], { icon }).addTo(layerGroup);

          marker.on("click", () => {
            setSelectedCctv(cam);
            setSelectedIncident(null);
            mapRef.current?.flyTo([cam.lat, cam.lng], 14, { duration: 0.8 });
          });
        });
      }
    });
  }, [displayPins, activeLayers]);

  // Handle Routing (OSRM Driving directions API)
  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current || !routeLayerRef.current) return;

    import("leaflet").then((leafletModule) => {
      const L = leafletModule.default ?? leafletModule;
      const routeLayer = routeLayerRef.current;
      if (!routeLayer) return;

      routeLayer.clearLayers();

      if (!routingMode || !startLocation || !endLocation) {
        setRouteInfo(null);
        return;
      }

      const fetchRoute = async () => {
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${startLocation.lng},${startLocation.lat};${endLocation.lng},${endLocation.lat}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          const data = await res.json();

          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const coords = route.geometry.coordinates as [number, number][];
            const latLngs: [number, number][] = coords.map(([lng, lat]) => [lat, lng]);

            const distanceKm = +(route.distance / 1000).toFixed(1);
            const baseDuration = Math.round(route.duration / 60);
            const durationMin = greenCorridorActive ? Math.round(baseDuration * 0.7) : baseDuration;
            const timeSavedMin = greenCorridorActive ? Math.round(baseDuration * 0.3) : 0;

            setRouteInfo({
              distanceKm,
              durationMin,
              timeSavedMin,
              geometry: coords,
            });

            // Draw route polyline on Leaflet map
            const polyline = L.polyline(latLngs, {
              color: greenCorridorActive ? "#10b981" : "#3b82f6",
              weight: 6,
              opacity: 0.85,
            }).addTo(routeLayer);

            // Fit map bounds around route
            mapRef.current?.fitBounds(polyline.getBounds(), { padding: [40, 40] });
          }
        } catch (err) {
          console.error("OSRM Route fetching error:", err);
        }
      };

      fetchRoute();
    });
  }, [routingMode, startLocation, endLocation, greenCorridorActive]);

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm", className)}>
      <div ref={mapContainerRef} style={{ height, width: "100%" }} className="z-0" />

      {/* Selected Incident Popup Panel */}
      {selectedIncident && (
        <div className="absolute bottom-4 left-4 right-4 z-20 max-w-md rounded-2xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 lg:left-4 lg:right-auto">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground text-sm">{selectedIncident.title}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                    selectedIncident.severity === "critical"
                      ? "bg-destructive/20 text-destructive"
                      : selectedIncident.severity === "warning"
                        ? "bg-warn/20 text-warn"
                        : "bg-success/20 text-success"
                  )}
                >
                  {selectedIncident.severity}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedIncident.location} · {selectedIncident.department} · {selectedIncident.minutesAgo}m ago
              </p>
            </div>
            <button
              onClick={() => setSelectedIncident(null)}
              className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => resolveIncident(selectedIncident.id)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-success px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:opacity-90"
            >
              <CheckCircle className="size-3.5" />
              Resolve Incident
            </button>
            <button
              onClick={() => setShowAiExplanation(!showAiExplanation)}
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
            >
              <Zap className="size-3.5 text-primary" />
              {showAiExplanation ? "Hide AI Logic" : "AI Explain"}
            </button>
          </div>

          {showAiExplanation && (
            <div className="mt-3 rounded-xl bg-secondary/80 p-3 text-xs text-muted-foreground animate-in fade-in">
              <p className="font-semibold text-foreground">AI Dispatch Logic:</p>
              <p className="mt-1">
                Detected high-severity anomaly from CCTV sensors. Rerouted nearest municipal unit and prioritized signal phase clearing.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Selected CCTV Popup Panel */}
      {selectedCctv && (
        <div className="absolute bottom-4 left-4 right-4 z-20 max-w-md rounded-2xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 lg:left-4 lg:right-auto">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Video className="size-4 text-primary" />
                <span className="font-semibold text-foreground text-sm">{selectedCctv.id} · {selectedCctv.location}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Vision AI Stream · Active Object Detection</p>
            </div>
            <button
              onClick={() => setSelectedCctv(null)}
              className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Routing Info Overlay Badge */}
      {routingMode && routeInfo && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-3 rounded-2xl border border-border bg-card/90 px-4 py-2.5 shadow-lg backdrop-blur-md">
          <Navigation className="size-4 text-primary animate-pulse" />
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <span>{routeInfo.distanceKm} km</span>
              <span>•</span>
              <span className="text-success">{routeInfo.durationMin} mins</span>
              {routeInfo.timeSavedMin > 0 && (
                <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] text-success font-medium">
                  -{routeInfo.timeSavedMin}m Green Corridor
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
