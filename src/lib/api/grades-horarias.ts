import apiClient from "./client";
import type { DiaSemana, Turno } from "./escolas";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type StatusGrade = "rascunho" | "ativa" | "arquivada";
export type NivelOtimizacao = "basico" | "medio" | "alto";
export type Semestre = 1 | 2;

export interface HorarioTurno {
  inicio: string; // HH:MM
  fim: string; // HH:MM
  duracaoAula: number;
  intervalo: number;
}

export interface Algoritmo {
  priorizarSemJanelas?: boolean;
  permitirAulasDuplas?: boolean;
  maxTentativas?: number;
  timeoutSegundos?: number;
  nivelOtimizacao?: NivelOtimizacao;
  permitirPequenasViolacoes?: boolean;
}

export interface Configuracoes {
  horariosDisponiveis?: {
    manha?: HorarioTurno;
    tarde?: HorarioTurno;
    noite?: HorarioTurno;
  };
  diasLetivos?: DiaSemana[];
  algoritmo?: Algoritmo;
}

export interface Horario {
  _id: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFim: string;
  disciplina?: {
    _id: string;
    nome: string;
    codigo: string;
    cor?: string;
    cargaHoraria?: number;
  } | string;
  professor?: {
    _id: string;
    nome: string;
    matricula: string;
    email?: string;
  } | string;
  turma?: string | any;
  sala?: string;
}

export interface GradeHoraria {
  _id: string;
  nome: string;
  descricao?: string;
  turma: {
    _id: string;
    nome: string;
    codigo: string;
    serie: string;
    turno: Turno;
    quantidadeAlunos?: number;
  } | string;
  anoLetivo: number;
  semestre: Semestre;
  status: StatusGrade;
  horarios: Horario[];
  configuracoes?: Configuracoes;
  validada: boolean;
  validadoEm?: string;
  validadoPor?: {
    _id: string;
    nome: string;
    email: string;
  } | string;
  escola: {
    _id: string;
    nome: string;
  } | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Estatisticas {
  totalAulas?: number;
  aulasAlocadas?: number;
  professoresUtilizados?: number;
  disciplinasConcluidas?: number;
  cargaHorariaTotal?: number;
  cargaHorariaCoberta?: number;
}

export interface Conflito {
  tipo: string;
  mensagem: string;
  detalhes?: any;
}

export interface Sugestao {
  tipo: string;
  mensagem: string;
  acao?: string;
}

export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
  payload?: T;
  errors?: string[];
  estatisticas?: Estatisticas;
  conflitos?: Conflito[];
  sugestoes?: Sugestao[];
}

export interface PaginationData {
  docs: GradeHoraria[];
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
// GRADES HORÁRIAS - Gerenciamento de Grades Horárias
// ============================================================================

/**
 * GET /api/grades-horarias
 * Lista grades horárias com paginação e filtros
 */
export interface ListGradesHorariasParams {
  idEscola: string; // Obrigatório
  page?: number;
  limit?: number;
  search?: string;
  status?: StatusGrade;
  turma?: string; // ID da turma
  anoLetivo?: number;
}

export const listGradesHorarias = async (
  params: ListGradesHorariasParams
): Promise<ApiResponse<PaginationData>> => {
  const response = await apiClient.get<ApiResponse<PaginationData>>(
    "/api/grades-horarias",
    { params }
  );
  return response.data;
};

/**
 * GET /api/grades-horarias/:id
 * Busca grade horária por ID
 */
export const getGradeHoraria = async (
  id: string
): Promise<ApiResponse<GradeHoraria>> => {
  const response = await apiClient.get<ApiResponse<GradeHoraria>>(
    `/api/grades-horarias/${id}`
  );
  return response.data;
};

/**
 * POST /api/grades-horarias
 * Cria nova grade horária e tenta gerar automaticamente
 */
export interface CreateGradeHorariaData {
  idEscola: string;
  nome: string;
  turma: string; // ID da turma
  descricao?: string;
  anoLetivo?: number;
  semestre?: Semestre;
  configuracoes?: Configuracoes;
}

export const createGradeHoraria = async (
  data: CreateGradeHorariaData
): Promise<ApiResponse<GradeHoraria>> => {
  const response = await apiClient.post<ApiResponse<GradeHoraria>>(
    "/api/grades-horarias",
    data
  );
  return response.data;
};

/**
 * PUT /api/grades-horarias/:id
 * Atualiza grade horária
 */
export interface UpdateGradeHorariaData {
  nome?: string;
  descricao?: string;
  anoLetivo?: number;
  semestre?: Semestre;
  configuracoes?: Configuracoes;
}

export const updateGradeHoraria = async (
  id: string,
  data: UpdateGradeHorariaData
): Promise<ApiResponse<GradeHoraria>> => {
  const response = await apiClient.put<ApiResponse<GradeHoraria>>(
    `/api/grades-horarias/${id}`,
    data
  );
  return response.data;
};

/**
 * DELETE /api/grades-horarias/:id
 * Remove grade horária
 */
export const deleteGradeHoraria = async (
  id: string
): Promise<ApiResponse<void>> => {
  const response = await apiClient.delete<ApiResponse<void>>(
    `/api/grades-horarias/${id}`
  );
  return response.data;
};

/**
 * PATCH /api/grades-horarias/:id/validar
 * Valida a grade horária
 */
export const validarGradeHoraria = async (
  id: string
): Promise<ApiResponse<GradeHoraria>> => {
  const response = await apiClient.patch<ApiResponse<GradeHoraria>>(
    `/api/grades-horarias/${id}/validar`
  );
  return response.data;
};

/**
 * POST /api/grades-horarias/:id/horarios
 * Adiciona horário à grade
 */
export interface AddHorarioData {
  horarioId: string;
}

export const addHorarioToGrade = async (
  id: string,
  data: AddHorarioData
): Promise<ApiResponse<GradeHoraria>> => {
  const response = await apiClient.post<ApiResponse<GradeHoraria>>(
    `/api/grades-horarias/${id}/horarios`,
    data
  );
  return response.data;
};

/**
 * DELETE /api/grades-horarias/:id/horarios/:horarioId
 * Remove horário da grade
 */
export const removeHorarioFromGrade = async (
  id: string,
  horarioId: string
): Promise<ApiResponse<GradeHoraria>> => {
  const response = await apiClient.delete<ApiResponse<GradeHoraria>>(
    `/api/grades-horarias/${id}/horarios/${horarioId}`
  );
  return response.data;
};

/**
 * POST /api/grades-horarias/:id/gerar-automaticamente
 * Gera a grade horária automaticamente
 */
export const gerarGradeAutomaticamente = async (
  id: string
): Promise<ApiResponse<GradeHoraria>> => {
  const response = await apiClient.post<ApiResponse<GradeHoraria>>(
    `/api/grades-horarias/${id}/gerar-automaticamente`
  );
  return response.data;
};
