import apiClient from "./client";
import type { GradeThemeConfig } from "./grades-horarias";

export interface GradeThemeAssets {
  bgImageUrl?: string;
  patternUrl?: string;
}

export interface GradeThemePreset {
  id: string;
  slug: string;
  nome: string;
  ativo: boolean;
  config: GradeThemeConfig;
  assets?: GradeThemeAssets;
}

export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
  payload?: T;
  errors?: string[];
}

/**
 * GET /api/grade-themes
 * Lista temas disponíveis
 */
export const listGradeThemes = async (): Promise<ApiResponse<GradeThemePreset[]>> => {
  const response = await apiClient.get<ApiResponse<GradeThemePreset[]>>(
    "/api/grade-themes"
  );
  return response.data;
};
