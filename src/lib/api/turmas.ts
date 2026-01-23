import apiClient from "./client";
import type { DiaSemana } from "./escolas";

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

export interface ConfiguracoesTurma {
  quantidadeAulasPorDia?: number;
  maxAulasConsecutivas?: number;
  intervaloObrigatorioAposAulas?: number;
  diasLetivos?: DiaSemana[];
}

export interface Turma {
  _id: string;
  escola: string; // ObjectId da escola
  nome: string;
  codigo: string; // Código único por escola (A-Z/0-9, 2-20 chars)
  serie: string; // 1-50 chars
  ano: number; // 1-12
  turno: Turno;
  capacidadeMaxima: number;
  quantidadeAlunos?: number;
  sala?: string;
  anoLetivo?: number; // 2020-2030
  professorResponsavel?: string; // ObjectId do professor
  diasLetivos?: DiaSemana[];
  alunos?: Array<{
    nomeAluno: string;
    cpfAluno: string;
    emailAluno?: string;
    nomeResponsavel: string;
    cpfResponsavel: string;
    emailResponsavel?: string;
    telefoneResponsavel?: string;
  }>;
  disciplinas?: Array<{
    _id?: string;
    disciplina: string;
    cargaHorariaSemanal: number;
  }>;
  configuracoes?: ConfiguracoesTurma;
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
 * idEscola é obrigatório (query param)
 */
export interface ListTurmasParams {
  idEscola: string; // Obrigatório na query
  page?: number;
  limit?: number;
  search?: string;
  turno?: Turno;
  ano?: number;
  anoLetivo?: number;
  serie?: string;
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
 * POST /api/turmas?idEscola=xxx
 * Cria nova turma na escola do usuário
 * Obrigatórios: nome, codigo (A-Z/0-9, 2-20 chars), ano (1-12), serie, turno, capacidadeMaxima
 */
export interface CreateTurmaData {
  nome: string; // 2-100 chars
  codigo: string; // A-Z/0-9, 2-20 chars (maiúsculo)
  ano: number; // int 1-12 (obrigatório)
  serie: string; // 1-50 chars (obrigatório)
  turno: Turno; // manha | tarde | noite | integral
  capacidadeMaxima: number; // int > 0 (obrigatório)
  quantidadeAlunos?: number; // int >= 0 (opcional)
  sala?: string; // max 50 chars (opcional)
  anoLetivo?: number; // int 2020-2030 (opcional)
  professorResponsavel?: string; // MongoId (opcional)
  diasLetivos?: DiaSemana[];
  alunos?: Array<{
    nomeAluno: string;
    cpfAluno: string; // 11 dígitos
    emailAluno?: string;
    nomeResponsavel: string;
    cpfResponsavel: string; // 11 dígitos
    emailResponsavel?: string;
    telefoneResponsavel?: string; // max 20 chars
  }>;
  disciplinas?: Array<{
    disciplina: string; // MongoId
    cargaHorariaSemanal: number; // int > 0
  }>;
  configuracoes?: ConfiguracoesTurma;
}

export const createTurma = async (
  data: CreateTurmaData,
  idEscola: string
): Promise<ApiResponse<Turma>> => {
  const params = { idEscola };
  const response = await apiClient.post<ApiResponse<Turma>>(
    "/api/turmas",
    data,
    { params }
  );
  return response.data;
};

/**
 * GET /api/turmas/:id
 * Busca turma por ID
 * Para múltiplas escolas: GET /api/turmas/:id?idEscola=ID_ESCOLA
 */
export const getTurma = async (
  id: string,
  idEscola?: string
): Promise<ApiResponse<Turma>> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.get<ApiResponse<Turma>>(
    `/api/turmas/${id}`,
    { params }
  );
  return response.data;
};

/**
 * PUT /api/turmas/:id?idEscola=xxx
 * Atualiza turma
 */
export interface UpdateTurmaData {
  nome?: string; // 2-100 chars
  codigo?: string; // A-Z/0-9, 2-20 chars (maiúsculo)
  ano?: number; // int 1-12
  serie?: string; // 1-50 chars
  turno?: Turno; // manha | tarde | noite | integral
  capacidadeMaxima?: number; // int > 0
  quantidadeAlunos?: number; // int >= 0
  sala?: string; // max 50 chars
  anoLetivo?: number; // int 2020-2030
  professorResponsavel?: string; // MongoId
  diasLetivos?: DiaSemana[];
  alunos?: Array<{
    nomeAluno: string;
    cpfAluno: string; // 11 dígitos
    emailAluno?: string;
    nomeResponsavel: string;
    cpfResponsavel: string; // 11 dígitos
    emailResponsavel?: string;
    telefoneResponsavel?: string; // max 20 chars
  }>;
  disciplinas?: Array<{
    disciplina: string; // MongoId
    cargaHorariaSemanal: number; // int > 0
  }>;
  configuracoes?: ConfiguracoesTurma;
  ativa?: boolean;
}

export const updateTurma = async (
  id: string,
  data: UpdateTurmaData,
  idEscola?: string
): Promise<ApiResponse<Turma>> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.put<ApiResponse<Turma>>(
    `/api/turmas/${id}`,
    data,
    { params }
  );
  return response.data;
};

/**
 * DELETE /api/turmas/:id
 * Remove turma
 * Para múltiplas escolas: DELETE /api/turmas/:id?idEscola=ID_ESCOLA
 */
export const deleteTurma = async (
  id: string,
  idEscola?: string
): Promise<ApiResponse<null>> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.delete<ApiResponse<null>>(
    `/api/turmas/${id}`,
    { params }
  );
  return response.data;
};

/**
 * PATCH /api/turmas/:id/toggle-active
 * Alterna status ativa/inativa
 * Para múltiplas escolas: PATCH /api/turmas/:id/toggle-active?idEscola=ID_ESCOLA
 */
export const toggleTurmaStatus = async (
  id: string,
  idEscola?: string
): Promise<ApiResponse<Turma>> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.patch<ApiResponse<Turma>>(
    `/api/turmas/${id}/toggle-active`,
    {},
    { params }
  );
  return response.data;
};

/**
 * POST /api/turmas/:id/disciplinas
 * Adiciona disciplina à turma
 * Para múltiplas escolas: POST /api/turmas/:id/disciplinas?idEscola=ID_ESCOLA
 */
export interface AddDisciplinaData {
  disciplina: string; // ObjectId da disciplina
  cargaHorariaSemanal: number; // Deve ser > 0
}

export const addDisciplina = async (
  turmaId: string,
  data: AddDisciplinaData,
  idEscola?: string
): Promise<ApiResponse<Turma>> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.post<ApiResponse<Turma>>(
    `/api/turmas/${turmaId}/disciplinas`,
    data,
    { params }
  );
  return response.data;
};

/**
 * DELETE /api/turmas/:id/disciplinas/:disciplinaId
 * Remove disciplina da turma
 * Para múltiplas escolas: DELETE /api/turmas/:id/disciplinas/:disciplinaId?idEscola=ID_ESCOLA
 */
export const removeDisciplina = async (
  turmaId: string,
  disciplinaId: string,
  idEscola?: string
): Promise<ApiResponse<Turma>> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.delete<ApiResponse<Turma>>(
    `/api/turmas/${turmaId}/disciplinas/${disciplinaId}`,
    { params }
  );
  return response.data;
};
