import { z } from "zod";
import type { Tables } from "@/integrations/supabase/types";

export type AmbulanceCompany = Tables<"ambulance_companies">;
export type AmbulanceRequest = Tables<"ambulance_requests">;
export const TRANSPORT_TYPES = ["من المنزل إلى مصحة أو مستشفى", "بين المصحات والمستشفيات", "نقل بين المدن", "سيارة إسعاف مجهزة", "حالات حرجة"] as const;
export const REQUEST_STATUS: Record<AmbulanceRequest["status"], string> = { new: "جديد", contacted: "تم التواصل", assigned: "أُسند لشركة", done: "مكتمل", cancelled: "ملغى" };

/** Libyan mobile numbers (09x / +2189x) → international digits for tel:/wa.me. */
export function intlPhone(p: string): string {
  const d = p.replace(/[^\d]/g, "");
  if (d.startsWith("218")) return d;
  if (d.startsWith("0")) return `218${d.slice(1)}`;
  return d;
}
export const whatsappUrl = (p: string) => `https://wa.me/${intlPhone(p)}`;
export const telUrl = (p: string) => `tel:${p.replace(/[^+\d]/g, "")}`;

export function filterCompanies(list: AmbulanceCompany[], cityId: string, type: string, query: string) {
  const q = query.trim();
  return list.filter((c) => (!cityId || c.city_id === cityId) && (!type || c.services.includes(type)) && (!q || [c.name, c.address ?? "", ...c.coverage].join(" ").includes(q)));
}

export const ambulanceRequestSchema = z.object({
  requester_name: z.string().trim().min(2, "أدخل الاسم").max(120),
  phone: z.string().trim().regex(/^(\+?218|0)9\d{8}$/, "أدخل رقم هاتف ليبي صحيح مثل 09XXXXXXXX"),
  pickup: z.string().trim().min(3, "حدّد مكان الانطلاق").max(500),
  destination: z.string().trim().min(2, "أدخل الوجهة").max(500),
  city: z.string().trim().min(2, "اختر المدينة").max(100),
  region: z.string().trim().max(100),
  transport_type: z.enum(TRANSPORT_TYPES),
  company_id: z.string().uuid().nullable(),
  notes: z.string().trim().max(1000),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
});
export type AmbulanceRequestInput = z.infer<typeof ambulanceRequestSchema>;

const httpsUrl = z.string().url().refine((v) => v.startsWith("https://"), "يجب استخدام رابط آمن https");
export const companySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(200),
  city: z.string().trim().min(2).max(100),
  region: z.string().trim().max(100),
  address: z.string().trim().max(1000).nullable(),
  phones: z.array(z.string().trim().min(5).max(40)).max(10),
  whatsapp: z.string().trim().max(40).nullable(),
  website: httpsUrl.nullable(),
  coverage: z.array(z.string().trim().min(1).max(100)).max(50),
  vehicle_types: z.array(z.string().trim().min(1).max(100)).max(20),
  services: z.array(z.enum(TRANSPORT_TYPES)).max(10),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  coordinate_source_url: httpsUrl.nullable(),
  source_urls: z.array(httpsUrl).min(1, "أضف مصدر البيانات").max(20),
  verification: z.enum(["pending", "verified"]),
  availability_confirmed: z.boolean(),
  published: z.boolean(),
}).refine((v) => (v.latitude === null) === (v.longitude === null) && (v.latitude === null || !!v.coordinate_source_url), { message: "أدخل إحداثيين موثقين ورابط مصدرهما، أو اتركهما فارغين", path: ["latitude"] });
export type CompanyInput = z.infer<typeof companySchema>;
