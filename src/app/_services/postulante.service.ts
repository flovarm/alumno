import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Postulante } from '../models/postulante';


@Injectable({
  providedIn: 'root'
})
export class PostulanteService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + 'postulante/';

  getByNumeroDocumento(numeroDocumento: string): Observable<Postulante> {
    return this.http.get<Postulante>(`${this.apiUrl}documento/${numeroDocumento}`);
  }
}
