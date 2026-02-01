import apiClient from "./client";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type TipoDisciplina = "regular" | "laboratorio" | "educacao_fisica" | "arte";
export type RestricaoPeriodo = "primeiro" | "ultimo";

export interface Disciplina {
  _id: string;
  nome: string;
  codigo: string;
  cargaHoraria?: number;
  cor?: string;
  descricao?: string;
  tipo?: TipoDisciplina;
  requerSequencia?: boolean;
  restricoesPeriodo?: RestricaoPeriodo[];
  salaEspecifica?: string;
  ativa: boolean;
  escola: string | {
    _id: string;
    nome: string;
    tipoEscola: string;
  };
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
  docs: Disciplina[];
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

// ============================================================================
// DISCIPLINAS - Gerenciamento de Disciplinas
// ============================================================================

/**
 * GET /api/disciplinas
 * Lista disciplinas da escola especificada com paginação e filtros
 */
export interface ListDisciplinasParams {
  page?: number;
  limit?: number;
  search?: string;
  ativa?: boolean;
  idEscola?: string;
}

export const listDisciplinas = async (
  params?: ListDisciplinasParams
): Promise<ApiResponse<PaginationData>> => {
  const response = await apiClient.get<ApiResponse<PaginationData>>(
    "/api/disciplinas",
    { params }
  );
  return response.data;
};

/**
 * POST /api/disciplinas?idEscola=xxx
 * Cria nova disciplina atrelada à escola do usuário logado
 */
export interface CreateDisciplinaData {
  nome: string; // 2-100 caracteres
  codigo: string; // 2-20 caracteres, A-Z/0-9
  cargaHoraria?: number; // > 0
  cor?: string; // formato #hex
  descricao?: string; // <= 500 caracteres
  tipo?: TipoDisciplina; // default: 'regular'
  requerSequencia?: boolean;
  restricoesPeriodo?: RestricaoPeriodo[];
  salaEspecifica?: string;
}

export const createDisciplina = async (
  data: CreateDisciplinaData,
  idEscola: string
): Promise<ApiResponse<Disciplina>> => {
  const params = { idEscola };
  const response = await apiClient.post<ApiResponse<Disciplina>>(
    "/api/disciplinas",
    data,
    { params }
  );
  return response.data;
};

/**
 * GET /api/disciplinas/:id?idEscola=xxx
 * Busca disciplina por ID (deve pertencer à mesma escola)
 */
export const getDisciplina = async (id: string, idEscola?: string): Promise<ApiResponse<Disciplina>> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.get<ApiResponse<Disciplina>>(
    `/api/disciplinas/${id}`,
    { params }
  );
  return response.data;
};

/**
 * PUT /api/disciplinas/:id?idEscola=xxx
 * Atualiza disciplina (escola não pode ser trocada)
 */
export interface UpdateDisciplinaData {
  nome?: string;
  codigo?: string;
  cargaHoraria?: number;
  cor?: string;
  descricao?: string;
  tipo?: TipoDisciplina;
  requerSequencia?: boolean;
  restricoesPeriodo?: RestricaoPeriodo[];
  salaEspecifica?: string;
  ativa?: boolean;
}

export const updateDisciplina = async (
  id: string,
  data: UpdateDisciplinaData,
  idEscola?: string
): Promise<ApiResponse<Disciplina>> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.put<ApiResponse<Disciplina>>(
    `/api/disciplinas/${id}`,
    data,
    { params }
  );
  return response.data;
};

/**
 * DELETE /api/disciplinas/:id?idEscola=xxx
 * Remove disciplina da escola do usuário
 */
export const deleteDisciplina = async (id: string, idEscola?: string): Promise<ApiResponse<null>> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.delete<ApiResponse<null>>(
    `/api/disciplinas/${id}`,
    { params }
  );
  return response.data;
};

/**
 * PATCH /api/disciplinas/:id/toggle-active?idEscola=xxx
 * Alterna status ativa/inativa
 */
export const toggleDisciplinaStatus = async (
  id: string,
  idEscola?: string
): Promise<ApiResponse<Disciplina>> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.patch<ApiResponse<Disciplina>>(
    `/api/disciplinas/${id}/toggle-active`,
    undefined,
    { params }
  );
  return response.data;
};
