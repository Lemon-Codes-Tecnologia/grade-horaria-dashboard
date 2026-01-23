import apiClient from "./client";

export type MuralStatus = "rascunho" | "publicada" | "arquivada";

export interface MuralAnexo {
  nome: string;
  mimeType: string;
  tamanho: number;
  url: string;
  caminhoStorage?: string;
  uploadedAt?: string;
}

export interface MuralAutor {
  _id: string;
  nome: string;
}

export interface MuralItem {
  _id: string;
  gradeHoraria: string;
  turma: string;
  disciplina?: {
    _id: string;
    nome: string;
  } | string;
  autor: MuralAutor | string;
  titulo: string;
  conteudo?: string;
  status: MuralStatus;
  fixada?: boolean;
  fixadaEm?: string;
  anexos?: MuralAnexo[];
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

export interface ListMuralParams {
  page?: number;
  limit?: number;
}

export const listMural = async (
  gradeId: string,
  params?: ListMuralParams,
  idEscola?: string,
  disciplinaId?: string
): Promise<ApiResponse<any>> => {
  const queryParams = {
    ...params,
    ...(idEscola ? { idEscola } : {}),
    ...(disciplinaId ? { disciplinaId } : {}),
  };
  const response = await apiClient.get<ApiResponse<any>>(
    `/api/grades-horarias/${gradeId}/mural`,
    { params: queryParams }
  );
  return response.data;
};

export const getMuralItem = async (
  gradeId: string,
  muralId: string,
  idEscola?: string
): Promise<ApiResponse<MuralItem>> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.get<ApiResponse<MuralItem>>(
    `/api/grades-horarias/${gradeId}/mural/${muralId}`,
    { params }
  );
  return response.data;
};

export const createMuralItem = async (
  gradeId: string,
  data: FormData,
  idEscola?: string
): Promise<ApiResponse<MuralItem>> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.post<ApiResponse<MuralItem>>(
    `/api/grades-horarias/${gradeId}/mural`,
    data,
    {
      headers: { "Content-Type": "multipart/form-data" },
      params,
    }
  );
  return response.data;
};

export const updateMuralItem = async (
  gradeId: string,
  muralId: string,
  data: FormData,
  idEscola?: string
): Promise<ApiResponse<MuralItem>> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.put<ApiResponse<MuralItem>>(
    `/api/grades-horarias/${gradeId}/mural/${muralId}`,
    data,
    {
      headers: { "Content-Type": "multipart/form-data" },
      params,
    }
  );
  return response.data;
};

export const deleteMuralItem = async (
  gradeId: string,
  muralId: string,
  idEscola?: string
): Promise<ApiResponse<void>> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.delete<ApiResponse<void>>(
    `/api/grades-horarias/${gradeId}/mural/${muralId}`,
    { params }
  );
  return response.data;
};

export const toggleMuralPin = async (
  gradeId: string,
  muralId: string,
  idEscola?: string
): Promise<ApiResponse<MuralItem>> => {
  const params = idEscola ? { idEscola } : undefined;
  const response = await apiClient.patch<ApiResponse<MuralItem>>(
    `/api/grades-horarias/${gradeId}/mural/${muralId}/fixar`,
    undefined,
    { params }
  );
  return response.data;
};
