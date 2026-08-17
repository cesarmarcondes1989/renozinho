import { NextRequest, NextResponse } from "next/server";
import { getOpenAI, CHAT_MODEL } from "@/lib/openai";
import { aiErrorResponse } from "@/lib/apiError";
import { supabase } from "@/lib/supabase";
import { margem, diasParado, BRL } from "@/lib/helpers";
import type { Produto } from "@/lib/types";

export const runtime = "nodejs";

const MAX_QUESTION_CHARS = 800;
const MAX_HISTORY = 6;

interface VendaRow {
  id: number;
  product_id: number | null;
  preco_final: number;
  canal: string;
  taxa_canal: number;
  custo_total_no_momento: number;
  lucro: number;
  vendido_em: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pergunta = String(body.pergunta || "").slice(0, MAX_QUESTION_CHARS).trim();
    if (!pergunta) {
      return NextResponse.json({ error: "Envie uma 'pergunta'" }, { status: 400 });
    }
    const historico: { eu: boolean; texto: string }[] = Array.isArray(body.historico)
      ? body.historico.slice(-MAX_HISTORY)
      : [];
    const produtos: Produto[] = Array.isArray(body.produtos) ? body.produtos : [];

    let vendas: VendaRow[] = [];
    if (supabase) {
      const { data } = await supabase
        .from("sales")
        .select("*")
        .order("vendido_em", { ascending: false })
        .limit(500);
      vendas = data || [];
    }

    const contexto = montarContexto(produtos, vendas);

    const openai = getOpenAI();
    const mensagens = [
      {
        role: "system" as const,
        content:
          "Você é o assistente de estoque do Renozinho Muambeiro, um app de gestão de estoque e revenda de peças " +
          "importadas dos EUA (roupas, calçados, acessórios, eletrônicos). Responda em português do Brasil, " +
          "de forma direta e concisa (como um relatório rápido, não um bate-papo longo), usando SOMENTE os " +
          "dados fornecidos abaixo — não invente números. Se a pergunta não puder ser respondida com esses " +
          "dados, diga isso claramente e sugira uma pergunta que você consegue responder.\n\n" +
          "DADOS ATUAIS DO ESTOQUE E VENDAS:\n" +
          contexto,
      },
      ...historico.map((h) => ({ role: h.eu ? ("user" as const) : ("assistant" as const), content: h.texto })),
      { role: "user" as const, content: pergunta },
    ];

    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: mensagens,
      temperature: 0.4,
      max_tokens: 500,
    });

    const resposta = completion.choices[0]?.message?.content?.trim();
    if (!resposta) {
      return NextResponse.json({ error: "A IA não retornou uma resposta" }, { status: 502 });
    }

    return NextResponse.json({ resposta });
  } catch (err) {
    return aiErrorResponse(err);
  }
}

// Summarizes the real inventory + sales data into a compact text block instead
// of dumping raw rows, so the prompt stays small even with a large catalog.
function montarContexto(produtos: Produto[], vendas: VendaRow[]): string {
  const linhas: string[] = [];

  const disponiveis = produtos.filter((p) => p.status !== "vendido");
  const capitalParado = disponiveis.reduce((s, p) => s + p.custo_total * p.qtd, 0);
  const potencialVenda = disponiveis.reduce((s, p) => s + p.preco_venda * p.qtd, 0);
  linhas.push(
    `Estoque: ${disponiveis.length} peças ativas (${disponiveis.reduce((s, p) => s + p.qtd, 0)} unidades), ` +
      `capital investido ${BRL(capitalParado)}, potencial de venda ${BRL(potencialVenda)}.`
  );

  // Por categoria.
  const porCategoria = new Map<string, { qtd: number; custo: number; venda: number; margemSoma: number; n: number }>();
  for (const p of disponiveis) {
    const c = porCategoria.get(p.categoria) || { qtd: 0, custo: 0, venda: 0, margemSoma: 0, n: 0 };
    c.qtd += p.qtd;
    c.custo += p.custo_total * p.qtd;
    c.venda += p.preco_venda * p.qtd;
    c.margemSoma += margem(p);
    c.n += 1;
    porCategoria.set(p.categoria, c);
  }
  linhas.push("Por categoria (estoque atual):");
  for (const [cat, c] of porCategoria) {
    linhas.push(
      `- ${cat}: ${c.qtd} un, custo ${BRL(c.custo)}, venda potencial ${BRL(c.venda)}, margem média ${Math.round(
        (c.margemSoma / c.n) * 100
      )}%`
    );
  }

  // Peças paradas há mais tempo.
  const paradas = disponiveis
    .map((p) => ({ p, dias: diasParado(p.created_at) }))
    .sort((a, b) => b.dias - a.dias)
    .slice(0, 8);
  linhas.push("Peças paradas há mais tempo:");
  for (const { p, dias } of paradas) {
    linhas.push(`- ${p.nome} (${p.marca}): ${dias} dias, ${BRL(p.preco_venda)}, margem ${Math.round(margem(p) * 100)}%`);
  }

  // Vendas reais (tabela sales), se houver.
  if (vendas.length) {
    const receitaTotal = vendas.reduce((s, v) => s + v.preco_final, 0);
    const lucroTotal = vendas.reduce((s, v) => s + v.lucro, 0);
    linhas.push(
      `Vendas registradas: ${vendas.length}, receita total ${BRL(receitaTotal)}, lucro total ${BRL(lucroTotal)}, ` +
        `ticket médio ${BRL(receitaTotal / vendas.length)}.`
    );

    const porCanal = new Map<string, { n: number; receita: number; lucro: number }>();
    for (const v of vendas) {
      const c = porCanal.get(v.canal) || { n: 0, receita: 0, lucro: 0 };
      c.n += 1;
      c.receita += v.preco_final;
      c.lucro += v.lucro;
      porCanal.set(v.canal, c);
    }
    linhas.push("Vendas por canal:");
    for (const [canal, c] of porCanal) {
      linhas.push(`- ${canal}: ${c.n} vendas, receita ${BRL(c.receita)}, lucro ${BRL(c.lucro)}`);
    }

    const porMes = new Map<string, { n: number; receita: number; lucro: number }>();
    for (const v of vendas) {
      const mes = new Date(v.vendido_em).toISOString().slice(0, 7); // YYYY-MM
      const m = porMes.get(mes) || { n: 0, receita: 0, lucro: 0 };
      m.n += 1;
      m.receita += v.preco_final;
      m.lucro += v.lucro;
      porMes.set(mes, m);
    }
    linhas.push("Vendas por mês:");
    for (const [mes, m] of [...porMes.entries()].sort()) {
      linhas.push(`- ${mes}: ${m.n} vendas, receita ${BRL(m.receita)}, lucro ${BRL(m.lucro)}`);
    }
  } else {
    linhas.push(
      "Vendas registradas: nenhuma venda real gravada ainda no banco (tabela sales vazia ou Supabase não configurado)."
    );
  }

  return linhas.join("\n");
}
