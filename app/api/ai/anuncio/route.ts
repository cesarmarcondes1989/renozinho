import { NextRequest, NextResponse } from "next/server";
import { getOpenAI, CHAT_MODEL } from "@/lib/openai";
import { aiErrorResponse } from "@/lib/apiError";

export const runtime = "nodejs";

interface AnuncioInput {
  nome: string;
  marca: string;
  categoria: string;
  cor: string;
  tamanho: string;
  condicao: string;
  preco: number;
  descricao: string;
  tags: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<AnuncioInput>;
    const nome = String(body.nome || "").slice(0, 200);
    if (!nome) {
      return NextResponse.json({ error: "Campo 'nome' é obrigatório" }, { status: 400 });
    }

    const input: AnuncioInput = {
      nome,
      marca: String(body.marca || "").slice(0, 100),
      categoria: String(body.categoria || "").slice(0, 100),
      cor: String(body.cor || "").slice(0, 100),
      tamanho: String(body.tamanho || "").slice(0, 50),
      condicao: String(body.condicao || "").slice(0, 100),
      preco: Number(body.preco) || 0,
      descricao: String(body.descricao || "").slice(0, 1000),
      tags: Array.isArray(body.tags) ? body.tags.slice(0, 12).map((t) => String(t).slice(0, 40)) : [],
    };

    const openai = getOpenAI();

    const prompt = `Escreva um anúncio curto e vendedor para Instagram/WhatsApp, em português do Brasil, no
tom de brechó/revenda de importados (direto, animado, com emoji, sem exagero, sem soar robótico).
Use as informações da peça abaixo. Inclua o preço formatado em reais, uma chamada tipo
"chama no direct" ou "chama no zap", e 3 a 5 hashtags relevantes ao final. Não invente
características que não foram informadas. Responda só com o texto do anúncio, sem comentários extras.

Peça:
- Nome: ${input.nome}
- Marca: ${input.marca || "não informada"}
- Categoria: ${input.categoria || "não informada"}
- Cor: ${input.cor || "não informada"}
- Tamanho: ${input.tamanho || "não informado"}
- Condição: ${input.condicao || "não informada"}
- Preço de venda: R$ ${input.preco}
- Descrição: ${input.descricao || "não informada"}
- Tags: ${input.tags.join(", ") || "nenhuma"}`;

    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
      max_tokens: 400,
    });

    const anuncio = completion.choices[0]?.message?.content?.trim();
    if (!anuncio) {
      return NextResponse.json({ error: "A IA não retornou um anúncio" }, { status: 502 });
    }

    return NextResponse.json({ anuncio });
  } catch (err) {
    return aiErrorResponse(err);
  }
}
