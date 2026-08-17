import { NextRequest, NextResponse } from "next/server";
import { getOpenAI, CHAT_MODEL } from "@/lib/openai";
import { aiErrorResponse } from "@/lib/apiError";

export const runtime = "nodejs";

const MAX_PHOTOS = 4;
// Rough cap on total request size (base64 photos can be sent inline as data
// URLs, or as regular https URLs from Supabase Storage — either way we bound
// the payload to avoid abuse).
const MAX_BODY_CHARS = 20_000_000; // ~20MB of JSON text

interface CampoExtraido {
  valor: string;
  confianca: number;
}

interface AnaliseResultado {
  nome: CampoExtraido;
  marca: CampoExtraido;
  categoria: CampoExtraido;
  cor: CampoExtraido;
  cor_secundaria: CampoExtraido;
  tamanho: CampoExtraido;
  material: CampoExtraido;
  genero: CampoExtraido;
  condicao: CampoExtraido;
  caracteristicas: CampoExtraido;
  descricao_anuncio: CampoExtraido;
}

const CAMPOS: (keyof AnaliseResultado)[] = [
  "nome",
  "marca",
  "categoria",
  "cor",
  "cor_secundaria",
  "tamanho",
  "material",
  "genero",
  "condicao",
  "caracteristicas",
  "descricao_anuncio",
];

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_CHARS) {
      return NextResponse.json({ error: "Payload de fotos grande demais" }, { status: 413 });
    }
    const body = JSON.parse(raw) as { fotos?: string[] };
    const fotos = Array.isArray(body.fotos) ? body.fotos.slice(0, MAX_PHOTOS) : [];
    if (!fotos.length) {
      return NextResponse.json({ error: "Envie ao menos uma foto (URL ou data URL)" }, { status: 400 });
    }
    for (const f of fotos) {
      if (typeof f !== "string" || !f.trim()) {
        return NextResponse.json({ error: "Fotos inválidas" }, { status: 400 });
      }
    }

    const openai = getOpenAI();

    const instrucoes = `Você é um especialista em catalogar peças de roupa, calçados, acessórios e outros
itens para revenda (brechó de importados dos EUA vendido no Brasil). Analise as fotos anexadas do MESMO item
e extraia os campos abaixo em JSON. Para cada campo, retorne um objeto com "valor" (string em português,
curta e objetiva; string vazia "" se não for possível determinar) e "confianca" (número de 0 a 1 indicando
o quão certo você está desse valor a partir das fotos — use valores baixos, abaixo de 0.7, quando a foto
não deixa claro o campo, por exemplo tamanho sem etiqueta visível, ou material que não dá para confirmar
visualmente).

Campos: nome (nome de anúncio sugerido), marca, categoria (ex.: Roupa Infantil, Roupa Feminina, Roupa
Masculina, Calçados, Eletrônicos, Acessórios), cor (cor primária), cor_secundaria, tamanho, material,
genero (Infantil/Feminino/Masculino/Unissex), condicao (ex.: Novo com etiqueta, Novo sem etiqueta,
Seminovo, Usado), caracteristicas (detalhes notáveis separados por " · "), descricao_anuncio (2-3 frases
descrevendo a peça para um anúncio de venda).

Responda em JSON com a chave "campos" contendo um objeto com essas 11 chaves, cada uma no formato
{"valor": "...", "confianca": 0.0-1.0}.`;

    const imageContent = fotos.map((url) => ({
      type: "image_url" as const,
      image_url: { url },
    }));

    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [{ type: "text" as const, text: instrucoes }, ...imageContent],
        },
      ],
      temperature: 0.3,
      max_tokens: 900,
    });

    const raw2 = completion.choices[0]?.message?.content;
    if (!raw2) {
      return NextResponse.json({ error: "A IA não retornou uma análise" }, { status: 502 });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(raw2);
    } catch {
      return NextResponse.json({ error: "Resposta da IA em formato inesperado" }, { status: 502 });
    }

    const camposRaw = parsed.campos ?? parsed;
    const resultado: Record<string, CampoExtraido> = {};
    for (const key of CAMPOS) {
      const c = camposRaw?.[key];
      const valor = typeof c?.valor === "string" ? c.valor : "";
      // If the model left the field null/empty and didn't self-report low
      // confidence, we derive a low confidence heuristically so the "campos
      // com baixa confiança em amarelo" UX still triggers correctly.
      let confianca = typeof c?.confianca === "number" ? c.confianca : 0;
      confianca = Math.max(0, Math.min(1, confianca));
      if (!valor) confianca = Math.min(confianca, 0.2);
      resultado[key] = { valor, confianca };
    }

    return NextResponse.json({ campos: resultado });
  } catch (err) {
    return aiErrorResponse(err);
  }
}
