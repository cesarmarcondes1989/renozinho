"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { css } from "@/lib/css";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { SEED_PRODUTOS, SEED_CATEGORIAS } from "@/lib/seed";
import type { Produto, Categoria } from "@/lib/types";
import { initialState, type AppState, type Ctx, type View } from "@/lib/context";
import { ThemeContext, useTheme, useThemeState } from "@/lib/theme";

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
    fotos: r.fotos ?? [],
    arquivado: r.arquivado ?? false,
  };
}

export default function ImportHubApp() {
  const themeState = useThemeState();
  return (
    <ThemeContext.Provider value={themeState}>
      <ImportHubShell />
    </ThemeContext.Provider>
  );
}

function ImportHubShell() {
  const { t, name, toggle } = useTheme();
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
      // Trust whatever the real database says — including a genuinely empty
      // table — instead of silently keeping the hardcoded seed data forever
      // when the query succeeds with zero rows. That silent fallback made a
      // real (empty or out-of-sync) database indistinguishable from demo
      // mode, which is exactly what caused "a peça que cadastrei sumiu".
      if (!prodErr && prodRows) {
        // `arquivado` may not exist yet if migration 0003 hasn't been applied
        // — filter defensively in JS instead of relying on `.eq()` in the
        // query above, so an older schema doesn't break the whole load.
        setProdutos(prodRows.map(rowToProduto).filter((p) => !p.arquivado));
      }
      if (!catErr && catRows) {
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
    setCategorias,
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
          `height:100dvh;width:100vw;background:${t.bg};color:${t.textPrimary};display:flex;align-items:center;justify-content:center`
        )}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: `${t.textSecondary}` }}>Carregando…</span>
      </div>
    );
  }

  return (
    <div
      style={css(
        `height:100dvh;width:100vw;background:${t.bg};color:${t.textPrimary};display:flex;flex-direction:column;overflow:hidden;padding-top:var(--safe-top);padding-left:var(--safe-left);padding-right:var(--safe-right)`
      )}
    >
      <div
        style={css(
          `flex:none;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;border-bottom:1px solid ${t.border}`
        )}
      >
        <div style={css("display:flex;align-items:baseline;gap:12px")}>
          <span style={css("font-size:19px;font-weight:800;letter-spacing:-.02em")}>Renozinho Muambeiro</span>
          <span style={css(`font-size:11.5px;font-weight:500;color:${t.textSecondary}`)}>
            Estoque e revenda de importados{" "}
            {!supabaseConfigured && "· dados de exemplo (Supabase não configurado)"}
          </span>
        </div>
        <button
          onClick={toggle}
          title={name === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
          aria-label={name === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
          style={css(
            `flex:none;width:36px;height:36px;border-radius:999px;background:${t.bgCard};border:1px solid ${t.border};color:${t.textPrimary};font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center`
          )}
        >
          {name === "dark" ? "☀" : "☾"}
        </button>
      </div>

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
            `flex:none;border-top:1px solid ${t.border};background:${t.bg};backdrop-filter:blur(12px);padding:8px 10px calc(10px + var(--safe-bottom));display:flex;align-items:center;gap:4px`
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
                    on ? t.bgCard : "none"
                  };border:none;border-radius:14px;cursor:pointer;color:${on ? t.accent : t.textTertiary}`
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
              `width:58px;height:52px;flex:none;background:${t.accent};color:${t.accentText};border:none;border-radius:16px;font-size:22px;font-weight:800;cursor:pointer;box-shadow:0 6px 20px ${
                name === "dark" ? "rgba(198,255,79,.2)" : "rgba(37,99,235,.25)"
              }`
            )}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}
