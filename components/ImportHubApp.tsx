"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { css } from "@/lib/css";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { SEED_PRODUTOS, SEED_CATEGORIAS } from "@/lib/seed";
import type { Produto, Categoria } from "@/lib/types";
import { initialState, type AppState, type Ctx, type View } from "@/lib/context";

import Home from "@/components/screens/Home";
import Estoque from "@/components/screens/Estoque";
import Peca from "@/components/screens/Peca";
import Categorias from "@/components/screens/Categorias";
import Wizard from "@/components/screens/Wizard";
import Venda from "@/components/screens/Venda";
import Analytics from "@/components/screens/Analytics";
import BuscaFoto from "@/components/screens/BuscaFoto";

function rowToProduto(r: any): Produto {
  return {
    id: r.id,
    nome: r.nome,
    marca: r.marca,
    categoria: r.categoria,
    cor: r.cor,
    cor2: r.cor2,
    tamanho: r.tamanho,
    sistema: r.sistema,
    material: r.material,
    genero: r.genero,
    condicao: r.condicao,
    custo_usd: Number(r.custo_usd),
    frete_usd: Number(r.frete_usd),
    cotacao: Number(r.cotacao),
    taxa: Number(r.taxa),
    outros_custos: Number(r.outros_custos ?? 0),
    custo_total: Number(r.custo_total),
    preco_venda: Number(r.preco_venda),
    qtd: r.qtd,
    local: r.local,
    status: r.status,
    created_at: r.created_at,
    fornecedor: r.fornecedor,
    lote: r.lote,
    sku: r.sku,
    hue: r.hue,
    descricao: r.descricao,
    tags: r.tags ?? [],
    variacoes: r.variacoes ?? [],
  };
}

export default function ImportHubApp() {
  const [produtos, setProdutos] = useState<Produto[]>(SEED_PRODUTOS);
  const [categorias, setCategorias] = useState<Categoria[]>(SEED_CATEGORIAS);
  const [loaded, setLoaded] = useState(!supabaseConfigured);
  const [state, setStateRaw] = useState<AppState>(initialState);

  const setState = useCallback((patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => {
    setStateRaw((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }));
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    (async () => {
      const [{ data: prodRows, error: prodErr }, { data: catRows, error: catErr }] = await Promise.all([
        supabase.from("products").select("*").order("id"),
        supabase.from("categories").select("*").order("id"),
      ]);
      if (cancelled) return;
      if (!prodErr && prodRows && prodRows.length) {
        setProdutos(prodRows.map(rowToProduto));
      }
      if (!catErr && catRows && catRows.length) {
        setCategorias(
          catRows.map((c: any) => ({ id: c.id, nome: c.nome, icone: c.icone, hue: c.hue, subs: c.subs ?? [] }))
        );
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const go = useCallback(
    (v: View) => setState({ view: v, anuncio: false }),
    [setState]
  );
  const openPeca = useCallback(
    (id: number) => {
      const p = produtos.find((x) => x.id === id);
      setState({ view: "peca", selId: id, anuncio: false, vendaPreco: p ? String(p.preco_venda) : "0" });
    },
    [produtos, setState]
  );

  const ctx: Ctx = {
    state,
    setState,
    produtos,
    setProdutos,
    categorias,
    go,
    openPeca,
    supabaseConfigured,
  };

  const navDef = useMemo(
    () => [
      { id: "home" as View, label: "Início", glyph: "◱" },
      { id: "estoque" as View, label: "Estoque", glyph: "▤" },
      { id: "categorias" as View, label: "Categorias", glyph: "◧" },
      { id: "analytics" as View, label: "Analytics", glyph: "◐" },
    ],
    []
  );
  const activeNav = state.view === "peca" || state.view === "buscafoto" ? "estoque" : state.view;
  const showTabBar = true;

  if (!loaded) {
    return (
      <div
        style={css(
          "min-height:100vh;background:#080906;color:#F2F4EF;display:flex;align-items:center;justify-content:center"
        )}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: "#7E857A" }}>Carregando…</span>
      </div>
    );
  }

  return (
    <div
      style={css(
        "min-height:100vh;background:#080906;color:#F2F4EF;padding:26px 22px 60px;display:flex;flex-direction:column;align-items:center;gap:20px"
      )}
    >
      <div
        style={css(
          "width:100%;max-width:1180px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap"
        )}
      >
        <div style={css("display:flex;align-items:baseline;gap:12px")}>
          <span style={css("font-size:19px;font-weight:800;letter-spacing:-.02em")}>Import Hub</span>
          <span style={css("font-size:11.5px;font-weight:500;color:#7E857A")}>
            Estoque e revenda de importados{" "}
            {!supabaseConfigured && "· dados de exemplo (Supabase não configurado)"}
          </span>
        </div>
      </div>

      <div
        style={css(
          "width:100%;max-width:640px;background:#0B0C0A;border:1px solid #23271F;border-radius:32px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 40px 90px rgba(0,0,0,.6);min-height:760px"
        )}
      >
        <div style={css("flex:1;min-height:0;display:flex;overflow:hidden")}>
          <div style={css("flex:1;min-width:0;overflow-y:auto")}>
            {state.view === "home" && <Home ctx={ctx} />}
            {state.view === "estoque" && <Estoque ctx={ctx} />}
            {state.view === "peca" && <Peca ctx={ctx} />}
            {state.view === "categorias" && <Categorias ctx={ctx} />}
            {state.view === "wizard" && <Wizard ctx={ctx} />}
            {state.view === "venda" && <Venda ctx={ctx} />}
            {state.view === "analytics" && <Analytics ctx={ctx} />}
            {state.view === "buscafoto" && <BuscaFoto ctx={ctx} />}
          </div>
        </div>

        {showTabBar && (
          <div
            style={css(
              "flex:none;border-top:1px solid #1E211C;background:rgba(11,12,10,.96);backdrop-filter:blur(12px);padding:8px 10px 18px;display:flex;align-items:center;gap:4px"
            )}
          >
            {navDef.map((n) => {
              const on = activeNav === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => go(n.id)}
                  style={css(
                    `flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:9px 2px;background:${
                      on ? "#141613" : "none"
                    };border:none;border-radius:14px;cursor:pointer;color:${on ? "#C6FF4F" : "#6E7469"}`
                  )}
                >
                  <span style={css("font-size:17px;line-height:1")}>{n.glyph}</span>
                  <span style={css("font-size:9.5px;font-weight:700;letter-spacing:.01em")}>{n.label}</span>
                </button>
              );
            })}
            <button
              onClick={() => setState({ view: "wizard", wz: 1, fotos: 2, custoUsd: "10", cotacao: "5.42", freteUsd: "2", outros: "8", precoVenda: "100" })}
              style={css(
                "width:58px;height:52px;flex:none;background:#C6FF4F;color:#0B0C0A;border:none;border-radius:16px;font-size:22px;font-weight:800;cursor:pointer;box-shadow:0 6px 20px rgba(198,255,79,.2)"
              )}
            >
              +
            </button>
          </div>
        )}
      </div>

      <div style={css("width:100%;max-width:1180px;font-size:11.5px;font-weight:500;color:#5F655B;line-height:1.7")}>
        Protótipo funcional. Análise de foto, busca por foto, geração de anúncio e o chat de perguntas no
        Analytics usam IA real via OpenAI (requer `OPENAI_API_KEY` no servidor — veja o README). CRUD no
        Supabase, cálculo de preço/margem, registro de vendas e baixa de estoque são reais.
      </div>
    </div>
  );
}
