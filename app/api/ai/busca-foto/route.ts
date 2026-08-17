import { NextRequest, NextResponse } from "next/server";
import { getOpenAI, CHAT_MODEL, EMBEDDING_MODEL } from "@/lib/openai";
import { aiErrorResponse } from "@/lib/apiError";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

const MAX_BODY_CHARS = 8_000_000; // ~8MB, one query photo
const MAX_PRODUTOS = 500;

interface ProdutoResumo {
  id: number;
  nome: string;
  marca: string;
  categoria: string;
  cor: string;
  cor2?: string;
  descricao: string;
  tags: string[];
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function produtoTexto(p: ProdutoResumo): string {
  return [p.nome, p.marca, p.categoria, p.cor, p.cor2, p.descricao, (p.tags || []).join(" ")]
    .filter(Boolean)
    .join(" · ");
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_CHARS) {
      return NextResponse.json({ error: "Payload grande demais" }, { status: 413 });
    }
    const body = JSON.parse(raw) as { foto?: string; produtos?: ProdutoResumo[] };
    const foto = body.foto;
    if (!foto || typeof foto !== "string") {
      return NextResponse.json({ error: "Envie a foto (URL ou data URL) em 'foto'" }, { status: 400 });
    }
    const produtos = Array.isArray(body.produtos) ? body.produtos.slice(0, MAX_PRODUTOS) : [];
    if (!produtos.length) {
      return NextResponse.json({ error: "Nenhum produto no estoque para comparar" }, { status: 400 });
    }

    const openai = getOpenAI();

    // 1) Describe the item in the query photo with the vision model.
    const descCompletion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Descreva em uma frase curta e objetiva, em português, o item de revenda (roupa, calçado, " +
                "acessório, eletrônico etc.) que aparece nesta foto: tipo de peça, marca (se visível), cor(es), " +
                "material aparente e qualquer característica notável. Responda só com a frase, sem comentários.",
            },
            { type: "image_url", image_url: { url: foto } },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 200,
    });
    const descricaoFoto = descCompletion.choices[0]?.message?.content?.trim();
    if (!descricaoFoto) {
      return NextResponse.json({ error: "Não foi possível interpretar a foto" }, { status: 502 });
    }

    // 2) Embed the photo description.
    const queryEmbeddingResp = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: descricaoFoto,
    });
    const queryEmbedding = queryEmbeddingResp.data[0].embedding;

    // 3) Get (or lazily compute + cache) each product's text embedding.
    //    Embeddings are cached in `products.embedding` (jsonb float array) so
    //    repeat searches don't re-embed unchanged products. See migration
    //    0002_ai_features.sql. Without Supabase configured, we just compute
    //    them in-memory for this request (no persistence, but still correct).
    const cached = new Map<number, number[]>();
    if (supabase) {
      const ids = produtos.map((p) => p.id);
      const { data } = await supabase
        .from("products")
        .select("id, embedding, embedding_texto")
        .in("id", ids);
      for (const row of data || []) {
        const texto = produtoTexto(produtos.find((p) => p.id === row.id)!);
        if (row.embedding && row.embedding_texto === texto && Array.isArray(row.embedding)) {
          cached.set(row.id, row.embedding as number[]);
        }
      }
    }

    const toEmbed = produtos.filter((p) => !cached.has(p.id));
    if (toEmbed.length) {
      const inputs = toEmbed.map(produtoTexto);
      const resp = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: inputs });
      resp.data.forEach((d, i) => {
        cached.set(toEmbed[i].id, d.embedding);
      });
      if (supabase) {
        await Promise.all(
          toEmbed.map((p, i) =>
            supabase!
              .from("products")
              .update({ embedding: resp.data[i].embedding, embedding_texto: produtoTexto(p) })
              .eq("id", p.id)
          )
        );
      }
    }

    // 4) Rank by cosine similarity, take top 3.
    const ranked = produtos
      .map((p) => ({
        id: p.id,
        score: cosineSimilarity(queryEmbedding, cached.get(p.id) || []),
        p,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const resultados = ranked.map((r) => ({
      id: r.id,
      score: Math.round(Math.max(0, Math.min(1, r.score)) * 100),
      motivo: motivoCompartilhado(descricaoFoto, r.p),
    }));

    return NextResponse.json({ descricao: descricaoFoto, resultados });
  } catch (err) {
    return aiErrorResponse(err);
  }
}

// Derives a short "why it matched" string from attributes shared between the
// photo description and the product record, avoiding an extra model call per
// result.
function motivoCompartilhado(descricaoFoto: string, p: ProdutoResumo): string {
  const descLower = descricaoFoto.toLowerCase();
  const razoes: string[] = [];
  if (p.marca && descLower.includes(p.marca.toLowerCase())) razoes.push(`mesma marca (${p.marca})`);
  if (p.categoria && descLower.includes(p.categoria.toLowerCase().split(" ")[0])) razoes.push(`categoria ${p.categoria}`);
  if (p.cor && descLower.includes(p.cor.toLowerCase())) razoes.push(`cor ${p.cor.toLowerCase()}`);
  for (const tag of p.tags || []) {
    if (tag && descLower.includes(tag.toLowerCase())) razoes.push(tag);
  }
  if (!razoes.length) return "atributos e descrição semanticamente próximos";
  return razoes.slice(0, 3).join(", ");
}
