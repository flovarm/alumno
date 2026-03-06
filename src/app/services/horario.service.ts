import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../environments/environment.development";
import { map, Observable } from "rxjs";
import { CodigoPlataforma } from "../models/codigoPlataform";

@Injectable({
  providedIn: "root",
})
export class HorarioService {
  private http = inject(HttpClient);
  apiUrl = environment.apiUrl + "Horario/";

  obtenerHorarioPorCursoYPeriodo(
    idCurso: number,
    idPeriodo: number,
    docId: string,
  ) {
    return this.http.get(
      this.apiUrl +
        "ObtenerHorarioPorCursoYPeriodo/" +
        idCurso +
        "/" +
        idPeriodo +
        "/" +
        docId,
    );
  }

  obtenerResumenPago(idHorario: number, docId: string) {
    return this.http.get(
      this.apiUrl + "ResumenPago/" + idHorario + "/" + docId,
    );
  }


  obtenerCodigoPlataforma(idHorario: number) {
    return this.http.get<CodigoPlataforma>(
      this.apiUrl + "obtenerCodigoPlataforma/" + idHorario,
    );
  }

  obtenerDeuda(docId: string) {
    return this.http.get(this.apiUrl + "ObtenerDeuda/" + docId);
  }
}
