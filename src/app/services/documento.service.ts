import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface DocumentoAlumnoReturn {
  Correlativo: string;
  Fecha_Doc?: string; // DateTime en backend, string en JSON
  Total?: number;
  Detalle_Doc?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentoService {
  private apiUrl = environment.apiUrl + 'documento';
  http = inject(HttpClient);  


  getDocumentosByAlumnoId(idAlumno: number): Observable<DocumentoAlumnoReturn[]> {
    return this.http.get<DocumentoAlumnoReturn[]>(`${this.apiUrl}/${idAlumno}`);
  }
}
