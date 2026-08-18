export type StatusPeca = "disponivel" | "reservado" | "em_transito" | "vendido";

// Gênero é um campo próprio, independente da categoria: faixa etária (ex.
// "infantil") é modelada na categoria ("Roupa Infantil"), não aqui.
export type Genero = "Feminino" | "Masculino" | "Ambos" | "Unissex";
export const GENEROS: Genero[] = ["Feminino", "Masculino", "Ambos", "Unissex"];

export interface Variacao {
  label: string;
  sku: string;
  qtd: number;
}

export interface Produto {
  id: number;
  nome: string;
  marca: string;
  categoria: string;
  cor: string;
  cor2: string;
  tamanho: string;
  sistema: string;
  material: string;
  genero: Genero;
  condicao: string;
  custo_usd: number;
  frete_usd: number;
  cotacao: number;
  taxa: number;
  outros_custos: number;
  custo_total: number;
  preco_venda: number;
  qtd: number;
  local: string;
  status: StatusPeca;
  dias_parado?: number;
  created_at: string;
  fornecedor: string;
  lote: string;
  sku: string;
  hue: number;
  descricao: string;
  tags: string[];
  variacoes: Variacao[];
  fotos?: string[];
  arquivado?: boolean;
}

export interface Categoria {
  id?: number;
  nome: string;
  icone: string;
  hue: number;
  subs: string[];
}

export interface Venda {
  id?: number;
  product_id: number;
  preco_final: number;
  canal: string;
  taxa_canal: number;
  custo_total_no_momento: number;
  lucro: number;
  vendido_em: string;
}
