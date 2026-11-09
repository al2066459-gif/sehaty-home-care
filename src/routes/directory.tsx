import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { ArrowRight, Building2, MapPin, Phone, Search, Navigation, List, Map, ExternalLink, LocateFixed, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/sehaty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DirectoryMap } from "@/components/directory-map";
import { directoryQuery } from "@/lib/directory.query";
import { directionsUrl, mapsSearchUrl, distanceKm, filterClinics, hasCoordinates, type Position } from "@/lib/directory";

export const Route = createFileRoute("/directory")({
  head: () => ({ meta: [
    { title: "دليل المصحات الطبية في طرابلس - صحتي" },
    { name: "description", content: "دليل موثق لمصحات وعيادات ومراكز طرابلس، البحث حسب المنطقة والتخصص وخريطة المواقع المتاحة." },
    { property: "og:title", content: "دليل المصحات الطبية - صحتي" },
    { property: "og:description", content: "بيانات من مصادر رسمية ومواقع موثقة للمصحات الطبية في طرابلس، ليبيا." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(directoryQuery),
  pendingComponent: () => <p className="p-12 text-center">جارٍ تحميل دليل المصحات…</p>,
  errorComponent: ({ reset }) => <div className="p-12 text-center"><p>تعذر تحميل دليل المصحات.</p><Button className="mt-4" onClick={reset}>إعادة المحاولة</Button></div>,
  component: Directory,
});

function Directory() {
  const { data } = useSuspenseQuery(directoryQuery);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState(data.cities.find((c) => c.name === "طرابلس")?.id ?? "");
  const [region, setRegion] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [position, setPosition] = useState<Position | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [view, setView] = useState<"list" | "map">("list");
  const [selected, setSelected] = useState<string | null>(null);
  const select = useCallback((id: string) => { setSelected(id); }, []);
  const filtered = useMemo(() => filterClinics(data, query, city, region, specialty, position), [data, query, city, region, specialty, position]);
  const mapped = filtered.filter(hasCoordinates).length;
  const specialties = [...new Set(data.clinics.filter((c) => !city || c.city_id === city).flatMap((c) => c.specialties))].sort();
  const locate = () => {
    setLocationError("");
    if (!navigator.geolocation) { setLocationError("هذا الجهاز لا يدعم تحديد الموقع."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition((p) => { setPosition({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocating(false); }, (e) => { setLocating(false); setLocationError(e.code === 1 ? "لم تسمح بالوصول إلى موقعك؛ يمكنك البحث بالمنطقة." : "تعذر تحديد موقعك؛ حاول مجدداً."); }, { timeout: 12000, maximumAge: 60000 });
  };
  return <div className="min-h-screen bg-background">
    <header className="border-b bg-card"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><Logo size="sm" /><Button asChild variant="ghost"><Link to="/home"><ArrowRight className="h-4 w-4" />العودة للتطبيق</Link></Button></div></header>
    <main className="mx-auto max-w-7xl px-4 pb-12 pt-7 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="mb-2 flex items-center gap-1 text-sm font-bold text-primary"><MapPin className="h-4 w-4" />طرابلس، ليبيا</p><h1 className="text-2xl font-extrabold text-brand-blue md:text-3xl">دليل المصحات الطبية</h1><p className="mt-3 text-muted-foreground">المصحات والعيادات والمراكز الطبية</p></div>
        <div className="flex items-center gap-2 rounded-lg bg-brand-soft px-4 py-3 text-sm text-primary"><ShieldCheck className="h-5 w-5" />بيانات من مصادر رسمية</div>
      </div>
      <p className="mt-5 border-r-2 border-primary pr-3 text-sm leading-6 text-muted-foreground">قائمة أولية موثقة وليست حصراً لجميع مصحات طرابلس. المواقع غير الموثقة لا تُعرض على الخريطة؛ يُنصح بتأكيد الخدمات هاتفياً.</p>
      <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.2fr_auto]">
        <div className="relative"><Search className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground" /><Input aria-label="البحث عن مصحة" placeholder="اسم المصحة، المنطقة أو التخصص" value={query} onChange={(e) => setQuery(e.target.value)} className="h-11 bg-card pr-10" /></div>
        <select aria-label="المدينة" value={city} onChange={(e) => { setCity(e.target.value); setRegion(""); setSpecialty(""); }} className="h-11 min-w-0 rounded-md border bg-card px-3"><option value="">كل المدن</option>{data.cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select aria-label="المنطقة" value={region} onChange={(e) => setRegion(e.target.value)} className="h-11 min-w-0 rounded-md border bg-card px-3"><option value="">كل المناطق</option>{data.regions.filter((r) => !city || r.city_id === city).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
        <select aria-label="التخصص" value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="h-11 min-w-0 rounded-md border bg-card px-3"><option value="">كل التخصصات</option>{specialties.map((s) => <option key={s}>{s}</option>)}</select>
        <Button variant={position ? "default" : "outline"} className="h-11" disabled={locating} onClick={position ? () => setPosition(null) : locate}><LocateFixed className="h-4 w-4" />{locating ? "تحديد الموقع…" : position ? "إلغاء ترتيب الأقرب" : "الأقرب إليّ"}</Button>
      </div>
      {locationError && <p role="alert" className="mt-3 text-sm text-destructive">{locationError}</p>}
      {position && <p className="mt-3 text-sm text-muted-foreground">المسافات خط مستقيم للمواقع الموثقة فقط. موقعك لا يُحفظ.</p>}
      <div className="mb-4 mt-6 flex items-center justify-between gap-2"><p className="text-sm"><b>{filtered.length}</b> منشآت طبية <span className="text-muted-foreground">· {mapped} بموقع موثق</span></p><div className="flex gap-1 lg:hidden"><Button size="sm" variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")}><List className="h-4 w-4" />القائمة</Button><Button size="sm" variant={view === "map" ? "default" : "outline"} onClick={() => setView("map")}><Map className="h-4 w-4" />الخريطة</Button></div></div>
      <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_1fr]">
        <section className={`${view === "list" ? "block" : "hidden"} space-y-4 lg:block`} aria-label="قائمة المصحات">
          {!filtered.length && <div className="py-14 text-center"><Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><h2 className="font-bold">لا توجد نتائج مطابقة</h2><Button variant="ghost" onClick={() => { setQuery(""); setRegion(""); setSpecialty(""); }}>مسح البحث والتصفية</Button></div>}
          {filtered.map((c) => {
            const area = data.regions.find((r) => r.id === c.region_id)?.name;
            const cityName = data.cities.find((x) => x.id === c.city_id)?.name;
            const url = directionsUrl(c, cityName);
            return <article key={c.id} className={`overflow-hidden rounded-lg border bg-card shadow-card ${selected === c.id ? "ring-2 ring-primary" : ""}`}>
              {c.photo_url && <div><img src={c.photo_url} alt={c.name} className="h-44 w-full object-cover" onError={(e) => { e.currentTarget.hidden = true; }} /><p className="px-4 pt-1 text-xs text-muted-foreground">{c.photo_attribution}</p></div>}
              <div className="p-5"><div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-soft text-primary"><Building2 className="h-6 w-6" /></div><div className="min-w-0 flex-1"><p className="mb-1 text-xs text-primary">{c.kind}</p><h2 className="text-lg font-bold leading-7">{c.name}</h2><p className="mt-1 text-sm text-muted-foreground">{cityName}{area ? ` · ${area}` : " · المنطقة غير متوفرة"}</p></div></div>
              <p className="mt-4 flex items-start gap-2 text-sm leading-6"><MapPin className="mt-1 h-4 w-4 shrink-0 text-primary" />{c.address || "العنوان التفصيلي غير متوفر"}</p>
              <div className="mt-3 flex flex-wrap gap-2">{c.specialties.length ? c.specialties.map((s) => <span key={s} className="rounded-md bg-brand-soft px-2 py-1 text-xs text-primary">{s}</span>) : <p className="text-xs text-muted-foreground">التخصصات غير متوفرة في المصدر</p>}</div>
              <p className="mt-3 text-xs text-muted-foreground">الخدمات: {c.services.length ? c.services.join("، ") : "غير متوفرة في المصدر"}</p>
              <div className="mt-4 flex flex-wrap gap-2">{c.phones.length ? c.phones.map((p) => <Button key={p} asChild variant="outline" size="sm"><a href={`tel:${p.replace(/[^+\d]/g, "")}`}><Phone className="h-3.5 w-3.5" /><span dir="ltr">{p}</span></a></Button>) : <span className="text-xs text-muted-foreground">الهاتف غير متوفر</span>}</div>
              <div className="mt-4 flex flex-wrap items-center gap-2"><Button asChild size="sm" variant="outline"><a href={mapsSearchUrl(c, cityName)} target="_blank" rel="noopener noreferrer"><Map className="h-4 w-4" />فتح في خرائط Google</a></Button><Button asChild size="sm"><a href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => { e.preventDefault(); const w = window.open(url, "_blank"); if (w) w.opener = null; else window.location.assign(url); }}><Navigation className="h-4 w-4" />الاتجاهات</a></Button>{hasCoordinates(c) && <Button size="sm" variant="ghost" onClick={() => { select(c.id); setView("map"); }}><MapPin className="h-4 w-4" />على الخريطة</Button>}</div>
              {!hasCoordinates(c) && <p className="mt-2 text-xs text-warning">الموقع غير مؤكد — سيبحث Google بالاسم والعنوان وقد تظهر عدة نتائج.</p>}
              <div className="mt-2 flex flex-wrap items-center gap-2">{position && c.latitude !== null && c.longitude !== null && <span className="mr-auto text-sm font-bold text-primary">{distanceKm(position, { lat: c.latitude, lng: c.longitude }).toFixed(1)} كم</span>}</div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground"><div className="flex flex-wrap gap-3">{c.source_urls.map((u, i) => <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary"><ExternalLink className="h-3 w-3" />{i === 0 ? "المصدر الرسمي" : "مصدر إضافي"}</a>)}</div><span>{c.verified_at ? `مراجعة المصدر: ${c.verified_at.slice(0, 10)}` : "تاريخ المراجعة غير متوفر"}</span></div>
              </div>
            </article>;
          })}
        </section>
        <aside className={`${view === "map" ? "block" : "hidden"} lg:sticky lg:top-5 lg:block`}><DirectoryMap clinics={filtered} selected={selected} position={position} onSelect={select} /><p className="mt-3 text-sm leading-6 text-muted-foreground">{mapped ? "تظهر المواقع المنشورة في المصادر الرسمية فقط." : "لا تتوفر مواقع موثقة للنتائج الحالية."} {filtered.length - mapped > 0 && `${filtered.length - mapped} منشآت دون إحداثيات موثقة.`}</p></aside>
      </div>
    </main>
  </div>;
}