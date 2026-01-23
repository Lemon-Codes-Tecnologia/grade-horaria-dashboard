import axios from "axios";
import Cookies from "js-cookie";
import { getAppToken } from "./app-token";

// Create Axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

// Request interceptor - Add APP token and user session token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Verifica se é rota privada ou /api/ (requer sessionToken do usuário)
      const isPrivateRoute = config.url?.includes('/private/') || config.url?.includes('/api/');

      if (isPrivateRoute) {
        // Rotas privadas usam session token do usuário logado
        const sessionToken = Cookies.get("gh_session");

        // Debug para rotas privadas
        console.log('🔒 ===== ROTA PRIVADA =====');
        console.log(`📍 URL: ${config.baseURL}${config.url}`);
        console.log(`🔧 Método: ${config.method?.toUpperCase()}`);
        console.log(`👤 Session Token:`, sessionToken ? sessionToken.substring(0, 20) + '...' : '❌ NÃO ENCONTRADO');
        console.log(`📋 Todos os cookies:`, document.cookie);

        // Log do body da requisição
        if (config.data) {
          console.log(`📤 Request Body:`, config.data);
        }

        // Log dos query params
        if (config.params) {
          console.log(`🔗 Query Params:`, config.params);
        }

        if (sessionToken) {
          // Usa session token no Authorization para rotas privadas
          config.headers.Authorization = `Bearer ${sessionToken}`;
          console.log(`✅ Session token adicionado ao header Authorization`);
        } else {
          console.error('⚠️ ALERTA: Rota privada sem session token! Requisição vai falhar com 401.');
        }
        console.log('🔒 ==========================');
      } else {
        // Rotas públicas usam APP token
        const appToken = await getAppToken();
        config.headers.Authorization = `Bearer ${appToken}`;

        // Debug para rotas públicas
        console.log('🌐 ===== ROTA PÚBLICA =====');
        console.log(`📍 URL: ${config.baseURL}${config.url}`);
        console.log(`🔧 Método: ${config.method?.toUpperCase()}`);
        console.log(`🔑 APP Token:`, appToken.substring(0, 20) + '...');

        // Log do body da requisição
        if (config.data) {
          console.log(`📤 Request Body:`, config.data);
        }

        // Log dos query params
        if (config.params) {
          console.log(`🔗 Query Params:`, config.params);
        }

        console.log('🌐 ==========================');
      }

      return config;
    } catch (error) {
      console.error('❌ Erro ao configurar requisição:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ ===== RESPOSTA SUCESSO =====');
    console.log(`📍 URL: ${response.config.url}`);
    console.log(`🔧 Método: ${response.config.method?.toUpperCase()}`);
    console.log(`🔢 Status: ${response.status}`);
    console.log(`📥 Response Body:`, response.data);
    console.log('✅ ==============================');
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();

    console.error('❌ ===== ERRO NA REQUISIÇÃO =====');
    console.error(`📍 URL: ${url}`);
    console.error(`🔧 Método: ${method}`);
    console.error(`🔢 Status: ${status || 'ERRO DE REDE/TIMEOUT'}`);
    console.error(`💬 Mensagem: ${message || error.message}`);
    console.error(`📦 Response Body:`, error.response?.data);
    console.error(`🔑 Headers enviados:`, error.config?.headers);

    // Log do body da requisição que falhou
    if (error.config?.data) {
      try {
        const requestBody = typeof error.config.data === 'string'
          ? JSON.parse(error.config.data)
          : error.config.data;
        console.error(`📤 Request Body (que falhou):`, requestBody);
      } catch (e) {
        console.error(`📤 Request Body (que falhou):`, error.config.data);
      }
    }

    // Log dos query params que falharam
    if (error.config?.params) {
      console.error(`🔗 Query Params (que falharam):`, error.config.params);
    }

    console.error('❌ =================================');

    // Handle 401 Unauthorized - session token expired or invalid
    if (status === 401) {
      const isAuthRoute = url?.includes('/public/usuario/entrar') || url?.includes('/public/usuario/criar');

      // Só redireciona se NÃO for rota de login/cadastro
      if (!isAuthRoute) {
        console.error('🔒 ATENÇÃO: 401 detectado em rota não-auth. Removendo cookie e redirecionando...');
        Cookies.remove("gh_session");

        if (typeof window !== "undefined" && !window.location.pathname.includes("/signin")) {
          console.error('🔄 Redirecionando para /signin...');
          window.location.href = "/signin";
        }
      } else {
        console.error('⚠️ 401 em rota de autenticação (login/cadastro) - não redirecionando');
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to clear all auth-related data
export const clearAuthCookies = () => {
  console.log('🧹 Limpando dados de autenticação...');

  // Clear session cookie
  Cookies.remove("gh_session");
  Cookies.remove("gh_session", { domain: window.location.hostname });
  Cookies.remove("gh_session", { domain: `.${window.location.hostname}` });
  Cookies.remove("gh_session", { path: "/" });

  // Note: APP token is kept in cache (valid for 24h, shared across sessions)
  // Only clear it on explicit logout or if we want to force re-authentication
};

export default apiClient;
