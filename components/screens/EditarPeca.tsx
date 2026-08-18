"use client";

import { useRef, useState } from "react";
import { css } from "@/lib/css";
import { useTheme, type ThemeTokens } from "@/lib/theme";
import { num } from "@/lib/helpers";
import { supabase } from "@/lib/supabase";
import { uploadPhoto } from "@/lib/upload";
import type { Ctx } from "@/lib/context";
import type { Produto, Variacao, Genero } from "@/lib/types";
import { GENEROS } from "@/lib/types";

const STATUS_OPTS: { v: Produto["status"]; label: string }[] = [
  { v: "disponivel", label: "Disponível" },
  { v: "reservado", label: "Reservado" },
  { v: "em_transito", label: "Em trânsito" },
  { v: "vendido", label: "Vendido" },
];

interface FormState {
  nome: string;
  marca: string;
  categoria: string;
  cor: string;
  tamanho: string;
  material: string;
  genero: string;
  condicao: string;
  custo_usd: string;
  frete_usd: string;
  cotacao: string;
  taxa: string;
  outros_custos: string;
  preco_venda: string;
  qtd: string;
  local: string;
  fornecedor: string;
  lote: string;
  sku: string;
  descricao: string;
  tags: string;
  status: Produto["status"];
}

function toForm(p: Produto): FormState {
  return {
    nome: p.nome,
    marca: p.marca,
    categoria: p.categoria,
    cor: p.cor,
    tamanho: p.tamanho,
    material: p.material,
    genero: p.genero,
    condicao: p.condicao,
    custo_usd: String(p.custo_usd),
    frete_usd: String(p.frete_usd),
    cotacao: String(p.cotacao),
    taxa: String(p.taxa),
    outros_custos: String(p.outros_custos),
    preco_venda: String(p.preco_venda),
    qtd: String(p.qtd),
    local: p.local,
    fornecedor: p.fornecedor,
    lote: p.lote,
    sku: p.sku,
    descricao: p.descricao,
    tags: (p.tags || []).join(", "),
    status: p.status,
  };
}

const campo = (
  t: ThemeTokens,
  label: string,
  value: string,
  onChange: (v: string) => void,
  opts?: { big?: boolean; multiline?: boolean }
) => (
  <div key={label} style={css(`display:flex;flex-direction:column;gap:5px;padding:12px 14px;border-radius:14px;background:${t.bgCard};border:1px solid ${t.border}`)}>
    <span style={css(`font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:${t.textTertiary}`)}>{label}</span>
    {opts?.multiline ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        style={css(`background:none;border:none;outline:none;color:${t.textPrimary};font-size:13px;font-weight:600;width:100%;resize:vertical;font-family:inherit`)}
      />
    ) : (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={css(`background:none;border:none;outline:none;color:${t.textPrimary};font-size:${opts?.big ? "16" : "13.5"}px;font-weight:700;letter-spacing:-.01em;width:100%`)}
      />
    )}
  </div>
);

const selectCampo = (
  t: ThemeTokens,
  label: string,
  value: string,
  onChange: (v: string) => void,
  options: string[]
) => (
  <div key={label} style={css(`display:flex;flex-direction:column;gap:5px;padding:12px 14px;border-radius:14px;background:${t.bgCard};border:1px solid ${t.border}`)}>
    <span style={css(`font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:${t.textTertiary}`)}>{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={css(`background:none;border:none;outline:none;color:${t.textPrimary};font-size:13.5px;font-weight:700;letter-spacing:-.01em;width:100%`)}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  </div>
);

export default function EditarPeca({
  ctx,
  sel,
  onCancel,
  onSaved,
}: {
  ctx: Ctx;
  sel: Produto;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { t } = useTheme();
  const { setProdutos, categorias } = ctx;
  const [form, setForm] = useState<FormState>(toForm(sel));
  const [fotos, setFotos] = useState<string[]>(sel.fotos || []);
  const [variacoes, setVariacoes] = useState<Variacao[]>(
    sel.variacoes && sel.variacoes.length ? sel.variacoes.map((v) => ({ ...v })) : [{ label: "", sku: "", qtd: 1 }]
  );
  const [uploading, setUploading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const setField = (k: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || !fileList.length) return;
    setUploading(true);
    try {
      const files = Array.from(fileList).slice(0, Math.max(0, 8 - fotos.length));
      const novas = await Promise.all(files.map((f) => uploadPhoto(f)));
      setFotos((prev) => [...prev, ...novas]);
    } catch {
      setErro("Não foi possível carregar a foto. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const removerFoto = (idx: number) => setFotos((prev) => prev.filter((_, i) => i !== idx));

  const atualizarVariacao = (idx: number, patch: Partial<Variacao>) =>
    setVariacoes((prev) => prev.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  const removerVariacao = (idx: number) => setVariacoes((prev) => prev.filter((_, i) => i !== idx));
  const adicionarVariacao = () => setVariacoes((prev) => [...prev, { label: "", sku: "", qtd: 1 }]);

  const custoTotal = Math.round(
    (num(form.custo_usd) + num(form.frete_usd)) * num(form.cotacao) + num(form.taxa) + num(form.outros_custos)
  );

  const salvar = async () => {
    setSalvando(true);
    setErro("");
    const patch = {
      nome: form.nome.trim() || "Peça sem nome",
      marca: form.marca,
      categoria: form.categoria,
      cor: form.cor,
      tamanho: form.tamanho,
      material: form.material,
      genero: (GENEROS.includes(form.genero as Genero) ? form.genero : "Unissex") as Genero,
      condicao: form.condicao,
      custo_usd: num(form.custo_usd),
      frete_usd: num(form.frete_usd),
      cotacao: num(form.cotacao),
      taxa: num(form.taxa),
      outros_custos: num(form.outros_custos),
      custo_total: custoTotal,
      preco_venda: num(form.preco_venda),
      qtd: Math.max(0, Math.round(num(form.qtd))),
      local: form.local,
      fornecedor: form.fornecedor,
      lote: form.lote,
      sku: form.sku,
      descricao: form.descricao,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      status: form.status,
      fotos,
      variacoes: variacoes.filter((v) => v.label.trim() || v.sku.trim()),
    };

    if (supabase) {
      const { error } = await supabase.from("products").update(patch).eq("id", sel.id);
      if (error) {
        setErro("Não foi possível salvar no Supabase agora. As alterações ficaram só nesta sessão.");
      }
    }
    setProdutos((prev) => prev.map((p) => (p.id === sel.id ? { ...p, ...patch } : p)));
    setSalvando(false);
    onSaved();
  };

  return (
    <div style={css("display:flex;flex-direction:column;animation:ihslide .24s ease both")}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => {
          onFilesSelected(e.target.files);
          e.target.value = "";
        }}
      />
      <div style={css(`padding:16px 18px 12px;display:flex;align-items:center;gap:12px;border-bottom:1px solid ${t.border}`)}>
        <button
          onClick={onCancel}
          style={css(`width:36px;height:36px;flex:none;border-radius:999px;background:${t.bgCard};border:1px solid ${t.borderStrong};color:${t.textPrimary};font-size:15px;cursor:pointer`)}
        >
          ‹
        </button>
        <span style={css("flex:1;font-size:15px;font-weight:800;letter-spacing:-.02em")}>Editar peça</span>
      </div>

      <div style={css("padding:18px;display:flex;flex-direction:column;gap:14px")}>
        {erro && (
          <div style={css("background:rgba(255,107,90,.1);border:1px solid rgba(255,107,90,.35);border-radius:12px;padding:11px 13px;font-size:11.5px;font-weight:600;color:#FF9285;line-height:1.5")}>
            {erro}
          </div>
        )}

        <span style={css(`font-size:11px;font-weight:800;letter-spacing:.06em;color:${t.textTertiary}`)}>FOTOS</span>
        <div style={css("display:grid;grid-template-columns:repeat(3,1fr);gap:9px")}>
          {fotos.map((url, i) => (
            <div key={i} style={css(`position:relative;aspect-ratio:1/1;border-radius:14px;overflow:hidden;background:${t.bgCard}`)}>
              <img src={url} alt={`Foto ${i + 1}`} style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover")} />
              <button
                onClick={() => removerFoto(i)}
                style={css(`position:absolute;top:5px;right:5px;width:20px;height:20px;border-radius:999px;background:rgba(8,9,6,.65);color:${t.textPrimary};font-size:11px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center`)}
              >
                ×
              </button>
            </div>
          ))}
          {fotos.length < 8 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={css(
                `aspect-ratio:1/1;border-radius:14px;background:${t.bgCard};border:1.5px dashed #34402A;color:${t.accent};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;font-size:11px;font-weight:700${
                  uploading ? ";opacity:.6" : ""
                }`
              )}
            >
              <span style={css("font-size:18px")}>+</span> {uploading ? "Enviando…" : "Adicionar"}
            </button>
          )}
        </div>

        <div style={css(`height:1px;background:${t.border};margin:2px 0`)} />

        <div style={css("display:grid;grid-template-columns:1fr 1fr;gap:10px")}>
          {campo(t, "Nome", form.nome, setField("nome"))}
        </div>
        <div style={css("display:grid;grid-template-columns:1fr 1fr;gap:10px")}>
          {campo(t, "Marca", form.marca, setField("marca"))}
          {campo(t, "Condição", form.condicao, setField("condicao"))}
        </div>
        <div style={css("display:grid;grid-template-columns:1fr 1fr;gap:10px")}>
          {selectCampo(
            t,
            "Categoria",
            categorias.some((c) => c.nome === form.categoria) ? form.categoria : "",
            setField("categoria"),
            categorias.map((c) => c.nome)
          )}
          {selectCampo(t, "Gênero", form.genero, setField("genero"), GENEROS)}
        </div>
        <div style={css("display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px")}>
          {campo(t, "Cor", form.cor, setField("cor"))}
          {campo(t, "Tamanho", form.tamanho, setField("tamanho"))}
          {campo(t, "Material", form.material, setField("material"))}
        </div>

        <div style={css(`display:flex;flex-direction:column;gap:5px;padding:12px 14px;border-radius:14px;background:${t.bgCard};border:1px solid ${t.border}`)}>
          <span style={css(`font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:${t.textTertiary}`)}>Status</span>
          <div style={css("display:flex;flex-wrap:wrap;gap:7px;margin-top:2px")}>
            {STATUS_OPTS.map((s) => {
              const on = form.status === s.v;
              return (
                <button
                  key={s.v}
                  onClick={() => setField("status")(s.v)}
                  style={css(
                    `border-radius:999px;padding:8px 12px;font-size:11.5px;font-weight:700;cursor:pointer;border:1px solid ${
                      on ? t.accent : t.borderStrong
                    };background:${on ? t.accent : t.bgCard};color:${on ? t.accentText : t.textBright}`
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          {form.status === "vendido" && (
            <span style={css("font-size:11px;font-weight:600;color:#F5C518;line-height:1.5;margin-top:6px")}>
              Marcar como vendido aqui só muda o status: não registra a venda, então não entra no lucro
              do mês nem no Analytics. Para contabilizar, use “Vender” na ficha da peça.
            </span>
          )}
        </div>

        <span style={css(`font-size:11px;font-weight:800;letter-spacing:.06em;color:${t.textTertiary};margin-top:4px`)}>CUSTOS E PREÇO</span>
        <div style={css("display:grid;grid-template-columns:1fr 1fr;gap:10px")}>
          {campo(t, "Custo US$", form.custo_usd, setField("custo_usd"))}
          {campo(t, "Frete US$", form.frete_usd, setField("frete_usd"))}
          {campo(t, "Cotação", form.cotacao, setField("cotacao"))}
          {campo(t, "Taxa R$", form.taxa, setField("taxa"))}
          {campo(t, "Outros custos R$", form.outros_custos, setField("outros_custos"))}
          {campo(t, "Qtd em estoque", form.qtd, setField("qtd"))}
        </div>
        {campo(t, "Preço de venda R$", form.preco_venda, setField("preco_venda"), { big: true })}
        <div style={css("background:#101410;border:1px solid #2E3B22;border-radius:14px;padding:13px 15px;display:flex;align-items:center;justify-content:space-between")}>
          <span style={css(`font-size:11.5px;font-weight:700;color:${t.textTertiary}`)}>Custo total (recalculado)</span>
          <span style={css("font-size:16px;font-weight:800;letter-spacing:-.02em")}>{custoTotal}</span>
        </div>

        <span style={css(`font-size:11px;font-weight:800;letter-spacing:.06em;color:${t.textTertiary};margin-top:4px`)}>LOGÍSTICA</span>
        <div style={css("display:grid;grid-template-columns:1fr 1fr;gap:10px")}>
          {campo(t, "Local", form.local, setField("local"))}
          {campo(t, "Fornecedor", form.fornecedor, setField("fornecedor"))}
          {campo(t, "Lote", form.lote, setField("lote"))}
          {campo(t, "SKU", form.sku, setField("sku"))}
        </div>

        {campo(t, "Descrição", form.descricao, setField("descricao"), { multiline: true })}
        {campo(t, "Tags (separadas por vírgula)", form.tags, setField("tags"))}

        <div style={css("display:flex;flex-direction:column;gap:9px;margin-top:4px")}>
          <span style={css(`font-size:11px;font-weight:800;letter-spacing:.06em;color:${t.textTertiary}`)}>VARIAÇÕES</span>
          {variacoes.map((v, i) => (
            <div key={i} style={css(`display:flex;gap:7px;align-items:center;background:${t.bgCard};border:1px solid ${t.border};border-radius:12px;padding:9px 10px`)}>
              <input
                value={v.label}
                onChange={(e) => atualizarVariacao(i, { label: e.target.value })}
                placeholder="Label"
                style={css(`flex:1;min-width:0;background:none;border:none;outline:none;color:${t.textPrimary};font-size:12.5px;font-weight:700`)}
              />
              <input
                value={v.sku}
                onChange={(e) => atualizarVariacao(i, { sku: e.target.value })}
                placeholder="SKU"
                style={css(`width:90px;background:none;border:none;outline:none;color:${t.textBright};font-size:11.5px;font-weight:600`)}
              />
              <input
                value={String(v.qtd)}
                onChange={(e) => atualizarVariacao(i, { qtd: Math.max(0, Math.round(num(e.target.value))) })}
                placeholder="Qtd"
                style={css(`width:44px;background:none;border:none;outline:none;color:${t.accent};font-size:12px;font-weight:800;text-align:right`)}
              />
              <button
                onClick={() => removerVariacao(i)}
                style={css(`width:22px;height:22px;flex:none;border-radius:999px;background:${t.bgCard};color:${t.textTertiary};font-size:11px;border:none;cursor:pointer`)}
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={adicionarVariacao}
            style={css(`background:none;border:1px dashed #34402A;color:${t.accent};border-radius:12px;padding:11px;font-size:12px;font-weight:700;cursor:pointer`)}
          >
            + variação
          </button>
        </div>

        <div style={css("display:flex;gap:9px;margin-top:8px")}>
          <button
            onClick={onCancel}
            style={css(`flex:1;background:${t.bgCard};border:1px solid ${t.borderStrong};color:${t.textBright};border-radius:15px;padding:15px;font-size:13.5px;font-weight:700;cursor:pointer`)}
          >
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={salvando}
            style={css(`flex:2;background:${t.accent};color:${t.accentText};border:none;border-radius:15px;padding:15px;font-size:14px;font-weight:800;cursor:pointer${salvando ? ";opacity:.7" : ""}`)}
          >
            {salvando ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}
