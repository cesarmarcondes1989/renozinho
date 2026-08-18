import type { Produto, Categoria } from "./types";

// Data ported 1:1 from the original Claude Design prototype (PRODUTOS/CATEGORIAS).
// `dias` from the prototype is converted into a `created_at` date so that
// "dias parado" can be computed live from the current date, same as a real
// database row would behave.
const TODAY = new Date("2026-08-17T12:00:00Z");
function daysAgo(d: number): string {
  const dt = new Date(TODAY);
  dt.setUTCDate(dt.getUTCDate() - d);
  return dt.toISOString();
}

function mk(o: {
  id: number;
  nome: string;
  marca: string;
  categoria: string;
  cor: string;
  cor2: string;
  tamanho: string;
  sistema: string;
  material: string;
  genero: string;
  condicao: string;
  custoUsd: number;
  freteUsd: number;
  taxa: number;
  precoVenda: number;
  qtd: number;
  local: string;
  status: Produto["status"];
  dias: number;
  fornecedor: string;
  lote: string;
  sku: string;
  hue: number;
  descricao: string;
  tags: string[];
  variacoes: { label: string; sku: string; qtd: number }[];
  cotacao?: number;
}): Produto {
  const cotacao = o.cotacao ?? 5.42;
  const custoTotal = Math.round((o.custoUsd + (o.freteUsd || 0)) * cotacao + (o.taxa || 0));
  return {
    id: o.id,
    nome: o.nome,
    marca: o.marca,
    categoria: o.categoria,
    cor: o.cor,
    cor2: o.cor2,
    tamanho: o.tamanho,
    sistema: o.sistema,
    material: o.material,
    genero: o.genero,
    condicao: o.condicao,
    custo_usd: o.custoUsd,
    frete_usd: o.freteUsd,
    cotacao,
    taxa: o.taxa,
    outros_custos: 0,
    custo_total: custoTotal,
    preco_venda: o.precoVenda,
    qtd: o.qtd,
    local: o.local,
    status: o.status,
    created_at: daysAgo(o.dias),
    fornecedor: o.fornecedor,
    lote: o.lote,
    sku: o.sku,
    hue: o.hue,
    descricao: o.descricao,
    tags: o.tags,
    variacoes: o.variacoes,
  };
}

export const SEED_PRODUTOS: Produto[] = [
  mk({ id: 1, nome: "Camiseta Polo Ralph Lauren infantil", marca: "Ralph Lauren", categoria: "Roupa Infantil", cor: "Azul marinho", cor2: "Branco", tamanho: "12 meses", sistema: "US", material: "Algodão pima", genero: "Infantil", condicao: "Novo com etiqueta", custoUsd: 10, freteUsd: 2, taxa: 8, precoVenda: 100, qtd: 1, local: "Caixa 3", status: "disponivel", dias: 18, fornecedor: "Ralph Lauren Outlet, Orlando", lote: "Viagem Orlando · jul/26", sku: "RL-POLO-12M", hue: 208,
    descricao: "Polo clássica infantil em algodão pima, azul marinho com pônei bordado. Novinha com etiqueta, comprada em outlet nos EUA. Tamanho 12 meses.",
    tags: ["pônei bordado", "outlet", "algodão pima"], variacoes: [{ label: "12 meses · Azul marinho", sku: "RL-POLO-12M", qtd: 1 }] }),
  mk({ id: 2, nome: "Vestido Tommy Hilfiger feminino", marca: "Tommy Hilfiger", categoria: "Roupa Feminina", cor: "Azul listrado", cor2: "Branco", tamanho: "M", sistema: "US", material: "Viscose", genero: "Feminino", condicao: "Novo com etiqueta", custoUsd: 15, freteUsd: 2.5, taxa: 11, precoVenda: 180, qtd: 2, local: "Armário", status: "disponivel", dias: 24, fornecedor: "Tommy Outlet, Miami", lote: "Viagem Orlando · jul/26", sku: "TH-VEST-M", hue: 12,
    descricao: "Vestido midi Tommy Hilfiger em viscose leve, listras azul e branco. Peça original comprada nos EUA, novo com etiqueta. Cai bem em M.",
    tags: ["midi", "listrado", "original"], variacoes: [{ label: "M · Azul listrado", sku: "TH-VEST-M", qtd: 1 }, { label: "G · Azul listrado", sku: "TH-VEST-G", qtd: 1 }] }),
  mk({ id: 3, nome: "Pomada A&D uso infantil 454g", marca: "A&D", categoria: "Pomadas", cor: "—", cor2: "—", tamanho: "454 g", sistema: "US", material: "Lanolina e vaselina", genero: "Unissex", condicao: "Novo", custoUsd: 17, freteUsd: 3, taxa: 12, precoVenda: 200, qtd: 10, local: "Caixa 1", status: "disponivel", dias: 9, fornecedor: "Costco", lote: "Viagem Orlando · jul/26", sku: "AD-454", hue: 46,
    descricao: "Pomada A&D original americana, pote grande de 454g. Proteção para assaduras, a preferida das mães. Lote novo, validade longa.",
    tags: ["importado", "pote grande", "best seller"], variacoes: [{ label: "454 g", sku: "AD-454", qtd: 10 }] }),
  mk({ id: 4, nome: "Tênis Nike Air Force 1 branco", marca: "Nike", categoria: "Calçados", cor: "Branco", cor2: "—", tamanho: "US 9", sistema: "US", material: "Couro", genero: "Masculino", condicao: "Novo com etiqueta", custoUsd: 78, freteUsd: 9, taxa: 52, precoVenda: 849, qtd: 1, local: "Caixa 2", status: "disponivel", dias: 41, fornecedor: "Nike Factory Store", lote: "Viagem Orlando · jul/26", sku: "NK-AF1-9", hue: 190,
    descricao: "Air Force 1 branco na caixa, tamanho US 9. Clássico que não sai de moda, comprado direto na Nike Factory Store.",
    tags: ["na caixa", "clássico"], variacoes: [{ label: "US 9 · Branco", sku: "NK-AF1-9", qtd: 1 }] }),
  mk({ id: 5, nome: "Fone Apple AirPods 4", marca: "Apple", categoria: "Eletrônicos", cor: "Branco", cor2: "—", tamanho: "Único", sistema: "—", material: "Plástico", genero: "Unissex", condicao: "Novo com etiqueta", custoUsd: 119, freteUsd: 6, taxa: 78, precoVenda: 1290, qtd: 2, local: "Com a Ana", status: "reservado", dias: 6, fornecedor: "Best Buy", lote: "Pedido Amazon · ago/26", sku: "AP-AP4", hue: 240,
    descricao: "AirPods 4 selados, comprados na Best Buy. Nota fiscal americana disponível. Entrega imediata.",
    tags: ["selado", "com nota"], variacoes: [{ label: "Único", sku: "AP-AP4", qtd: 2 }] }),
  mk({ id: 6, nome: "Conjunto Carter's body 5 peças", marca: "Carter's", categoria: "Roupa Infantil", cor: "Rosa", cor2: "Cinza", tamanho: "6 meses", sistema: "US", material: "Algodão", genero: "Infantil", condicao: "Novo com etiqueta", custoUsd: 22, freteUsd: 3, taxa: 16, precoVenda: 230, qtd: 3, local: "Caixa 3", status: "disponivel", dias: 12, fornecedor: "Carter's Outlet", lote: "Viagem Orlando · jul/26", sku: "CT-BODY-6M", hue: 330,
    descricao: "Kit com 5 bodies Carter's em algodão, estampas mescladas rosa e cinza. Tamanho 6 meses, todos novos com etiqueta.",
    tags: ["kit 5 peças", "enxoval"], variacoes: [{ label: "6 meses · Rosa", sku: "CT-BODY-6M", qtd: 2 }, { label: "9 meses · Rosa", sku: "CT-BODY-9M", qtd: 1 }] }),
  mk({ id: 7, nome: "Bolsa Michael Kors couro caramelo", marca: "Michael Kors", categoria: "Acessórios", cor: "Caramelo", cor2: "Dourado", tamanho: "Único", sistema: "—", material: "Couro saffiano", genero: "Feminino", condicao: "Novo sem etiqueta", custoUsd: 96, freteUsd: 8, taxa: 64, precoVenda: 990, qtd: 1, local: "Armário", status: "disponivel", dias: 96, fornecedor: "MK Outlet", lote: "Viagem Miami · mai/26", sku: "MK-TOTE", hue: 24,
    descricao: "Bolsa tote Michael Kors em couro saffiano caramelo com ferragens douradas. Sem etiqueta, nunca usada.",
    tags: ["couro", "saffiano", "tote"], variacoes: [{ label: "Único · Caramelo", sku: "MK-TOTE", qtd: 1 }] }),
  mk({ id: 8, nome: "Perfume Victoria's Secret Bombshell", marca: "Victoria's Secret", categoria: "Acessórios", cor: "—", cor2: "—", tamanho: "100 ml", sistema: "—", material: "—", genero: "Feminino", condicao: "Novo com etiqueta", custoUsd: 38, freteUsd: 4, taxa: 26, precoVenda: 420, qtd: 4, local: "Caixa 1", status: "disponivel", dias: 15, fornecedor: "Victoria's Secret", lote: "Pedido Amazon · ago/26", sku: "VS-BOMB-100", hue: 0,
    descricao: "Bombshell 100ml lacrado, o perfume mais vendido da Victoria's Secret. Comprado em loja física nos EUA.",
    tags: ["lacrado", "100ml"], variacoes: [{ label: "100 ml", sku: "VS-BOMB-100", qtd: 4 }] }),
  mk({ id: 9, nome: "Moletom Champion Reverse Weave", marca: "Champion", categoria: "Roupa Masculina", cor: "Cinza mescla", cor2: "—", tamanho: "L", sistema: "US", material: "Moletom flanelado", genero: "Masculino", condicao: "Seminovo", custoUsd: 34, freteUsd: 5, taxa: 23, precoVenda: 390, qtd: 1, local: "Caixa 2", status: "disponivel", dias: 118, fornecedor: "Thrift store, Atlanta", lote: "Viagem Miami · mai/26", sku: "CH-RW-L", hue: 96,
    descricao: "Moletom Champion Reverse Weave cinza mescla, tamanho L. Seminovo, sem furos nem manchas, etiqueta antiga.",
    tags: ["vintage", "reverse weave"], variacoes: [{ label: "L · Cinza mescla", sku: "CH-RW-L", qtd: 1 }] }),
  mk({ id: 10, nome: "Óculos Ray-Ban Aviator clássico", marca: "Ray-Ban", categoria: "Acessórios", cor: "Dourado", cor2: "Verde G15", tamanho: "58 mm", sistema: "—", material: "Metal", genero: "Unissex", condicao: "Novo com etiqueta", custoUsd: 88, freteUsd: 5, taxa: 58, precoVenda: 920, qtd: 1, local: "Armário", status: "em_transito", dias: 3, fornecedor: "Sunglass Hut", lote: "Pedido Amazon · ago/26", sku: "RB-AVI-58", hue: 60,
    descricao: "Ray-Ban Aviator dourado com lente verde G15, 58mm. Na caixa com case e flanela, comprado na Sunglass Hut.",
    tags: ["na caixa", "G15"], variacoes: [{ label: "58 mm · Dourado", sku: "RB-AVI-58", qtd: 1 }] }),
  mk({ id: 11, nome: "Legging Nike Pro feminina", marca: "Nike", categoria: "Roupa Feminina", cor: "Preto", cor2: "—", tamanho: "P", sistema: "BR", material: "Dri-FIT", genero: "Feminino", condicao: "Novo com etiqueta", custoUsd: 26, freteUsd: 3, taxa: 18, precoVenda: 249, qtd: 2, local: "Caixa 3", status: "disponivel", dias: 31, fornecedor: "Nike Factory Store", lote: "Viagem Orlando · jul/26", sku: "NK-PRO-P", hue: 268,
    descricao: "Legging Nike Pro preta em tecido Dri-FIT, cintura alta. Tamanho P, nova com etiqueta.",
    tags: ["dri-fit", "cintura alta"], variacoes: [{ label: "P · Preto", sku: "NK-PRO-P", qtd: 1 }, { label: "M · Preto", sku: "NK-PRO-M", qtd: 1 }] }),
  mk({ id: 12, nome: "Vitamina Centrum Adults 425 cápsulas", marca: "Centrum", categoria: "Pomadas", cor: "—", cor2: "—", tamanho: "425 un", sistema: "—", material: "—", genero: "Unissex", condicao: "Novo", custoUsd: 29, freteUsd: 6, taxa: 20, precoVenda: 340, qtd: 6, local: "Caixa 1", status: "disponivel", dias: 22, fornecedor: "Costco", lote: "Viagem Orlando · jul/26", sku: "CTR-425", hue: 150,
    descricao: "Centrum Adults pote gigante de 425 cápsulas, lacrado. Validade 2028, comprado no Costco.",
    tags: ["pote gigante", "lacrado"], variacoes: [{ label: "425 un", sku: "CTR-425", qtd: 6 }] }),
];

export const SEED_CATEGORIAS: Categoria[] = [
  { nome: "Roupa Infantil", icone: "☻", hue: 330, subs: ["Bodies", "Conjuntos", "Polos"] },
  { nome: "Roupa Feminina", icone: "✿", hue: 12, subs: ["Vestidos", "Leggings"] },
  { nome: "Roupa Masculina", icone: "▲", hue: 96, subs: ["Moletons", "Camisetas"] },
  { nome: "Calçados", icone: "▮", hue: 190, subs: ["Tênis", "Sandálias"] },
  { nome: "Eletrônicos", icone: "◈", hue: 240, subs: [] },
  { nome: "Acessórios", icone: "◇", hue: 24, subs: ["Bolsas", "Óculos", "Perfumes"] },
  { nome: "Pomadas", icone: "●", hue: 46, subs: ["Assadura", "Vitaminas"] },
];

// `group` puts mutually-exclusive chips (e.g. two different categories) in the
// same bucket: chips in the same group combine with OR, different groups combine
// with AND. Chips with no group are treated as their own single-chip group.
export const CHIPS = [
  { id: "disp", label: "Disponível", group: "status", test: (p: Produto) => p.status === "disponivel" },
  { id: "inf", label: "Infantil", group: "categoria", test: (p: Produto) => p.categoria === "Roupa Infantil" },
  { id: "fem", label: "Feminina", group: "categoria", test: (p: Produto) => p.categoria === "Roupa Feminina" },
  { id: "pom", label: "Pomadas", group: "categoria", test: (p: Produto) => p.categoria === "Pomadas" },
  { id: "nike", label: "Nike", group: "marca", test: (p: Produto) => p.marca === "Nike" },
  { id: "ncet", label: "Novo c/ etiqueta", group: "condicao", test: (p: Produto) => p.condicao === "Novo com etiqueta" },
  { id: "caro", label: "Acima de R$ 500", group: "preco", test: (p: Produto) => p.preco_venda > 500 },
  { id: "cx3", label: "Caixa 3", group: "local", test: (p: Produto) => p.local === "Caixa 3" },
];

export const CANAIS = [
  { label: "Instagram", taxa: 0 },
  { label: "WhatsApp", taxa: 0 },
  { label: "Shopee", taxa: 0.14 },
  { label: "Mercado Livre", taxa: 0.16 },
  { label: "Presencial", taxa: 0 },
];

export const STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  disponivel: { label: "Disponível", bg: "rgba(198,255,79,.14)", fg: "#C6FF4F" },
  reservado: { label: "Reservado", bg: "rgba(245,197,24,.14)", fg: "#F5C518" },
  em_transito: { label: "Em trânsito", bg: "rgba(122,170,255,.14)", fg: "#8FB6FF" },
  vendido: { label: "Vendido", bg: "rgba(255,255,255,.1)", fg: "#9AA096" },
};

// Demo Q&A for the "Perguntar ao estoque" mocked chat feature (Analytics).
export const CHAT_QA = [
  { p: "Qual categoria vende mais?", r: "Pomadas, com 21 unidades vendidas nos últimos 6 meses. Mas quem traz mais lucro por venda é Acessórios: R$ 220 de lucro médio contra R$ 90 de Pomadas.\n\nSe o critério é volume, aposte em Pomadas. Se é retorno por peça, Acessórios." },
  { p: "O que está parado há mais tempo?", r: "Três peças passaram de 90 dias:\n\n1. Moletom Champion Reverse Weave — 118 dias, R$ 390\n2. Bolsa Michael Kors caramelo — 96 dias, R$ 990\n3. Tênis Nike Air Force 1 — 41 dias, R$ 849\n\nJuntas são R$ 1.010 de capital parado. O moletom é seminovo e tem a menor margem do grupo: seria o primeiro a promover." },
  { p: "Qual meu lucro real no mês?", r: "Em agosto: R$ 2.870 de lucro realizado em 7 vendas, já descontando taxas de canal e custo total das peças.\n\nTicket médio de R$ 512, margem média de 34%. Melhor mês do semestre depois de junho (AirPods puxaram a receita)." },
  { p: "Quanto tenho investido em estoque?", r: "R$ 4.986 em custo total das 44 unidades disponíveis, com potencial de venda de R$ 12.958.\n\nA maior concentração está em Pomadas (10 unidades da A&D) e em Acessórios, que sozinha responde por 31% do capital parado." },
  { p: "Qual canal me dá mais retorno?", r: "Instagram: 44% da receita e taxa zero, então o lucro fica inteiro com você.\n\nShopee e Mercado Livre juntos são 25% da receita, mas as taxas de 14% e 16% comem R$ 830 do período. Vale usá-los só para peças com margem acima de 50%." },
  { p: "Que peça devo comprar mais na próxima viagem?", r: "Pomada A&D e Centrum. As duas giram em menos de 15 dias, não têm risco de tamanho errado e a margem passa de 60%.\n\nEvite ampliar Roupa Masculina: 74 dias de giro médio e o menor lucro por peça do estoque." },
];

export const REVISAO_MOCK = [
  { label: "Nome", valor: "Camiseta Polo Ralph Lauren infantil azul marinho", conf: 0.94 },
  { label: "Marca", valor: "Ralph Lauren", conf: 0.98 },
  { label: "Categoria", valor: "Roupa Infantil", conf: 0.91 },
  { label: "Cor", valor: "Azul marinho · secundária branco", conf: 0.89 },
  { label: "Tamanho", valor: "12 meses (US)", conf: 0.62 },
  { label: "Material", valor: "Algodão pima", conf: 0.55 },
  { label: "Gênero", valor: "Infantil", conf: 0.96 },
  { label: "Condição", valor: "Novo com etiqueta", conf: 0.88 },
  { label: "Características", valor: "pônei bordado · gola canelada · etiqueta original", conf: 0.84 },
  { label: "SKU original (código de barras)", valor: "0 3615 41398 2", conf: 0.79 },
  { label: "Descrição para anúncio", valor: "Polo clássica infantil em algodão pima, azul marinho com pônei bordado. Novinha com etiqueta, comprada em outlet nos EUA. Tamanho 12 meses.", conf: 0.92 },
];

export const VENDAS_MES = [
  { cat: "Pomadas", mes: "mar", n: 9, receita: 1800, lucro: 820 },
  { cat: "Roupa Infantil", mes: "abr", n: 7, receita: 1420, lucro: 610 },
  { cat: "Acessórios", mes: "mai", n: 4, receita: 2380, lucro: 900 },
  { cat: "Eletrônicos", mes: "jun", n: 3, receita: 3480, lucro: 1010 },
  { cat: "Roupa Feminina", mes: "jul", n: 6, receita: 1180, lucro: 520 },
  { cat: "Calçados", mes: "ago", n: 2, receita: 1590, lucro: 430 },
];

export const CAT_PERF = [
  { cat: "Pomadas", vendidas: 21, receita: 4120, lucro: 1880, giro: 11 },
  { cat: "Roupa Infantil", vendidas: 18, receita: 3640, lucro: 1490, giro: 16 },
  { cat: "Acessórios", vendidas: 9, receita: 5210, lucro: 1980, giro: 38 },
  { cat: "Eletrônicos", vendidas: 6, receita: 6740, lucro: 1720, giro: 8 },
  { cat: "Roupa Feminina", vendidas: 14, receita: 2380, lucro: 960, giro: 29 },
  { cat: "Calçados", vendidas: 5, receita: 3980, lucro: 1040, giro: 52 },
  { cat: "Roupa Masculina", vendidas: 3, receita: 1120, lucro: 310, giro: 74 },
];

export const CANAL_PERF = [
  { canal: "Instagram", pct: 44, receita: 9840 },
  { canal: "WhatsApp", pct: 26, receita: 5820 },
  { canal: "Shopee", pct: 16, receita: 3580 },
  { canal: "Mercado Livre", pct: 9, receita: 2010 },
  { canal: "Presencial", pct: 5, receita: 1120 },
];

export const SIMILARES_MOCK = [
  { id: 1, score: 94, motivo: "mesma marca, mesma categoria, cor azul marinho" },
  { id: 6, score: 78, motivo: "roupa infantil, algodão, faixa de preço próxima" },
  { id: 2, score: 61, motivo: "listrado azul e branco, marca americana" },
];
