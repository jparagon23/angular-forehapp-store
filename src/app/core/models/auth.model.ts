export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  lastname: string;
}

export interface RegisterResponse {
  userId: number;
  message: string;
}

export interface VerifyCodeRequest {
  userId: number;
  code: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  userId: number;
  name: string;
  email: string;
  storeRoles: string[];
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
}
