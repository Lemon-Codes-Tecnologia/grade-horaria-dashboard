import apiClient from "./client";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface UF {
  _id: string;
  nome: string;
  uf: string; // Sigla da UF (ex: "AC", "SP")
  regiao?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Cidade {
  _id: string;
  nome: string;
  uf: string;
  codigo_ibge?: string;
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

// ============================================================================
// UF ENDPOINTS
// ============================================================================

/**
 * POST /public/uf/listar
 * Lista todas as UFs cadastradas
 */
export const listUFs = async (): Promise<ApiResponse<UF[]>> => {
  const response = await apiClient.post<ApiResponse<UF[]>>("/public/uf/listar");
  return response.data;
};

/**
 * GET /public/uf/:id
 * Busca uma UF específica por ID
 */
export const getUF = async (id: string): Promise<ApiResponse<UF>> => {
  const response = await apiClient.get<ApiResponse<UF>>(`/public/uf/${id}`);
  return response.data;
};

// ============================================================================
// CIDADE ENDPOINTS
// ============================================================================

/**
 * POST /public/cidade/listar
 * Lista todas as cidades ordenadas por nome
 * Se passar body { uf: "AC" }, filtra por UF
 */
export const listCidades = async (): Promise<ApiResponse<Cidade[]>> => {
  const response = await apiClient.post<ApiResponse<Cidade[]>>("/public/cidade/listar");
  return response.data;
};

/**
 * POST /public/cidade/listar
 * Lista cidades de uma UF específica (sigla)
 * Body: { uf: "AC" }
 */
export const listCidadesByUF = async (uf: string): Promise<ApiResponse<Cidade[]>> => {
  const response = await apiClient.post<ApiResponse<Cidade[]>>("/public/cidade/listar", {
    uf
  });
  return response.data;
};

/**
 * GET /public/cidade/:id
 * Busca uma cidade específica por ID
 */
export const getCidade = async (id: string): Promise<ApiResponse<Cidade>> => {
  const response = await apiClient.get<ApiResponse<Cidade>>(`/public/cidade/${id}`);
  return response.data;
};
