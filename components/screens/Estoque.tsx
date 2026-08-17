"use client";

import { css } from "@/lib/css";
import { BRL, diasParado, initials, margem, margemChipStyle, norm } from "@/lib/helpers";
import { CHIPS, STATUS_META } from "@/lib/seed";
import type { Ctx } from "@/lib/context";
import type { Produto } from "@/lib/types";

const SORTS = [
  { id: "recente", label: "Recentes", cmp: (a: Produto, b: Produto) => diasParado(a.created_at) - diasParado(b.created_at) },
  { id: "caro", label: "Mais caro", cmp: (a: Produto, b: Produto) => b.preco_venda - a.preco_venda },
  { id: "margem", label: "Margem", cmp: (a: Produto, b: Produto) => margem(b) - margem(a) },
  { id: "parado", label: "Parado", cmp: (a: Produto, b: Produto) => diasParado(b.created_at) - diasParado(a.created_at) },
];

export default function Estoque({ ctx }: { ctx: Ctx }) {
  const { produtos, state, setState, openPeca } = ctx;
  const { query, chips, sort, mode } = state;

  const q = norm(query);
  let list = produtos.filter((p) => {
    if (q) {
      const hay = norm([p.nome, p.marca, p.descricao, p.sku, p.local, p.categoria, (p.tags || []).join(" ")].join(" "));
      if (!hay.includes(q) && !q.split(" ").every((t) => hay.includes(t))) return false;
    }
    return chips.every((id) => CHIPS.find((c) => c.id === id)!.test(p));
  });
  const sorter = SORTS.find((s) => s.id === sort) || SORTS[0];
  list = list.slice().sort(sorter.cmp);

  const grid = mode === "grid";

  return (
    <div style={css("display:flex;flex-direction:column;animation:ihslide .28s ease both")}>
      <div
        style={css(
          "position:sticky;top:0;background:rgba(11,12,10,.94);backdrop-filter:blur(12px);border-bottom:1px solid #1E211C;padding:16px 18px 12px;display:flex;flex-direction:column;gap:12px;z-index:5"
        )}
      >
        <div style={css("display:flex;gap:9px;align-items:center")}>
          <div style={css("flex:1;display:flex;align-items:center;gap:9px;background:#141613;border:1px solid #2E332B;border-radius:14px;padding:0 13px;height:46px")}>
            <span style={css("color:#6E7469;font-size:14px")}>⌕</span>
            <input
              value={query}
              onChange={(e) => setState({ query: e.target.value })}
              placeholder="Buscar nome, marca, SKU, tag…"
              style={css("flex:1;background:none;border:none;outline:none;color:#F2F4EF;font-size:14px;font-weight:600;min-width:0")}
            />
            {query.length > 0 && (
              <button
                onClick={() => setState({ query: "" })}
                style={css("background:#262A24;border:none;color:#9AA096;width:22px;height:22px;border-radius:999px;cursor:pointer;font-size:12px")}
              >
                ×
              </button>
            )}
          </div>
          <button
            onClick={() => setState({ view: "buscafoto", bfEstado: "camera" })}
            title="Buscar por foto"
            style={css("width:46px;height:46px;flex:none;background:#141613;border:1px solid #2E332B;border-radius:14px;color:#C6FF4F;font-size:15px;cursor:pointer")}
          >
            ◉
          </button>
          <button
            onClick={() => setState({ mode: grid ? "list" : "grid" })}
            style={css("width:46px;height:46px;flex:none;background:#141613;border:1px solid #2E332B;border-radius:14px;color:#C6FF4F;font-size:15px;cursor:pointer")}
          >
            {grid ? "▤" : "▦"}
          </button>
        </div>
        <div style={css("display:flex;gap:7px;overflow-x:auto;padding-bottom:2px")}>
          {CHIPS.map((c) => {
            const on = chips.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => setState({ chips: on ? chips.filter((x) => x !== c.id) : chips.concat(c.id) })}
                style={css(
                  `flex:none;white-space:nowrap;border-radius:999px;padding:8px 13px;font-size:11.5px;font-weight:700;cursor:pointer;border:1px solid ${
                    on ? "#C6FF4F" : "#2E332B"
                  };background:${on ? "#C6FF4F" : "#141613"};color:${on ? "#0B0C0A" : "#B7BEB2"}`
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>
        <div style={css("display:flex;align-items:center;justify-content:space-between;gap:10px")}>
          <span style={css("font-size:11.5px;font-weight:600;color:#7E857A")}>
            {list.length} {list.length === 1 ? "peça" : "peças"}
          </span>
          <div style={css("display:flex;gap:6px")}>
            {SORTS.map((s) => {
              const on = sort === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setState({ sort: s.id })}
                  style={css(
                    `border:none;background:${on ? "#262A24" : "transparent"};color:${
                      on ? "#C6FF4F" : "#6E7469"
                    };border-radius:8px;padding:6px 9px;font-size:11px;font-weight:700;cursor:pointer`
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        style={css(
          grid
            ? "display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:16px 18px 26px"
            : "display:flex;flex-direction:column;gap:8px;padding:16px 18px 26px"
        )}
      >
        {list.map((p) => {
          const m = margem(p);
          const stt = STATUS_META[p.status];
          return (
            <button
              key={p.id}
              onClick={() => openPeca(p.id)}
              style={css(
                `display:flex;${grid ? "flex-direction:column;" : "align-items:center;"}gap:${
                  grid ? "0" : "12px"
                };background:#141613;border:1px solid #262A24;border-radius:18px;overflow:hidden;padding:0;cursor:pointer;text-align:left;color:#F2F4EF`
              )}
            >
              <span
                style={css(
                  `position:relative;${
                    grid ? "width:100%;aspect-ratio:1/1;" : "width:78px;height:78px;flex:none;margin:10px 0 10px 10px;border-radius:14px;"
                  }background:linear-gradient(150deg,hsl(${p.hue} 44% 36%),hsl(${(p.hue + 40) % 360} 34% 18%));display:flex;align-items:center;justify-content:center`
                )}
              >
                <span style={css("font-size:26px;font-weight:800;color:rgba(255,255,255,.5);letter-spacing:-.03em")}>{initials(p)}</span>
                <span style={css("position:absolute;top:8px;left:8px;font-size:9.5px;font-weight:800;letter-spacing:.06em;color:rgba(255,255,255,.55);background:rgba(0,0,0,.35);border-radius:5px;padding:3px 5px")}>
                  FOTO
                </span>
                <span
                  style={css(
                    `position:absolute;bottom:8px;right:8px;font-size:9.5px;font-weight:800;letter-spacing:.03em;color:${stt.fg};background:rgba(8,9,6,.72);border-radius:6px;padding:4px 7px`
                  )}
                >
                  {stt.label}
                </span>
              </span>
              <span style={css(`display:flex;flex-direction:column;gap:2px;padding:${grid ? "11px 12px 14px" : "12px 14px 12px 0"};min-width:0;flex:1`)}>
                <span style={css("font-size:10.5px;font-weight:700;color:#7E857A;letter-spacing:.04em;text-transform:uppercase")}>{p.marca}</span>
                <span style={css("font-size:13.5px;font-weight:700;letter-spacing:-.015em;line-height:1.25")}>{p.nome}</span>
                <span style={css("display:flex;align-items:baseline;gap:7px;margin-top:2px")}>
                  <span style={css("font-size:15px;font-weight:800;letter-spacing:-.02em")}>{BRL(p.preco_venda)}</span>
                  <span style={css(margemChipStyle(m))}>{Math.round(m * 100)}%</span>
                </span>
                <span style={css("font-size:11px;font-weight:500;color:#6E7469")}>
                  {p.tamanho} · {p.qtd} un · {p.local}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {list.length === 0 && (
        <div style={css("padding:60px 30px;text-align:center;display:flex;flex-direction:column;gap:8px;align-items:center")}>
          <div style={css("font-size:28px;color:#3A3F36")}>⌕</div>
          <div style={css("font-size:14px;font-weight:700")}>Nada encontrado</div>
          <div style={css("font-size:12px;color:#7E857A;max-width:240px;line-height:1.5")}>Tente outra palavra ou limpe os filtros ativos.</div>
          <button
            onClick={() => setState({ chips: [], query: "" })}
            style={css("margin-top:6px;background:#141613;border:1px solid #2E332B;color:#C6FF4F;border-radius:12px;padding:10px 16px;font-size:12.5px;font-weight:700;cursor:pointer")}
          >
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}
