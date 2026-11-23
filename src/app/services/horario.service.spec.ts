import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment.development';
import { HorarioService } from './horario.service';

describe('HorarioService', () => {
  it('consulta el horario del alumno del mes actual sin enviar fecha', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);
    TestBed.inject(HorarioService).obtenerHorarioAlumno(12345).subscribe(eventos => expect(eventos).toEqual([]));
    const req = http.expectOne(environment.apiUrl + 'Horario/ObtenerHorarioAlumno/12345');
    expect(req.request.method).toBe('GET');
    req.flush([]);
    http.verify();
  });

  it('envía la fecha como query parameter cuando se especifica', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);
    TestBed.inject(HorarioService).obtenerHorarioAlumno(12345, '2026-12-01').subscribe(eventos => expect(eventos).toEqual([]));
    const req = http.expectOne(environment.apiUrl + 'Horario/ObtenerHorarioAlumno/12345?fecha=2026-12-01');
    expect(req.request.method).toBe('GET');
    req.flush([]);
    http.verify();
  });
});
