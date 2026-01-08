/**
 * Gerenciador de APP Token (Token da Aplicação)
 *
 * A API requer um APP token em TODAS as requisições (públicas e privadas)
 * Este token é obtido em /gradehoraria/auth/token e tem validade de 24h
 */

const APP_TOKEN_KEY = 'gh_app_token';
const APP_TOKEN_EXPIRY_KEY = 'gh_app_token_expiry';

interface AppTokenResponse {
  token: string;
}

/**
 * Obtém o APP token do servidor
 */
async function fetchAppToken(): Promise<string> {
  console.log('🔑 Obtendo novo APP token da API...');

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/token`, {
    method: 'GET',
    credentials: 'omit', // Não enviar cookies
  });

  if (!response.ok) {
    throw new Error(`Erro ao obter APP token: ${response.status}`);
  }

  const data: AppTokenResponse = await response.json();

  if (!data.token) {
    throw new Error('API não retornou um token válido');
  }

  console.log('✅ APP token obtido com sucesso');
  return data.token;
}

/**
 * Salva o APP token no localStorage com timestamp de expiração
 */
function saveAppToken(token: string): void {
  // Token válido por 24h, mas vamos renovar 1h antes para garantir
  const expiryTime = Date.now() + (23 * 60 * 60 * 1000); // 23 horas

  if (typeof window !== 'undefined') {
    localStorage.setItem(APP_TOKEN_KEY, token);
    localStorage.setItem(APP_TOKEN_EXPIRY_KEY, expiryTime.toString());
  }
}

/**
 * Obtém o APP token do localStorage
 */
function getStoredAppToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = localStorage.getItem(APP_TOKEN_KEY);
  const expiryTime = localStorage.getItem(APP_TOKEN_EXPIRY_KEY);

  if (!token || !expiryTime) {
    return null;
  }

  // Verifica se o token ainda é válido
  if (Date.now() >= parseInt(expiryTime, 10)) {
    console.log('⚠️ APP token expirado');
    clearAppToken();
    return null;
  }

  return token;
}

/**
 * Limpa o APP token do localStorage
 */
function clearAppToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(APP_TOKEN_KEY);
    localStorage.removeItem(APP_TOKEN_EXPIRY_KEY);
  }
}

/**
 * Obtém o APP token (do cache ou busca um novo)
 * Esta é a função principal que deve ser usada
 */
export async function getAppToken(): Promise<string> {
  // Tenta obter do cache primeiro
  const cachedToken = getStoredAppToken();

  if (cachedToken) {
    console.log('✅ Usando APP token em cache');
    return cachedToken;
  }

  // Se não tem cache válido, busca um novo
  const newToken = await fetchAppToken();
  saveAppToken(newToken);
  return newToken;
}

/**
 * Força a renovação do APP token
 */
export async function refreshAppToken(): Promise<string> {
  console.log('🔄 Forçando renovação do APP token...');
  clearAppToken();
  return await getAppToken();
}

/**
 * Limpa o APP token (útil para logout)
 */
export function clearStoredAppToken(): void {
  clearAppToken();
}
