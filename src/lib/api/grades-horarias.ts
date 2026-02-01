import apiClient from "./client";
import type { DiaSemana, Turno } from "./escolas";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

// Re-export types from escolas for convenience
export type { DiaSemana, Turno };

export type StatusGrade = "rascunho" | "ativa" | "arquivada";
export type StatusGeracao = "pendente" | "processando" | "concluida" | "falhou";
export type NivelOtimizacao = "basico" | "medio" | "alto";
export type Semestre = 1 | 2;
export type Periodo = "manha" | "tarde" | "noite";

export interface GradeThemeConfig {
  primaryColor?: string;
  accentColor?: string;
  background?: string;
  pattern?: string;
}

export interface GradeTema {
  tipo: "preset" | "custom";
  id?: string;
  config?: GradeThemeConfig;
}

export interface HorarioTurno {
  inicio: string; // HH:MM, default: manha=07:00, tarde=13:00, noite=19:00
  fim: string; // HH:MM, default: manha=12:00, tarde=18:00, noite=23:00
  duracaoAula: number; // default: manha/tarde=50, noite=45
  intervalo: number; // default: 10
}

export interface Algoritmo {
  priorizarSemJanelas?: boolean; // default: true
  permitirAulasDuplas?: boolean; // default: true
  maxTentativas?: number; // default: 10000
  timeoutSegundos?: number; // default: 30
  nivelOtimizacao?: NivelOtimizacao; // default: medio
  permitirPequenasViolacoes?: boolean; // default: false
}

export interface Configuracoes {
  horariosDisponiveis?: {
    manha?: HorarioTurno;
    tarde?: HorarioTurno;
    noite?: HorarioTurno;
  };
  diasLetivos?: DiaSemana[]; // default: [segunda, terca, quarta, quinta, sexta]
  algoritmo?: Algoritmo;
}

export interface Geracao {
  status: StatusGeracao; // default: pendente
  iniciadaEm?: string; // Date
  finalizadaEm?: string; // Date
  erros?: string[]; // Array de mensagens de erro
}

export interface Horario {
  _id: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFim: string;
  periodo: Periodo;
  disciplina: {
    _id: string;
    nome: string;
    codigo: string;
    cor?: string;
    cargaHoraria?: number;
  } | string;
  professor: {
    _id: string;
    nome: string;
    matricula: string;
    email?: string;
  } | string;
  turma?: string | any;
  observacoes?: string;
  anoLetivo?: number;
  ativo?: boolean;
}

export interface SlotIntervalo {
  diaSemana: DiaSemana;
  turno: Periodo;
  horaInicio: string;
  horaFim: string;
}

export interface DisciplinaNaoAlocada {
  disciplina: string;
  disciplinaNome: string;
  aulasNaoAlocadas: number;
  motivos: string[];
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
  slotsIntervalo?: SlotIntervalo[];
  disciplinasNaoAlocadas?: DisciplinaNaoAlocada[];
  configuracoes?: Configuracoes;
  tema?: GradeTema;
  validada: boolean;
  validadoEm?: string;
  validadoPor?: {
    _id: string;
    nome: string;
    email: string;
  } | string;
  geracao?: Geracao;
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
  id: string,
  idEscola?: string
): Promise<ApiResponse<GradeHoraria>> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.get<ApiResponse<GradeHoraria>>(
    `/api/grades-horarias/${id}`,
    { params }
  );
  return response.data;
};

/**
 * GET /api/grades-horarias/:id/export/pdf
 * Exporta a grade horaria em PDF
 */
export const exportGradeHorariaPdf = async (
  id: string,
  idEscola?: string
): Promise<Blob> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.get<Blob>(
    `/api/grades-horarias/${id}/export/pdf`,
    { params, responseType: "blob" }
  );
  return response.data;
};

/**
 * POST /api/grades-horarias?idEscola=xxx
 * Cria nova grade horária e tenta gerar automaticamente
 */
export interface CreateGradeHorariaData {
  nome?: string;
  turma?: string; // ID da turma
  modo?: "turma" | "turno";
  turno?: Periodo;
  descricao?: string;
  anoLetivo?: number;
  semestre?: Semestre;
  configuracoes?: Configuracoes;
}

export const createGradeHoraria = async (
  data: CreateGradeHorariaData,
  idEscola: string
): Promise<ApiResponse<GradeHoraria>> => {
  const params = { idEscola };
  const response = await apiClient.post<ApiResponse<GradeHoraria>>(
    "/api/grades-horarias",
    data,
    { params }
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
  data: UpdateGradeHorariaData,
  idEscola?: string
): Promise<ApiResponse<GradeHoraria>> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.put<ApiResponse<GradeHoraria>>(
    `/api/grades-horarias/${id}`,
    data,
    { params }
  );
  return response.data;
};

/**
 * DELETE /api/grades-horarias/:id
 * Remove grade horária
 */
export const deleteGradeHoraria = async (
  id: string,
  idEscola?: string
): Promise<ApiResponse<void>> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.delete<ApiResponse<void>>(
    `/api/grades-horarias/${id}`,
    { params }
  );
  return response.data;
};

/**
 * PATCH /api/grades-horarias/:id/validar
 * Valida a grade horária
 */
export const validarGradeHoraria = async (
  id: string,
  idEscola?: string
): Promise<ApiResponse<GradeHoraria>> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.patch<ApiResponse<GradeHoraria>>(
    `/api/grades-horarias/${id}/validar`,
    undefined,
    { params }
  );
  return response.data;
};

/**
 * PATCH /api/grades-horarias/:id/tema
 * Atualiza o tema da grade horária
 */
export const updateGradeTema = async (
  id: string,
  data: GradeTema,
  idEscola?: string
): Promise<ApiResponse<GradeHoraria>> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.patch<ApiResponse<GradeHoraria>>(
    `/api/grades-horarias/${id}/tema`,
    { tema: data },
    { params }
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
  data: AddHorarioData,
  idEscola?: string
): Promise<ApiResponse<GradeHoraria>> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.post<ApiResponse<GradeHoraria>>(
    `/api/grades-horarias/${id}/horarios`,
    data,
    { params }
  );
  return response.data;
};

/**
 * DELETE /api/grades-horarias/:id/horarios/:horarioId
 * Remove horário da grade
 */
export const removeHorarioFromGrade = async (
  id: string,
  horarioId: string,
  idEscola?: string
): Promise<ApiResponse<GradeHoraria>> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.delete<ApiResponse<GradeHoraria>>(
    `/api/grades-horarias/${id}/horarios/${horarioId}`,
    { params }
  );
  return response.data;
};

/**
 * POST /api/grades-horarias/:id/gerar-automaticamente
 * Gera a grade horária automaticamente
 */
export const gerarGradeAutomaticamente = async (
  id: string,
  idEscola?: string
): Promise<ApiResponse<GradeHoraria>> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.post<ApiResponse<GradeHoraria>>(
    `/api/grades-horarias/${id}/gerar-automaticamente`,
    undefined,
    { params }
  );
  return response.data;
};

/**
 * GET /api/grades-horarias/:id/status
 * Busca o status da geração da grade horária
 */
export interface GradeStatusResponse {
  id: string;
  nome: string;
  status: StatusGrade;
  geracao: Geracao;
  updatedAt: string;
}

export const getGradeStatus = async (
  id: string,
  idEscola?: string
): Promise<ApiResponse<GradeStatusResponse>> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.get<ApiResponse<GradeStatusResponse>>(
    `/api/grades-horarias/${id}/status`,
    { params }
  );
  return response.data;
};
