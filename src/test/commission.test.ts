import { describe, expect, it } from "vitest";
import { splitCommission } from "@/lib/commission";

describe("platform commission", () => {
  it("takes 15% of a 100 LYD visit", () => {
    expect(splitCommission(100, 15)).toEqual({ commission: 15, providerNet: 85 });
  });
});
