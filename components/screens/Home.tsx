"use client";

import { css } from "@/lib/css";
import { BRL, diasParado, initials, thumbStyle } from "@/lib/helpers";
import type { Ctx } from "@/lib/context";

export default function Home({ ctx }: { ctx: Ctx }) {
  const { produtos, setState, openPeca } = ctx;

  const ativos = produtos.filter((p) => p.status !== "vendido");
  const totalCusto = ativos.reduce((s, p) => s + p.custo_total * p.qtd, 0);
  const totalVenda = ativos.reduce((s, p) => s + p.preco_venda * p.qtd, 0);
  const totalPecas = produtos.reduce((s, p) => s + p.qtd, 0);
  const estoqueBaixo = produtos.filter((p) => p.qtd <= 1).length;
  const paradas = produtos
    .slice()
    .sort((a, b) => diasParado(b.created_at) - diasParado(a.created_at))
    .slice(0, 5);

  const dataStr = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  return (
    <div style={css("padding:20px 18px 26px;display:flex;flex-direction:column;gap:18px;animation:ihslide .28s ease both")}>
      <div style={css("display:flex;align-items:flex-end;justify-content:space-between;gap:12px")}>
        <div>
          <div style={css("font-size:12px;font-weight:600;color:#7E857A")}>
            {dataStr.charAt(0).toUpperCase() + dataStr.slice(1)}
          </div>
          <div style={css("font-size:23px;font-weight:800;letter-spacing:-.03em;margin-top:2px")}>Seu estoque</div>
        </div>
        <div
          style={css(
            "font-size:11px;font-weight:700;color:#C6FF4F;background:rgba(198,255,79,.1);border:1px solid rgba(198,255,79,.25);border-radius:999px;padding:6px 11px"
          )}
        >
          {totalPecas} peças
        </div>
      </div>

      <div style={css("display:grid;grid-template-columns:repeat(2,1fr);gap:10px")}>
        <div style={css("background:#141613;border:1px solid #262A24;border-radius:18px;padding:16px 16px 18px;display:flex;flex-direction:column;gap:6px")}>
          <div style={css("font-size:11.5px;font-weight:600;color:#8B9186")}>Capital parado</div>
          <div style={css("font-size:26px;font-weight:800;letter-spacing:-.035em")}>{BRL(totalCusto)}</div>
          <div style={css("font-size:11px;font-weight:500;color:#6E7469")}>custo total do que está aqui</div>
        </div>
        <div style={css("background:#141613;border:1px solid #262A24;border-radius:18px;padding:16px 16px 18px;display:flex;flex-direction:column;gap:6px")}>
          <div style={css("font-size:11.5px;font-weight:600;color:#8B9186")}>Valor potencial</div>
          <div style={css("font-size:26px;font-weight:800;letter-spacing:-.035em;color:#C6FF4F")}>{BRL(totalVenda)}</div>
          <div style={css("font-size:11px;font-weight:500;color:#6E7469")}>se vender tudo no preço atual</div>
        </div>
        <div style={css("background:#141613;border:1px solid #262A24;border-radius:18px;padding:16px 16px 18px;display:flex;flex-direction:column;gap:6px")}>
          <div style={css("font-size:11.5px;font-weight:600;color:#8B9186")}>Lucro no mês</div>
          <div style={css("font-size:26px;font-weight:800;letter-spacing:-.035em")}>{BRL(2870)}</div>
          <div style={css("font-size:11px;font-weight:500;color:#7CE38B")}>7 vendas realizadas</div>
        </div>
        <div style={css("background:#141613;border:1px solid #3A3320;border-radius:18px;padding:16px 16px 18px;display:flex;flex-direction:column;gap:6px")}>
          <div style={css("font-size:11.5px;font-weight:600;color:#E8C766")}>Estoque baixo</div>
          <div style={css("font-size:26px;font-weight:800;letter-spacing:-.035em;color:#F5C518")}>{estoqueBaixo}</div>
          <div style={css("font-size:11px;font-weight:500;color:#6E7469")}>últimas unidades</div>
        </div>
      </div>

      <div style={css("display:flex;flex-direction:column;gap:10px")}>
        <div style={css("display:flex;align-items:baseline;justify-content:space-between")}>
          <span style={css("font-size:13.5px;font-weight:800;letter-spacing:-.01em")}>Paradas há mais tempo</span>
          <button
            onClick={() => setState({ view: "estoque", sort: "parado", chips: [], query: "" })}
            style={css("background:none;border:none;color:#C6FF4F;font-size:11.5px;font-weight:700;cursor:pointer;padding:0")}
          >
            ver todas
          </button>
        </div>
        <div style={css("background:#141613;border:1px solid #262A24;border-radius:18px;overflow:hidden")}>
          {paradas.map((p) => (
            <button
              key={p.id}
              onClick={() => openPeca(p.id)}
              style={css(
                "width:100%;display:flex;align-items:center;gap:12px;padding:11px 14px;background:none;border:none;border-bottom:1px solid #1E211C;cursor:pointer;text-align:left;color:#F2F4EF"
              )}
            >
              <span style={css(thumbStyle(p, 40))}>{initials(p)}</span>
              <span style={css("flex:1;min-width:0;display:flex;flex-direction:column;gap:2px")}>
                <span style={css("font-size:13px;font-weight:700;letter-spacing:-.01em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap")}>
                  {p.nome}
                </span>
                <span style={css("font-size:11px;font-weight:500;color:#7E857A")}>
                  {p.local} · {BRL(p.preco_venda)}
                </span>
              </span>
              <span style={css("font-size:11px;font-weight:800;color:#F5C518;flex:none")}>{diasParado(p.created_at)}d</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() =>
          setState({ view: "wizard", wz: 1, fotos: 2, custoUsd: "10", cotacao: "5.42", freteUsd: "2", outros: "8", precoVenda: "100" })
        }
        style={css(
          "display:flex;align-items:center;justify-content:center;gap:10px;background:#C6FF4F;color:#0B0C0A;border:none;border-radius:16px;padding:17px;font-size:15px;font-weight:800;letter-spacing:-.01em;cursor:pointer;box-shadow:0 10px 30px rgba(198,255,79,.14)"
        )}
      >
        <span style={css("font-size:17px")}>◉</span> Nova peça por foto
      </button>
    </div>
  );
}
