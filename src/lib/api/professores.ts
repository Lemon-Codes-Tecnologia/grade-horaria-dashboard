import apiClient from "./client";
import type { NivelEnsino } from "./escolas";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type DiaSemana = "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado" | "domingo";
export type Turno = "manha" | "tarde" | "noite";

export interface DisponibilidadeDia {
  manha: boolean;
  tarde: boolean;
  noite: boolean;
}

export interface Disponibilidade {
  segunda?: DisponibilidadeDia;
  terca?: DisponibilidadeDia;
  quarta?: DisponibilidadeDia;
  quinta?: DisponibilidadeDia;
  sexta?: DisponibilidadeDia;
  sabado?: DisponibilidadeDia;
  domingo?: DisponibilidadeDia;
}

export interface Professor {
  _id: string;
  nome: string;
  email: string;
  matricula: string;
  cpf?: string;
  telefone?: string;
  cargaHorariaSemanal?: number;
  nivelEnsino?: NivelEnsino[]; // Níveis de ensino que o professor leciona
  disciplinas?: string[] | any[]; // IDs ou objetos populados
  disponibilidade?: Disponibilidade;
  preferencias?: any;
  restricoes?: any;
  ativo: boolean;
  escola: string | any; // ID ou objeto populado
  escolasAdicionais?: string[] | any[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
  payload?: T;
  errors?: string[];
}

export interface PaginationData {
  docs: Professor[];
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
// PROFESSORES - Gerenciamento de Professores
// ============================================================================

/**
 * GET /api/professores
 * Lista professores com paginação e filtros
 * Requer idEscola
 */
export interface ListProfessoresParams {
  idEscola: string; // Obrigatório
  page?: number;
  limit?: number;
  search?: string;
  ativo?: boolean;
}

export const listProfessores = async (
  params: ListProfessoresParams
): Promise<ApiResponse<PaginationData>> => {
  const response = await apiClient.get<ApiResponse<PaginationData>>(
    "/api/professores",
    { params }
  );
  return response.data;
};

/**
 * POST /api/professores?idEscola=xxx
 * Cria novo professor
 */
export interface CreateProfessorData {
  nome: string;
  email: string;
  matricula: string;
  cpf?: string;
  telefone?: string;
  cargaHorariaSemanal?: number;
  nivelEnsino?: NivelEnsino[]; // Níveis de ensino que o professor leciona
  disciplinas?: string[]; // IDs das disciplinas
  disponibilidade?: Disponibilidade;
}

export const createProfessor = async (
  data: CreateProfessorData,
  idEscola: string
): Promise<ApiResponse<Professor>> => {
  const params = { idEscola };
  const response = await apiClient.post<ApiResponse<Professor>>(
    "/api/professores",
    data,
    { params }
  );
  return response.data;
};

/**
 * GET /api/professores/:id?idEscola=xxx
 * Busca professor por ID
 */
export const getProfessor = async (id: string, idEscola?: string): Promise<ApiResponse<Professor>> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.get<ApiResponse<Professor>>(
    `/api/professores/${id}`,
    { params }
  );
  return response.data;
};

/**
 * PUT /api/professores/:id
 * Atualiza professor
 */
export interface UpdateProfessorData {
  nome?: string;
  email?: string;
  matricula?: string;
  cpf?: string;
  telefone?: string;
  cargaHorariaSemanal?: number;
  nivelEnsino?: NivelEnsino[]; // Níveis de ensino que o professor leciona
  disciplinas?: string[];
}

export const updateProfessor = async (
  id: string,
  data: UpdateProfessorData,
  idEscola?: string
): Promise<ApiResponse<Professor>> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.put<ApiResponse<Professor>>(
    `/api/professores/${id}`,
    data,
    { params }
  );
  return response.data;
};

/**
 * DELETE /api/professores/:id?idEscola=xxx
 * Exclui professor
 */
export const deleteProfessor = async (id: string, idEscola?: string): Promise<ApiResponse<void>> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.delete<ApiResponse<void>>(
    `/api/professores/${id}`,
    { params }
  );
  return response.data;
};

/**
 * PATCH /api/professores/:id/toggle-active?idEscola=xxx
 * Ativa/Desativa professor
 */
export const toggleProfessorActive = async (
  id: string,
  idEscola?: string
): Promise<ApiResponse<Professor>> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.patch<ApiResponse<Professor>>(
    `/api/professores/${id}/toggle-active`,
    undefined,
    { params }
  );
  return response.data;
};

/**
 * PATCH /api/professores/:id/disponibilidade
 * Atualiza disponibilidade do professor
 */
export interface UpdateDisponibilidadeData {
  disponibilidade: Disponibilidade;
}

export const updateDisponibilidade = async (
  id: string,
  data: UpdateDisponibilidadeData,
  idEscola?: string
): Promise<ApiResponse<Professor>> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.patch<ApiResponse<Professor>>(
    `/api/professores/${id}/disponibilidade`,
    data,
    { params }
  );
  return response.data;
};
