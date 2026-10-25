import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../environments/environment.development";
import { HorarioExamen, TipoExamen } from "../models/examen";

@Injectable({ providedIn: "root" })
export class ExamenService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl + "Examen/";

  listarTiposExamen() {
    return this.http.get<TipoExamen[]>(this.apiUrl + "Tipos");
  }

  obtenerHorariosExamen(fecha: string, idTipoExamen: number) {
    const params = new HttpParams().set("fecha", fecha).set("idTipoExamen", idTipoExamen);
    return this.http.get<HorarioExamen[]>(this.apiUrl + "Horarios", { params });
  }

  alumnoRegistradoEnExamen(codigo: number, idTipoExamen?: number) {
    let params = new HttpParams();
    if (idTipoExamen != null) params = params.set("idTipoExamen", idTipoExamen);
    return this.http.get<boolean>(this.apiUrl + "AlumnoRegistrado/" + codigo, { params });
  }
}
