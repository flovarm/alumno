import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../environments/environment.development";
import { map, switchMap } from "rxjs";

export interface NiubizSessionResponse {
  sessionKey: string;
  expirationTime: number;
  webSessionID?: string;
}

export interface PrepararPagoNiubizResponse {
  purchaseNumber: string;
  status: string;
  WebSessionID?: string;
  webSessionID?: string;
  merchantUrl: string;
}

export interface PrepararPagoNiubizRequest {
  purchaseNumber: string;
  amount: number;
  currency?: string;
  merchantId: string;
  tipoOperacion: "matricula" | "libro" | "deuda" | "examen";
  docid?: string;
  idHorario?: number;
  idTipoExamen?: number;
  idItems?: number[];
  idCurso?: number;
  idSede?: number | string;
  idRegistro?: number;
}

@Injectable({
  providedIn: "root",
})
export class NiubizService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + "Pago/";

  crearSession(codigoAlumno: number, merchantId: string, monto: number) {
    const montoFormateado = monto.toFixed(2);
    return this.http.post<NiubizSessionResponse>(
      `${this.apiUrl}CrearSessionNiubiz/${codigoAlumno}/${merchantId}/${montoFormateado}`,
      {}
    );
  }

  prepararPago(request: PrepararPagoNiubizRequest) {
    return this.http.post<PrepararPagoNiubizResponse>(
      `${environment.apiUrl}PagoNiubiz/preparar`,
      {
        ...request,
        currency: request.currency ?? "PEN",
      },
    );
  }

  prepararYCrearSession(
    request: PrepararPagoNiubizRequest,
    codigoAlumno: number,
  ) {
    return this.prepararPago(request).pipe(
      switchMap((preparado) =>
        this.crearSession(codigoAlumno, request.merchantId, request.amount).pipe(
          map((session) => ({
            ...session,
            webSessionID: preparado.WebSessionID ?? preparado.webSessionID,
          })),
        ),
      ),
    );
  }

  procesarPagoExamenNiubiz(
    merchantId: string,
    idHorarioExamen: number,
    idTipoExamen: number,
    docid: string,
    purchaseNumber: string,
    datosPago: FormData,
  ) {
    return this.http.post(
      `${this.apiUrl}ProcesarPagoExamenNiubiz/${encodeURIComponent(merchantId)}/${idHorarioExamen}/${idTipoExamen}/${encodeURIComponent(docid)}/${encodeURIComponent(purchaseNumber)}`,
      datosPago,
    );
  }
}
