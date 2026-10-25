import { TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { of, Subject, throwError } from "rxjs";
import { ExamenesComponent } from "./examenes.component";
import { ExamenService } from "../../services/examen.service";
import { RegistroService } from "../../services/registro.service";
import { AuthService } from "../../services/auth.service";
import { HorarioExamen, TipoExamen, vacantesDisponibles } from "../../models/examen";

describe("Selección de horarios de examen", () => {
  let component: ExamenesComponent;
  let service: jasmine.SpyObj<ExamenService>;
  const tipo = { idTipoExamen: 2, descripcion: "Clasificación", estado: true } as TipoExamen;
  const horario = { idHorarioExamen: 10, capacidad: 5, matriculados: 4 } as HorarioExamen;

  beforeEach(() => {
    service = jasmine.createSpyObj("ExamenService", ["listarTiposExamen", "obtenerHorariosExamen", "alumnoRegistradoEnExamen"]);
    service.listarTiposExamen.and.returnValue(of([tipo]));
    service.obtenerHorariosExamen.and.returnValue(of([horario]));
    service.alumnoRegistradoEnExamen.and.returnValue(of(false));
    TestBed.configureTestingModule({ providers: [
      { provide: ExamenService, useValue: service },
      { provide: RegistroService, useValue: { obtenerUltimoRegistroPorAlumno: () => of(null) } },
      { provide: AuthService, useValue: { currentUser: signal({ codigo: 123, userName: "documento" }) } },
    ] });
    component = TestBed.runInInjectionContext(() => new ExamenesComponent());
    component.ngOnInit();
    component.form.setValue({ fecha: new Date(2026, 9, 15), idTipoExamen: 2 });
  });

  it("consulta con el código del alumno y permite seleccionar una vacante", () => {
    component.buscarHorarios();
    expect(service.obtenerHorariosExamen).toHaveBeenCalledWith("2026-10-15", 2);
    expect(service.alumnoRegistradoEnExamen).toHaveBeenCalledWith(123, 2);
    component.seleccionarHorario(horario);
    expect(component.seleccionado()).toBe(horario);
  });

  it("bloquea horarios completos y alumnos ya registrados", () => {
    component.buscarHorarios();
    const lleno = { ...horario, matriculados: 5 };
    component.horarios.set([lleno]);
    component.seleccionarHorario(lleno);
    expect(component.seleccionado()).toBeNull();
    component.horarios.set([horario]);
    component.registrado.set(true);
    component.seleccionarHorario(horario);
    expect(component.seleccionado()).toBeNull();
  });

  it("limpia la selección al cambiar los filtros", () => {
    component.buscarHorarios();
    component.seleccionarHorario(horario);
    component.form.controls.fecha.setValue(new Date(2026, 9, 16));
    expect(component.seleccionado()).toBeNull();
    expect(component.horarios()).toEqual([]);
    expect(component.registrado()).toBeNull();
  });

  it("descarta respuestas pendientes si cambian los filtros", () => {
    const pendientes = new Subject<HorarioExamen[]>();
    service.obtenerHorariosExamen.and.returnValue(pendientes);
    component.buscarHorarios();
    expect(component.cargando()).toBeTrue();
    component.form.controls.fecha.setValue(new Date(2026, 9, 16));
    pendientes.next([horario]);
    pendientes.complete();
    expect(component.horarios()).toEqual([]);
    expect(component.cargando()).toBeFalse();
    expect(component.consultado()).toBeFalse();
  });

  it("bloquea la selección si falla la verificación del registro", () => {
    service.alumnoRegistradoEnExamen.and.returnValue(throwError(() => new Error("sin conexión")));
    component.buscarHorarios();
    component.seleccionarHorario(horario);
    expect(component.error()).toBeTruthy();
    expect(component.seleccionado()).toBeNull();
    expect(component.cargando()).toBeFalse();
  });

  it("rechaza fechas inválidas y el límite excluido por el controlador", () => {
    for (const fecha of [new Date(9999, 11, 31), new Date(NaN), new Date("0000-12-31T00:00:00")]) {
      component.form.controls.fecha.setValue(fecha);
      expect(() => component.buscarHorarios()).not.toThrow();
      expect(component.error()).toBeTruthy();
    }
    expect(service.obtenerHorariosExamen).not.toHaveBeenCalled();
  });

  it("nunca ofrece vacantes negativas o con capacidad desconocida", () => {
    expect(vacantesDisponibles({ ...horario, matriculados: 6 })).toBe(0);
    expect(vacantesDisponibles({ ...horario, capacidad: undefined })).toBe(0);
  });
});
