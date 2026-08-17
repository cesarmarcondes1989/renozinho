"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { BRL, num } from "@/lib/helpers";
import { REVISAO_MOCK } from "@/lib/seed";
import { supabase } from "@/lib/supabase";
import type { Ctx } from "@/lib/context";

const HUES = [12, 208, 46, 268, 150, 330, 24, 190, 96, 0, 240, 60];
const WIZ_TITLES: Record<number, string> = {
  1: "Fotos da peça",
  2: "Analisando",
  3: "Revisar o que a IA leu",
  4: "Custos e preço",
  5: "Pronto",
};

export default function Wizard({ ctx }: { ctx: Ctx }) {
  const { state, setState, setProdutos, produtos, go } = ctx;
  const { wz, fotos } = state;
  const [savedResumo, setSavedResumo] = useState("");

  const custoTotalCalc = Math.round((num(state.custoUsd) + num(state.freteUsd)) * num(state.cotacao) + num(state.outros));
  const pv = num(state.precoVenda);
  const mLive = pv > 0 ? (pv - custoTotalCalc) / pv : 0;

  const analisar = () => {
    setState({ wz: 2 });
    setTimeout(() => setState({ wz: 3 }), 1900);
  };

  const salvar = async () => {
    const nome = "Camiseta Polo Ralph Lauren infantil";
    const newId = produtos.length ? Math.max(...produtos.map((p) => p.id)) + 1 : 1;
    const novaPeca = {
      id: newId,
      nome,
      marca: "Ralph Lauren",
      categoria: "Roupa Infantil",
      cor: "Azul marinho",
      cor2: "Branco",
      tamanho: "12 meses",
      sistema: "US",
      material: "Algodão pima",
      genero: "Infantil",
      condicao: "Novo com etiqueta",
      custo_usd: num(state.custoUsd),
      frete_usd: num(state.freteUsd),
      cotacao: num(state.cotacao),
      taxa: 0,
      outros_custos: num(state.outros),
      custo_total: custoTotalCalc,
      preco_venda: pv,
      qtd: 1,
      local: "Caixa 3",
      status: "disponivel" as const,
      created_at: new Date().toISOString(),
      fornecedor: "Ralph Lauren Outlet, Orlando",
      lote: "Cadastro via wizard",
      sku: "RL-POLO-" + newId,
      hue: 208,
      descricao:
        "Polo clássica infantil em algodão pima, azul marinho com pônei bordado. Novinha com etiqueta, comprada em outlet nos EUA.",
      tags: ["pônei bordado", "outlet", "algodão pima"],
      variacoes: [{ label: "12 meses · Azul marinho", sku: "RL-POLO-" + newId, qtd: 1 }],
    };

    if (supabase) {
      const { data, error } = await supabase
        .from("products")
        .insert({
          nome: novaPeca.nome,
          marca: novaPeca.marca,
          categoria: novaPeca.categoria,
          cor: novaPeca.cor,
          cor2: novaPeca.cor2,
          tamanho: novaPeca.tamanho,
          sistema: novaPeca.sistema,
          material: novaPeca.material,
          genero: novaPeca.genero,
          condicao: novaPeca.condicao,
          custo_usd: novaPeca.custo_usd,
          frete_usd: novaPeca.frete_usd,
          cotacao: novaPeca.cotacao,
          taxa: novaPeca.taxa,
          outros_custos: novaPeca.outros_custos,
          custo_total: novaPeca.custo_total,
          preco_venda: novaPeca.preco_venda,
          qtd: novaPeca.qtd,
          local: novaPeca.local,
          status: novaPeca.status,
          fornecedor: novaPeca.fornecedor,
          lote: novaPeca.lote,
          sku: novaPeca.sku,
          hue: novaPeca.hue,
          descricao: novaPeca.descricao,
          tags: novaPeca.tags,
          variacoes: novaPeca.variacoes,
        })
        .select()
        .single();
      if (!error && data) {
        setProdutos((prev) => [
          ...prev,
          { ...novaPeca, id: data.id, created_at: data.created_at ?? novaPeca.created_at },
        ]);
      } else {
        setProdutos((prev) => [...prev, novaPeca]);
      }
    } else {
      setProdutos((prev) => [...prev, novaPeca]);
    }

    setSavedResumo(BRL(pv) + " · margem " + Math.round(mLive * 100) + "% · Caixa 3");
    setState({ wz: 5 });
  };

  return (
    <div style={css("display:flex;flex-direction:column;min-height:100%")}>
      <div style={css("padding:16px 18px 12px;display:flex;flex-direction:column;gap:12px;border-bottom:1px solid #1E211C")}>
        <div style={css("display:flex;align-items:center;gap:12px")}>
          <button
            onClick={() => (wz <= 1 ? go("home") : setState({ wz: wz - 1 }))}
            style={css("width:36px;height:36px;flex:none;border-radius:999px;background:#141613;border:1px solid #2E332B;color:#F2F4EF;font-size:15px;cursor:pointer")}
          >
            ‹
          </button>
          <span style={css("flex:1;font-size:14px;font-weight:800;letter-spacing:-.015em")}>{WIZ_TITLES[wz]}</span>
          <span style={css("font-size:11px;font-weight:700;color:#7E857A")}>Passo {Math.min(wz, 4)} de 4</span>
        </div>
        <div style={css("display:flex;gap:5px")}>
          {[1, 2, 3, 4].map((i) => (
            <span key={i} style={css(`flex:1;height:4px;border-radius:9px;background:${wz >= i ? "#C6FF4F" : "#262A24"}`)} />
          ))}
        </div>
      </div>

      {wz === 1 && (
        <div style={css("padding:18px;display:flex;flex-direction:column;gap:16px;animation:ihslide .24s ease both")}>
          <div style={css("font-size:12.5px;font-weight:500;color:#8B9186;line-height:1.6")}>
            Frente, verso, etiqueta e defeito. Quanto mais ângulos, melhor a leitura da IA (simulada).
          </div>
          <div style={css("display:grid;grid-template-columns:repeat(2,1fr);gap:10px")}>
            {["FRENTE", "VERSO", "ETIQUETA", "DEFEITO"].slice(0, fotos).map((label, i) => (
              <div
                key={label}
                style={css(
                  `position:relative;aspect-ratio:3/4;border-radius:16px;background:linear-gradient(150deg,hsl(${HUES[i]} 40% 32%),hsl(${HUES[i + 3]} 30% 16%));display:flex;align-items:flex-end;justify-content:center;padding-bottom:9px`
                )}
              >
                <span style={css("font-size:10px;font-weight:800;letter-spacing:.06em;color:rgba(255,255,255,.65)")}>{label}</span>
                <span style={css("position:absolute;top:6px;right:6px;width:20px;height:20px;border-radius:999px;background:rgba(8,9,6,.65);color:#F2F4EF;font-size:11px;display:flex;align-items:center;justify-content:center")}>
                  ×
                </span>
              </div>
            ))}
            <button
              onClick={() => setState({ fotos: Math.min(4, fotos + 1) })}
              style={css(
                "aspect-ratio:3/4;border-radius:16px;background:#0E100D;border:1.5px dashed #34402A;color:#C6FF4F;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;cursor:pointer;font-size:12px;font-weight:700"
              )}
            >
              <span style={css("font-size:22px")}>◉</span> Tirar foto
            </button>
          </div>
          <button
            onClick={() => setState({ fotos: Math.min(4, fotos + 1) })}
            style={css("flex:1;background:#141613;border:1px solid #2E332B;color:#B7BEB2;border-radius:14px;padding:14px;font-size:12.5px;font-weight:700;cursor:pointer")}
          >
            Escolher da galeria
          </button>
          <div style={css("margin-top:auto")} />
          <button
            onClick={analisar}
            style={css("background:#C6FF4F;color:#0B0C0A;border:none;border-radius:16px;padding:17px;font-size:15px;font-weight:800;cursor:pointer")}
          >
            Analisar {fotos} fotos
          </button>
        </div>
      )}

      {wz === 2 && (
        <div style={css("padding:60px 26px;display:flex;flex-direction:column;align-items:center;gap:22px;text-align:center")}>
          <div style={css("width:64px;height:64px;border-radius:999px;border:3px solid #262A24;border-top-color:#C6FF4F;animation:ihspin .9s linear infinite")} />
          <div style={css("display:flex;flex-direction:column;gap:6px")}>
            <div style={css("font-size:16px;font-weight:800;letter-spacing:-.02em")}>Lendo as fotos… (simulado)</div>
            <div style={css("font-size:12.5px;font-weight:500;color:#8B9186")}>Marca, tamanho, cor, condição e código de barras.</div>
          </div>
          <div style={css("width:100%;display:flex;flex-direction:column;gap:9px")}>
            {[70, 92, 54, 80].map((w, i) => (
              <span key={i} style={css(`height:13px;width:${w}%;border-radius:7px;background:#1A1D18;animation:ihpulse 1.3s ease-in-out infinite`)} />
            ))}
          </div>
        </div>
      )}

      {wz === 3 && (
        <div style={css("padding:18px;display:flex;flex-direction:column;gap:14px;animation:ihslide .24s ease both")}>
          <div style={css("display:flex;gap:12px;align-items:center;background:#141608;border:1px solid rgba(245,197,24,.3);border-radius:14px;padding:12px 14px")}>
            <span style={css("font-size:16px;color:#F5C518")}>⚠</span>
            <span style={css("font-size:11.5px;font-weight:600;color:#E8D9A0;line-height:1.5")}>
              Dados de exemplo (simulados) com campos de baixa confiança marcados em amarelo. Confirme antes de salvar.
            </span>
          </div>
          {REVISAO_MOCK.map((r) => {
            const low = r.conf < 0.7;
            return (
              <div
                key={r.label}
                style={css(
                  `display:flex;flex-direction:column;gap:5px;padding:12px 14px;border-radius:14px;background:${
                    low ? "rgba(245,197,24,.07)" : "#141613"
                  };border:1px solid ${low ? "rgba(245,197,24,.4)" : "#262A24"}`
                )}
              >
                <div style={css("display:flex;align-items:center;justify-content:space-between;gap:8px")}>
                  <span style={css("font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#6E7469")}>{r.label}</span>
                  <span style={css(`font-size:10px;font-weight:800;color:${low ? "#F5C518" : "#5F655B"}`)}>{Math.round(r.conf * 100)}%</span>
                </div>
                <div style={css("font-size:14px;font-weight:700;letter-spacing:-.01em;line-height:1.4")}>{r.valor}</div>
              </div>
            );
          })}
          <button
            onClick={() => setState({ wz: 4 })}
            style={css("background:#C6FF4F;color:#0B0C0A;border:none;border-radius:16px;padding:17px;font-size:15px;font-weight:800;cursor:pointer")}
          >
            Confirmar e ir aos custos
          </button>
        </div>
      )}

      {wz === 4 && (
        <div style={css("padding:18px;display:flex;flex-direction:column;gap:14px;animation:ihslide .24s ease both")}>
          <div style={css("display:grid;grid-template-columns:1fr 1fr;gap:10px")}>
            {[
              { label: "CUSTO US$", key: "custoUsd" as const },
              { label: "COTAÇÃO", key: "cotacao" as const },
              { label: "FRETE US$", key: "freteUsd" as const },
              { label: "OUTROS R$", key: "outros" as const },
            ].map((f) => (
              <div key={f.key} style={css("background:#141613;border:1px solid #2E332B;border-radius:14px;padding:11px 13px;display:flex;flex-direction:column;gap:4px")}>
                <span style={css("font-size:10px;font-weight:800;letter-spacing:.06em;color:#6E7469")}>{f.label}</span>
                <input
                  value={state[f.key]}
                  onChange={(e) => setState({ [f.key]: e.target.value } as any)}
                  style={css("background:none;border:none;outline:none;color:#F2F4EF;font-size:17px;font-weight:800;width:100%;letter-spacing:-.02em")}
                />
              </div>
            ))}
          </div>

          <div style={css("background:#101410;border:1px solid #2E3B22;border-radius:16px;padding:15px;display:flex;align-items:center;justify-content:space-between")}>
            <span style={css("font-size:12px;font-weight:700;color:#9AA096")}>Custo total</span>
            <span style={css("font-size:22px;font-weight:800;letter-spacing:-.03em")}>{BRL(custoTotalCalc)}</span>
          </div>

          <div style={css("background:#141613;border:1px solid #2E332B;border-radius:16px;padding:15px;display:flex;flex-direction:column;gap:12px")}>
            <div style={css("display:flex;align-items:center;justify-content:space-between;gap:10px")}>
              <span style={css("font-size:11px;font-weight:800;letter-spacing:.06em;color:#6E7469")}>PREÇO DE VENDA R$</span>
              <span style={css(`font-size:11px;font-weight:800;color:${mLive < 0.2 ? "#FF6B5A" : "#7CE38B"};background:${mLive < 0.2 ? "rgba(255,107,90,.13)" : "rgba(124,227,139,.12)"};border-radius:7px;padding:3px 6px`)}>
                margem {Math.round(mLive * 100)}%
              </span>
            </div>
            <input
              value={state.precoVenda}
              onChange={(e) => setState({ precoVenda: e.target.value })}
              style={css("background:none;border:none;outline:none;color:#F2F4EF;font-size:28px;font-weight:800;letter-spacing:-.035em;width:100%")}
            />
            <div style={css("height:1px;background:#242822")} />
            <div style={css("display:flex;align-items:center;justify-content:space-between")}>
              <span style={css("font-size:11.5px;font-weight:600;color:#8B9186")}>Markup</span>
              <span style={css("font-size:12.5px;font-weight:800")}>
                {custoTotalCalc > 0 ? Math.round((pv / custoTotalCalc - 1) * 100) + "%" : "—"}
              </span>
            </div>
            <div style={css("display:flex;align-items:center;justify-content:space-between")}>
              <span style={css("font-size:11.5px;font-weight:600;color:#8B9186")}>Lucro por unidade</span>
              <span style={css(`font-size:12.5px;font-weight:800;color:${pv - custoTotalCalc <= 0 ? "#FF6B5A" : "#7CE38B"}`)}>
                {BRL(Math.round(pv - custoTotalCalc))}
              </span>
            </div>
          </div>

          <div style={css("display:flex;flex-direction:column;gap:8px")}>
            <span style={css("font-size:11px;font-weight:800;letter-spacing:.06em;color:#6E7469")}>SUGESTÕES (já com taxa do canal)</span>
            <div style={css("display:flex;gap:8px")}>
              {[0.3, 0.5, 1].map((mgn) => {
                const preco = Math.round((custoTotalCalc * (1 + mgn)) / (1 - 0.14));
                return (
                  <button
                    key={mgn}
                    onClick={() => setState({ precoVenda: String(preco) })}
                    style={css("flex:1;background:#0E100D;border:1px solid #2E332B;border-radius:14px;padding:12px 8px;display:flex;flex-direction:column;gap:3px;align-items:center;cursor:pointer")}
                  >
                    <span style={css("font-size:10px;font-weight:800;color:#C6FF4F;letter-spacing:.04em")}>{Math.round(mgn * 100)}%</span>
                    <span style={css("font-size:13.5px;font-weight:800;color:#F2F4EF;letter-spacing:-.02em")}>{BRL(preco)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={salvar}
            style={css("background:#C6FF4F;color:#0B0C0A;border:none;border-radius:16px;padding:17px;font-size:15px;font-weight:800;cursor:pointer")}
          >
            Salvar peça
          </button>
        </div>
      )}

      {wz === 5 && (
        <div style={css("padding:70px 26px;display:flex;flex-direction:column;align-items:center;gap:20px;text-align:center")}>
          <div
            style={css(
              "width:78px;height:78px;border-radius:999px;background:#C6FF4F;color:#0B0C0A;display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:800;animation:ihpop .42s cubic-bezier(.2,1.4,.4,1) both"
            )}
          >
            ✓
          </div>
          <div style={css("display:flex;flex-direction:column;gap:6px")}>
            <div style={css("font-size:19px;font-weight:800;letter-spacing:-.025em")}>Peça salva</div>
            <div style={css("font-size:12.5px;font-weight:500;color:#8B9186;line-height:1.6")}>
              Camiseta Polo Ralph Lauren infantil
              <br />
              {savedResumo}
            </div>
          </div>
          <div style={css("display:flex;flex-direction:column;gap:9px;width:100%;max-width:300px")}>
            <button
              onClick={() =>
                setState({ view: "wizard", wz: 1, fotos: 2, custoUsd: "10", cotacao: "5.42", freteUsd: "2", outros: "8", precoVenda: "100" })
              }
              style={css("background:#C6FF4F;color:#0B0C0A;border:none;border-radius:15px;padding:15px;font-size:14px;font-weight:800;cursor:pointer")}
            >
              Cadastrar outra
            </button>
            <button
              onClick={() => go("estoque")}
              style={css("background:#141613;border:1px solid #2E332B;color:#B7BEB2;border-radius:15px;padding:15px;font-size:14px;font-weight:700;cursor:pointer")}
            >
              Ver no estoque
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
