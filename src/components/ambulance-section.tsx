import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { CheckCircle2, LocateFixed, MapPin, MessageCircle, Navigation, Phone, ShieldAlert, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ambulanceQuery } from "@/lib/ambulance.query";
import { submitAmbulanceRequest } from "@/lib/ambulance.functions";
import { TRANSPORT_TYPES, ambulanceRequestSchema, filterCompanies, telUrl, whatsappUrl } from "@/lib/ambulance";
import { directionsUrl } from "@/lib/directory";

/** Open Google Maps in a real new tab (outside the preview frame). */
function openExternal(url: string) {
  const w = window.open(url, "_blank", "noopener,noreferrer");
  if (!w) window.location.assign(url);
}

export function AmbulanceSection() {
  const { data } = useSuspenseQuery(ambulanceQuery);
  const tripoli = data.cities.find((c) => c.name === "طرابلس")?.id ?? "";
  const [cityId, setCityId] = useState(tripoli);
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const list = useMemo(() => filterCompanies(data.companies, cityId, type, q), [data.companies, cityId, type, q]);
  const cityName = (id: string) => data.cities.find((c) => c.id === id)?.name;

  const submit = useServerFn(submitAmbulanceRequest);
  const [form, setForm] = useState({ requester_name: "", phone: "", pickup: "", destination: "", city: "طرابلس", region: "", transport_type: TRANSPORT_TYPES[0] as string, company_id: "", notes: "" });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [err, setErr] = useState(""), [sending, setSending] = useState(false), [sent, setSent] = useState(false), [locating, setLocating] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const locate = () => {
    setErr("");
    if (!navigator.geolocation) return setErr("المتصفح لا يدعم تحديد الموقع، اكتب العنوان يدوياً");
    setLocating(true);
    navigator.geolocation.getCurrentPosition((p) => {
      setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
      setForm((f) => ({ ...f, pickup: f.pickup || `موقعي الحالي (${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)})` }));
      setLocating(false);
    }, (e) => { setLocating(false); setErr(e.code === 1 ? "لم تسمح بالوصول إلى موقعك؛ اكتب العنوان يدوياً" : "تعذّر تحديد الموقع، اكتب العنوان يدوياً"); }, { timeout: 12000 });
  };

  const send = async () => {
    setErr("");
    const parsed = ambulanceRequestSchema.safeParse({ ...form, company_id: form.company_id || null, latitude: coords?.lat ?? null, longitude: coords?.lng ?? null });
    if (!parsed.success) return setErr(parsed.error.issues[0]?.message ?? "راجع البيانات");
    setSending(true);
    try { await submit({ data: parsed.data }); setSent(true); }
    catch (e) { setErr(e instanceof Error ? e.message : "تعذر إرسال الطلب، حاول مجدداً أو اتصل مباشرة"); }
    finally { setSending(false); }
  };

  return <div className="space-y-6 p-4">
    <section aria-labelledby="req-title" className="rounded-2xl bg-card p-4 shadow-card">
      <h2 id="req-title" className="mb-1 text-lg font-extrabold">نموذج طلب نقل طبي</h2>
      <p className="mb-4 text-xs text-muted-foreground">يُحفظ طلبك لدى فريق صحتي للتنسيق مع شركة إسعاف مناسبة. في الحالات الحرجة اتصل مباشرة.</p>
      {sent ? <div role="status" className="rounded-xl bg-brand-soft p-4 text-center"><CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-primary" /><p className="font-bold">تم حفظ طلبك بنجاح</p><p className="mt-1 text-sm text-muted-foreground">سيتواصل معك فريق صحتي على {form.phone}. لم يُرسل الطلب لشركة بعينها بعد؛ للسرعة يمكنك الاتصال بإحدى الشركات أدناه.</p><Button variant="outline" className="mt-3" onClick={() => { setSent(false); setForm({ ...form, pickup: "", destination: "", notes: "" }); setCoords(null); }}>طلب جديد</Button></div> :
      <div className="space-y-3">
        <Input aria-label="اسم مقدم الطلب" placeholder="اسم مقدم الطلب" value={form.requester_name} onChange={set("requester_name")} className="h-12 bg-card" />
        <Input aria-label="رقم الهاتف" dir="ltr" inputMode="tel" placeholder="09XXXXXXXX" value={form.phone} onChange={set("phone")} className="h-12 bg-card text-right" />
        <button type="button" onClick={locate} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary bg-brand-soft p-3 text-sm font-bold text-primary"><LocateFixed className="h-4 w-4" />{locating ? "جارٍ التحديد..." : coords ? "تم تحديد موقعك ✓" : "استخدم موقعي الحالي (بإذنك)"}</button>
        <Input aria-label="مكان الانطلاق" placeholder="موقع المريض / مكان الانطلاق" value={form.pickup} onChange={set("pickup")} className="h-12 bg-card" />
        <Input aria-label="الوجهة" placeholder="الوجهة (اسم المصحة أو المستشفى أو المدينة)" value={form.destination} onChange={set("destination")} className="h-12 bg-card" />
        <div className="grid grid-cols-2 gap-2">
          <select aria-label="المدينة" value={form.city} onChange={set("city")} className="h-12 rounded-md border bg-card px-2">{data.cities.map((c) => <option key={c.id}>{c.name}</option>)}</select>
          <Input aria-label="المنطقة" placeholder="المنطقة" value={form.region} onChange={set("region")} className="h-12 bg-card" />
        </div>
        <select aria-label="نوع خدمة النقل" value={form.transport_type} onChange={set("transport_type")} className="h-12 w-full rounded-md border bg-card px-2">{TRANSPORT_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        <select aria-label="الشركة المفضلة" value={form.company_id} onChange={set("company_id")} className="h-12 w-full rounded-md border bg-card px-2"><option value="">بدون تفضيل شركة</option>{data.companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <textarea aria-label="ملاحظات" placeholder="ملاحظات (حالة المريض، الطابق، الحاجة لأكسجين…)" value={form.notes} onChange={set("notes")} className="min-h-20 w-full rounded-md border bg-card p-3 text-sm" />
        {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
        <Button size="lg" variant="destructive" className="w-full" disabled={sending} onClick={send}>{sending ? "جارٍ الإرسال…" : "إرسال طلب النقل"}</Button>
      </div>}
    </section>

    <section aria-labelledby="co-title">
      <h2 id="co-title" className="mb-1 flex items-center gap-2 text-lg font-extrabold"><Truck className="h-5 w-5 text-primary" />شركات الإسعاف ونقل المرضى</h2>
      <p className="mb-3 text-xs text-muted-foreground">بيانات من مصادر عامة. التوفر الحالي غير مؤكد إلا إذا ذُكر ذلك؛ تأكد هاتفياً قبل الاعتماد.</p>
      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        <Input aria-label="بحث عن شركة" placeholder="اسم الشركة أو المنطقة" value={q} onChange={(e) => setQ(e.target.value)} className="h-11 bg-card" />
        <select aria-label="مدينة الشركة" value={cityId} onChange={(e) => setCityId(e.target.value)} className="h-11 rounded-md border bg-card px-2"><option value="">كل المدن</option>{data.cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select aria-label="نوع النقل" value={type} onChange={(e) => setType(e.target.value)} className="h-11 rounded-md border bg-card px-2"><option value="">كل أنواع النقل</option>{TRANSPORT_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
      </div>
      {!list.length && <p className="py-8 text-center text-sm text-muted-foreground">لا توجد شركات مطابقة. <button className="text-primary underline" onClick={() => { setQ(""); setType(""); setCityId(""); }}>مسح التصفية</button></p>}
      <div className="space-y-3">{list.map((c) => {
        const region = data.regions.find((r) => r.id === c.region_id)?.name;
        const hasLoc = c.latitude !== null && c.longitude !== null;
        return <article key={c.id} className="rounded-2xl bg-card p-4 shadow-card">
          <div className="flex items-start justify-between gap-2"><h3 className="font-bold leading-7">{c.name}</h3>{c.verification === "verified" ? <span className="flex shrink-0 items-center gap-1 rounded-md bg-brand-soft px-2 py-1 text-xs text-primary"><ShieldCheck className="h-3.5 w-3.5" />موثقة</span> : <span className="flex shrink-0 items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-warning"><ShieldAlert className="h-3.5 w-3.5" />بانتظار التحقق</span>}</div>
          <p className="mt-1 flex items-start gap-1 text-sm text-muted-foreground"><MapPin className="mt-1 h-3.5 w-3.5 shrink-0" />{cityName(c.city_id)}{region ? ` · ${region}` : ""} — {c.address || "العنوان غير متوفر"}</p>
          <p className="mt-2 text-xs"><b>التغطية:</b> {c.coverage.length ? c.coverage.join("، ") : "غير محددة"}</p>
          <p className="mt-1 text-xs"><b>الخدمات:</b> {c.services.length ? c.services.join("، ") : "غير متوفرة في المصدر"}</p>
          <p className="mt-1 text-xs"><b>السيارات:</b> {c.vehicle_types.length ? c.vehicle_types.join("، ") : "غير متوفرة في المصدر"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{c.availability_confirmed ? "متاحة حالياً (مؤكد من الإدارة)" : "حالة التوفر الحالية غير مؤكدة"}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {c.phones.map((p) => <Button key={p} asChild size="sm"><a href={telUrl(p)}><Phone className="h-3.5 w-3.5" />اتصال <span dir="ltr">{p}</span></a></Button>)}
            {c.whatsapp && <Button asChild size="sm" variant="outline"><a href={whatsappUrl(c.whatsapp)} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-3.5 w-3.5" />واتساب</a></Button>}
            {(c.address || hasLoc) && <Button size="sm" variant="outline" onClick={() => openExternal(directionsUrl(c, cityName(c.city_id)))}><Navigation className="h-3.5 w-3.5" />الاتجاهات</Button>}
            {!c.phones.length && !c.whatsapp && <span className="text-xs text-muted-foreground">لا يوجد رقم تواصل موثق</span>}
          </div>
          {!hasLoc && c.address && <p className="mt-2 text-xs text-warning">الموقع غير مؤكد — سيبحث Google بالاسم والعنوان.</p>}
          {c.source_urls[0] && <a href={c.source_urls[0]} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-primary">مصدر البيانات</a>}
        </article>;
      })}</div>
    </section>
  </div>;
}
