import apiClient from "./client";
import Cookies from "js-cookie";

// Types
export interface User {
  _id: string; // API uses _id
  id?: string; // Optional for compatibility
  nome: string;
  email: string;
  tipo: string;
  permissoes?: string[];
  cargo?: string;
  escolas?: any[]; // API uses escolas array
  escola?: string; // For compatibility
  uf?: any;
  sessionToken?: string;
  primeiroLogin?: boolean;
  ativo?: boolean;
  createdAt?: string;
}

export interface ApiResponse<T> {
  success?: boolean; // Optional - API may not always return this
  message?: string;
  payload?: T;
  data?: T; // Support for new API structure
}

export interface UserTypesResponse {
  tipos: string[];
  tiposCriacaoEscola: string[];
}

export interface Profile {
  _id: string;
  slug: string;
  nome: string;
  descricao?: string;
  ordem?: number;
  acessoApp?: boolean;
  acessoWeb?: boolean;
  podeCriarTipos?: string[];
  permissoes?: string[];
  ativo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// 1. Register User (Auto-cadastro público)
export interface RegisterUserData {
  nome: string;
  email: string;
  password: string;
}

export const registerUser = async (data: RegisterUserData): Promise<ApiResponse<User>> => {
  const response = await apiClient.post<ApiResponse<User>>(
    "/public/usuario/criar",
    data
  );

  // Save session token to cookie if registration successful
  if (response.data.payload?.sessionToken) {
    Cookies.set("gh_session", response.data.payload.sessionToken, {
      expires: 7, // 7 days
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response.data;
};

// 2. Login
export interface LoginData {
  email: string;
  password: string;
  fcmToken?: string;
  permanecerLogado?: boolean;
}

export const login = async (data: LoginData): Promise<ApiResponse<User>> => {
  const response = await apiClient.post<ApiResponse<User>>(
    "/public/usuario/entrar",
    data
  );

  // Save session token to cookie if login successful
  if (response.data.payload?.sessionToken) {
    Cookies.set("gh_session", response.data.payload.sessionToken, {
      expires: 7, // 7 days
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response.data;
};

// 3. Password Recovery - Step 1: Send Code
export interface SendRecoveryCodeData {
  email: string;
}

export const sendRecoveryCode = async (
  data: SendRecoveryCodeData
): Promise<ApiResponse<null>> => {
  const response = await apiClient.post<ApiResponse<null>>(
    "/public/usuario/enviar-codigo",
    data
  );

  return response.data;
};

// 3. Password Recovery - Step 2: Validate Code
export interface ValidateRecoveryCodeData {
  code: string;
}

export const validateRecoveryCode = async (
  data: ValidateRecoveryCodeData
): Promise<ApiResponse<null>> => {
  const response = await apiClient.post<ApiResponse<null>>(
    "/public/usuario/validar-codigo",
    data
  );

  return response.data;
};

// 3. Password Recovery - Step 3: Reset Password
export interface ResetPasswordData {
  email: string;
  pass: string;
}

export const resetPassword = async (data: ResetPasswordData): Promise<ApiResponse<null>> => {
  const { email, pass } = data;
  const response = await apiClient.post<ApiResponse<null>>(
    "/public/usuario/nova-senha",
    { email, pass }
  );

  return response.data;
};

// Extra: Validate Email (check if email already exists)
export interface ValidateEmailData {
  email: string;
}

export const validateEmail = async (
  data: ValidateEmailData
): Promise<ApiResponse<{ hasEmail: boolean }>> => {
  const response = await apiClient.post<ApiResponse<{ hasEmail: boolean }>>(
    "/public/usuario/validar-email",
    data
  );

  return response.data;
};

// 4. Logout (clears session token on backend)
export const logout = async (userId: string): Promise<ApiResponse<null>> => {
  const response = await apiClient.post<ApiResponse<null>>(
    `/private/usuario/sair/${userId}`
  );

  // Also clear local cookie
  Cookies.remove("gh_session");

  return response.data;
};

// 5. Get Logged User Info
export const getLoggedUser = async (): Promise<ApiResponse<User>> => {
  const response = await apiClient.post<ApiResponse<User>>(
    "/private/usuario-logado"
  );

  return response.data;
};

// 5.1 Get User Types (Admin/Support/Director)
export const getUserTypes = async (): Promise<ApiResponse<UserTypesResponse>> => {
  const response = await apiClient.get<ApiResponse<UserTypesResponse>>(
    "/private/usuario/tipos"
  );

  return response.data;
};

// 5.2 Get Profiles (Admin/Support/Director/Coordinator)
export const getProfiles = async (): Promise<ApiResponse<Profile[]>> => {
  const response = await apiClient.get<ApiResponse<Profile[]>>(
    "/private/perfis"
  );

  return response.data;
};

// 6. Create User by School (Director/Coordinator/Secretary)
export interface CreateUserBySchoolData {
  nome: string;
  email: string;
  tipo: string;
  permissoes?: string[];
  turmaId?: string;
  professorId?: string;
  filhos?: any[];
  escola?: string;
  escolaId?: string;
}

export const createUserBySchool = async (
  data: CreateUserBySchoolData
): Promise<ApiResponse<User>> => {
  const response = await apiClient.post<ApiResponse<User>>(
    "/private/usuario/criar-pela-escola",
    data
  );

  return response.data;
};

// 7. List Users (Admin/Support only)
export interface ListUsersParams {
  page: number;
  limit?: number;
  search?: string;
}

export interface ListUsersResponse {
  docs: User[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
}

export const listUsers = async (
  page: number,
  params?: Omit<ListUsersParams, 'page'>
): Promise<ApiResponse<ListUsersResponse>> => {
  const response = await apiClient.get<ApiResponse<ListUsersResponse>>(
    `/private/usuario/listar/${page}`,
    { params }
  );

  return response.data;
};

// 8. Get User by ID (Admin/Support only)
export const getUser = async (userId: string): Promise<ApiResponse<User>> => {
  const response = await apiClient.get<ApiResponse<User>>(
    `/private/usuario/${userId}`
  );

  return response.data;
};

// 8.1. Resend Credentials (Admin/Support/Director)
export const resendUserCredentials = async (
  userId: string
): Promise<ApiResponse<null>> => {
  const response = await apiClient.post<ApiResponse<null>>(
    `/private/usuario/${userId}`
  );

  return response.data;
};

// 9. Update User (Admin/Support only)
export interface UpdateUserData {
  nome?: string;
  email?: string;
  tipo?: string;
  permissoes?: string[];
  cargo?: string;
  telefone?: string;
  ativo?: boolean;
  escolas?: any[];
  passwordAtual?: string;
  password?: string;
}

export const updateUser = async (
  userId: string,
  data: UpdateUserData
): Promise<ApiResponse<User>> => {
  const response = await apiClient.put<ApiResponse<User>>(
    `/private/usuario/${userId}`,
    data
  );

  return response.data;
};

// 10. Delete User (Admin/Support only)
export const deleteUser = async (userId: string): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete<ApiResponse<null>>(
    `/private/usuario/${userId}`
  );

  return response.data;
};

// 11. Subscription Management
export interface SubscriptionData {
  [key: string]: any; // API-specific subscription data
}

export const assignPlan = async (
  data: SubscriptionData
): Promise<ApiResponse<User>> => {
  const response = await apiClient.post<ApiResponse<User>>(
    "/private/usuario/assinar-plano",
    data
  );

  return response.data;
};

// 12. Validate Apple Receipt (Legacy)
export interface AppleReceiptData {
  receiptData: string;
  isSandbox?: boolean;
}

export const validateAppleReceipt = async (
  data: AppleReceiptData
): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>(
    "/private/usuario/validar-recibo-apple",
    data
  );

  return response.data;
};

// 13. Validate Google Receipt (Legacy)
export interface GoogleReceiptData {
  packageName: string;
  productId: string;
  purchaseToken: string;
}

export const validateGoogleReceipt = async (
  data: GoogleReceiptData
): Promise<ApiResponse<any>> => {
  const response = await apiClient.post<ApiResponse<any>>(
    "/private/usuario/validar-recibo-google",
    data
  );

  return response.data;
};
