"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { BRL } from "@/lib/helpers";
import { supabase } from "@/lib/supabase";
import type { Ctx } from "@/lib/context";
import type { Categoria } from "@/lib/types";

interface EditForm {
  nome: string;
  icone: string;
  subs: string;
}

function toEditForm(c: Categoria): EditForm {
  return { nome: c.nome, icone: c.icone, subs: c.subs.join(", ") };
}

export default function Categorias({ ctx }: { ctx: Ctx }) {
  const { produtos, setProdutos, categorias, setCategorias } = ctx;
  const [editandoNome, setEditandoNome] = useState<string | null>(null);
  const [form, setForm] = useState<EditForm>({ nome: "", icone: "", subs: "" });
  const [erro, setErro] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [criandoNova, setCriandoNova] = useState(false);
  const [novaForm, setNovaForm] = useState<EditForm>({ nome: "", icone: "●", subs: "" });

  const contagemPorCategoria = (nome: string) => produtos.filter((p) => p.categoria === nome).length;

  const abrirEdicao = (c: Categoria) => {
    setEditandoNome(c.nome);
    setForm(toEditForm(c));
    setErro({});
  };

  const salvarEdicao = async (c: Categoria) => {
    setSalvando(true);
    const novoNome = form.nome.trim() || c.nome;
    const subs = form.subs.split(",").map((s) => s.trim()).filter(Boolean);
    const icone = form.icone.trim() || c.icone;
    const patch = { nome: novoNome, icone, subs };

    if (supabase && c.id != null) {
      await supabase.from("categories").update(patch).eq("id", c.id);
      if (novoNome !== c.nome) {
        await supabase.from("products").update({ categoria: novoNome }).eq("categoria", c.nome);
      }
    }

    setCategorias((prev) => prev.map((x) => (x.nome === c.nome ? { ...x, ...patch } : x)));
    if (novoNome !== c.nome) {
      setProdutos((prev) => prev.map((p) => (p.categoria === c.nome ? { ...p, categoria: novoNome } : p)));
    }
    setSalvando(false);
    setEditandoNome(null);
  };

  const excluirCategoria = async (c: Categoria) => {
    const n = contagemPorCategoria(c.nome);
    if (n > 0) {
      setErro((e) => ({ ...e, [c.nome]: `Mova as ${n} peça${n === 1 ? "" : "s"} desta categoria para outra antes de excluir.` }));
      return;
    }
    if (supabase && c.id != null) {
      await supabase.from("categories").delete().eq("id", c.id);
    }
    setCategorias((prev) => prev.filter((x) => x.nome !== c.nome));
    setEditandoNome(null);
  };

  const criarCategoria = async () => {
    const nome = novaForm.nome.trim();
    if (!nome) return;
    if (categorias.some((c) => c.nome.toLowerCase() === nome.toLowerCase())) {
      setErro((e) => ({ ...e, __nova: "Já existe uma categoria com esse nome." }));
      return;
    }
    const hue = Math.floor(Math.random() * 360);
    const subs = novaForm.subs.split(",").map((s) => s.trim()).filter(Boolean);
    const nova: Categoria = { nome, icone: novaForm.icone.trim() || "●", hue, subs };

    if (supabase) {
      const { data, error } = await supabase
        .from("categories")
        .insert({ nome: nova.nome, icone: nova.icone, hue: nova.hue, subs: nova.subs })
        .select()
        .single();
      if (!error && data) nova.id = data.id;
    }

    setCategorias((prev) => [...prev, nova]);
    setNovaForm({ nome: "", icone: "●", subs: "" });
    setCriandoNova(false);
    setErro((e) => ({ ...e, __nova: "" }));
  };

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
          const editando = editandoNome === c.nome;
          return (
            <div key={c.nome} style={css("background:#141613;border:1px solid #262A24;border-radius:16px;overflow:hidden")}>
              <div style={css("display:flex;align-items:center;gap:12px;padding:13px 14px")}>
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
                <button
                  onClick={() => (editando ? setEditandoNome(null) : abrirEdicao(c))}
                  style={css(`background:none;border:none;color:${editando ? "#C6FF4F" : "#7E857A"};font-size:15px;cursor:pointer;padding:4px`)}
                >
                  {editando ? "×" : "⋯"}
                </button>
              </div>

              {!editando && c.subs.length > 0 && (
                <div style={css("display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 13px 46px")}>
                  {c.subs.map((s) => (
                    <span key={s} style={css("font-size:11px;font-weight:600;color:#9AA096;background:#0E100D;border:1px solid #242822;border-radius:8px;padding:5px 9px")}>
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {editando && (
                <div style={css("display:flex;flex-direction:column;gap:9px;padding:0 14px 15px")}>
                  <div style={css("display:grid;grid-template-columns:56px 1fr;gap:8px")}>
                    <input
                      value={form.icone}
                      onChange={(e) => setForm((f) => ({ ...f, icone: e.target.value }))}
                      style={css("background:#0E100D;border:1px solid #262A24;border-radius:10px;padding:9px;color:#F2F4EF;font-size:14px;text-align:center;outline:none")}
                    />
                    <input
                      value={form.nome}
                      onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                      placeholder="Nome da categoria"
                      style={css("background:#0E100D;border:1px solid #262A24;border-radius:10px;padding:9px 11px;color:#F2F4EF;font-size:12.5px;font-weight:700;outline:none")}
                    />
                  </div>
                  <input
                    value={form.subs}
                    onChange={(e) => setForm((f) => ({ ...f, subs: e.target.value }))}
                    placeholder="Subcategorias, separadas por vírgula"
                    style={css("background:#0E100D;border:1px solid #262A24;border-radius:10px;padding:9px 11px;color:#B7BEB2;font-size:11.5px;font-weight:600;outline:none")}
                  />
                  {erro[c.nome] && (
                    <span style={css("font-size:11px;font-weight:600;color:#FF9285;line-height:1.5")}>{erro[c.nome]}</span>
                  )}
                  <div style={css("display:flex;gap:8px")}>
                    <button
                      onClick={() => excluirCategoria(c)}
                      style={css("flex:1;background:none;border:1px solid rgba(255,107,90,.35);color:#FF9285;border-radius:10px;padding:10px;font-size:11.5px;font-weight:700;cursor:pointer")}
                    >
                      Excluir
                    </button>
                    <button
                      onClick={() => salvarEdicao(c)}
                      disabled={salvando}
                      style={css(`flex:2;background:#C6FF4F;color:#0B0C0A;border:none;border-radius:10px;padding:10px;font-size:11.5px;font-weight:800;cursor:pointer${salvando ? ";opacity:.7" : ""}`)}
                    >
                      {salvando ? "Salvando…" : "Salvar"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {criandoNova ? (
        <div style={css("background:#141613;border:1px solid #262A24;border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:9px")}>
          <span style={css("font-size:12.5px;font-weight:800")}>Nova categoria</span>
          <div style={css("display:grid;grid-template-columns:56px 1fr;gap:8px")}>
            <input
              value={novaForm.icone}
              onChange={(e) => setNovaForm((f) => ({ ...f, icone: e.target.value }))}
              style={css("background:#0E100D;border:1px solid #262A24;border-radius:10px;padding:9px;color:#F2F4EF;font-size:14px;text-align:center;outline:none")}
            />
            <input
              value={novaForm.nome}
              onChange={(e) => setNovaForm((f) => ({ ...f, nome: e.target.value }))}
              placeholder="Nome da categoria"
              style={css("background:#0E100D;border:1px solid #262A24;border-radius:10px;padding:9px 11px;color:#F2F4EF;font-size:12.5px;font-weight:700;outline:none")}
            />
          </div>
          <input
            value={novaForm.subs}
            onChange={(e) => setNovaForm((f) => ({ ...f, subs: e.target.value }))}
            placeholder="Subcategorias, separadas por vírgula (opcional)"
            style={css("background:#0E100D;border:1px solid #262A24;border-radius:10px;padding:9px 11px;color:#B7BEB2;font-size:11.5px;font-weight:600;outline:none")}
          />
          {erro.__nova && <span style={css("font-size:11px;font-weight:600;color:#FF9285;line-height:1.5")}>{erro.__nova}</span>}
          <div style={css("display:flex;gap:8px")}>
            <button
              onClick={() => setCriandoNova(false)}
              style={css("flex:1;background:none;border:1px solid #2E332B;color:#B7BEB2;border-radius:10px;padding:10px;font-size:11.5px;font-weight:700;cursor:pointer")}
            >
              Cancelar
            </button>
            <button
              onClick={criarCategoria}
              style={css("flex:2;background:#C6FF4F;color:#0B0C0A;border:none;border-radius:10px;padding:10px;font-size:11.5px;font-weight:800;cursor:pointer")}
            >
              Criar categoria
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setCriandoNova(true)}
          style={css("background:none;border:1px dashed #34402A;color:#C6FF4F;border-radius:16px;padding:15px;font-size:13.5px;font-weight:800;cursor:pointer")}
        >
          + Nova categoria
        </button>
      )}
      <div style={css("background:#141613;border:1px solid #262A24;border-radius:16px;padding:14px;font-size:11.5px;font-weight:500;color:#8B9186;line-height:1.6")}>
        Ao excluir uma categoria com peças, o app pede pra mover as peças para outra antes de confirmar.
      </div>
    </div>
  );
}
