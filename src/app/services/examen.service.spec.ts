import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { ExamenService } from "./examen.service";
import { environment } from "../../environments/environment.development";

describe("ExamenService", () => {
  let service: ExamenService;
  let http: HttpTestingController;
  const apiUrl = environment.apiUrl + "Examen/";
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ExamenService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it("envía fecha e idTipoExamen como parámetros de consulta", () => {
    service.obtenerHorariosExamen("2026-10-15", 2).subscribe();
    const req = http.expectOne(r => r.url === apiUrl + "Horarios");
    expect(req.request.method).toBe("GET");
    expect(req.request.params.get("fecha")).toBe("2026-10-15");
    expect(req.request.params.get("idTipoExamen")).toBe("2");
    req.flush([]);
  });

  it("omite el tipo cuando se verifica cualquier registro del alumno", () => {
    service.alumnoRegistradoEnExamen(123).subscribe();
    const req = http.expectOne(apiUrl + "AlumnoRegistrado/123");
    expect(req.request.params.has("idTipoExamen")).toBeFalse();
    req.flush(false);
  });
});
