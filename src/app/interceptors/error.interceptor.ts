import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SnackService } from '../services/snack.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export const ErrorInterceptor: HttpInterceptorFn = (req, next) => {
const router = inject(Router);    
const snackBar = inject(SnackService);    
  
      return next(req).pipe(
      catchError(error => {
        if (error) {
          switch (error.status) {
            case 400:
                ({ severity: 'error', summary: 'Error', detail: error.error });
                if (error.error.errors) {
                    const modalStateErrors = [];
                    for (const key in error.error.errors) {
                        if (error.error.errors[key]) {
                            modalStateErrors.push(error.error.errors[key]);
                        }
                    }
                    
                    throw modalStateErrors.flat();
                } else {
                    snackBar.danger(error.error)
              }
              break;
            case 401:
              router.navigate(['/login']);
              snackBar.danger('No autorizado. Por favor vuelve a iniciar sesión.'); 
              break;
            case 404:
             snackBar.danger('Recurso no encontrado');
              break;
            case 500:
                snackBar.danger('Error en el servidor, por favor intente más tarde');
              break;
            default:
                snackBar.danger('Error interno del servidor');
              break;
          }
        }
        throw error;
      })
    );
  }
