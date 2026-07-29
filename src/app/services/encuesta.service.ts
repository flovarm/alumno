import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../environments/environment.development";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class EncuestaService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + 'Encuestas/';

  obtenerEncuestaPendiente(idRegistro: number): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'alumno/' + idRegistro);
  }

  guardarRespuestas(dto: {
    idRegistro: number;
    idUsuarioRegistro: string;
    respuestas: { preguntaId: number; opcionesRespuestaId: number; descripcion: string | null }[];
  }): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'guardar-respuestas', dto);
  }
}
