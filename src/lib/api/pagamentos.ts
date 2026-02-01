import apiClient from "./client";

export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  payload?: T;
  data?: T;
  errors?: string[];
}

export interface DadosEscolaEndereco {
  cep?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
}

export interface DadosEscolaPayload {
  email?: string;
  cnpj?: string;
  endereco?: DadosEscolaEndereco;
}

export interface CreateStripeCheckoutSessionRequest {
  srtipe_price_id: string;
  plan_id: string;
  payer_email: string;
  dados_escola: DadosEscolaPayload;
  escola_id: string;
  success_url?: string;
  cancel_url?: string;
}

export interface StripeSessionPayload {
  id?: string;
  object?: string;
  payment_status?: string;
  subscription?: string;
  url?: string;
  [key: string]: unknown;
}

export interface CreateStripeCheckoutSessionResponse {
  success?: boolean;
  assinatura_id?: string;
  session?: StripeSessionPayload;
  assinatura?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CreateStripePortalSessionRequest {
  session_id: string;
}

export interface CreateStripePortalSessionResponse {
  success: boolean;
  portal_url: string;
}

export interface StripeSyncResponse {
  success: boolean;
  session?: StripeSessionPayload;
  assinatura_id?: string;
}

export interface AssinaturaStatusData {
  assinatura_id: string;
  status: string;
  data_inicio?: string;
  data_vencimento?: string;
  valor_pago?: number;
  nota_fiscal_url?: string;
}

export interface UpgradeAssinaturaRequest {
  srtipe_price_id: string;
  plan_id: string;
  payer_email: string;
  dados_escola: DadosEscolaPayload;
}

export interface UpgradeAssinaturaResponse {
  success: boolean;
  assinatura_id: string;
  session?: StripeSessionPayload;
}

export interface HistoricoTransacao {
  _id: string;
  assinatura: string;
  stripeInvoiceId?: string;
  status: string;
  valor: number;
  metodoPagamento?: string;
  processedAt?: string;
}

/**
 * POST /api/pagamentos/stripe/checkout-session
 * Cria sessão de checkout Stripe (rota privada)
 */
export const createStripeCheckoutSession = async (
  data: CreateStripeCheckoutSessionRequest
): Promise<ApiResponse<CreateStripeCheckoutSessionResponse>> => {
  const response = await apiClient.post<
    ApiResponse<CreateStripeCheckoutSessionResponse>
  >("/api/pagamentos/stripe/checkout-session", data);

  return response.data;
};

/**
 * POST /api/pagamentos/stripe/portal-session
 * Cria sessão do portal do cliente Stripe (rota privada)
 */
export const createStripePortalSession = async (
  data: CreateStripePortalSessionRequest
): Promise<ApiResponse<CreateStripePortalSessionResponse>> => {
  const response = await apiClient.post<
    ApiResponse<CreateStripePortalSessionResponse>
  >("/api/pagamentos/stripe/portal-session", data);

  return response.data;
};

/**
 * POST /api/pagamentos/stripe/sync/:assinaturaId
 * Sincroniza sessão Stripe (rota privada)
 */
export const syncStripeAssinatura = async (
  assinaturaId: string
): Promise<ApiResponse<StripeSyncResponse>> => {
  const response = await apiClient.post<ApiResponse<StripeSyncResponse>>(
    `/api/pagamentos/stripe/sync/${assinaturaId}`
  );

  return response.data;
};

/**
 * GET /api/pagamentos/status/:assinaturaId
 * Retorna status da assinatura
 */
export const getAssinaturaStatus = async (
  assinaturaId: string
): Promise<ApiResponse<AssinaturaStatusData>> => {
  const response = await apiClient.get<ApiResponse<AssinaturaStatusData>>(
    `/api/pagamentos/status/${assinaturaId}`
  );

  return response.data;
};

/**
 * POST /api/assinaturas/upgrade
 * Faz upgrade de assinatura Stripe (rota privada)
 */
export const upgradeAssinatura = async (
  data: UpgradeAssinaturaRequest
): Promise<ApiResponse<UpgradeAssinaturaResponse>> => {
  const response = await apiClient.post<ApiResponse<UpgradeAssinaturaResponse>>(
    "/api/assinaturas/upgrade",
    data
  );

  return response.data;
};

/**
 * GET /api/assinaturas/minha
 * Retorna assinatura do usuário autenticado
 */
export const getMinhaAssinatura = async (): Promise<
  ApiResponse<AssinaturaStatusData>
> => {
  const response = await apiClient.get<ApiResponse<AssinaturaStatusData>>(
    "/api/assinaturas/minha"
  );

  return response.data;
};

/**
 * GET /api/assinaturas/historico
 * Retorna histórico de transações da assinatura
 */
export const getHistoricoTransacoes = async (): Promise<
  ApiResponse<HistoricoTransacao[]>
> => {
  const response = await apiClient.get<ApiResponse<HistoricoTransacao[]>>(
    "/api/assinaturas/historico"
  );

  return response.data;
};
