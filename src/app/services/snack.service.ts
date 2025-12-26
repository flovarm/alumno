import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export interface SnackBarOptions {
  duration?: number;
  action?: string;
  verticalPosition?: 'top' | 'bottom';
  horizontalPosition?: 'start' | 'center' | 'end' | 'left' | 'right';
}

@Injectable({
  providedIn: 'root'
})
export class SnackService {
  private snackBar = inject(MatSnackBar);

  private defaultConfig: MatSnackBarConfig = {
    duration: 4000,
    verticalPosition: 'top',
    horizontalPosition: 'right'
  };

  /**
   * Muestra un snackbar de éxito
   * @param message Mensaje a mostrar
   * @param options Opciones adicionales
   */
  success(message: string, options?: SnackBarOptions): void {
    const config: MatSnackBarConfig = {
      ...this.defaultConfig,
      ...options,
      panelClass: ['snack-success']
    };

    this.snackBar.open(message, options?.action || 'Cerrar', config);
  }

  /**
   * Muestra un snackbar de error
   * @param message Mensaje a mostrar
   * @param options Opciones adicionales
   */
  danger(message: string, options?: SnackBarOptions): void {
    const config: MatSnackBarConfig = {
      ...this.defaultConfig,
      ...options,
      duration: options?.duration || 6000, // Más tiempo para errores
      panelClass: ['snack-danger']
    };

    this.snackBar.open(message, options?.action || 'Cerrar', config);
  }

  /**
   * Muestra un snackbar de información
   * @param message Mensaje a mostrar
   * @param options Opciones adicionales
   */
  info(message: string, options?: SnackBarOptions): void {
    const config: MatSnackBarConfig = {
      ...this.defaultConfig,
      ...options,
      panelClass: ['snack-info']
    };

    this.snackBar.open(message, options?.action || 'Cerrar', config);
  }

  /**
   * Muestra un snackbar de advertencia
   * @param message Mensaje a mostrar
   * @param options Opciones adicionales
   */
  warning(message: string, options?: SnackBarOptions): void {
    const config: MatSnackBarConfig = {
      ...this.defaultConfig,
      ...options,
      duration: options?.duration || 5000, // Tiempo intermedio para advertencias
      panelClass: ['snack-warning']
    };

    this.snackBar.open(message, options?.action || 'Cerrar', config);
  }

  /**
   * Cierra todos los snackbars activos
   */
  dismiss(): void {
    this.snackBar.dismiss();
  }
}