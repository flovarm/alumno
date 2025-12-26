import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../environments/environment.development";

@Injectable({
    providedIn: 'root'
})
export class RegistroService{
    http = inject(HttpClient);
    apiUrl = environment.apiUrl + 'Registro/'

    obtenerUltimoRegistroPorAlumno(docid: string) {
        return this.http.get(this.apiUrl + 'ultimo/' + docid);
    }

    obtenerTokenPago(precio: number, transactionId: string, orderNumber: string) {
        return this.http.get(this.apiUrl + 'PagoIzipay/' + precio + '/' + transactionId + '/' + orderNumber);
    }

    matricularAlumno(data: any) {
        return this.http.post(this.apiUrl + 'matricular', data);
    }

    pagarDeuda(idRegistro: number, data: any) {
        return this.http.patch(this.apiUrl + 'Deuda/' + idRegistro, data);
    }

    obtenerExamenDeCalificacion(docid: string) {
        return this.http.get(this.apiUrl + 'ExamenCalificacion/' + docid);
    }
  
}