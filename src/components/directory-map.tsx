import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Clinic, Position } from "@/lib/directory";

let mapsPromise: Promise<void> | undefined;
function loadMaps() {
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise<void>((resolve, reject) => {
    if (window.google?.maps?.Map) { resolve(); return; }
    const key = import.meta.env['VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY'];
    if (!key) { reject(new Error("لم يتم إعداد الخريطة")); return; }
    const callback = "sehatyDirectoryMapReady";
    const global = window as unknown as Record<string, unknown>;
    const timer = window.setTimeout(() => reject(new Error("تعذر تحميل خرائط Google")), 20000);
    global[callback] = () => { window.clearTimeout(timer); delete global[callback]; resolve(); };
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&callback=${callback}&language=ar&region=LY&channel=${encodeURIComponent(import.meta.env['VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID'] ?? "")}`;
    script.async = true;
    script.onerror = () => { window.clearTimeout(timer); reject(new Error("تعذر الاتصال بخرائط Google")); };
    document.head.appendChild(script);
  });
  mapsPromise.catch(() => { mapsPromise = undefined; });
  return mapsPromise;
}

export function DirectoryMap({ clinics, selected, position, onSelect }: { clinics: Clinic[]; selected: string | null; position: Position | null; onSelect: (id: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    loadMaps().then(() => {
      if (!active || !container.current) return;
      map.current = new google.maps.Map(container.current, { center: { lat: 32.8872, lng: 13.1913 }, zoom: 12, clickableIcons: false, mapTypeControl: false, streetViewControl: false, gestureHandling: "cooperative", styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }] });
      setReady(true);
    }).catch((e: Error) => { if (active) setError(e.message); });
    return () => { active = false; map.current = null; };
  }, [attempt]);
  useEffect(() => {
    if (!ready || !map.current) return;
    const currentMap = map.current;
    const bounds = new google.maps.LatLngBounds();
    const markers: google.maps.Marker[] = [];
    const info = new google.maps.InfoWindow();
    clinics.forEach((c) => {
      if (c.latitude === null || c.longitude === null) return;
      const p = { lat: c.latitude, lng: c.longitude };
      bounds.extend(p);
      const marker = new google.maps.Marker({ position: p, map: currentMap, title: c.name, animation: c.id === selected ? google.maps.Animation.BOUNCE : null });
      marker.addListener("click", () => {
        onSelect(c.id);
        const label = document.createElement("div"); label.textContent = c.name; label.dir = "rtl";
        info.setContent(label); info.open({ anchor: marker, map: currentMap });
      });
      markers.push(marker);
    });
    if (position) { bounds.extend(position); markers.push(new google.maps.Marker({ position, map: currentMap, title: "موقعك", label: "●" })); }
    const focused = clinics.find((c) => c.id === selected);
    if (focused?.latitude !== null && focused?.latitude !== undefined && focused.longitude !== null) { currentMap.panTo({ lat: focused.latitude, lng: focused.longitude }); currentMap.setZoom(15); }
    else if (!bounds.isEmpty()) { currentMap.fitBounds(bounds, 65); google.maps.event.addListenerOnce(currentMap, "idle", () => { if ((currentMap.getZoom() ?? 12) > 15) currentMap.setZoom(15); }); }
    return () => { info.close(); markers.forEach((m) => { google.maps.event.clearInstanceListeners(m); m.setMap(null); }); };
  }, [ready, clinics, selected, position, onSelect]);
  return <div className="relative h-[380px] overflow-hidden rounded-lg border bg-muted lg:h-[620px]">
    <div ref={container} className="h-full w-full" aria-label="خريطة المصحات الطبية في طرابلس" />
    {!ready && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted p-6 text-center"><MapPin className="h-9 w-9 text-primary" /><p>{error || "جارٍ تحميل خريطة طرابلس…"}</p>{error && <Button variant="outline" onClick={() => { setError(""); setAttempt((n) => n + 1); }}>إعادة المحاولة</Button>}</div>}
  </div>;
}