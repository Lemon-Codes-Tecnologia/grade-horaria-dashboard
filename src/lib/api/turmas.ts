import apiClient from "./client";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type Turno = "manha" | "tarde" | "noite" | "integral";
export type Serie =
  | "1ano_infantil" | "2ano_infantil" | "3ano_infantil"
  | "1ano_fundamental" | "2ano_fundamental" | "3ano_fundamental"
  | "4ano_fundamental" | "5ano_fundamental" | "6ano_fundamental"
  | "7ano_fundamental" | "8ano_fundamental" | "9ano_fundamental"
  | "1ano_medio" | "2ano_medio" | "3ano_medio"
  | "eja_fundamental" | "eja_medio";

export interface Disciplina {
  _id?: string; // ID da disciplina na turma
  disciplina: string; // ObjectId da disciplina
  cargaHorariaSemanal: number;
}

export interface Turma {
  _id: string;
  escola: string; // ObjectId da escola
  nome: string;
  codigo: string; // Código único por escola (A-Z/0-9, 2-20 chars)
  serie: Serie;
  ano: number; // 1-12 (obrigatório)
  turno: Turno;
  capacidadeMaxima: number; // Obrigatório
  quantidadeAlunos?: number;
  sala?: string;
  anoLetivo: number; // 2020-2030
  professorResponsavel?: string; // ObjectId do professor
  disciplinas?: Disciplina[];
  ativa: boolean;
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
  docs: Turma[];
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
// TURMAS - Gerenciamento de Turmas
// ============================================================================

/**
 * GET /api/turmas
 * Lista turmas da escola do usuário autenticado
 */
export interface ListTurmasParams {
  idEscola?: string;
  page?: number;
  limit?: number;
  search?: string;
  turno?: Turno;
  ano?: number;
  anoLetivo?: number;
  serie?: Serie;
  ativa?: boolean;
}

export const listTurmas = async (
  params?: ListTurmasParams
): Promise<ApiResponse<PaginationData>> => {
  const response = await apiClient.get<ApiResponse<PaginationData>>(
    "/api/turmas",
    { params }
  );
  return response.data;
};

/**
 * POST /api/turmas
 * Cria nova turma na escola do usuário
 * Obrigatórios: nome, codigo (A-Z/0-9, 2-20 chars), ano (1-12), serie, turno, capacidadeMaxima
 */
export interface CreateTurmaData {
  idEscola: string;
  nome: string;
  codigo: string; // A-Z/0-9, 2-20 chars
  serie: Serie;
  ano: number; // 1-12
  turno: Turno;
  capacidadeMaxima: number;
  quantidadeAlunos?: number;
  sala?: string;
  anoLetivo?: number; // 2020-2030
  professorResponsavel?: string;
  disciplinas?: Disciplina[];
}

export const createTurma = async (
  data: CreateTurmaData
): Promise<ApiResponse<Turma>> => {
  const response = await apiClient.post<ApiResponse<Turma>>(
    "/api/turmas",
    data
  );
  return response.data;
};

/**
 * GET /api/turmas/:id
 * Busca turma por ID
 */
export const getTurma = async (id: string): Promise<ApiResponse<Turma>> => {
  const response = await apiClient.get<ApiResponse<Turma>>(
    `/api/turmas/${id}`
  );
  return response.data;
};

/**
 * PUT /api/turmas/:id
 * Atualiza turma
 */
export interface UpdateTurmaData {
  idEscola?: string;
  nome?: string;
  codigo?: string;
  serie?: Serie;
  ano?: number;
  turno?: Turno;
  capacidadeMaxima?: number;
  sala?: string;
  anoLetivo?: number;
  professorResponsavel?: string;
  disciplinas?: Disciplina[];
  ativa?: boolean;
}

export const updateTurma = async (
  id: string,
  data: UpdateTurmaData
): Promise<ApiResponse<Turma>> => {
  const response = await apiClient.put<ApiResponse<Turma>>(
    `/api/turmas/${id}`,
    data
  );
  return response.data;
};

/**
 * DELETE /api/turmas/:id
 * Remove turma
 */
export const deleteTurma = async (id: string): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete<ApiResponse<null>>(
    `/api/turmas/${id}`
  );
  return response.data;
};

/**
 * PATCH /api/turmas/:id/toggle-active
 * Alterna status ativa/inativa
 */
export const toggleTurmaStatus = async (
  id: string
): Promise<ApiResponse<Turma>> => {
  const response = await apiClient.patch<ApiResponse<Turma>>(
    `/api/turmas/${id}/toggle-active`
  );
  return response.data;
};

/**
 * POST /api/turmas/:id/disciplinas
 * Adiciona disciplina à turma
 */
export interface AddDisciplinaData {
  disciplina: string; // ObjectId da disciplina
  cargaHorariaSemanal: number; // Deve ser > 0
}

export const addDisciplina = async (
  turmaId: string,
  data: AddDisciplinaData
): Promise<ApiResponse<Turma>> => {
  const response = await apiClient.post<ApiResponse<Turma>>(
    `/api/turmas/${turmaId}/disciplinas`,
    data
  );
  return response.data;
};

/**
 * DELETE /api/turmas/:id/disciplinas/:disciplinaId
 * Remove disciplina da turma
 */
export const removeDisciplina = async (
  turmaId: string,
  disciplinaId: string
): Promise<ApiResponse<Turma>> => {
  const response = await apiClient.delete<ApiResponse<Turma>>(
    `/api/turmas/${turmaId}/disciplinas/${disciplinaId}`
  );
  return response.data;
};
