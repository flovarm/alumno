import { Injectable, signal, inject } from "@angular/core";
import { Router } from "@angular/router";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";

import { Observable, catchError, throwError, tap } from "rxjs";

import { LoginAlumnoDto } from "../models/login-alumno.dto";
import { AuthResponseDto } from "../models/auth-response.dto";
import { AuthUser } from "../models/auth-user.model";
import { environment } from "../../environments/environment.development";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Configuración de la API
  private readonly apiUrl = environment.apiUrl + "Account";

  // Configuración de storage keys
  private readonly storageKeys = {
    token: "auth_token",
    refreshToken: "refresh_token",
    currentUser: "alumno_currentUser",
    tokenExpiry: "alumno_tokenExpiry",
  };

  // Signals para el estado de autenticación
  private _currentUser = signal<AuthUser | null>(null);
  private _isLoggedIn = signal<boolean>(false);

  // Getters públicos
  public readonly isLoggedIn = this._isLoggedIn.asReadonly();
  public readonly currentUser = this._currentUser.asReadonly();

  constructor() {
    // Inicializar estado de login al crear el servicio
    const loggedIn = this.checkInitialLoginState();
    this._isLoggedIn.set(loggedIn);
  }

  private checkInitialLoginState(): boolean {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem(this.storageKeys.token);
      const expiry = localStorage.getItem(this.storageKeys.tokenExpiry);

      if (token && expiry) {
        const expiryDate = new Date(expiry);
        if (expiryDate > new Date()) {
          // Cargar usuario si el token es válido
          this.loadCurrentUser();
          return true;
        }
      }
    }
    return false;
  }

  private loadCurrentUser(): void {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem(this.storageKeys.currentUser);
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user && user.tokenExpiry) {
            const expiryDate = new Date(user.tokenExpiry);
            if (!isNaN(expiryDate.getTime()) && expiryDate > new Date()) {
              this._currentUser.set(user);
            }
          }
        } catch (error) {
          console.error("Error parsing stored user:", error);
        }
      }
    }
  }

  /**
   * Inicia sesión usando el endpoint login-alumno
   * @param dni DNI del alumno
   * @param password Contraseña
   */
  login(dni: string, password: string): Observable<AuthResponseDto> {
    const loginData: LoginAlumnoDto = { dni, password };

    return this.http
      .post<AuthResponseDto>(`${this.apiUrl}/login-alumno`, loginData)
      .pipe(
        tap((response) => {
          this.setAuthData(response);
        }),
        catchError(this.handleError.bind(this)),
      );
  }

  /**
   * Método legacy para compatibilidad (convierte Observable a Promise)
   */
  async loginLegacy(username: string, password: string): Promise<boolean> {
    try {
      await this.login(username, password).toPromise();
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  }

  /**
   * Establece los datos de autenticación después del login exitoso
   */
  private setAuthData(authResponse: AuthResponseDto): void {
    const tokenExpiry = new Date(authResponse.tokenExpiry);

    const user: AuthUser & { dni?: string } = {
      id: authResponse.id,
      codigo: authResponse.codigo, // Asumiendo que el ID es numérico
      userName: authResponse.userName,
      email: authResponse.email,
      nombreCompleto: authResponse.nombreCompleto,
      sede: authResponse.sede,
      token: authResponse.token,
      refreshToken: authResponse.refreshToken,
      tokenExpiry,
      dni: (authResponse as any).dni || undefined,
    };

    // Guardar en localStorage
    localStorage.setItem(this.storageKeys.token, authResponse.token);
    localStorage.setItem(
      this.storageKeys.refreshToken,
      authResponse.refreshToken,
    );
    localStorage.setItem(this.storageKeys.currentUser, JSON.stringify(user));
    localStorage.setItem(
      this.storageKeys.tokenExpiry,
      tokenExpiry.toISOString(),
    );

    // Actualizar signals
    this._isLoggedIn.set(true);
    this._currentUser.set(user);

    console.log("Datos de autenticación guardados");
  }

  /**
   * Maneja errores de HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = "Ocurrió un error desconocido";

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = error.error || `Error del servidor: ${error.status}`;
    }

    console.error("Error en AuthService:", errorMessage);
    return throwError(() => errorMessage);
  }

  logout(): void {
    console.log("Cerrando sesión");

    // Limpiar datos de autenticación
    localStorage.removeItem(this.storageKeys.token);
    localStorage.removeItem(this.storageKeys.refreshToken);
    localStorage.removeItem(this.storageKeys.currentUser);
    localStorage.removeItem(this.storageKeys.tokenExpiry);

    // Actualizar signals
    this._isLoggedIn.set(false);
    this._currentUser.set(null);

    // Redirigir al login
    this.router.navigate(["/login"]);
  }

  /**
   * Obtiene el nombre de usuario actual
   */
  getUsername(): string | null {
    const user = this._currentUser();
    return user ? user.userName : null;
  }

  /**
   * Obtiene el nombre completo del usuario actual
   */
  getNombreCompleto(): string | null {
    const user = this._currentUser();
    return user ? user.nombreCompleto : null;
  }

  /**
   * Obtiene el token de autenticación actual
   */
  getToken(): string | null {
    const user = this._currentUser();
    return user ? user.token : null;
  }

  /**
   * Verifica si el usuario está autenticado (para guards)
   */
  isAuthenticated(): boolean {
    return this._isLoggedIn();
  }

  /**
   * Verifica si el token está próximo a expirar
   */
  isTokenExpiringSoon(): boolean {
    const user = this._currentUser();
    if (!user) return false;

    const now = new Date();
    const expiry = new Date(user.tokenExpiry);
    const timeUntilExpiry = expiry.getTime() - now.getTime();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutos en milisegundos

    return timeUntilExpiry < fiveMinutes;
  }

    changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(this.apiUrl + '/change-password', {
      currentPassword,
      newPassword
    });
  }
}
