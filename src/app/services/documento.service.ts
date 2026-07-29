import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment.development";

export interface DocumentoAlumnoReturn {
  Correlativo: string;
  Fecha_Doc?: string; // DateTime en backend, string en JSON
  Total?: number;
  Detalle_Doc?: string;
  idDocumento?: number; // ID del documento enviado desde el backend
}

export interface BoletaElectronicaResponse {
  serie?: string;
  numero?: string;
  fechaEmision?: string;
  fechaInicio?: string; // Fecha de inicio del curso/servicio
  fechaFinal?: string; // Fecha de fin del curso/servicio
  codigo?: string;
  docId?: string;
  completo?: string;
  curso?: string;
  aula?: string;
  profesor?: string;
  periodo?: string;
  turno?: string;
  concepto?: string;
  nombreLibro?: string;
  costo?: number;
  descuento?: number;
  deuda?: number;
  total?: number;
}

@Injectable({
  providedIn: "root",
})
export class DocumentoService {
  private apiUrl = environment.apiUrl + "documento";
  http = inject(HttpClient);

  getDocumentosByAlumnoId(idAlumno: number) {
    return this.http.get<DocumentoAlumnoReturn[]>(`${this.apiUrl}/${idAlumno}`);
  }

  obtenerBoleta(iddocumento: number): Observable<BoletaElectronicaResponse> {
    return this.http.get<BoletaElectronicaResponse>(
      this.apiUrl + "/obtener-boleta/" + iddocumento,
    );
  }
}
