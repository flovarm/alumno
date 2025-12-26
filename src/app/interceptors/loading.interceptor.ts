import { inject, Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpInterceptorFn
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

export const LoadingInterceptor:  HttpInterceptorFn = (req, next) => {
   const loadingService = inject(LoadingService);
    loadingService.show();

    return next(req).pipe(
      finalize(() => loadingService.hide())
    );
  }
