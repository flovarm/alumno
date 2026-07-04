import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../environments/environment.development";

@Injectable({
  providedIn: "root",
})
export class ComunicadoService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + "comunicado";
  constructor() {}

  listarComunicados() {
    return this.http.get(this.apiUrl + "/rango-fechas");
  }
}