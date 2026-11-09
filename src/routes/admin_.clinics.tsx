import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowRight, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteClinic, getManagedDirectory, saveClinic } from "@/lib/directory.functions";
import type { Clinic, DirectoryData } from "@/lib/directory";

export const Route = createFileRoute("/admin_/clinics")({
  head: () => ({ meta: [
    { title: "إدارة دليل المصحات - صحتي" },
    { name: "description", content: "إضافة وتعديل وحذف بيانات المصحات الطبية في دليل صحتي." },
    { property: "og:title", content: "إدارة دليل المصحات - صحتي" },
    { property: "og:description", content: "لوحة إدارة بيانات المصحات في ليبيا." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: ClinicsAdmin,
});

type Form = { id?: string; name: string; kind: string; city: string; region: string; address: string; phones: string; specialties: string; services: string; latitude: string; longitude: string; coordinate_source_url: string; source_urls: string; published: boolean };
const empty: Form = { name: "", kind: "مصحة", city: "طرابلس", region: "", address: "", phones: "", specialties: "", services: "", latitude: "", longitude: "", coordinate_source_url: "", source_urls: "", published: true };
const list = (s: string) => s.split(/[،,\n]/).map((x) => x.trim()).filter(Boolean);

function ClinicsAdmin() {
  const [state, setState] = useState<"loading" | "out" | "denied" | "ok">("loading");
  const [data, setData] = useState<DirectoryData | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [msg, setMsg] = useState("");
  const load = useServerFn(getManagedDirectory), save = useServerFn(saveClinic), remove = useServerFn(deleteClinic);
  const refresh = async () => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) { setState("out"); return; }
    try { setData(await load()); setState("ok"); } catch { setState("denied"); }
  };
  useEffect(() => { void refresh(); }, []);

  const edit = (c: Clinic) => setForm({ id: c.id, name: c.name, kind: c.kind, city: data?.cities.find((x) => x.id === c.city_id)?.name ?? "", region: data?.regions.find((r) => r.id === c.region_id)?.name ?? "", address: c.address ?? "", phones: c.phones.join("، "), specialties: c.specialties.join("، "), services: c.services.join("، "), latitude: c.latitude?.toString() ?? "", longitude: c.longitude?.toString() ?? "", coordinate_source_url: c.coordinate_source_url ?? "", source_urls: c.source_urls.join("\n"), published: c.published });
  const submit = async () => {
    if (!form) return; setMsg("");
    try {
      await save({ data: { ...(form.id ? { id: form.id } : {}), name: form.name, kind: form.kind as "مصحة", city: form.city, region: form.region, address: form.address || null, phones: list(form.phones), specialties: list(form.specialties), services: list(form.services), latitude: form.latitude ? Number(form.latitude) : null, longitude: form.longitude ? Number(form.longitude) : null, coordinate_source_url: form.coordinate_source_url || null, source_urls: list(form.source_urls), photo_url: null, photo_attribution: null, published: form.published } });
      setForm(null); setMsg("تم الحفظ"); await refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "تعذر الحفظ؛ تحقق من الحقول والمصادر"); }
  };
  const del = async (c: Clinic) => { if (!confirm(`حذف «${c.name}» نهائياً؟`)) return; try { await remove({ data: { id: c.id } }); await refresh(); } catch { setMsg("تعذر الحذف"); } };
  const f = (k: keyof Form, label: string, area = false) => <label className="block text-sm font-bold">{label}{area ? <textarea className="mt-1 w-full rounded-md border bg-card p-2 font-normal" rows={2} value={String(form?.[k] ?? "")} onChange={(e) => setForm({ ...form!, [k]: e.target.value })} /> : <Input className="mt-1 bg-card font-normal" value={String(form?.[k] ?? "")} onChange={(e) => setForm({ ...form!, [k]: e.target.value })} />}</label>;

  return <div className="min-h-screen bg-background"><main className="mx-auto max-w-5xl space-y-5 p-4 md:p-8">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-extrabold">إدارة دليل المصحات</h1><Button asChild variant="ghost"><Link to="/admin"><ArrowRight className="h-4 w-4" />لوحة الإدارة</Link></Button></div>
    {state === "loading" && <p>جارٍ التحميل…</p>}
    {state === "out" && <div className="rounded-lg bg-card p-6 text-center shadow-card"><p className="mb-4">سجّل الدخول بحساب المسؤول لإدارة المصحات.</p><Button onClick={() => lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.href })}>الدخول عبر Google</Button></div>}
    {state === "denied" && <p className="rounded-lg bg-card p-6 text-center shadow-card">هذا الحساب لا يملك صلاحية إدارة الدليل.</p>}
    {msg && <p role="status" className="text-sm text-primary">{msg}</p>}
    {state === "ok" && data && <>
      {!form && <Button onClick={() => setForm({ ...empty })}><Plus className="h-4 w-4" />إضافة مصحة</Button>}
      {form && <div className="grid gap-3 rounded-lg bg-card p-5 shadow-card md:grid-cols-2">
        {f("name", "اسم المصحة *")}
        <label className="block text-sm font-bold">النوع<select className="mt-1 h-10 w-full rounded-md border bg-card px-2 font-normal" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>{["مصحة", "عيادة", "مركز طبي", "مستشفى"].map((k) => <option key={k}>{k}</option>)}</select></label>
        {f("city", "المدينة * (طرابلس، بنغازي، مصراتة، سبها…)")}{f("region", "المنطقة")}
        {f("address", "العنوان", true)}{f("phones", "أرقام الهاتف (افصل بفاصلة)")}
        {f("specialties", "التخصصات (افصل بفاصلة)")}{f("services", "الخدمات (افصل بفاصلة)")}
        {f("latitude", "خط العرض (فقط إن كان موثقاً)")}{f("longitude", "خط الطول (فقط إن كان موثقاً)")}
        {f("coordinate_source_url", "رابط مصدر الإحداثيات")}{f("source_urls", "روابط مصادر البيانات * (سطر لكل رابط)", true)}
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />منشورة للعامة</label>
        <div className="flex gap-2 md:col-span-2"><Button onClick={submit}>حفظ</Button><Button variant="outline" onClick={() => setForm(null)}>إلغاء</Button></div>
      </div>}
      <div className="space-y-2">{!data.clinics.length && <p className="text-muted-foreground">لا توجد مصحات بعد.</p>}
        {data.clinics.map((c) => <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-card p-4 shadow-card"><div><p className="font-bold">{c.name}</p><p className="text-xs text-muted-foreground">{data.cities.find((x) => x.id === c.city_id)?.name} · {c.published ? "منشورة" : "مخفية"}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => edit(c)}><Pencil className="h-4 w-4" />تعديل</Button><Button size="sm" variant="destructive" onClick={() => del(c)}><Trash2 className="h-4 w-4" />حذف</Button></div></div>)}
      </div>
    </>}
  </main></div>;
}
