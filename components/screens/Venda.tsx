"use client";

import { css } from "@/lib/css";
import { useTheme } from "@/lib/theme";
import { BRL, num } from "@/lib/helpers";
import Thumb from "@/components/Thumb";
import { CANAIS } from "@/lib/seed";
import { supabase } from "@/lib/supabase";
import type { Ctx } from "@/lib/context";

export default function Venda({ ctx }: { ctx: Ctx }) {
  const { t } = useTheme();
  const { produtos, setProdutos, vendas, setVendas, state, setState, go } = ctx;
  const sel = produtos.find((p) => p.id === state.selId) || produtos[0];
  if (!sel) return null;

  const canalObj = CANAIS.find((c) => c.label === state.canal) || CANAIS[0];
  const vp = num(state.vendaPreco);
  const taxaVal = Math.round(vp * canalObj.taxa);
  const lucroVenda = vp - taxaVal - sel.custo_total;

  const vendaLinhas = [
    { label: "Preço final", valor: BRL(vp), bold: false },
    { label: `Taxa do canal (${state.canal})`, valor: "− " + BRL(taxaVal), bold: false },
    { label: "Custo total da peça", valor: "− " + BRL(sel.custo_total), bold: false },
    { label: "Lucro real", valor: BRL(lucroVenda), bold: true },
  ];

  const confirmarVenda = async () => {
    const novaQtd = Math.max(0, sel.qtd - 1);
    const novoStatus = novaQtd === 0 ? ("vendido" as const) : sel.status;

    const novaVenda = {
      product_id: sel.id,
      preco_final: vp,
      canal: state.canal,
      taxa_canal: canalObj.taxa,
      custo_total_no_momento: sel.custo_total,
      lucro: lucroVenda,
      categoria: sel.categoria,
      produto_nome: sel.nome,
    };

    if (supabase) {
      const { data } = await supabase.from("sales").insert(novaVenda).select().single();
      await supabase.from("products").update({ qtd: novaQtd, status: novoStatus }).eq("id", sel.id);
      setVendas((prev) => prev.concat(data ? (data as any) : { ...novaVenda, vendido_em: new Date().toISOString() }));
    }

    setProdutos((prev) => prev.map((p) => (p.id === sel.id ? { ...p, qtd: novaQtd, status: novoStatus } : p)));
    go("home");
  };

  return (
    <div style={css("padding:18px;display:flex;flex-direction:column;gap:15px;animation:ihslide .26s ease both")}>
      <div style={css("display:flex;align-items:center;gap:12px")}>
        <button
          onClick={() => setState({ view: "peca", anuncio: false })}
          style={css(`width:36px;height:36px;flex:none;border-radius:999px;background:${t.bgCard};border:1px solid ${t.borderStrong};color:${t.textPrimary};font-size:15px;cursor:pointer`)}
        >
          ‹
        </button>
        <span style={css("font-size:16px;font-weight:800;letter-spacing:-.02em")}>Registrar venda</span>
      </div>

      <div style={css(`display:flex;gap:12px;align-items:center;background:${t.bgCard};border:1px solid ${t.border};border-radius:16px;padding:12px`)}>
        <Thumb p={sel} size={40} />
        <span style={css("flex:1;min-width:0;display:flex;flex-direction:column;gap:2px")}>
          <span style={css("font-size:13px;font-weight:700;letter-spacing:-.01em")}>{sel.nome}</span>
          <span style={css(`font-size:11px;font-weight:500;color:${t.textSecondary}`)}>
            custo {BRL(sel.custo_total)} · {sel.qtd} un em estoque
          </span>
        </span>
      </div>

      <div style={css(`background:${t.bgCard};border:1px solid ${t.borderStrong};border-radius:16px;padding:15px;display:flex;flex-direction:column;gap:6px`)}>
        <span style={css(`font-size:10px;font-weight:800;letter-spacing:.06em;color:${t.textTertiary}`)}>PREÇO FINAL R$</span>
        <input
          value={state.vendaPreco}
          onChange={(e) => setState({ vendaPreco: e.target.value })}
          style={css(`background:none;border:none;outline:none;color:${t.textPrimary};font-size:28px;font-weight:800;letter-spacing:-.035em;width:100%`)}
        />
      </div>

      <div style={css("display:flex;flex-direction:column;gap:8px")}>
        <span style={css(`font-size:11px;font-weight:800;letter-spacing:.06em;color:${t.textTertiary}`)}>CANAL</span>
        <div style={css("display:flex;flex-wrap:wrap;gap:7px")}>
          {CANAIS.map((c) => {
            const on = state.canal === c.label;
            return (
              <button
                key={c.label}
                onClick={() => setState({ canal: c.label })}
                style={css(
                  `border-radius:999px;padding:9px 13px;font-size:11.5px;font-weight:700;cursor:pointer;border:1px solid ${
                    on ? t.accent : t.borderStrong
                  };background:${on ? t.accent : t.bgCard};color:${on ? t.accentText : t.textBright}`
                )}
              >
                {c.label} <span style={{ opacity: 0.6 }}>{c.taxa ? Math.round(c.taxa * 100) + "%" : "0%"}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={css("background:#101410;border:1px solid #2E3B22;border-radius:16px;padding:15px;display:flex;flex-direction:column;gap:10px")}>
        {vendaLinhas.map((l) => (
          <div key={l.label} style={css("display:flex;align-items:center;justify-content:space-between;gap:10px")}>
            <span style={css(`font-size:11.5px;font-weight:${l.bold ? "700" : "500"};color:${l.bold ? t.textBright : t.textSecondary}`)}>{l.label}</span>
            <span
              style={css(
                `font-size:${l.bold ? "15" : "12.5"}px;font-weight:${l.bold ? "800" : "600"};letter-spacing:-.02em;color:${
                  l.bold ? (lucroVenda <= 0 ? "#FF6B5A" : t.accent) : t.textPrimary
                }`
              )}
            >
              {l.valor}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={confirmarVenda}
        style={css(`background:${t.accent};color:${t.accentText};border:none;border-radius:16px;padding:17px;font-size:15px;font-weight:800;cursor:pointer`)}
      >
        Confirmar venda e baixar estoque
      </button>
    </div>
  );
}
