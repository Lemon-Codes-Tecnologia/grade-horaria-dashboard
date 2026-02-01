import apiClient from "./client";

export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  payload?: T;
  data?: T;
  errors?: string[];
}

export type PlanoTipo = "essencial" | "avancado" | "premium" | string;

export type PlanoId = string | { $oid?: string };

export interface Plano {
  _id: PlanoId;
  name: string;
  description: string;
  yearlyPrice: string;
  product_id?: string;
  srtipePriceId?: string;
  lookupKey?: string;
  lookup_key?: string;
  stripeLookupKey?: string;
  lookupKeyMonth?: string;
  lookupKeyYear?: string;
  stripeLookupKeyMonth?: string;
  stripeLookupKeyYear?: string;
  promotionalPriceYear?: string;
  promotionalTextYear?: string;
  promotionalPriceMonth?: string;
  promotionalTextMonth?: string;
  subcardText?: string;
  currency?: string;
  durationDays?: number;
  appleProductId?: string;
  googleProductId?: string;
  features: string[];
  isActive: boolean;
  type: PlanoTipo;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * GET /private/plano/listar
 * Lista planos disponíveis (rota privada)
 */
export const listPlanos = async (): Promise<ApiResponse<Plano[]>> => {
  const response = await apiClient.get<ApiResponse<Plano[]>>(
    "/private/plano/listar"
  );

  return response.data;
};
