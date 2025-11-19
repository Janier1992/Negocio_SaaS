import { describe, it, expect, vi, beforeEach } from "vitest";
import * as alertsSvc from "@/services/alerts";

// Mock Supabase client used by alerts service
vi.mock("@/integrations/supabase/newClient", () => {
  return {
    supabase: {
      from: vi.fn(() => ({
        update: vi.fn(() => ({ in: vi.fn(() => Promise.resolve({ error: null })) })),
        eq: vi.fn(() => ({ update: vi.fn(() => Promise.resolve({ error: null })) })),
      })),
    },
  };
});

describe("markAlertsReadFlexible", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("actualiza solo ids UUID y omite sintéticos", async () => {
    const ids = [
      "11111111-1111-1111-1111-111111111111",
      "sintetica-pb-1",
      "00000000-0000-0000-0000-000000000000",
      "alerta-stock-critico-pc-2",
    ];
    const res = await alertsSvc.markAlertsReadFlexible(ids, true);
    expect(res.updated).toBe(2);
    expect(res.attempted).toBe(2);
    expect(res.skippedSynthetic).toBe(2);
  });

  it("no llama a DB cuando no hay UUIDs", async () => {
    const ids = ["sintetica-1", "alerta-temp-2"];
    const res = await alertsSvc.markAlertsReadFlexible(ids, true);
    expect(res.updated).toBe(0);
    expect(res.attempted).toBe(0);
    expect(res.skippedSynthetic).toBe(2);
  });
});
