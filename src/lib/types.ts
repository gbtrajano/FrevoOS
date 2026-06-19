export type StatusAtivo = "ativo" | "inativo";

export type StatusOS =
  | "solicitado"
  | "laboratorio"
  | "pronto"
  | "concluido"
  | "cancelado";

export interface Cliente {
  id: number;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  observacoes: string | null;
  status: StatusAtivo;
  created_at: string;
}

export interface Categoria {
  id: number;
  nome: string;
  created_at: string;
}

export interface Produto {
  id: number;
  nome: string;
  tipo_lente: string | null;
  categoria_id: number | null;
  categorias?: { nome: string } | null;
  preco: number;
  custo: number;
  estoque: number;
  estoque_minimo: number;
  status: StatusAtivo;
  created_at: string;
}

export interface ItemPedido {
  id?: number;
  produto_id: number | null;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
}

export interface Orcamento {
  id: number;
  cliente_id: number | null;
  clientes?: { nome: string } | null;
  data: string;
  aprovado: boolean;
  observacoes: string | null;
  valor_total: number;
  created_at: string;
}

export interface OrdemServico {
  id: number;
  cliente_id: number | null;
  clientes?: { nome: string } | null;
  orcamento_id: number | null;
  data: string;
  status: StatusOS;
  observacoes: string | null;
  valor_total: number;
  created_at: string;
}

export interface ContaPagar {
  id: number;
  descricao: string;
  categoria: string | null;
  fornecedor: string | null;
  valor: number;
  vencimento: string | null;
  pago: boolean;
  data_pagamento: string | null;
  created_at: string;
}

export interface ContaReceber {
  id: number;
  descricao: string;
  cliente_id: number | null;
  clientes?: { nome: string } | null;
  valor: number;
  vencimento: string | null;
  recebido: boolean;
  data_recebimento: string | null;
  created_at: string;
}

export const STATUS_OS_LABELS: Record<StatusOS, string> = {
  solicitado: "Solicitado",
  laboratorio: "Laboratório",
  pronto: "Pronto",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const STATUS_OS_COLORS: Record<StatusOS, string> = {
  solicitado: "#D9A441",
  laboratorio: "#E4B73B",
  pronto: "#2F9E6E",
  concluido: "#2451B3",
  cancelado: "#B3122B",
};
