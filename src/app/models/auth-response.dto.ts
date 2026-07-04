export interface AuthResponseDto {
  id: string;
  codigo: number;
  userName: string;
  token: string;
  refreshToken: string;
  email: string;
  phoneNumber?: string;
  nombreCompleto: string;
  sede: string;
  tokenExpiry: string;
}
