import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, tap } from "rxjs";
import { AsistenciaAlumno } from "../models/AsistenciaAlumno";
import { environment } from "../../environments/environment.development";

@Injectable({
  providedIn: "root",
})
export class AlumnoService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Verifica si existe un alumno por DNI y obtiene su código
   * @param dni DNI del alumno
   */
  verificarDni(dni: string): Observable<{ existe: boolean; codigo: string }> {
    return this.http.get<{ existe: boolean; codigo: string }>(
      `${this.apiUrl}Alumno/verificar-dni/${dni}`,
    );
  }

  /**
   * Obtiene el historial académico del alumno
   * @param alumnoId ID del alumno
   */
  getHistorialAcademico(alumnoId: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}Alumno/${alumnoId}/historial-academico`,
    );
  }

  /**
   * Obtiene el perfil del alumno por DNI
   * @param dni DNI del alumno
   */
  getPerfil(dni: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}Alumno/perfil/${encodeURIComponent(dni)}`,
    );
  }

  ObtenerLista(idHorario: number, Codigo?: number) {
    if (Codigo) {
      return this.http.get<AsistenciaAlumno[]>(
        this.apiUrl + "AsistenciaAlumno/Detalle2/" + idHorario + "/" + Codigo,
      );
    }
    return this.http.get(this.apiUrl + idHorario);
  }

  listarNotas(idHorario: number, idFormatoNota: number, idRegistro?: number) {
    if (idRegistro) {
      return this.http.get(
        `${this.apiUrl}Nota/Detalle/${idHorario}/${idFormatoNota}/${idRegistro}`,
      );
    }
    return this.http.get(`${this.apiUrl}${idHorario}/${idFormatoNota}`);
  }

   updateAlumno(codigo: number, alumnoData: any) {        
        return this.http.patch(`${this.apiUrl}alumno/actualizarPerfil/${codigo}`, alumnoData).pipe(
            tap({
                next: (response) => console.log('AlumnoService.updateAlumno - Respuesta exitosa:', response),
            })
        );
    }
    

    obtenerCuentaTeams(idteams: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}StudentAccount/${idteams}`);
    }

}
