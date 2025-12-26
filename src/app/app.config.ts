import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';

import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ErrorInterceptor } from './interceptors/error.interceptor';
import { jwtInterceptor } from './interceptors/jwt.interceptor';

import { routes } from './app.routes';
import { LoadingInterceptor } from './interceptors/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes, withViewTransitions()),
     provideHttpClient(withInterceptors([ErrorInterceptor, jwtInterceptor, LoadingInterceptor])),
  ]
};
