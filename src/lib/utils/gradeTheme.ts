import type { GradeThemeConfig, GradeTema } from "@/lib/api/grades-horarias";
import type { GradeThemeAssets, GradeThemePreset } from "@/lib/api/grade-themes";

export interface ResolvedGradeTheme {
  config?: GradeThemeConfig;
  assets?: GradeThemeAssets;
}

export const resolveGradeTheme = (
  tema?: GradeTema | null,
  presets?: GradeThemePreset[]
): ResolvedGradeTheme => {
  if (!tema) return {};

  if (tema.tipo === "custom") {
    return { config: tema.config };
  }

  const preset = presets?.find((item) => item.id === tema.id || item.slug === tema.id);
  return {
    config: tema.config || preset?.config,
    assets: preset?.assets,
  };
};
