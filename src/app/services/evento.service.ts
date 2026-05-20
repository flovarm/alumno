import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../environments/environment.development";

@Injectable({
  providedIn: "root",
})
export class EventoService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + "Evento/";

  listarEventosDesdeAhora() {
    return this.http.get(this.apiUrl + "EventosDesdeAhora");
  }
}
