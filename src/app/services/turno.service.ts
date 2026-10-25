import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../environments/environment.development";

export interface NumeroHorasMaximoTurno {
  numeroHorasTurno: number;
  numeroMaximoFaltas: number;
  totalHorasMaximoFalta: number;
}

@Injectable({ providedIn: "root" })
export class TurnoService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl + "Turno/";

  numeroHorasMaximoTurno(idTurno: number) {
    return this.http.get<NumeroHorasMaximoTurno>(
      `${this.apiUrl}NumeroHorasMaximoTurno/${idTurno}`,
    );
  }
}
