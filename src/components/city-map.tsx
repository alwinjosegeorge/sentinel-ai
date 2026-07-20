import { useEffect, useRef, useState } from "react";
import { type Incident } from "@/data/kochi";
import { cn } from "@/lib/utils";
import { useSentinelStore, schematicToLngLat } from "@/lib/store";
import { ShieldAlert, Video, Eye, Navigation, CheckCircle, Zap } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";

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
  const markersRef = useRef<any[]>([]);
  const { incidents, mapboxToken, resolveIncident, greenCorridorActive } = useSentinelStore();

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

  const [ambulancePos, setAmbulancePos] = useState<[number, number] | null>(null);
  const [ambulanceAngle, setAmbulanceAngle] = useState(0);

  // Dynamic light/dark theme tracking
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false; // Default to light mode as requested
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

  // Initialize Mapbox map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let mapboxgl: any;

    import("mapbox-gl").then((m) => {
      mapboxgl = m.default ?? m;
      mapboxgl.accessToken = mapboxToken;

      const kochiCenter: [number, number] = [76.3116, 9.9822];

      const DEFAULT_MAPBOX_TOKEN = "pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTAwM2MzN21keG1ycjhpZ3MifQ.-bgrem2g2t5jRYg6BpA2g";

      const isVectorMap = mapboxToken && mapboxToken !== DEFAULT_MAPBOX_TOKEN && mapboxToken.startsWith("pk.");

      // Determine map style based on token and theme
      let mapStyle: any;
      // Only use Mapbox vector styles if user has input their own custom Mapbox token
      if (isVectorMap) {
        mapStyle = isDarkMode
          ? "mapbox://styles/mapbox/dark-v11"
          : "mapbox://styles/mapbox/light-v11";
      } else {
        // Fallback to open source raster basemaps if using default or empty token
        mapStyle = {
          version: 8,
          sources: {
            "raster-tiles": {
              type: "raster",
              tiles: [
                isDarkMode
                  ? "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png"
                  : "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png"
              ],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors, © CartoDB",
            },
          },
          layers: [
            {
              id: "raster-layer",
              type: "raster",
              source: "raster-tiles",
              minzoom: 0,
              maxzoom: 20,
            },
          ],
        };
      }

      try {
        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: mapStyle,
          center: kochiCenter,
          zoom: 12,
          pitch: isVectorMap ? 30 : 0, // Flat 2D view for raster tiles to prevent box skewing
          antialias: true,
        });

        mapRef.current = map;

        // Add standard controls
        map.addControl(new mapboxgl.NavigationControl(), "top-right");
        map.addControl(new mapboxgl.FullscreenControl(), "top-right");

        // Load custom layers once style loads
        map.on("load", () => {
          setupCustomOverlays(map, mapboxgl);
        });

        // Cleanup on unmount
        return () => {
          map.remove();
        };
      } catch (err) {
        console.error("Mapbox load error:", err);
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapboxToken, isDarkMode]);

  // Automatically resize Mapbox GL canvas when container resizes or mounts
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });
    resizeObserver.observe(mapContainerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Configure layers (Traffic heatmap, Flood polygons, Transit route overlays)
  const setupCustomOverlays = (map: any, mapboxgl: any) => {
    try {
      // 1. Traffic Heatmap
      if (activeLayers.includes("traffic")) {
        const trafficPoints = {
          type: "FeatureCollection",
          features: [
            { type: "Feature", geometry: { type: "Point", coordinates: [76.3218, 9.9678] }, properties: { intensity: 0.9 } }, // Vytilla
            { type: "Feature", geometry: { type: "Point", coordinates: [76.3116, 9.9366] }, properties: { intensity: 0.8 } }, // Kundannoor
            { type: "Feature", geometry: { type: "Point", coordinates: [76.3090, 10.0250] }, properties: { intensity: 0.7 } }, // Edappally
            { type: "Feature", geometry: { type: "Point", coordinates: [76.2828, 9.9722] }, properties: { intensity: 0.5 } }, // MG Road
            { type: "Feature", geometry: { type: "Point", coordinates: [76.3120, 10.0076] }, properties: { intensity: 0.6 } }, // Palarivattom
          ],
        };

        if (!map.getSource("traffic-heatmap-src")) {
          map.addSource("traffic-heatmap-src", {
            type: "geojson",
            data: trafficPoints,
          });
        }

        if (!map.getLayer("traffic-heatmap-layer")) {
          map.addLayer({
            id: "traffic-heatmap-layer",
            type: "heatmap",
            source: "traffic-heatmap-src",
            maxzoom: 15,
            paint: {
              "heatmap-weight": ["get", "intensity"],
              "heatmap-intensity": 2,
              "heatmap-color": [
                "interpolate",
                ["linear"],
                ["heatmap-value"],
                0, "rgba(0, 255, 0, 0)",
                0.3, "rgba(255, 165, 0, 0.4)",
                0.7, "rgba(255, 69, 0, 0.6)",
                1.0, "rgba(255, 0, 0, 0.8)"
              ],
              "heatmap-radius": 35,
              "heatmap-opacity": 0.55,
            },
          });
        }
      }

      // 2. Flood Polygons (Marine Drive & Low Catchments)
      if (activeLayers.includes("flood")) {
        const floodZones = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: [[
                  [76.270, 9.988],
                  [76.278, 9.986],
                  [76.275, 9.975],
                  [76.268, 9.978],
                  [76.270, 9.988]
                ]]
              },
              properties: { risk: "high" }
            },
            {
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: [[
                  [76.308, 9.932],
                  [76.315, 9.934],
                  [76.316, 9.928],
                  [76.309, 9.926],
                  [76.308, 9.932]
                ]]
              },
              properties: { risk: "medium" }
            }
          ]
        };

        if (!map.getSource("flood-zones-src")) {
          map.addSource("flood-zones-src", {
            type: "geojson",
            data: floodZones,
          });
        }

        if (!map.getLayer("flood-zones-layer")) {
          map.addLayer({
            id: "flood-zones-layer",
            type: "fill",
            source: "flood-zones-src",
            paint: {
              "fill-color": "#38bdf8",
              "fill-opacity": 0.35,
              "fill-outline-color": "#0284c7",
            },
          });
        }
      }

      // 3. Transit Overlays (Kochi Metro Line)
      if (activeLayers.includes("transit")) {
        const metroLine = {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [76.350, 10.080],
              [76.316, 10.024],
              [76.299, 10.003],
              [76.282, 9.972],
              [76.321, 9.967],
              [76.345, 9.955],
            ],
          },
        };

        if (!map.getSource("metro-line-src")) {
          map.addSource("metro-line-src", {
            type: "geojson",
            data: metroLine,
          });
        }

        if (!map.getLayer("metro-line-layer")) {
          map.addLayer({
            id: "metro-line-layer",
            type: "line",
            source: "metro-line-src",
            paint: {
              "line-color": "#a855f7",
              "line-width": 4,
              "line-opacity": 0.8,
            },
          });
        }
      }
    } catch (err) {
      console.warn("Safely caught map overlay setup error:", err);
    }
  };

  // Re-draw Markers when incidents list changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    import("mapbox-gl").then((m) => {
      const mapboxgl = m.default ?? m;

      // Remove existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      // 1. Add Incident Markers
      displayPins.forEach((p) => {
        const lng = p.lng ?? schematicToLngLat(p.x, p.y)[0];
        const lat = p.lat ?? schematicToLngLat(p.x, p.y)[1];

        const el = document.createElement("div");
        el.className = "relative flex items-center justify-center cursor-pointer";

        // Style depending on severity
        const colorClass =
          p.severity === "critical"
            ? "bg-destructive shadow-destructive/50"
            : p.severity === "warning"
              ? "bg-warn shadow-warn/50"
              : p.severity === "resolved"
                ? "bg-success shadow-success/50"
                : "bg-primary shadow-primary/50";

        // Animated pulse for critical / warnings
        const isPulse = p.severity === "critical" || p.severity === "warning";

        el.innerHTML = `
          <span class="relative flex h-4 w-4">
            ${isPulse ? `<span class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${colorClass}"></span>` : ""}
            <span class="relative inline-flex rounded-full h-4 w-4 border-2 border-white dark:border-black ${colorClass}"></span>
          </span>
        `;

        el.addEventListener("click", () => {
          setSelectedIncident(p);
          setSelectedCctv(null);
          setShowAiExplanation(false);

          map.easeTo({
            center: [lng, lat],
            zoom: 14.5,
            duration: 800,
          });
        });

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map);

        markersRef.current.push(marker);
      });

      // 2. Add CCTV Camera Markers (if layer active)
      if (activeLayers.includes("cctv")) {
        const cctvFeeds = [
          { id: "CAM-14", location: "Vytilla Junction", lng: 76.3218, lat: 9.9678, status: "alert" },
          { id: "CAM-22", location: "MG Road", lng: 76.2828, lat: 9.9722, status: "normal" },
          { id: "CAM-09", location: "Kundannoor", lng: 76.3116, lat: 9.9366, status: "critical" },
          { id: "CAM-18", location: "Edappally NH-66", lng: 76.3090, lat: 10.0250, status: "critical" },
          { id: "CAM-07", location: "Kakkanad", lng: 76.3533, lat: 10.0159, status: "normal" },
        ];

        cctvFeeds.forEach((cam) => {
          const el = document.createElement("div");
          el.className = cn(
            "grid size-7 place-items-center rounded-lg border border-border cursor-pointer shadow-lg transition-transform hover:scale-110",
            cam.status === "critical" ? "bg-destructive text-white" : cam.status === "alert" ? "bg-warn text-white" : "bg-card text-foreground"
          );
          el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>`;

          el.addEventListener("click", () => {
            setSelectedCctv(cam);
            setSelectedIncident(null);
            map.easeTo({
              center: [cam.lng, cam.lat],
              zoom: 14.5,
              duration: 800,
            });
          });

          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([cam.lng, cam.lat])
            .addTo(map);

          markersRef.current.push(marker);
        });
      }
    });
  }, [displayPins, activeLayers]);

  // Handle routing (directions API + OSRM fallback)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!routingMode || !startLocation || !endLocation) {
      // Remove route paths from map if routing mode is off
      try {
        if (map.getLayer("route-line")) map.removeLayer("route-line");
        if (map.getLayer("route-traffic-flow")) map.removeLayer("route-traffic-flow");
        if (map.getSource("route-src")) map.removeSource("route-src");
      } catch {}
      setRouteInfo(null);
      setAmbulancePos(null);
      return;
    }

    // Fetch routing geometry from OSRM (OpenSource Routing Machine) which requires NO token
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${startLocation.lng},${startLocation.lat};${endLocation.lng},${endLocation.lat}?overview=full&geometries=geojson&steps=true`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates as [number, number][];
          
          const distanceKm = +(route.distance / 1000).toFixed(1);
          // green corridor makes emergency vehicles save ~30% time
          const baseDuration = Math.round(route.duration / 60);
          const durationMin = greenCorridorActive ? Math.round(baseDuration * 0.7) : baseDuration;
          const timeSavedMin = greenCorridorActive ? Math.round(baseDuration * 0.3) : 0;

          setRouteInfo({
            distanceKm,
            durationMin,
            timeSavedMin,
            geometry: coords,
          });

          // Draw the route geometry on map safely
          try {
            if (map.getLayer("route-line")) map.removeLayer("route-line");
            if (map.getLayer("route-traffic-flow")) map.removeLayer("route-traffic-flow");
            if (map.getSource("route-src")) map.removeSource("route-src");

            map.addSource("route-src", {
              type: "geojson",
              data: {
                type: "Feature",
                properties: {},
                geometry: route.geometry,
              },
            });

            // Main route drawing (like Google Maps)
            map.addLayer({
              id: "route-line",
              type: "line",
              source: "route-src",
              layout: {
                "line-join": "round",
                "line-cap": "round",
              },
              paint: {
                "line-color": greenCorridorActive ? "#10b981" : "#3b82f6", // Green for emergency path / Blue for normal path
                "line-width": 7,
                "line-opacity": 0.85,
              },
            });
          } catch (routeErr) {
            console.warn("Route drawing safely caught error:", routeErr);
          }

          // Zoom and Pan to fit the route bounds
          import("mapbox-gl").then((m) => {
            const mapboxgl = m.default ?? m;
            const bounds = coords.reduce((acc, coord) => {
              return acc.extend(coord);
            }, new mapboxgl.LngLatBounds(coords[0], coords[0]));

            map.fitBounds(bounds, {
              padding: 50,
              duration: 1200,
            });
          });

          // Start route animation for Ambulance
          animateAmbulance(coords);
        }
      } catch (err) {
        console.error("Routing error:", err);
      }
    };

    fetchRoute();
  }, [routingMode, startLocation, endLocation, greenCorridorActive]);

  // Ambulance moving animation along route
  const animateAmbulance = (coords: [number, number][]) => {
    if (coords.length < 2) return;
    
    let index = 0;
    const animationSpeed = 2; // skip indices to animate speed

    const interval = setInterval(() => {
      if (index >= coords.length) {
        index = 0; // Loop route animation
      }
      
      const current = coords[index];
      const next = coords[Math.min(index + 1, coords.length - 1)];
      
      // Calculate angle for heading orientation
      const dx = next[0] - current[0];
      const dy = next[1] - current[1];
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      setAmbulancePos(current);
      setAmbulanceAngle(angle);

      index += animationSpeed;
    }, 150);

    return () => clearInterval(interval);
  };

  return (
    <div className={cn("relative overflow-hidden rounded-3xl bg-porcelain h-full w-full min-h-[480px]", className)} style={{ height: typeof height === 'number' ? `${height}px` : height }}>
      {/* Mapbox container */}
      <div ref={mapContainerRef} className="h-full w-full min-h-[480px]" />

      {/* Floating Ambulance Marker when route active */}
      {routingMode && ambulancePos && mapRef.current && (
        <AmbulanceMapMarker map={mapRef.current} pos={ambulancePos} angle={ambulanceAngle} />
      )}

      {/* Glassmorphic POPUP Details Panel - Incidents */}
      {selectedIncident && (
        <div className="glass soft-ring absolute bottom-4 left-4 right-4 z-40 max-w-sm rounded-3xl p-4 shadow-2xl animate-rise md:bottom-auto md:top-4 md:right-auto">
          <div className="flex items-start justify-between">
            <div>
              <span className={cn(
                "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white",
                selectedIncident.severity === "critical" ? "bg-destructive" : selectedIncident.severity === "warning" ? "bg-warn" : "bg-primary"
              )}>
                {selectedIncident.severity}
              </span>
              <h3 className="mt-1 font-display text-base font-semibold">{selectedIncident.title}</h3>
              <p className="text-xs text-muted-foreground">{selectedIncident.location}</p>
            </div>
            <button
              onClick={() => setSelectedIncident(null)}
              className="grid size-6 place-items-center rounded-full bg-secondary hover:bg-muted"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Confidence:</span>
              <span className="font-mono font-medium">{selectedIncident.confidence}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Department:</span>
              <span className="font-medium">{selectedIncident.department}</span>
            </div>
            <div className="rounded-xl bg-secondary/70 p-2.5">
              <p className="font-semibold text-foreground uppercase tracking-wider text-[9px]">Recommended AI Action</p>
              <p className="mt-0.5 text-muted-foreground">
                {selectedIncident.severity === "critical"
                  ? "Deploy immediate emergency unit with active signal override (Green Corridor) via SA Road."
                  : "Dispatch civic field team. Alert local traffic authorities."}
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                resolveIncident(selectedIncident.id);
                setSelectedIncident(null);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-success text-white py-2 text-xs font-semibold hover:brightness-110"
            >
              <CheckCircle className="size-3.5" />
              Resolve Incident
            </button>
            <button
              onClick={() => setShowAiExplanation(!showAiExplanation)}
              className="flex-1 rounded-xl border border-border bg-card py-2 text-xs font-semibold hover:bg-secondary"
            >
              AI Explanation
            </button>
          </div>

          {showAiExplanation && (
            <div className="mt-3 border-t border-border pt-2 text-[11px] text-muted-foreground leading-relaxed animate-rise">
              <strong>Multi-Agent Reasoning:</strong> CCTV-Vision Agent flagged anomaly with 97% confidence matching high congestion telemetry at {selectedIncident.location}. Master Agent resolved route prioritization & recommended dispatch.
            </div>
          )}
        </div>
      )}

      {/* CCTV Live Feed Popup */}
      {selectedCctv && (
        <div className="glass soft-ring absolute bottom-4 left-4 right-4 z-40 max-w-sm rounded-3xl p-4 shadow-2xl animate-rise md:bottom-auto md:top-4 md:right-auto">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Video className="size-4 text-primary" />
              {selectedCctv.id} · {selectedCctv.location}
            </div>
            <button
              onClick={() => setSelectedCctv(null)}
              className="grid size-6 place-items-center rounded-full bg-secondary hover:bg-muted"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="relative mt-3 aspect-video overflow-hidden rounded-2xl bg-black">
            {/* Simulated Live Scanline Video */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.4))] pointer-events-none" />
            <div className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[8px] font-mono text-red-500 uppercase tracking-widest flex items-center gap-1">
              <span className="size-1.5 animate-pulse rounded-full bg-red-600" />
              Live Feed
            </div>
            {/* Display CCTV status overlays */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 text-white/90">
              <Eye className="size-6 text-primary mb-1 animate-pulse" />
              <p className="text-xs font-semibold uppercase tracking-wider">Vision AI Processing</p>
              <p className="text-[10px] text-muted-foreground/80 mt-0.5 font-mono">
                Detections: {selectedCctv.status === "critical" ? "Overturned Truck (96% Confidence)" : "Normal vehicle flow"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Navigation Routing Card (Google Maps style) */}
      {routingMode && routeInfo && (
        <div className="glass soft-ring absolute bottom-4 right-4 z-40 max-w-sm rounded-3xl p-4 shadow-2xl animate-rise">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              <Navigation className="size-3.5" />
              Emergency Navigation
            </h4>
            {greenCorridorActive && (
              <span className="flex items-center gap-0.5 rounded-full bg-success/15 px-2 py-0.5 text-[9px] font-semibold text-success">
                <Zap className="size-2.5" />
                Green Corridor
              </span>
            )}
          </div>
          
          <div className="mt-3 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-2xl border border-border bg-secondary/40 p-2">
              <span className="text-[10px] font-medium text-muted-foreground">ETA</span>
              <p className="font-display text-lg font-bold text-foreground">{routeInfo.durationMin} mins</p>
            </div>
            <div className="rounded-2xl border border-border bg-secondary/40 p-2">
              <span className="text-[10px] font-medium text-muted-foreground">Distance</span>
              <p className="font-display text-lg font-bold text-foreground">{routeInfo.distanceKm} km</p>
            </div>
          </div>

          {greenCorridorActive && routeInfo.timeSavedMin > 0 && (
            <div className="mt-2.5 flex items-center justify-between rounded-xl bg-success/10 px-3 py-2 text-xs text-success">
              <span>Time saved via Priority Signals:</span>
              <span className="font-bold font-mono">-{routeInfo.timeSavedMin} mins</span>
            </div>
          )}

          <div className="mt-3 rounded-2xl bg-secondary/80 p-3 text-[11px] text-muted-foreground">
            <div className="font-semibold text-foreground mb-1 uppercase tracking-wider text-[9px]">Recommended AI Operations:</div>
            • Priority override holds signals at Vytilla & Palarivattom intersections.<br/>
            • Rerouted local civilian traffic via NH-66 bypass.
          </div>
        </div>
      )}
    </div>
  );
}

// Separate Mini Marker Render for Ambulance (moves along route coords)
function AmbulanceMapMarker({ map, pos, angle }: { map: any; pos: [number, number]; angle: number }) {
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !pos) return;

    import("mapbox-gl").then((m) => {
      const mapboxgl = m.default ?? m;

      const el = document.createElement("div");
      el.className = "grid size-8 place-items-center rounded-full bg-destructive border-2 border-white shadow-2xl text-white";
      el.style.transform = `rotate(${angle}deg)`;
      el.style.transition = "transform 0.15s ease-out";
      
      // Ambulance Icon SVG
      el.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="animate-pulse">
          <path d="M14 18H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/>
          <circle cx="7" cy="18" r="2"/>
          <circle cx="17" cy="18" r="2"/>
          <path d="M15 13H9"/>
          <path d="M12 10v6"/>
        </svg>
      `;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(pos)
        .addTo(map);

      markerRef.current = marker;
    });

    return () => {
      if (markerRef.current) markerRef.current.remove();
    };
  }, [map, pos, angle]);

  return null;
}
