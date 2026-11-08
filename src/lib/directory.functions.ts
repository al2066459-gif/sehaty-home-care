import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { clinicSchema, type Clinic, type DirectoryData } from "./directory";
import type { Database } from "@/integrations/supabase/types";

export const getDirectory = createServerFn({ method: "GET" }).handler(async (): Promise<DirectoryData> => {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error("تعذر الاتصال بدليل المصحات");
  const db = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
  const [cities, regions] = await Promise.all([db.from("directory_cities").select("*"), db.from("directory_regions").select("*")]);
  if (cities.error || regions.error) throw new Error("تعذر تحميل المدن والمناطق");
  const clinics: Clinic[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db.from("directory_clinics").select("*").eq("published", true).order("id").range(offset, offset + 499);
    if (error) throw new Error("تعذر تحميل المصحات، يرجى المحاولة مجدداً");
    clinics.push(...data);
    if (data.length < 500) break;
  }
  return { clinics, cities: cities.data ?? [], regions: regions.data ?? [] };
});

export const getManagedDirectory = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }): Promise<DirectoryData> => {
  const { data: admin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (roleError || !admin) throw new Error("هذا الحساب لا يملك صلاحية إدارة دليل المصحات");
  const [cities, regions] = await Promise.all([context.supabase.from("directory_cities").select("*"), context.supabase.from("directory_regions").select("*")]);
  const clinics: Clinic[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await context.supabase.from("directory_clinics").select("*").order("id").range(offset, offset + 499);
    if (error) throw new Error("تعذر تحميل المصحات");
    clinics.push(...data);
    if (data.length < 500) break;
  }
  if (cities.error || regions.error) throw new Error("تعذر تحميل المناطق");
  return { clinics, cities: cities.data ?? [], regions: regions.data ?? [] };
});

export const saveClinic = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => clinicSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: admin, error: roleError } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (roleError || !admin) throw new Error("لا تملك صلاحية تعديل الدليل");
    const { city, region, id, ...fields } = data;
    // Only hosted app storage is rendered as media; external images must be imported first.
    const storageOrigin = process.env['SUPABASE_URL'];
    const browserOrigin = process.env['VITE_SUPABASE_URL'];
    if (fields.photo_url && ![storageOrigin, browserOrigin].some((u) => u && fields.photo_url?.startsWith(`${u}/storage/v1/object/public/`))) throw new Error("استخدم صورة مرفوعة إلى تخزين التطبيق");
    const cityResult = await context.supabase.from("directory_cities").upsert({ name: city, country: "ليبيا" }, { onConflict: "name,country" }).select("id").single();
    if (cityResult.error) throw new Error("تعذر حفظ المدينة");
    let regionId: string | null = null;
    if (region) {
      const regionResult = await context.supabase.from("directory_regions").upsert({ city_id: cityResult.data.id, name: region }, { onConflict: "city_id,name" }).select("id").single();
      if (regionResult.error) throw new Error("تعذر حفظ المنطقة");
      regionId = regionResult.data.id;
    }
    const payload = { ...fields, city_id: cityResult.data.id, region_id: regionId, updated_at: new Date().toISOString(), verified_at: new Date().toISOString() };
    const result = id ? await context.supabase.from("directory_clinics").update(payload).eq("id", id).select("id").single() : await context.supabase.from("directory_clinics").insert(payload).select("id").single();
    if (result.error) throw new Error("تعذر حفظ المصحة، راجع البيانات والمصادر");
    return result.data;
  });