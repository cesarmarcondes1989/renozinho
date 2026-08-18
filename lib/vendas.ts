import type { Venda } from "./types";

/**
 * Postgres/PostgREST error shapes that mean "this column doesn't exist in the
 * table yet". Happens when migration 0005 (sales.categoria / sales.produto_nome)
 * hasn't been applied to a database that already had 0001 — without a fallback
 * the whole sale insert is rejected.
 */
export function isColunaInexistente(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42703") return true; // undefined_column
  if (error.code === "PGRST204") return true; // PostgREST: column not found in schema cache
  const m = (error.message || "").toLowerCase();
  return m.includes("column") && (m.includes("does not exist") || m.includes("not found"));
}

export type InsertResult = { data: Venda | null; error: { code?: string; message?: string } | null };

/**
 * Minimal shape of the supabase client this module needs — keeps it testable
 * with a fake. Deliberately loose so the real SupabaseClient (whose generated
 * generics don't match a hand-written interface) is accepted too.
 */
export interface SalesWriter {
  from(table: string): SalesInsertBuilder;
}

/* eslint-disable */
type SalesInsertBuilder = any;
/* eslint-enable */

/**
 * Records a sale, degrading gracefully when the snapshot columns aren't in the
 * schema yet. Returns the error so the caller can decide what to do — crucially,
 * the caller must NOT mark the product as sold when this fails, otherwise the
 * product shows up as "Vendido" while no sale exists, and every sales figure
 * (lucro no mês, receita, analytics) silently reads zero.
 */
export async function registrarVenda(client: SalesWriter, venda: Venda): Promise<InsertResult> {
  const primeira = await client.from("sales").insert(venda as unknown as Record<string, unknown>).select().single();
  if (!primeira.error || !isColunaInexistente(primeira.error)) return primeira;

  const { categoria: _c, produto_nome: _p, ...semSnapshot } = venda;
  return client.from("sales").insert(semSnapshot as unknown as Record<string, unknown>).select().single();
}
