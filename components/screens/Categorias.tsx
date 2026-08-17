"use client";

import { css } from "@/lib/css";
import { BRL } from "@/lib/helpers";
import type { Ctx } from "@/lib/context";

export default function Categorias({ ctx }: { ctx: Ctx }) {
  const { produtos, categorias } = ctx;

  return (
    <div style={css("padding:20px 18px 26px;display:flex;flex-direction:column;gap:16px;animation:ihslide .28s ease both")}>
      <div>
        <div style={css("font-size:23px;font-weight:800;letter-spacing:-.03em")}>Categorias</div>
        <div style={css("font-size:12px;font-weight:500;color:#7E857A;margin-top:3px")}>Suas frentes de revenda.</div>
      </div>
      <div style={css("display:flex;flex-direction:column;gap:8px")}>
        {categorias.map((c) => {
          const ps = produtos.filter((p) => p.categoria === c.nome);
          const contagem = ps.reduce((s, p) => s + p.qtd, 0);
          const valorFmt = BRL(ps.reduce((s, p) => s + p.preco_venda * p.qtd, 0));
          return (
            <div key={c.nome} style={css("background:#141613;border:1px solid #262A24;border-radius:16px;overflow:hidden")}>
              <div style={css("display:flex;align-items:center;gap:12px;padding:13px 14px")}>
                <span style={css("color:#4A5045;font-size:13px;cursor:grab")}>⠿</span>
                <span
                  style={css(
                    `width:30px;height:30px;flex:none;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:13px;background:hsl(${c.hue} 40% 22%);color:hsl(${c.hue} 70% 70%)`
                  )}
                >
                  {c.icone}
                </span>
                <span style={css("flex:1;min-width:0;display:flex;flex-direction:column;gap:2px")}>
                  <span style={css("font-size:13.5px;font-weight:700;letter-spacing:-.01em")}>{c.nome}</span>
                  <span style={css("font-size:11px;font-weight:500;color:#7E857A")}>
                    {contagem} peças · {valorFmt}
                  </span>
                </span>
                <button style={css("background:none;border:none;color:#7E857A;font-size:15px;cursor:pointer;padding:4px")}>⋯</button>
              </div>
              {c.subs.length > 0 && (
                <div style={css("display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 13px 46px")}>
                  {c.subs.map((s) => (
                    <span key={s} style={css("font-size:11px;font-weight:600;color:#9AA096;background:#0E100D;border:1px solid #242822;border-radius:8px;padding:5px 9px")}>
                      {s}
                    </span>
                  ))}
                  <button style={css("font-size:11px;font-weight:700;color:#C6FF4F;background:none;border:1px dashed #34402A;border-radius:8px;padding:5px 9px;cursor:pointer")}>
                    + sub
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button style={css("background:none;border:1px dashed #34402A;color:#C6FF4F;border-radius:16px;padding:15px;font-size:13.5px;font-weight:800;cursor:pointer")}>
        + Nova categoria
      </button>
      <div style={css("background:#141613;border:1px solid #262A24;border-radius:16px;padding:14px;font-size:11.5px;font-weight:500;color:#8B9186;line-height:1.6")}>
        Ao arquivar ou excluir uma categoria com peças, o app exige mover as peças para outra antes de confirmar.
      </div>
    </div>
  );
}
