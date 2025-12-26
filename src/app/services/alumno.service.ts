import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AsistenciaAlumno } from '../models/AsistenciaAlumno';

@Injectable({
  providedIn: 'root'
})
export class AlumnoService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Verifica si existe un alumno por DNI y obtiene su código
   * @param dni DNI del alumno
   */
  verificarDni(dni: number): Observable<{ existe: boolean; codigo: string }> {
    return this.http.get<{ existe: boolean; codigo: string }>(`${this.apiUrl}Alumno/verificar-dni`, { params: { dni: dni.toString() } });
  }

  /**
   * Obtiene el historial académico del alumno
   * @param alumnoId ID del alumno
   */
  getHistorialAcademico(alumnoId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Alumno/${alumnoId}/historial-academico`);
  }

   ObtenerLista(idHorario: number , Codigo?: number) {
        if (Codigo) {
            return this.http.get<AsistenciaAlumno[]>(this.apiUrl + "AsistenciaAlumno/Detalle/" + idHorario + "/" + Codigo);
        }
        return this.http.get(this.apiUrl + idHorario);
    }

       listarNotas(idHorario: number, idFormatoNota: number, idRegistro?: number) {
        if (idRegistro) {
            return this.http.get(`${this.apiUrl}Nota/Detalle/${idHorario}/${idFormatoNota}/${idRegistro}`);
        }
        return this.http.get(`${this.apiUrl}${idHorario}/${idFormatoNota}`);
    }
}
