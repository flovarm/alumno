import { Injectable, inject } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpInterceptorFn
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const currentUser = authService.currentUser();
    
    if (currentUser) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${currentUser.token}`
            }
        });
    }
    
    return next(req);
};