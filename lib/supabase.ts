import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";

// Criar o cliente do Supabase para o navegador
export const supabase = createBrowserSupabaseClient();

export type UserRole = "master" | "funcionario";

export interface UserProfile {
  id: string;
  email: string;
  nome: string;
  role: UserRole;
  meta_operacoes?: number;
  avatar_url?: string;
  created_at: string;
}

export interface Parceiro {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  documento: string; // CPF ou CNPJ
  tipo_documento: "cpf" | "cnpj";
  observacoes?: string;
  created_by: string;
  created_at: string;
}

export interface Socio {
  id: string;
  operacao_id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  estado_civil: string;
  percentual_participacao: number;
}

export type EstadoCivil = "solteiro" | "casado" | "divorciado" | "viuvo";

export type StatusOperacao =
  | "pre_analise"
  | "analise"
  | "analise_credito"
  | "analise_juridica_laudo"
  | "comite"
  | "credito_aprovado"
  | "contrato_assinado"
  | "contrato_registrado"
  | "recusada";

export type TipoImovel =
  | "casa_rua"
  | "casa_condominio"
  | "terreno_condominio"
  | "comercial"
  | "chacara"
  | "apartamento"
  | "imovel_rural_produtivo"
  | "imovel_nao_averbado"
  | "imovel_misto"
  | "multi_familiar";

export interface Documento {
  id: string;
  operacao_id: string;
  nome: string;
  tipo: string;
  url: string;
  created_at: string;
}

export interface ImagemImovel {
  id: string;
  operacao_id: string;
  url: string;
  is_capa: boolean;
  created_at: string;
}

export interface Operacao {
  id: string;
  created_by: string;
  created_at: string;
  status: StatusOperacao;
  estado_civil: EstadoCivil;
  cnpj_empresa: string;
  faturamento: number;
  periodo_faturamento: "mensal" | "anual";
  quantidade_funcionarios: number;
  possui_dividas: boolean;
  valor_dividas?: number;
  instituicao_financeira?: string;
  dividas_processos?: string;
  imovel_alugado: boolean;
  valor_aluguel?: number;
  tipos_imovel: TipoImovel[];
  imagens?: ImagemImovel[];
  documentos?: Documento[];
  socios: Socio[];
}

export const formatarStatus = (status: StatusOperacao): string => {
  switch (status) {
    case "pre_analise":
      return "Pré-análise";
    case "analise":
      return "Análise";
    case "analise_credito":
      return "Análise de Crédito";
    case "analise_juridica_laudo":
      return "Análise Jurídica e Laudo de Engenharia";
    case "comite":
      return "Comitê";
    case "credito_aprovado":
      return "Crédito Aprovado";
    case "contrato_assinado":
      return "Contrato Assinado";
    case "contrato_registrado":
      return "Contrato Registrado";
    case "recusada":
      return "Recusada";
    default:
      return status;
  }
};

export const getStatusColor = (status: StatusOperacao): string => {
  switch (status) {
    case "pre_analise":
      return "bg-purple-100 text-purple-800";
    case "analise":
      return "bg-blue-100 text-blue-800";
    case "analise_credito":
      return "bg-cyan-100 text-cyan-800";
    case "analise_juridica_laudo":
      return "bg-indigo-100 text-indigo-800";
    case "comite":
      return "bg-yellow-100 text-yellow-800";
    case "credito_aprovado":
      return "bg-green-100 text-green-800";
    case "contrato_assinado":
      return "bg-emerald-100 text-emerald-800";
    case "contrato_registrado":
      return "bg-teal-100 text-teal-800";
    case "recusada":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
