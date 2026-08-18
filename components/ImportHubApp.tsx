"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { css } from "@/lib/css";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { SEED_PRODUTOS, SEED_CATEGORIAS } from "@/lib/seed";
import type { Produto, Categoria, Venda as VendaRow } from "@/lib/types";
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
  const [vendas, setVendas] = useState<VendaRow[]>([]);
  const [loaded, setLoaded] = useState(!supabaseConfigured);
  const [state, setStateRaw] = useState<AppState>(initialState);

  const setState = useCallback((patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => {
    setStateRaw((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }));
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    (async () => {
      const [{ data: prodRows, error: prodErr }, { data: catRows, error: catErr }, { data: saleRows, error: saleErr }] = await Promise.all([
        supabase.from("products").select("*").order("id"),
        supabase.from("categories").select("*").order("id"),
        supabase.from("sales").select("*").order("vendido_em"),
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
      if (!saleErr && saleRows) {
        setVendas(saleRows as VendaRow[]);
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
    vendas,
    setVendas,
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
  const [menuAberto, setMenuAberto] = useState(false);
  const menuItens = useMemo(() => [...navDef, { id: "wizard" as View, label: "Nova peça", glyph: "＋" }], [navDef]);
  const irPara = useCallback(
    (id: View) => {
      setMenuAberto(false);
      if (id === "wizard") {
        setState({ view: "wizard", wz: 1, fotos: 2, custoUsd: "10", cotacao: "5.42", freteUsd: "2", outros: "8", precoVenda: "100" });
      } else {
        go(id);
      }
    },
    [go, setState]
  );

  if (!loaded) {
    return (
      <div
        style={css(
          `position:fixed;inset:0;background:${t.bg};color:${t.textPrimary};display:flex;align-items:center;justify-content:center`
        )}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: `${t.textSecondary}` }}>Carregando…</span>
      </div>
    );
  }

  return (
    <div
      style={css(
        // `position:fixed;inset:0` instead of `height:100dvh;width:100vw`:
        // on iOS standalone (installed PWA) with viewport-fit=cover, 100dvh
        // can stop short of the physical bottom edge, leaving an uncovered
        // strip around the home indicator. inset:0 pins the shell to the real
        // viewport bounds, and 100vw is avoided since it ignores scrollbars.
        `position:fixed;inset:0;background:${t.bg};color:${t.textPrimary};display:flex;flex-direction:column;overflow:hidden;padding-top:var(--safe-top);padding-left:var(--safe-left);padding-right:var(--safe-right)`
      )}
    >
      {/* Single tight row. The old header wrapped the long title + tagline onto
          several lines and pushed the theme button to its own row, eating 130px
          of an 844px phone screen before any content was drawn. */}
      <div
        style={css(
          `flex:none;padding:9px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid ${t.border}`
        )}
      >
        <button
          onClick={() => setMenuAberto(true)}
          title="Menu"
          aria-label="Abrir menu"
          style={css(
            `flex:none;width:34px;height:34px;border-radius:10px;background:none;border:none;color:${t.textPrimary};font-size:17px;cursor:pointer;display:flex;align-items:center;justify-content:center;margin-left:-6px`
          )}
        >
          ☰
        </button>
        <span
          style={css(
            "flex:1;font-size:17px;font-weight:800;letter-spacing:-.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0"
          )}
        >
          Renozinho Muambeiro
        </span>
        <button
          onClick={toggle}
          title={name === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
          aria-label={name === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
          style={css(
            `flex:none;width:34px;height:34px;border-radius:999px;background:${t.bgCard};border:1px solid ${t.border};color:${t.textPrimary};font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center`
          )}
        >
          {name === "dark" ? "☀" : "☾"}
        </button>
      </div>

      {!supabaseConfigured && (
        <div
          style={css(
            `flex:none;padding:5px 14px;font-size:10.5px;font-weight:600;color:${t.textSecondary};background:${t.bgCard};border-bottom:1px solid ${t.border};text-align:center`
          )}
        >
          Dados de exemplo · Supabase não configurado
        </div>
      )}

      <div style={css("flex:1;min-height:0;display:flex;overflow:hidden")}>
        <div style={css("flex:1;min-width:0;overflow-y:auto;padding-bottom:var(--safe-bottom)")}>
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

      {/* Navegação em gaveta pelo hambúrguer, no lugar da barra fixa embaixo:
          a barra custava 78px permanentes de tela; a gaveta custa zero quando
          fechada. */}
      {menuAberto && (
        <div
          onClick={() => setMenuAberto(false)}
          style={css("position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:40;display:flex;animation:ihfade .18s ease both")}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={css(
              `width:min(78vw,290px);background:${t.bg};border-right:1px solid ${t.border};display:flex;flex-direction:column;padding:calc(12px + var(--safe-top)) 12px calc(12px + var(--safe-bottom));gap:4px;animation:ihdrawer .22s cubic-bezier(.2,.8,.3,1) both`
            )}
          >
            <div style={css("display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 6px 10px")}>
              <span style={css("font-size:15px;font-weight:800;letter-spacing:-.02em")}>Menu</span>
              <button
                onClick={() => setMenuAberto(false)}
                aria-label="Fechar menu"
                style={css(
                  `width:30px;height:30px;border-radius:999px;background:${t.bgCard};border:1px solid ${t.border};color:${t.textSecondary};font-size:14px;cursor:pointer`
                )}
              >
                ×
              </button>
            </div>
            {menuItens.map((n) => {
              const on = n.id === "wizard" ? state.view === "wizard" : activeNav === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => irPara(n.id)}
                  style={css(
                    `display:flex;align-items:center;gap:12px;padding:13px 12px;border-radius:12px;cursor:pointer;text-align:left;font-size:14px;font-weight:700;background:${
                      on ? t.bgCard : "none"
                    };border:1px solid ${on ? t.borderStrong : "transparent"};color:${on ? t.accent : t.textBright}`
                  )}
                >
                  <span style={css("font-size:17px;width:22px;text-align:center")}>{n.glyph}</span>
                  {n.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
