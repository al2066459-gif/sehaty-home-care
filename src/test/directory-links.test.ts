import { describe, expect, it } from "vitest";
import { directionsUrl, mapsSearchUrl } from "@/lib/directory";

const base = { name: "مصحة الأسرة", address: "شارع الجمهورية", latitude: null, longitude: null };

describe("Google Maps links", () => {
  it("search uses name, address, city and Libya", () => {
    const q = decodeURIComponent(new URL(mapsSearchUrl(base, "طرابلس")).searchParams.get("query")!);
    expect(q).toBe("مصحة الأسرة، شارع الجمهورية، طرابلس، ليبيا");
  });
  it("directions use verified coordinates when present", () => {
    const u = new URL(directionsUrl({ ...base, latitude: 32.86, longitude: 13.18 }, "طرابلس"));
    expect(u.searchParams.get("destination")).toBe("32.86,13.18");
  });
  it("directions fall back to text search without coordinates", () => {
    const u = new URL(directionsUrl(base, "بنغازي"));
    expect(u.searchParams.get("destination")).toBe("مصحة الأسرة، شارع الجمهورية، بنغازي، ليبيا");
  });
});
