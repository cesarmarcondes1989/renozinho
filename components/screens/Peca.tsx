"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { useTheme } from "@/lib/theme";
import { BRL, initials, margem, margemChipStyle, primeiraFoto } from "@/lib/helpers";
import { STATUS_META } from "@/lib/seed";
import { supabase } from "@/lib/supabase";
import type { Ctx } from "@/lib/context";
import EditarPeca from "./EditarPeca";

export default function Peca({ ctx }: { ctx: Ctx }) {
  const { t } = useTheme();
  const { produtos, setProdutos, state, setState } = ctx;
  const sel = produtos.find((p) => p.id === state.selId) || produtos[0];
  const [anuncio, setAnuncio] = useState("");
  const [gerando, setGerando] = useState(false);
  const [erroAnuncio, setErroAnuncio] = useState("");
  const [editando, setEditando] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState("");
  if (!sel) return null;
  const m = margem(sel);
  const stt = STATUS_META[sel.status];
  const foto = primeiraFoto(sel);

  const excluir = async () => {
    setExcluindo(true);
    setErroExclusao("");
    if (supabase) {
      const { error } = await supabase.from("products").update({ arquivado: true }).eq("id", sel.id);
      if (error) {
        setErroExclusao("Não foi possível excluir no Supabase agora (a migração de arquivamento pode não ter sido aplicada ainda). A peça foi removida só desta sessão.");
      }
    }
    setProdutos((prev) => prev.filter((p) => p.id !== sel.id));
    setExcluindo(false);
    setState({ view: "estoque" });
  };

  if (editando) {
    return (
      <EditarPeca
        ctx={ctx}
        sel={sel}
        onCancel={() => setEditando(false)}
        onSaved={() => setEditando(false)}
      />
    );
  }

  const gerarAnuncio = async () => {
    setState({ anuncio: true });
    setGerando(true);
    setErroAnuncio("");
    setAnuncio("");
    try {
      const resp = await fetch("/api/ai/anuncio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: sel.nome,
          marca: sel.marca,
          categoria: sel.categoria,
          cor: sel.cor,
          tamanho: sel.tamanho,
          condicao: sel.condicao,
          preco: sel.preco_venda,
          descricao: sel.descricao,
          tags: sel.tags,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Falha ao gerar o anúncio");
      setAnuncio(data.anuncio);
    } catch (err: any) {
      setErroAnuncio(err?.message || "Falha ao gerar o anúncio. Tente novamente.");
    } finally {
      setGerando(false);
    }
  };

  const custoLinhas = [
    { label: "Custo em dólar", valor: "US$ " + sel.custo_usd.toFixed(2), bold: false },
    { label: "Frete", valor: "US$ " + (sel.frete_usd || 0).toFixed(2), bold: false },
    { label: "Cotação usada", valor: "R$ " + (sel.cotacao || 5.42).toFixed(2), bold: false },
    { label: "Impostos e taxas", valor: BRL(sel.taxa || 0), bold: false },
    { label: "Custo total", valor: BRL(sel.custo_total), bold: true },
    { label: "Lucro por unidade", valor: BRL(sel.preco_venda - sel.custo_total), bold: true },
  ];

  const specs = [
    { k: "Categoria", v: sel.categoria },
    { k: "Tamanho", v: `${sel.tamanho} (${sel.sistema})` },
    { k: "Cor", v: sel.cor },
    { k: "Condição", v: sel.condicao },
    { k: "Material", v: sel.material },
    { k: "Gênero", v: sel.genero },
    { k: "Localização", v: sel.local },
    { k: "SKU", v: sel.sku },
    { k: "Fornecedor", v: sel.fornecedor },
    { k: "Lote", v: sel.lote },
  ];

  return (
    <div style={css("display:flex;flex-direction:column;animation:ihslide .28s ease both")}>
      <div
        style={css(
          `position:relative;width:100%;aspect-ratio:1/1;background:linear-gradient(150deg,hsl(${sel.hue} 44% 34%),hsl(${
            (sel.hue + 40) % 360
          } 32% 15%));display:flex;align-items:center;justify-content:center;flex:none;overflow:hidden`
        )}
      >
        {foto && (
          <img src={foto} alt={sel.nome} style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover")} />
        )}
        <button
          onClick={() => setState({ view: "estoque", anuncio: false })}
          style={css(
            `position:absolute;top:14px;left:14px;width:38px;height:38px;border-radius:999px;background:rgba(8,9,6,.6);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.12);color:${t.textPrimary};font-size:16px;cursor:pointer;z-index:2`
          )}
        >
          ‹
        </button>
        <div style={css("position:absolute;top:14px;right:14px;display:flex;gap:8px;z-index:2")}>
          <button
            onClick={() => setEditando(true)}
            title="Editar peça"
            style={css(
              `width:38px;height:38px;border-radius:999px;background:rgba(8,9,6,.6);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.12);color:${t.textPrimary};font-size:15px;cursor:pointer`
            )}
          >
            ✎
          </button>
          <button
            onClick={() => setConfirmandoExclusao(true)}
            title="Excluir peça"
            style={css(
              "width:38px;height:38px;border-radius:999px;background:rgba(8,9,6,.6);backdrop-filter:blur(8px);border:1px solid rgba(255,107,90,.35);color:#FF9285;font-size:15px;cursor:pointer"
            )}
          >
            ⌫
          </button>
        </div>
        {!foto && (
          <span style={css("font-size:56px;font-weight:800;color:rgba(255,255,255,.42);letter-spacing:-.04em")}>{initials(sel)}</span>
        )}
      </div>

      <div style={css("padding:18px;display:flex;flex-direction:column;gap:18px")}>
        {confirmandoExclusao && (
          <div style={css("background:rgba(255,107,90,.08);border:1px solid rgba(255,107,90,.35);border-radius:16px;padding:15px;display:flex;flex-direction:column;gap:11px;animation:ihslide .2s ease both")}>
            <span style={css("font-size:13px;font-weight:800;color:#FF9285")}>Excluir esta peça?</span>
            <span style={css("font-size:11.5px;font-weight:500;color:#E8B8AE;line-height:1.55")}>
              A peça some do estoque e das buscas, mas o histórico de vendas dela é mantido. Tem certeza?
            </span>
            {erroExclusao && (
              <span style={css("font-size:11px;font-weight:600;color:#FF9285;line-height:1.5")}>{erroExclusao}</span>
            )}
            <div style={css("display:flex;gap:8px")}>
              <button
                onClick={() => setConfirmandoExclusao(false)}
                style={css(`flex:1;background:${t.bgCard};border:1px solid ${t.borderStrong};color:${t.textBright};border-radius:12px;padding:11px;font-size:12.5px;font-weight:700;cursor:pointer`)}
              >
                Cancelar
              </button>
              <button
                onClick={excluir}
                disabled={excluindo}
                style={css(`flex:1;background:#FF6B5A;color:#1A0906;border:none;border-radius:12px;padding:11px;font-size:12.5px;font-weight:800;cursor:pointer${excluindo ? ";opacity:.7" : ""}`)}
              >
                {excluindo ? "Excluindo…" : "Excluir peça"}
              </button>
            </div>
          </div>
        )}
        <div style={css("display:flex;flex-direction:column;gap:7px")}>
          <div style={css("display:flex;align-items:center;gap:8px")}>
            <span style={css(`font-size:10.5px;font-weight:800;color:${t.textSecondary};letter-spacing:.06em;text-transform:uppercase`)}>{sel.marca}</span>
            <span style={css(`font-size:10px;font-weight:800;letter-spacing:.04em;color:${stt.fg};background:${stt.bg};border-radius:6px;padding:4px 8px`)}>
              {stt.label}
            </span>
          </div>
          <div style={css("font-size:21px;font-weight:800;letter-spacing:-.03em;line-height:1.2")}>{sel.nome}</div>
          <div style={css(`font-size:12.5px;font-weight:500;color:${t.textSecondary};line-height:1.55`)}>{sel.descricao}</div>
        </div>

        <div style={css("display:flex;gap:10px;flex-wrap:wrap")}>
          {sel.tags.map((tag) => (
            <span key={tag} style={css(`font-size:11px;font-weight:700;color:${t.textBright};background:${t.bgCard};border:1px solid ${t.border};border-radius:999px;padding:6px 11px`)}>
              {tag}
            </span>
          ))}
        </div>

        <div style={css(`background:${t.bgCard};border:1px solid ${t.border};border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:12px`)}>
          <div style={css("display:flex;align-items:flex-end;justify-content:space-between;gap:12px")}>
            <div style={css("display:flex;flex-direction:column;gap:3px")}>
              <span style={css(`font-size:11px;font-weight:600;color:${t.textSecondary}`)}>Preço de venda</span>
              <span style={css("font-size:27px;font-weight:800;letter-spacing:-.035em")}>{BRL(sel.preco_venda)}</span>
            </div>
            <div style={css("display:flex;flex-direction:column;gap:3px;align-items:flex-end")}>
              <span style={css(`font-size:11px;font-weight:600;color:${t.textSecondary}`)}>Margem</span>
              <span style={css(margemChipStyle(m, true))}>{Math.round(m * 100)}%</span>
            </div>
          </div>
          <div style={css(`height:1px;background:${t.border}`)} />
          {custoLinhas.map((l) => (
            <div key={l.label} style={css("display:flex;align-items:center;justify-content:space-between;gap:10px")}>
              <span style={css(`font-size:11.5px;font-weight:${l.bold ? "700" : "500"};color:${l.bold ? t.textBright : t.textSecondary}`)}>{l.label}</span>
              <span style={css(`font-size:${l.bold ? "13.5" : "12.5"}px;font-weight:${l.bold ? "800" : "600"};color:${t.textPrimary};letter-spacing:-.01em`)}>
                {l.valor}
              </span>
            </div>
          ))}
        </div>

        <div style={css("display:grid;grid-template-columns:repeat(2,1fr);gap:8px")}>
          {specs.map((s) => (
            <div key={s.k} style={css(`background:${t.bgCard};border:1px solid ${t.border};border-radius:14px;padding:11px 13px;display:flex;flex-direction:column;gap:3px`)}>
              <span style={css(`font-size:10px;font-weight:700;color:${t.textTertiary};letter-spacing:.05em;text-transform:uppercase`)}>{s.k}</span>
              <span style={css("font-size:13px;font-weight:700;letter-spacing:-.01em")}>{s.v}</span>
            </div>
          ))}
        </div>

        <div style={css("display:flex;flex-direction:column;gap:9px")}>
          <span style={css("font-size:13.5px;font-weight:800;letter-spacing:-.01em")}>Variações</span>
          <div style={css(`background:${t.bgCard};border:1px solid ${t.border};border-radius:16px;overflow:hidden`)}>
            {sel.variacoes.map((v) => (
              <div key={v.sku} style={css(`display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid ${t.border}`)}>
                <span style={css(`width:9px;height:9px;border-radius:999px;flex:none;background:hsl(${sel.hue} 55% 52%)`)} />
                <span style={css("flex:1;font-size:12.5px;font-weight:700")}>{v.label}</span>
                <span style={css(`font-size:11px;font-weight:600;color:${t.textSecondary}`)}>{v.sku}</span>
                <span style={css(`font-size:11.5px;font-weight:800;color:${v.qtd <= 1 ? "#F5C518" : t.accent}`)}>{v.qtd} un</span>
              </div>
            ))}
          </div>
        </div>

        <div style={css("display:flex;gap:9px")}>
          <button
            onClick={() => setState({ view: "venda", vendaPreco: String(sel.preco_venda) })}
            style={css(`flex:1;background:${t.accent};color:${t.accentText};border:none;border-radius:15px;padding:16px;font-size:14.5px;font-weight:800;cursor:pointer`)}
          >
            Vender
          </button>
          <button
            onClick={gerarAnuncio}
            title="Gerar anúncio"
            style={css(`width:56px;flex:none;background:${t.bgCard};border:1px solid ${t.borderStrong};color:${t.accent};border-radius:15px;font-size:16px;cursor:pointer`)}
          >
            ✦
          </button>
          <button
            title="Etiqueta QR"
            style={css(`width:56px;flex:none;background:${t.bgCard};border:1px solid ${t.borderStrong};color:${t.textTertiary};border-radius:15px;font-size:15px;cursor:pointer`)}
          >
            ▣
          </button>
        </div>

        {state.anuncio && (
          <div
            style={css(
              `background:#101410;border:1px solid ${t.accentBarFade};border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:10px;animation:ihslide .24s ease both`
            )}
          >
            <div style={css("display:flex;align-items:center;gap:8px")}>
              <span style={css(`font-size:11px;font-weight:800;color:${t.accent};letter-spacing:.05em`)}>ANÚNCIO GERADO POR IA · GPT-4O-MINI</span>
            </div>
            {gerando && (
              <div style={css("display:flex;align-items:center;gap:9px;padding:4px 2px")}>
                <span style={css(`width:15px;height:15px;border-radius:999px;border:2px solid ${t.border};border-top-color:${t.accent};animation:ihspin .8s linear infinite`)} />
                <span style={css(`font-size:11.5px;font-weight:600;color:${t.textSecondary}`)}>gerando anúncio…</span>
              </div>
            )}
            {erroAnuncio && (
              <div style={css("background:rgba(255,107,90,.1);border:1px solid rgba(255,107,90,.35);border-radius:10px;padding:10px 12px;font-size:11.5px;font-weight:600;color:#FF9285;line-height:1.5")}>
                {erroAnuncio}
              </div>
            )}
            {!gerando && anuncio && (
              <div style={css(`font-size:12.5px;font-weight:500;color:${t.textBright};line-height:1.65;white-space:pre-line`)}>{anuncio}</div>
            )}
            <div style={css("display:flex;gap:8px")}>
              {!gerando && anuncio && (
                <button
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                      navigator.clipboard.writeText(anuncio).catch(() => {});
                    }
                    setState({ anuncio: false });
                  }}
                  style={css(`flex:1;background:${t.accent};color:${t.accentText};border:none;border-radius:12px;padding:12px;font-size:12.5px;font-weight:800;cursor:pointer`)}
                >
                  Copiar texto
                </button>
              )}
              {erroAnuncio && !gerando && (
                <button
                  onClick={gerarAnuncio}
                  style={css(`flex:1;background:${t.bgCard};border:1px solid ${t.borderStrong};color:${t.textBright};border-radius:12px;padding:12px;font-size:12.5px;font-weight:700;cursor:pointer`)}
                >
                  Tentar de novo
                </button>
              )}
              <button
                onClick={() => setState({ anuncio: false })}
                style={css(`background:none;border:1px solid ${t.borderStrong};color:${t.textTertiary};border-radius:12px;padding:12px 14px;font-size:12.5px;font-weight:700;cursor:pointer`)}
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
