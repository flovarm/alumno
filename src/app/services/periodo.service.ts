import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../environments/environment.development";

@Injectable({
    providedIn: 'root'
})export class PeriodoService{
    http =  inject(HttpClient);
    apiUrl = environment.apiUrl + 'Periodo/'
    

    listarPeriodo() {
        return this.http.get(this.apiUrl);
    }

    obtenerPeriodo(idPeriodo: number){
        return this.http.get(this.apiUrl + idPeriodo );
    }

    listaPeriodosAño(año: number) {
        return this.http.get(this.apiUrl + 'Año/' + año);
    }

    ultimos12Periodos() {
    return this.http.get(this.apiUrl + 'Ultimos12');
    }

    listarPeriodosPorDocente(idProfesor: number) {
        return this.http.get(this.apiUrl + 'Profesor/' + idProfesor);
    }

    listarTodosPeriodos() {
        return this.http.get(this.apiUrl + 'Todos');
    }
}