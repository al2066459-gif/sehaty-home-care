import { z } from "zod";
import type { Tables } from "@/integrations/supabase/types";

export type Clinic = Tables<"directory_clinics">;
export type City = Tables<"directory_cities">;
export type Region = Tables<"directory_regions">;
export type DirectoryData = { clinics: Clinic[]; cities: City[]; regions: Region[] };
export type Position = { lat: number; lng: number };
const httpsUrl = z.string().url().refine((v) => v.startsWith("https://"), "يجب استخدام رابط آمن https");
export const clinicSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(200),
  kind: z.enum(["مصحة", "عيادة", "مركز طبي", "مستشفى"]),
  city: z.string().trim().min(2).max(100),
  region: z.string().trim().max(100),
  address: z.string().trim().max(1000).nullable(),
  phones: z.array(z.string().trim().min(5).max(40)).max(10),
  specialties: z.array(z.string().trim().min(1).max(100)).max(50),
  services: z.array(z.string().trim().min(1).max(100)).max(50),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  coordinate_source_url: httpsUrl.nullable(),
  source_urls: z.array(httpsUrl).min(1, "أضف مصدر البيانات").max(20),
  photo_url: httpsUrl.nullable(),
  photo_attribution: z.string().max(300).nullable(),
  published: z.boolean(),
}).superRefine((v, ctx) => {
  if ((v.latitude === null) !== (v.longitude === null) || (v.latitude !== null && !v.coordinate_source_url)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "أدخل إحداثيين موثقين ورابط مصدرهما، أو اتركهما فارغين", path: ["latitude"] });
  }
  if (v.photo_url && !v.photo_attribution) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "أضف مصدر الصورة وحقوق استخدامها", path: ["photo_attribution"] });
});
export type ClinicInput = z.infer<typeof clinicSchema>;

export const normalizeArabic = (s: string) => s.toLowerCase().replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/[\u064B-\u065Fـ]/g, "").trim();
export function hasCoordinates(c: Pick<Clinic, "latitude" | "longitude">): boolean {
  return c.latitude !== null && c.longitude !== null && Number.isFinite(c.latitude) && Number.isFinite(c.longitude);
}
export function distanceKm(a: Position, b: Position): number {
  const rad = (n: number) => n * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
export function filterClinics(data: DirectoryData, query: string, city: string, region: string, specialty: string, position: Position | null) {
  const q = normalizeArabic(query);
  const result = data.clinics.filter((c) => {
    const area = data.regions.find((r) => r.id === c.region_id)?.name ?? "";
    return (!city || c.city_id === city) && (!region || c.region_id === region) && (!specialty || c.specialties.includes(specialty)) && (!q || normalizeArabic([c.name, c.address, area, ...c.specialties, ...c.services].join(" ")).includes(q));
  });
  if (position) result.sort((a, b) => {
    const d = (c: Clinic) => c.latitude === null || c.longitude === null ? Infinity : distanceKm(position, { lat: c.latitude, lng: c.longitude });
    return d(a) - d(b);
  });
  return result;
}
type MapsClinic = Pick<Clinic, "name" | "address" | "latitude" | "longitude">;
/** Text query: name + address + city + Libya, so it works for any Libyan city. */
export function mapsQuery(c: MapsClinic, cityName?: string | null) {
  return [c.name, c.address, cityName, "ليبيا"].filter((p) => p && p.trim()).join("، ");
}
/** Opens Google Maps search by name/address (shows results list if not matched exactly). */
export function mapsSearchUrl(c: MapsClinic, cityName?: string | null) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery(c, cityName))}`;
}
/** Directions from the user's current location; verified coordinates first, otherwise text search. */
export function directionsUrl(c: MapsClinic, cityName?: string | null) {
  const dest = hasCoordinates(c) ? `${c.latitude},${c.longitude}` : mapsQuery(c, cityName);
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=driving`;
}