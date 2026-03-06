import { inject } from "@angular/core";
import { HttpInterceptorFn } from "@angular/common/http";
import { finalize } from "rxjs/operators";
import { PaymentSpinnerService } from "../services/loading.service";

export const LoadingInterceptor: HttpInterceptorFn = (req, next) => {
  const paymentSpinner = inject(PaymentSpinnerService);
  // No mostrar spinner automáticamente para todas las requests
  return next(req).pipe(
    finalize(() => {
      // El spinner se maneja manualmente en cada componente
    }),
  );
};
