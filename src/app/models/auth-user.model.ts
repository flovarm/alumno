export interface AuthUser {
  id: string;
  codigo: number;
  userName: string;
  email: string;
  nombreCompleto: string;
  sede: string;
  token: string;
  refreshToken: string;
  tokenExpiry: Date;
}
