import apiClient from "./client";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type TipoEscola = "publica" | "privada" | "tecnica" | "superior";
export type NivelEnsino = "infantil" | "fundamental1" | "fundamental2" | "medio" | "eja" | "superior";
export type DiaSemana = "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado" | "domingo";
export type Turno = "manha" | "tarde" | "noite";

export interface Endereco {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade: string;
  uf: string;
  cep?: string;
}

export interface Contato {
  telefone?: string;
  celular?: string;
  email?: string;
  site?: string;
}

export interface Limites {
  maxAlunos?: number;
  maxProfessores?: number;
  maxTurmas?: number;
}

export interface Configuracoes {
  diasLetivos?: DiaSemana[];
  turnosDisponiveis?: Turno[];
}

export interface Escola {
  _id: string;
  nome: string;
  tipoEscola: TipoEscola;
  nivelEnsino?: NivelEnsino[];
  inep?: string; // 8 dígitos
  cnpj?: string; // 14 dígitos
  endereco: Endereco;
  contato?: Contato;
  limites?: Limites;
  configuracoes?: Configuracoes;
  ativa: boolean;
  codigoFilial?: string; // Só para filiais
  escolaMatriz?: string; // ID da matriz (se for filial)
  filiais?: string[] | Escola[]; // IDs ou objetos das filiais (se for matriz)
  diasLetivos?: DiaSemana[];
  turnosDisponiveis?: Turno[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  payload?: T;
  data?: T;
  errors?: string[];
}

export interface PaginationData {
  docs: Escola[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: number | null;
  prevPage: number | null;
  pagingCounter: number;
}

export interface ListEscolasResponse {
  escolas: Escola[];
  pagination: PaginationData;
}

// ============================================================================
// ESCOLAS - Gerenciamento de Escolas
// ============================================================================

/**
 * GET /api/escolas
 * Lista escolas com paginação e filtros
 * Admin/suporte: visualizam toda a rede
 * Outros perfis: recebem apenas a escola vinculada
 */
export interface ListEscolasParams {
  page?: number;
  limit?: number;
  search?: string;
  tipoEscola?: TipoEscola;
  ativa?: boolean;
}

export const listEscolas = async (
  params?: ListEscolasParams
): Promise<ApiResponse<PaginationData>> => {
  const response = await apiClient.get<ApiResponse<PaginationData>>(
    "/api/escolas",
    { params }
  );
  return response.data;
};

/**
 * POST /api/escolas
 * Cria nova escola (requer admin/suporte)
 */
export interface CreateEscolaData {
  nome: string;
  tipoEscola: TipoEscola;
  endereco: {
    cidade: string;
    uf: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cep?: string;
  };
  nivelEnsino?: NivelEnsino[];
  diasLetivos?: DiaSemana[];
  turnosDisponiveis?: Turno[];
  inep?: string; // 8 dígitos
  cnpj?: string; // 14 dígitos
  contato?: Contato;
  limites?: Limites;
}

export const createEscola = async (
  data: CreateEscolaData
): Promise<ApiResponse<Escola>> => {
  const response = await apiClient.post<ApiResponse<Escola>>(
    "/api/escolas",
    data
  );
  return response.data;
};

/**
 * GET /api/escolas/:id
 * Busca escola por ID
 * Admin/suporte: pode acessar qualquer escola
 * Diretor/coordenador/secretário: apenas escola vinculada
 */
export const getEscola = async (id: string): Promise<ApiResponse<Escola>> => {
  const response = await apiClient.get<ApiResponse<Escola>>(
    `/api/escolas/${id}`
  );
  return response.data;
};

/**
 * PUT /api/escolas/:id
 * Atualiza escola (requer admin/suporte)
 */
export interface UpdateEscolaData {
  nome?: string;
  tipoEscola?: TipoEscola;
  nivelEnsino?: NivelEnsino[];
  diasLetivos?: DiaSemana[];
  turnosDisponiveis?: Turno[];
  inep?: string;
  cnpj?: string;
  endereco?: Partial<Endereco>;
  contato?: Contato;
  limites?: Limites;
  ativa?: boolean;
}

export const updateEscola = async (
  id: string,
  data: UpdateEscolaData
): Promise<ApiResponse<Escola>> => {
  const response = await apiClient.put<ApiResponse<Escola>>(
    `/api/escolas/${id}`,
    data
  );
  return response.data;
};

/**
 * DELETE /api/escolas/:id
 * Remove escola (requer admin/suporte, falha se houver usuários)
 */
export const deleteEscola = async (id: string): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete<ApiResponse<null>>(
    `/api/escolas/${id}`
  );
  return response.data;
};

/**
 * PATCH /api/escolas/:id/toggle-active
 * Alterna status ativa/inativa (requer admin/suporte)
 */
export const toggleEscolaStatus = async (
  id: string
): Promise<ApiResponse<Escola>> => {
  const response = await apiClient.patch<ApiResponse<Escola>>(
    `/api/escolas/${id}/toggle-active`
  );
  return response.data;
};

// ============================================================================
// FILIAIS - Gerenciamento de Filiais
// ============================================================================

/**
 * GET /api/escolas/:id/filiais
 * Lista filiais da escola informada (requer vínculo com a escola)
 */
export interface ListFiliaisParams {
  page?: number;
}

export const listFiliais = async (
  escolaId: string,
  params?: ListFiliaisParams
): Promise<ApiResponse<Escola[]>> => {
  const response = await apiClient.get<ApiResponse<Escola[]>>(
    `/api/escolas/${escolaId}/filiais`,
    { params }
  );
  return response.data;
};

/**
 * POST /api/escolas/:id/filiais
 * Cria filial para a escola informada (somente matrizes)
 */
export interface CreateFilialData {
  nome: string;
  codigoFilial: string; // 1-10 caracteres, letras maiúsculas/números
  endereco: {
    cidade: string;
    uf: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cep?: string;
  };
  inep?: string; // 8 dígitos
  cnpj?: string; // 14 dígitos
  contato?: Contato;
}

export const createFilial = async (
  escolaId: string,
  data: CreateFilialData
): Promise<ApiResponse<Escola>> => {
  const response = await apiClient.post<ApiResponse<Escola>>(
    `/api/escolas/${escolaId}/filiais`,
    data
  );
  return response.data;
};

/**
 * PUT /api/escolas/:id/filiais/:filialId
 * Atualiza filial vinculada à escola informada
 */
export interface UpdateFilialData {
  nome?: string;
  codigoFilial?: string;
  endereco?: Partial<Endereco>;
  inep?: string;
  cnpj?: string;
  contato?: Contato;
}

export const updateFilial = async (
  escolaId: string,
  filialId: string,
  data: UpdateFilialData
): Promise<ApiResponse<Escola>> => {
  const response = await apiClient.put<ApiResponse<Escola>>(
    `/api/escolas/${escolaId}/filiais/${filialId}`,
    data
  );
  return response.data;
};

/**
 * DELETE /api/escolas/:id/filiais/:filialId
 * Remove filial vinculada à escola informada
 */
export const deleteFilial = async (
  escolaId: string,
  filialId: string
): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete<ApiResponse<null>>(
    `/api/escolas/${escolaId}/filiais/${filialId}`
  );
  return response.data;
};

/**
 * GET /api/escolas/:id/rede
 * Retorna hierarquia completa (matriz + filiais) da escola informada
 */
export const getRedeEscola = async (escolaId: string): Promise<ApiResponse<Escola>> => {
  const response = await apiClient.get<ApiResponse<Escola>>(
    `/api/escolas/${escolaId}/rede`
  );
  return response.data;
};
