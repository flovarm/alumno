import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../environments/environment.development";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class LibroService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + 'Libro/';

  obtenerLibroUltimoCurso(idCurso: number, sede: string): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'ultimo-curso/' + idCurso + '/' + encodeURIComponent(sede));
  }

  listarTiposLibros()  {
    return this.http.get(this.apiUrl + 'tipos-libro');
  }

  registrarLibro(libroCompradoDto: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'registrar', libroCompradoDto);
  }

  
}
