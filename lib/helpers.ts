import type { Produto } from "./types";

export const BRL = (n: number) =>
  "R$ " + Math.round(n).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export function margem(p: Pick<Produto, "preco_venda" | "custo_total">): number {
  if (!p.preco_venda) return 0;
  return (p.preco_venda - p.custo_total) / p.preco_venda;
}

export function norm(s: string | null | undefined): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function initials(p: Pick<Produto, "marca">): string {
  return (p.marca || "?")
    .replace(/[^A-Za-z ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function thumbStyle(p: Pick<Produto, "hue">, size = 40): string {
  const s = size;
  return `width:${s}px;height:${s}px;flex:none;border-radius:11px;background:linear-gradient(150deg,hsl(${p.hue} 42% 34%),hsl(${(p.hue + 40) % 360} 34% 20%));display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:rgba(255,255,255,.7)`;
}

export function margemChipStyle(m: number, big?: boolean): string {
  const col = m < 0.2 ? "#FF6B5A" : "#7CE38B";
  if (big) return `font-size:20px;font-weight:800;letter-spacing:-.03em;color:${col}`;
  return `font-size:11px;font-weight:800;color:${col};background:${
    m < 0.2 ? "rgba(255,107,90,.13)" : "rgba(124,227,139,.12)"
  };border-radius:7px;padding:3px 6px`;
}

export function diasParado(createdAt: string, now: Date = new Date()): number {
  const created = new Date(createdAt);
  const ms = now.getTime() - created.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export function num(s: string): number {
  const n = parseFloat(String(s).replace(",", "."));
  return isNaN(n) ? 0 : n;
}
