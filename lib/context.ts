import type { Produto, Categoria } from "./types";

export type View =
  | "home"
  | "estoque"
  | "peca"
  | "categorias"
  | "wizard"
  | "venda"
  | "analytics"
  | "buscafoto";

export interface ChatMsg {
  eu: boolean;
  texto: string;
}

export interface AppState {
  view: View;
  selId: number;
  query: string;
  chips: string[];
  sort: string;
  mode: "grid" | "list";
  wz: number;
  fotos: number;
  anuncio: boolean;
  chat: ChatMsg[];
  chatInput: string;
  chatPensando: boolean;
  bfEstado: "camera" | "analisando" | "resultado";
  custoUsd: string;
  cotacao: string;
  freteUsd: string;
  outros: string;
  precoVenda: string;
  vendaPreco: string;
  canal: string;
  saving: boolean;
  savedResumo: string;
}

export const initialState: AppState = {
  view: "home",
  selId: 1,
  query: "",
  chips: [],
  sort: "recente",
  mode: "grid",
  wz: 1,
  fotos: 2,
  anuncio: false,
  chat: [],
  chatInput: "",
  chatPensando: false,
  bfEstado: "camera",
  custoUsd: "10",
  cotacao: "5.42",
  freteUsd: "2",
  outros: "8",
  precoVenda: "100",
  vendaPreco: "100",
  canal: "Instagram",
  saving: false,
  savedResumo: "",
};

export interface Ctx {
  state: AppState;
  setState: (patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => void;
  produtos: Produto[];
  setProdutos: React.Dispatch<React.SetStateAction<Produto[]>>;
  categorias: Categoria[];
  go: (v: View) => void;
  openPeca: (id: number) => void;
  supabaseConfigured: boolean;
}
