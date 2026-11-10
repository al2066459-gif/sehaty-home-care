import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { ambulanceRequestSchema, companySchema, type AmbulanceCompany, type AmbulanceRequest } from "./ambulance";
import type { City, Region } from "./directory";

function publicDb() {
  const url = process.env["SUPABASE_URL"], key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("تعذر الاتصال بالخادم");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const h = new Headers(init?.headers);
      if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
      h.set("apikey", key);
      return fetch(input, { ...init, headers: h });
    } },
  });
}

export const getAmbulanceCompanies = createServerFn({ method: "GET" }).handler(async (): Promise<{ companies: AmbulanceCompany[]; cities: City[]; regions: Region[] }> => {
  const db = publicDb();
  const [companies, cities, regions] = await Promise.all([
    db.from("ambulance_companies").select("*").eq("published", true).order("verification", { ascending: false }).order("name"),
    db.from("directory_cities").select("*").order("name"),
    db.from("directory_regions").select("*").order("name"),
  ]);
  if (companies.error || cities.error || regions.error) throw new Error("تعذر تحميل شركات الإسعاف");
  return { companies: companies.data, cities: cities.data, regions: regions.data };
});

/** Public submission: saved for Sehaty staff review; the DB only accepts status 'new'. */
export const submitAmbulanceRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ambulanceRequestSchema.parse(input))
  .handler(async ({ data }) => {
    const { error } = await publicDb().from("ambulance_requests").insert({ ...data, region: data.region || null, notes: data.notes || null });
    if (error) { console.error("ambulance request insert failed", error); throw new Error("تعذر حفظ الطلب، حاول مجدداً أو اتصل مباشرة"); }
    return { ok: true as const };
  });

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (error || !data) throw new Error("هذا الحساب لا يملك صلاحية الإدارة");
}

export const getAmbulanceAdmin = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }): Promise<{ companies: AmbulanceCompany[]; requests: AmbulanceRequest[] }> => {
  await assertAdmin(context);
  const [companies, requests] = await Promise.all([
    context.supabase.from("ambulance_companies").select("*").order("name"),
    context.supabase.from("ambulance_requests").select("*").order("created_at", { ascending: false }).limit(200),
  ]);
  if (companies.error || requests.error) throw new Error("تعذر تحميل بيانات الإسعاف");
  return { companies: companies.data, requests: requests.data };
});

export const saveCompany = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => companySchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { city, region, id, ...fields } = data;
    const c = await context.supabase.from("directory_cities").upsert({ name: city, country: "ليبيا" }, { onConflict: "name,country" }).select("id").single();
    if (c.error) throw new Error("تعذر حفظ المدينة");
    let region_id: string | null = null;
    if (region) {
      const r = await context.supabase.from("directory_regions").upsert({ city_id: c.data.id, name: region }, { onConflict: "city_id,name" }).select("id").single();
      if (r.error) throw new Error("تعذر حفظ المنطقة");
      region_id = r.data.id;
    }
    const payload = { ...fields, city_id: c.data.id, region_id, updated_at: new Date().toISOString() };
    const res = id ? await context.supabase.from("ambulance_companies").update(payload).eq("id", id).select("id").single() : await context.supabase.from("ambulance_companies").insert(payload).select("id").single();
    if (res.error) throw new Error("تعذر حفظ الشركة");
    return res.data;
  });

export const deleteCompany = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => ({ id: String(input.id) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("ambulance_companies").delete().eq("id", data.id);
    if (error) throw new Error("تعذر حذف الشركة");
    return { ok: true };
  });

const STATUSES = ["new", "contacted", "assigned", "done", "cancelled"] as const;
export const updateRequestStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: string }) => {
    if (!STATUSES.includes(input.status as (typeof STATUSES)[number])) throw new Error("حالة غير صالحة");
    return { id: String(input.id), status: input.status as (typeof STATUSES)[number] };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("ambulance_requests").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error("تعذر تحديث الطلب");
    return { ok: true };
  });

export const addPlace = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: { city: string; region?: string }) => {
    const city = String(input.city ?? "").trim(), region = String(input.region ?? "").trim();
    if (city.length < 2 || city.length > 100 || region.length > 100) throw new Error("أدخل اسم مدينة صحيح");
    return { city, region };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const c = await context.supabase.from("directory_cities").upsert({ name: data.city, country: "ليبيا" }, { onConflict: "name,country" }).select("id").single();
    if (c.error) throw new Error("تعذر حفظ المدينة");
    if (data.region) {
      const r = await context.supabase.from("directory_regions").upsert({ city_id: c.data.id, name: data.region }, { onConflict: "city_id,name" });
      if (r.error) throw new Error("تعذر حفظ المنطقة");
    }
    return { ok: true };
  });
