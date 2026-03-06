import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../environments/environment.development";

@Injectable({
  providedIn: "root",
})
export class RegistroService {
  http = inject(HttpClient);
  apiUrl = environment.apiUrl + "Registro/";

  obtenerUltimoRegistroPorAlumno(docid: string) {
    return this.http.get(this.apiUrl + "ultimo/" + docid);
  }

  obtenerTokenPago(precio: number, transactionId: string, orderNumber: string) {
    return this.http.get(
      this.apiUrl +
        "PagoIzipay/" +
        precio +
        "/" +
        transactionId +
        "/" +
        orderNumber,
    );
  }

  matricularAlumno(data: any) {
    return this.http.post(this.apiUrl + "matricular", data);
  }

  pagarDeuda(idRegistro: number, data: any) {
    return this.http.patch(this.apiUrl + "Deuda/" + idRegistro, data);
  }

  obtenerExamenDeCalificacion(docid: string) {
    return this.http.get(this.apiUrl + "ExamenCalificacion/" + docid);
  }

  // Método para guardar la matrícula pendiente antes del pago
  guardarMatriculaPendiente(
    transactionId: string,
    orderNumber: string,
    datosMatricula: any,
  ) {
    return this.http.post(this.apiUrl + "iniciar-matricula", datosMatricula, {
      params: {
        transactionId: transactionId,
        orderNumber: orderNumber,
      },
    });
  }

  // Método para verificar el estado de un pago
  verificarEstadoPago(transactionId: string) {
    return this.http.get(this.apiUrl + "verificar-pago/" + transactionId);
  }

  // Método para procesar webhook de IziPay (si necesitas llamarlo manualmente)
  procesarWebhookIzipay(data: any) {
    return this.http.post(this.apiUrl + "webhook/izipay", data);
  }
}
