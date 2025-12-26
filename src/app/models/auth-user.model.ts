export interface AuthUser {
  id: string;
  userName: string;
  email: string;
  nombreCompleto: string;
  sede: string;
  token: string;
  refreshToken: string;
  tokenExpiry: Date;
}
