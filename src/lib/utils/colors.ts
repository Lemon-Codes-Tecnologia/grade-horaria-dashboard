/**
 * Calcula se deve usar texto claro ou escuro baseado na luminosidade da cor de fundo
 * para garantir melhor contraste e acessibilidade
 *
 * @param hexColor - Cor hexadecimal (com ou sem #)
 * @returns Cor do texto em hexadecimal (#1F2937 para escuro, #FFFFFF para claro)
 */
export const getTextColorForBackground = (hexColor: string): string => {
  // Remove o # se existir
  const hex = hexColor.replace("#", "");

  // Converte hex para RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calcula a luminância relativa (fórmula W3C)
  // https://www.w3.org/TR/WCAG20/#relativeluminancedef
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Se a luminância for maior que 0.5, usar texto escuro, senão texto claro
  return luminance > 0.5 ? "#1F2937" : "#FFFFFF"; // gray-800 : white
};

/**
 * Verifica se uma cor é clara ou escura
 *
 * @param hexColor - Cor hexadecimal (com ou sem #)
 * @returns true se a cor for clara, false se for escura
 */
export const isLightColor = (hexColor: string): boolean => {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};
