import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase client used by services/users
const mockFrom = vi.fn();
const mockRpc = vi.fn();
const mockAuth = {
  getSession: vi.fn(() => Promise.resolve({ data: { session: { access_token: "token" } } })),
  getUser: vi.fn(() => Promise.resolve({ data: { user: { id: "admin-user" } } })),
};

vi.mock("@/integrations/supabase/newClient", () => {
  // Minimal query builder to satisfy .select().eq().maybeSingle() and .update().eq()
  const builder = {
    select: vi.fn(() => builder),
    update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ data: null, error: null })) })),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(() =>
      Promise.resolve({
        data: { id: "target-user", empresa_id: "empresa-1", rol: "empleado" },
        error: null,
      }),
    ),
  } as any;

  mockFrom.mockImplementation((_table: string) => builder);
  mockRpc.mockResolvedValue({ data: null, error: null });

  return {
    supabase: {
      from: mockFrom,
      rpc: mockRpc,
      auth: mockAuth,
      functions: { invoke: vi.fn() },
    },
  };
});

import { validateEmail, validatePassword, ensureAdminAccessForEmail } from "@/services/users";

beforeEach(() => {
  mockFrom.mockClear();
  mockRpc.mockClear();
});

describe("Validaciones de usuarios", () => {
  it("valida emails correctamente", () => {
    expect(validateEmail("test@example.com")).toBe(true);
    expect(validateEmail("invalid")).toBe(false);
    expect(validateEmail("user@domain")).toBe(false);
  });

  it("enforce política de contraseña fuerte", () => {
    // Debe incluir minúscula, mayúscula, número y símbolo, 10+ caracteres
    expect(validatePassword("Aa1!aaaaaa")).toBe(true);
    expect(validatePassword("Aa1aaaaaa")).toBe(false); // falta símbolo
    expect(validatePassword("aaaaaaaaaa")).toBe(false); // falta mayúscula, número y símbolo
    expect(validatePassword("AA1!AAAAAA")).toBe(false); // falta minúscula
    expect(validatePassword("Aa1!aaaaa")).toBe(false); // menos de 10
  });
});

describe("Acceso administrativo y siembra de permisos", () => {
  it("asegura acceso admin para email existente y siembra ACL", async () => {
    const ok = await ensureAdminAccessForEmail("someone@example.com");
    expect(ok).toBe(true);
    // Debe haber consultado profiles y llamado a assign_roles, seed_acl_permissions_for_empresa
    expect(mockFrom).toHaveBeenCalledWith("profiles");
    expect(mockRpc).toHaveBeenCalledWith("assign_roles", expect.any(Object));
    expect(mockRpc).toHaveBeenCalledWith("seed_acl_permissions_for_empresa", expect.any(Object));
  });
});
