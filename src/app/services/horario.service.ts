import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../environments/environment.development";
import { map, Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})export class HorarioService{
    private http = inject(HttpClient);
    apiUrl = environment.apiUrl + 'Horario/';
    
    obtenerHorarioPorCursoYPeriodo(idCurso: number, idPeriodo: number, docId: string) {
        return this.http.get(this.apiUrl + 'ObtenerHorarioPorCursoYPeriodo/' + idCurso + '/' + idPeriodo + '/' + docId);
    }

    obtenerResumenPago(idHorario: number, docId: string) {
        return this.http.get(this.apiUrl + 'ResumenPago/' + idHorario + '/' + docId);
    }

    

    
}