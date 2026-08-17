"use client";

import { useRef, useState } from "react";
import { css } from "@/lib/css";
import { BRL } from "@/lib/helpers";
import Thumb from "@/components/Thumb";
import { uploadPhoto } from "@/lib/upload";
import type { Ctx } from "@/lib/context";

interface Resultado {
  id: number;
  score: number;
  motivo: string;
}

export default function BuscaFoto({ ctx }: { ctx: Ctx }) {
  const { produtos, state, setState, openPeca } = ctx;
  const estado = state.bfEstado;
  const [fotoUrl, setFotoUrl] = useState("");
  const [descricao, setDescricao] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [erro, setErro] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const disparar = async (file: File) => {
    setErro("");
    setState({ bfEstado: "analisando" });
    try {
      const url = await uploadPhoto(file);
      setFotoUrl(url);
      const resp = await fetch("/api/ai/busca-foto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foto: url,
          produtos: produtos.map((p) => ({
            id: p.id,
            nome: p.nome,
            marca: p.marca,
            categoria: p.categoria,
            cor: p.cor,
            cor2: p.cor2,
            descricao: p.descricao,
            tags: p.tags,
          })),
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Falha na busca por foto");
      setDescricao(data.descricao);
      setResultados(data.resultados);
      setState({ bfEstado: "resultado" });
    } catch (err: any) {
      setErro(err?.message || "Falha na busca por foto. Tente novamente.");
      setState({ bfEstado: "camera" });
    }
  };

  const similares = resultados
    .map((s) => {
      const p = produtos.find((x) => x.id === s.id);
      return p ? { ...s, p } : null;
    })
    .filter(Boolean) as { id: number; score: number; motivo: string; p: (typeof produtos)[number] }[];

  return (
    <div style={css("display:flex;flex-direction:column;min-height:100%;animation:ihslide .26s ease both")}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) disparar(f);
        }}
      />
      <div style={css("padding:16px 18px 12px;display:flex;align-items:center;gap:12px;border-bottom:1px solid #1E211C")}>
        <button
          onClick={() => setState({ view: "estoque" })}
          style={css("width:36px;height:36px;flex:none;border-radius:999px;background:#141613;border:1px solid #2E332B;color:#F2F4EF;font-size:15px;cursor:pointer")}
        >
          ‹
        </button>
        <span style={css("flex:1;font-size:15px;font-weight:800;letter-spacing:-.02em")}>Buscar por foto</span>
      </div>

      {estado === "camera" && (
        <div style={css("padding:18px;display:flex;flex-direction:column;gap:16px;flex:1")}>
          <div style={css("font-size:12.5px;font-weight:500;color:#8B9186;line-height:1.6")}>
            Tire ou escolha uma foto da peça. A IA descreve o item e compara com a descrição de cada peça do
            seu estoque por similaridade de texto (embeddings), não é uma comparação visual pixel a pixel.
          </div>
          {erro && (
            <div style={css("background:rgba(255,107,90,.1);border:1px solid rgba(255,107,90,.35);border-radius:12px;padding:11px 13px;font-size:11.5px;font-weight:600;color:#FF9285;line-height:1.5")}>
              {erro}
            </div>
          )}
          <div style={css("position:relative;flex:1;min-height:280px;border-radius:22px;background:#0E100D;border:1px solid #23271F;display:flex;align-items:center;justify-content:center;overflow:hidden")}>
            <span style={css("position:absolute;inset:34px;border-radius:16px;border:1.5px dashed rgba(198,255,79,.4)")} />
            <span style={css("font-size:11.5px;font-weight:700;color:#4A5045;letter-spacing:.04em")}>VISOR DA CÂMERA</span>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={css(
              "display:flex;align-items:center;justify-content:center;gap:10px;background:#C6FF4F;color:#0B0C0A;border:none;border-radius:16px;padding:17px;font-size:15px;font-weight:800;cursor:pointer"
            )}
          >
            <span style={css("font-size:17px")}>◉</span> Fotografar e comparar
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={css("background:#141613;border:1px solid #2E332B;color:#B7BEB2;border-radius:14px;padding:14px;font-size:12.5px;font-weight:700;cursor:pointer")}
          >
            Escolher da galeria
          </button>
        </div>
      )}

      {estado === "analisando" && (
        <div style={css("padding:70px 26px;display:flex;flex-direction:column;align-items:center;gap:20px;text-align:center")}>
          <div style={css("width:60px;height:60px;border-radius:999px;border:3px solid #262A24;border-top-color:#C6FF4F;animation:ihspin .9s linear infinite")} />
          <div style={css("font-size:15px;font-weight:800;letter-spacing:-.02em")}>Comparando com seu estoque…</div>
          <div style={css("font-size:12.5px;font-weight:500;color:#8B9186;max-width:270px;line-height:1.6")}>
            Descrevendo a foto com IA, gerando o embedding e buscando as peças mais próximas.
          </div>
        </div>
      )}

      {estado === "resultado" && (
        <div style={css("padding:18px;display:flex;flex-direction:column;gap:16px")}>
          <div style={css("display:flex;gap:12px;align-items:center;background:#141613;border:1px solid #262A24;border-radius:18px;padding:12px")}>
            {fotoUrl ? (
              <img src={fotoUrl} alt="Sua foto" style={css("width:64px;height:64px;flex:none;border-radius:14px;object-fit:cover")} />
            ) : (
              <span
                style={css(
                  "width:64px;height:64px;flex:none;border-radius:14px;background:linear-gradient(150deg,hsl(208 42% 34%),hsl(248 32% 18%));display:flex;align-items:center;justify-content:center;font-size:9.5px;font-weight:800;color:rgba(255,255,255,.6);letter-spacing:.05em"
                )}
              >
                SUA FOTO
              </span>
            )}
            <span style={css("flex:1;min-width:0;display:flex;flex-direction:column;gap:3px")}>
              <span style={css("font-size:13px;font-weight:700;letter-spacing:-.01em")}>{similares.length} peças parecidas</span>
              <span style={css("font-size:11.5px;font-weight:500;color:#7E857A;line-height:1.5")}>{descricao}</span>
            </span>
          </div>

          <div style={css("display:flex;flex-direction:column;gap:9px")}>
            {similares.map((s) => {
              const p = s.p;
              return (
                <button
                  key={s.id}
                  onClick={() => openPeca(p.id)}
                  style={css("display:flex;align-items:center;gap:12px;background:#141613;border:1px solid #262A24;border-radius:18px;padding:11px;cursor:pointer;text-align:left;color:#F2F4EF")}
                >
                  <Thumb p={p} size={64} radius={14} />
                  <span style={css("flex:1;min-width:0;display:flex;flex-direction:column;gap:3px")}>
                    <span style={css("display:flex;align-items:center;gap:7px")}>
                      <span style={css("font-size:10px;font-weight:800;color:#7E857A;letter-spacing:.05em;text-transform:uppercase")}>{p.marca}</span>
                      <span
                        style={css(
                          `font-size:10.5px;font-weight:800;color:${
                            s.score > 80 ? "#C6FF4F" : s.score > 65 ? "#F5C518" : "#9AA096"
                          };background:rgba(255,255,255,.05);border-radius:7px;padding:4px 7px`
                        )}
                      >
                        {s.score}% parecido
                      </span>
                    </span>
                    <span style={css("font-size:12.5px;font-weight:700;letter-spacing:-.01em;line-height:1.3")}>{p.nome}</span>
                    <span style={css("font-size:10.5px;font-weight:500;color:#6E7469;line-height:1.4")}>{s.motivo}</span>
                    <span style={css("font-size:11px;font-weight:700;color:#C6FF4F")}>
                      {BRL(p.preco_venda)} · {p.tamanho} · {p.qtd} un · {p.local}
                    </span>
                  </span>
                </button>
              );
            })}
            {!similares.length && (
              <div style={css("font-size:12px;font-weight:500;color:#7E857A;padding:8px 2px")}>
                Nenhuma peça parecida encontrada no estoque.
              </div>
            )}
          </div>

          <div style={css("display:flex;gap:9px")}>
            <button
              onClick={() => setState({ bfEstado: "camera" })}
              style={css("flex:1;background:#141613;border:1px solid #2E332B;color:#B7BEB2;border-radius:15px;padding:15px;font-size:13px;font-weight:700;cursor:pointer")}
            >
              Tirar outra foto
            </button>
            <button
              onClick={() =>
                setState({ view: "wizard", wz: 1, custoUsd: "10", cotacao: "5.42", freteUsd: "2", outros: "8", precoVenda: "100" })
              }
              style={css("flex:1;background:#C6FF4F;color:#0B0C0A;border:none;border-radius:15px;padding:15px;font-size:13px;font-weight:800;cursor:pointer")}
            >
              Cadastrar como nova
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
