"use client";

import { useState } from "react";
import { css } from "@/lib/css";
import { useTheme } from "@/lib/theme";
import { BRL, margem, diasParado } from "@/lib/helpers";
import Thumb from "@/components/Thumb";
import { CHAT_QA } from "@/lib/seed";
import type { Ctx } from "@/lib/context";

const MESES_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export default function Analytics({ ctx }: { ctx: Ctx }) {
  const { t } = useTheme();
  const { produtos, categorias, vendas, openPeca } = ctx;
  const [chat, setChat] = useState<{ eu: boolean; texto: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatPensando, setChatPensando] = useState(false);

  const anReceita = vendas.reduce((s, v) => s + v.preco_final, 0);
  const anLucro = vendas.reduce((s, v) => s + v.lucro, 0);
  const anVendidas = vendas.length;
  const anTicket = anVendidas > 0 ? anReceita / anVendidas : 0;

  // "Giro médio": average days-parado of currently in-stock (non-sold,
  // non-archived) products — a real, traceable stand-in for "how long stock
  // tends to sit", since the old demo `giro` per category had no real
  // definition at all.
  const emEstoque = produtos.filter((p) => p.status !== "vendido" && !p.arquivado);
  const anGiro = emEstoque.length
    ? Math.round(emEstoque.reduce((s, p) => s + diasParado(p.created_at), 0) / emEstoque.length)
    : 0;

  // Receita por mês: group real sales by YYYY-MM, last 6 months that have data.
  const porMesMap = new Map<string, { mes: string; receita: number }>();
  for (const v of vendas) {
    const d = new Date(v.vendido_em);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const cur = porMesMap.get(key) || { mes: MESES_PT[d.getUTCMonth()], receita: 0 };
    cur.receita += v.preco_final;
    porMesMap.set(key, cur);
  }
  const vendasMes = [...porMesMap.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([, v]) => v);
  const maxReceitaMes = vendasMes.length ? Math.max(...vendasMes.map((v) => v.receita)) : 0;

  // Categorias por lucro: group real sales by their snapshotted categoria.
  const porCatMap = new Map<string, { cat: string; vendidas: number; receita: number; lucro: number }>();
  for (const v of vendas) {
    const cat = v.categoria || "Sem categoria";
    const cur = porCatMap.get(cat) || { cat, vendidas: 0, receita: 0, lucro: 0 };
    cur.vendidas += 1;
    cur.receita += v.preco_final;
    cur.lucro += v.lucro;
    porCatMap.set(cat, cur);
  }
  const catPerfOrdered = [...porCatMap.values()].sort((a, b) => b.lucro - a.lucro);
  const maxLucroCat = catPerfOrdered.length ? Math.max(...catPerfOrdered.map((c) => c.lucro)) : 0;
  const giroPorCat = new Map<string, number>();
  for (const cat of new Set([...emEstoque.map((p) => p.categoria), ...catPerfOrdered.map((c) => c.cat)])) {
    const itens = emEstoque.filter((p) => p.categoria === cat);
    giroPorCat.set(cat, itens.length ? Math.round(itens.reduce((s, p) => s + diasParado(p.created_at), 0) / itens.length) : 0);
  }

  // Canais de venda: group real sales by canal, % relative to real receita.
  const porCanalMap = new Map<string, { canal: string; receita: number }>();
  for (const v of vendas) {
    const cur = porCanalMap.get(v.canal) || { canal: v.canal, receita: 0 };
    cur.receita += v.preco_final;
    porCanalMap.set(v.canal, cur);
  }
  const canalPerf = [...porCanalMap.values()].sort((a, b) => b.receita - a.receita);
  const maxReceitaCanal = canalPerf.length ? Math.max(...canalPerf.map((c) => c.receita)) : 0;

  const iconeByCat: Record<string, { icone: string; hue: number }> = {};
  for (const c of categorias) iconeByCat[c.nome] = { icone: c.icone, hue: c.hue };

  const topProdutos = produtos
    .slice()
    .sort((a, b) => margem(b) - margem(a))
    .slice(0, 4);

  const ask = async (pergunta: string) => {
    const historico = chat.slice(-6).map((m) => ({ eu: m.eu, texto: m.texto }));
    setChat((c) => c.concat({ eu: true, texto: pergunta }));
    setChatInput("");
    setChatPensando(true);
    try {
      const resp = await fetch("/api/ai/chat-estoque", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta, historico, produtos }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Falha ao consultar o estoque");
      setChat((c) => c.concat({ eu: false, texto: data.resposta }));
    } catch (err: any) {
      setChat((c) =>
        c.concat({
          eu: false,
          texto: err?.message || "Não consegui consultar o estoque agora. Tente de novo em instantes.",
        })
      );
    } finally {
      setChatPensando(false);
    }
  };

  return (
    <div style={css("padding:20px 18px 26px;display:flex;flex-direction:column;gap:20px;animation:ihslide .28s ease both")}>
      <div style={css("display:flex;align-items:flex-end;justify-content:space-between;gap:12px")}>
        <div>
          <div style={css("font-size:23px;font-weight:800;letter-spacing:-.03em")}>Analytics</div>
          <div style={css(`font-size:12px;font-weight:500;color:${t.textSecondary};margin-top:3px`)}>Últimos 6 meses</div>
        </div>
        <div style={css(`font-size:11px;font-weight:700;color:${t.accent};background:${t.accentSoftBg};border:1px solid ${t.accentSoftBorder};border-radius:999px;padding:6px 11px`)}>
          {anVendidas} vendidas
        </div>
      </div>

      <div style={css("display:grid;grid-template-columns:repeat(2,1fr);gap:10px")}>
        <div style={css(`background:${t.bgCard};border:1px solid ${t.border};border-radius:18px;padding:15px;display:flex;flex-direction:column;gap:5px`)}>
          <span style={css(`font-size:11.5px;font-weight:600;color:${t.textSecondary}`)}>Receita</span>
          <span style={css("font-size:23px;font-weight:800;letter-spacing:-.035em")}>{BRL(anReceita)}</span>
        </div>
        <div style={css(`background:${t.bgCard};border:1px solid ${t.border};border-radius:18px;padding:15px;display:flex;flex-direction:column;gap:5px`)}>
          <span style={css(`font-size:11.5px;font-weight:600;color:${t.textSecondary}`)}>Lucro</span>
          <span style={css(`font-size:23px;font-weight:800;letter-spacing:-.035em;color:${t.accent}`)}>{BRL(anLucro)}</span>
        </div>
        <div style={css(`background:${t.bgCard};border:1px solid ${t.border};border-radius:18px;padding:15px;display:flex;flex-direction:column;gap:5px`)}>
          <span style={css(`font-size:11.5px;font-weight:600;color:${t.textSecondary}`)}>Ticket médio</span>
          <span style={css("font-size:23px;font-weight:800;letter-spacing:-.035em")}>{BRL(anTicket)}</span>
        </div>
        <div style={css(`background:${t.bgCard};border:1px solid ${t.border};border-radius:18px;padding:15px;display:flex;flex-direction:column;gap:5px`)}>
          <span style={css(`font-size:11.5px;font-weight:600;color:${t.textSecondary}`)}>Giro médio</span>
          <span style={css("font-size:23px;font-weight:800;letter-spacing:-.035em")}>{anGiro} dias</span>
        </div>
      </div>

      {anVendidas === 0 && (
        <div style={css(`background:${t.bgCard};border:1px solid ${t.border};border-radius:18px;padding:20px;text-align:center;display:flex;flex-direction:column;gap:6px;align-items:center`)}>
          <div style={css(`font-size:24px;color:${t.borderStrong}`)}>◐</div>
          <div style={css("font-size:13px;font-weight:700")}>Ainda sem vendas</div>
          <div style={css(`font-size:11.5px;color:${t.textSecondary};max-width:260px;line-height:1.5`)}>
            Assim que você registrar uma venda, os números aqui passam a refletir dados reais do seu estoque.
          </div>
        </div>
      )}

      <div style={css("display:flex;flex-direction:column;gap:11px")}>
        <span style={css("font-size:13.5px;font-weight:800;letter-spacing:-.01em")}>Receita por mês</span>
        {vendasMes.length === 0 ? (
          <div style={css(`background:${t.bgCard};border:1px solid ${t.border};border-radius:18px;padding:24px;text-align:center;font-size:12px;font-weight:600;color:${t.textSecondary}`)}>
            Sem vendas registradas ainda.
          </div>
        ) : (
          <div style={css(`background:${t.bgCard};border:1px solid ${t.border};border-radius:18px;padding:16px 14px 12px;display:flex;align-items:flex-end;gap:8px;height:180px`)}>
            {vendasMes.map((v, i) => (
              <div key={v.mes + i} style={css("flex:1;display:flex;flex-direction:column;align-items:center;gap:7px;justify-content:flex-end;height:100%")}>
                <span style={css(`font-size:9.5px;font-weight:800;color:${t.textTertiary};white-space:nowrap`)}>{BRL(v.receita)}</span>
                <span
                  style={css(
                    `width:100%;height:${Math.round((v.receita / maxReceitaMes) * 118)}px;border-radius:8px 8px 3px 3px;background:linear-gradient(180deg,${t.accent},${t.accentBarFade})`
                  )}
                />
                <span style={css(`font-size:10px;font-weight:700;color:${t.textTertiary};text-transform:uppercase`)}>{v.mes}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={css("display:flex;flex-direction:column;gap:11px")}>
        <span style={css("font-size:13.5px;font-weight:800;letter-spacing:-.01em")}>Categorias por lucro</span>
        {catPerfOrdered.length === 0 ? (
          <div style={css(`background:${t.bgCard};border:1px solid ${t.border};border-radius:18px;padding:24px;text-align:center;font-size:12px;font-weight:600;color:${t.textSecondary}`)}>
            Sem vendas registradas ainda.
          </div>
        ) : (
        <div style={css(`background:${t.bgCard};border:1px solid ${t.border};border-radius:18px;overflow:hidden`)}>
          {catPerfOrdered.map((c, i) => {
            const meta = iconeByCat[c.cat] || { icone: "●", hue: 96 };
            const giro = giroPorCat.get(c.cat) ?? 0;
            return (
              <div key={c.cat} style={css(`display:flex;align-items:center;gap:12px;padding:12px 14px;border-bottom:1px solid ${t.border}`)}>
                <span style={css(`font-size:10.5px;font-weight:800;color:${t.textTertiary};width:12px`)}>{i + 1}</span>
                <span
                  style={css(
                    `width:26px;height:26px;flex:none;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:12px;background:hsl(${meta.hue} 40% 22%);color:hsl(${meta.hue} 70% 70%)`
                  )}
                >
                  {meta.icone}
                </span>
                <span style={css("flex:1;min-width:0;display:flex;flex-direction:column;gap:5px")}>
                  <span style={css("display:flex;align-items:baseline;justify-content:space-between;gap:8px")}>
                    <span style={css("font-size:12.5px;font-weight:700;letter-spacing:-.01em")}>{c.cat}</span>
                    <span style={css(`font-size:12.5px;font-weight:800;color:${t.accent}`)}>{BRL(c.lucro)}</span>
                  </span>
                  <span style={css(`height:6px;border-radius:9px;background:hsl(${meta.hue} 70% 58%);width:${Math.round((c.lucro / maxLucroCat) * 100)}%`)} />
                  <span style={css("display:flex;gap:10px")}>
                    <span style={css(`font-size:10.5px;font-weight:600;color:${t.textSecondary}`)}>
                      {c.vendidas} un · {BRL(c.receita)}
                    </span>
                    <span style={css(`font-size:10.5px;font-weight:700;color:${giro > 40 ? "#F5C518" : t.textSecondary}`)}>{giro}d de giro</span>
                  </span>
                </span>
              </div>
            );
          })}
        </div>
        )}
      </div>

      <div style={css("display:flex;flex-direction:column;gap:11px")}>
        <span style={css("font-size:13.5px;font-weight:800;letter-spacing:-.01em")}>Canais de venda</span>
        {canalPerf.length === 0 ? (
          <div style={css(`background:${t.bgCard};border:1px solid ${t.border};border-radius:18px;padding:24px;text-align:center;font-size:12px;font-weight:600;color:${t.textSecondary}`)}>
            Sem vendas registradas ainda.
          </div>
        ) : (
        <div style={css(`background:${t.bgCard};border:1px solid ${t.border};border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:12px`)}>
          {canalPerf.map((c) => {
            const pct = anReceita > 0 ? Math.round((c.receita / anReceita) * 100) : 0;
            const barWidth = maxReceitaCanal > 0 ? Math.round((c.receita / maxReceitaCanal) * 100) : 0;
            return (
              <div key={c.canal} style={css("display:flex;flex-direction:column;gap:6px")}>
                <div style={css("display:flex;align-items:baseline;justify-content:space-between;gap:8px")}>
                  <span style={css("font-size:12px;font-weight:700")}>{c.canal}</span>
                  <span style={css(`font-size:11px;font-weight:600;color:${t.textSecondary}`)}>
                    {pct}% · {BRL(c.receita)}
                  </span>
                </div>
                <span style={css(`height:6px;border-radius:9px;background:${t.accent};width:${barWidth}%`)} />
              </div>
            );
          })}
        </div>
        )}
      </div>

      <div style={css("display:flex;flex-direction:column;gap:11px")}>
        <span style={css("font-size:13.5px;font-weight:800;letter-spacing:-.01em")}>Melhores margens no estoque</span>
        <div style={css(`background:${t.bgCard};border:1px solid ${t.border};border-radius:18px;overflow:hidden`)}>
          {topProdutos.map((p) => (
            <button
              key={p.id}
              onClick={() => openPeca(p.id)}
              style={css(
                `width:100%;display:flex;align-items:center;gap:12px;padding:11px 14px;background:none;border:none;border-bottom:1px solid ${t.border};cursor:pointer;text-align:left;color:${t.textPrimary}`
              )}
            >
              <Thumb p={p} size={38} />
              <span style={css("flex:1;min-width:0;display:flex;flex-direction:column;gap:2px")}>
                <span style={css("font-size:12.5px;font-weight:700;letter-spacing:-.01em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap")}>{p.nome}</span>
                <span style={css(`font-size:10.5px;font-weight:600;color:${t.textSecondary}`)}>lucro {BRL(p.preco_venda - p.custo_total)} por unidade</span>
              </span>
              <span style={css("font-size:12.5px;font-weight:800;color:#7CE38B;flex:none")}>{Math.round(margem(p) * 100)}%</span>
            </button>
          ))}
        </div>
      </div>

      <div style={css("display:flex;flex-direction:column;gap:11px")}>
        <div style={css("display:flex;align-items:baseline;justify-content:space-between;gap:8px")}>
          <span style={css("font-size:13.5px;font-weight:800;letter-spacing:-.01em")}>Perguntar ao estoque (IA)</span>
          <button
            onClick={() => {
              setChat([]);
              setChatInput("");
            }}
            style={css(`background:none;border:none;color:${t.textSecondary};font-size:11px;font-weight:700;cursor:pointer;padding:0`)}
          >
            limpar
          </button>
        </div>
        <div style={css("background:#101410;border:1px solid #2E3B22;border-radius:20px;padding:14px;display:flex;flex-direction:column;gap:12px")}>
          {chat.length === 0 && (
            <div style={css("display:flex;flex-direction:column;gap:9px")}>
              <div style={css(`font-size:12px;font-weight:500;color:${t.textSecondary};line-height:1.6`)}>
                Pergunte em português. As respostas vêm de uma IA (gpt-4o-mini) consultando os dados reais do
                seu estoque e vendas.
              </div>
              <div style={css("display:flex;flex-direction:column;gap:6px")}>
                {CHAT_QA.map((q) => (
                  <button
                    key={q.p}
                    onClick={() => ask(q.p)}
                    style={css(`text-align:left;background:${t.bgCard};border:1px solid ${t.border};color:${t.textBright};border-radius:12px;padding:11px 13px;font-size:12px;font-weight:600;cursor:pointer;line-height:1.4`)}
                  >
                    {q.p}
                  </button>
                ))}
              </div>
            </div>
          )}
          {chat.map((m, i) => (
            <div key={i} style={css(`display:flex;justify-content:${m.eu ? "flex-end" : "flex-start"}`)}>
              <span
                style={css(
                  m.eu
                    ? `max-width:84%;background:${t.accent};color:${t.accentText};border-radius:16px 16px 5px 16px;padding:11px 14px;font-size:12.5px;font-weight:700;line-height:1.5;white-space:pre-line`
                    : `max-width:90%;background:${t.bgCard};border:1px solid ${t.border};color:${t.textBright};border-radius:16px 16px 16px 5px;padding:12px 14px;font-size:12.5px;font-weight:500;line-height:1.65;white-space:pre-line`
                )}
              >
                {m.texto}
              </span>
            </div>
          ))}
          {chatPensando && (
            <div style={css("display:flex;align-items:center;gap:9px;padding:4px 2px")}>
              <span style={css(`width:15px;height:15px;border-radius:999px;border:2px solid ${t.border};border-top-color:${t.accent};animation:ihspin .8s linear infinite`)} />
              <span style={css(`font-size:11.5px;font-weight:600;color:${t.textSecondary}`)}>consultando o banco…</span>
            </div>
          )}
          <div style={css("display:flex;gap:8px;align-items:center")}>
            <div style={css(`flex:1;display:flex;align-items:center;background:${t.bgCard};border:1px solid ${t.borderStrong};border-radius:14px;padding:0 13px;height:46px`)}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ex.: qual categoria vende mais?"
                style={css(`flex:1;background:none;border:none;outline:none;color:${t.textPrimary};font-size:13px;font-weight:600;min-width:0`)}
              />
            </div>
            <button
              onClick={() => chatInput.trim() && ask(chatInput.trim())}
              style={css(`width:46px;height:46px;flex:none;background:${t.accent};color:${t.accentText};border:none;border-radius:14px;font-size:16px;font-weight:800;cursor:pointer`)}
            >
              ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
