import { TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { Router } from "@angular/router";
import { of, Subject, throwError } from "rxjs";
import { ExamenesComponent } from "./examenes.component";
import { ExamenService } from "../../services/examen.service";
import { RegistroService } from "../../services/registro.service";
import { AuthService } from "../../services/auth.service";
import { AlumnoService } from "../../services/alumno.service";
import { HorarioExamen, TipoExamen, vacantesDisponibles } from "../../models/examen";

describe("Selección de horarios de examen", () => {
  let component: ExamenesComponent;
  let service: jasmine.SpyObj<ExamenService>;
  let alumno: jasmine.SpyObj<AlumnoService>;
  const pendiente = { idItem: 1, item: "Speaking", formato: "Regular", nota: 0, tieneNota: false };
  const registrada = { idItem: 2, item: "Writing", formato: "Regular", nota: 0, tieneNota: true };
  const tipo = { idTipoExamen: 2, descripcion: "Clasificación", estado: true } as TipoExamen;
  const horario = { idHorarioExamen: 10, capacidad: 5, matriculados: 4 } as HorarioExamen;

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 9, 15, 14, 30));
    service = jasmine.createSpyObj("ExamenService", ["listarTiposExamen", "obtenerHorariosExamen", "alumnoRegistradoEnExamen"]);
    service.listarTiposExamen.and.returnValue(of([tipo]));
    service.obtenerHorariosExamen.and.returnValue(of([horario]));
    service.alumnoRegistradoEnExamen.and.returnValue(of(false));
    alumno = jasmine.createSpyObj("AlumnoService", ["obtenerNotasRegistro"]);
    alumno.obtenerNotasRegistro.and.returnValue(of({ idRegistro: 20, items: [pendiente, registrada] }));
    TestBed.configureTestingModule({ providers: [
      { provide: Router, useValue: jasmine.createSpyObj("Router", ["navigate"]) },
      { provide: ExamenService, useValue: service },
      { provide: RegistroService, useValue: { obtenerUltimoRegistroPorAlumno: () => of({ idHorario: 30, idRegistro: 20, curso: "Basic 01" }) } },
      { provide: AlumnoService, useValue: alumno },
      { provide: AuthService, useValue: { currentUser: signal({ codigo: 123, userName: "documento" }) } },
    ] });
    component = TestBed.runInInjectionContext(() => new ExamenesComponent());
    component.ngOnInit();
    component.form.setValue({ fecha: new Date(2026, 9, 15), idTipoExamen: 2 });
  });

  afterEach(() => jasmine.clock().uninstall());

  it("consulta con el código del alumno y permite seleccionar una vacante", () => {
    component.buscarHorarios();
    expect(service.obtenerHorariosExamen).toHaveBeenCalledWith("2026-10-15", 2, "documento");
    expect(service.alumnoRegistradoEnExamen).toHaveBeenCalledWith(123, 2);
    component.seleccionarHorario(horario);
    expect(component.seleccionado()).toBe(horario);
  });

  it("permite seleccionar otro rezagado y delega el límite por periodo al backend", () => {
    const rezagado = { ...tipo, idTipoExamen: 3, abreviatura: " R " };
    const horarioRezagado = { ...horario, idTipoExamen: 3 };
    component.tipos.set([tipo, rezagado]);
    component.form.controls.idTipoExamen.setValue(3);
    component.seleccionarNota(pendiente);
    service.alumnoRegistradoEnExamen.and.returnValue(of(true));
    service.obtenerHorariosExamen.and.returnValue(of([horarioRezagado]));
    component.buscarHorarios();
    expect(service.alumnoRegistradoEnExamen).not.toHaveBeenCalled();
    expect(service.obtenerHorariosExamen).toHaveBeenCalledWith("2026-10-15", 3, "documento", [1]);
    expect(component.registrado()).toBeFalse();
    component.seleccionarHorario(horarioRezagado);
    expect(component.seleccionado()).toBe(horarioRezagado);
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(["/resumen-examen"], {
      state: { horario: horarioRezagado, tipoExamen: rezagado, idItems: [1] },
    });
  });

  it("muestra el rechazo del backend cuando se alcanza el límite de rezagados", () => {
    component.tipos.set([{ ...tipo, abreviatura: "R" }]);
    component.form.controls.idTipoExamen.setValue(2);
    component.seleccionarNota(pendiente);
    const mensaje = "Solo puedes rendir dos exámenes rezagados por periodo.";
    service.obtenerHorariosExamen.and.returnValue(throwError(() =>
      new HttpErrorResponse({ status: 400, error: mensaje })));
    component.buscarHorarios();
    expect(component.error()).toBe(mensaje);
    expect(component.horarios()).toEqual([]);
    expect(component.consultado()).toBeFalse();
    expect(component.cargando()).toBeFalse();
  });

  it("evita consultar horarios si el alumno no tiene documento", () => {
    const auth = TestBed.inject(AuthService);
    const alumno = auth.currentUser()!;
    spyOn(auth, "currentUser").and.returnValue({ ...alumno, userName: "  " });
    component.buscarHorarios();
    expect(service.obtenerHorariosExamen).not.toHaveBeenCalled();
    expect(service.alumnoRegistradoEnExamen).not.toHaveBeenCalled();
    expect(component.error()).toBeTruthy();
    expect(component.cargando()).toBeFalse();
  });

  it("carga las notas al elegir rezagado y exige una pendiente antes de consultar", () => {
    component.tipos.set([{ ...tipo, abreviatura: "R" }]);
    component.form.controls.idTipoExamen.setValue(2);
    expect(alumno.obtenerNotasRegistro).toHaveBeenCalledWith(30, 20, true);
    expect(service.obtenerHorariosExamen).not.toHaveBeenCalled();
    component.seleccionarNota(registrada);
    component.buscarHorarios();
    expect(service.obtenerHorariosExamen).not.toHaveBeenCalled();
    component.seleccionarNota(pendiente);
    component.buscarHorarios();
    expect(service.obtenerHorariosExamen).toHaveBeenCalledWith("2026-10-15", 2, "documento", [1]);
  });

  it("limpia los horarios al cambiar el ítem y omite idItem al cambiar a clasificación", () => {
    const otro = { ...pendiente, idItem: 3, item: "Reading" };
    alumno.obtenerNotasRegistro.and.returnValue(of({ idRegistro: 20, items: [pendiente, otro] }));
    component.tipos.set([tipo, { ...tipo, idTipoExamen: 3, abreviatura: "R" }]);
    component.form.controls.idTipoExamen.setValue(3);
    component.seleccionarNota(pendiente);
    component.buscarHorarios();
    component.seleccionarNota(otro);
    expect(component.horarios()).toEqual([]);
    expect(component.consultado()).toBeFalse();
    component.form.controls.idTipoExamen.setValue(2);
    expect(component.idItemsSeleccionados()).toEqual([]);
    component.buscarHorarios();
    expect(service.obtenerHorariosExamen.calls.mostRecent().args).toEqual(["2026-10-15", 2, "documento"]);
  });

  it("descarta la carga de notas si cambia el tipo de examen", () => {
    const pendientes = new Subject<{ idRegistro: number; items: typeof pendiente[] }>();
    alumno.obtenerNotasRegistro.and.returnValue(pendientes);
    component.tipos.set([tipo, { ...tipo, idTipoExamen: 3, abreviatura: "R" }]);
    component.form.controls.idTipoExamen.setValue(3);
    expect(component.cargandoNotas()).toBeTrue();
    component.form.controls.idTipoExamen.setValue(2);
    pendientes.next({ idRegistro: 20, items: [pendiente] });
    expect(component.notas()).toEqual([]);
    expect(component.cargandoNotas()).toBeFalse();
  });

  it("limita a dos pendientes, consulta ambos y permite desmarcar", () => {
    const otro = { ...pendiente, idItem: 10, item: "Reading" };
    const tercero = { ...pendiente, idItem: 11, item: "Listening" };
    alumno.obtenerNotasRegistro.and.returnValue(of({ idRegistro: 20, items: [pendiente, otro, tercero] }));
    component.tipos.set([{ ...tipo, abreviatura: "R" }]);
    component.form.controls.idTipoExamen.setValue(2);
    component.seleccionarNota(pendiente);
    component.seleccionarNota(otro);
    component.seleccionarNota(tercero);
    expect(component.idItemsSeleccionados()).toEqual([1, 10]);
    service.obtenerHorariosExamen.and.returnValue(of([horario]));
    component.buscarHorarios();
    expect(service.obtenerHorariosExamen).toHaveBeenCalledOnceWith("2026-10-15", 2, "documento", [1, 10]);
    expect(component.horarios()).toEqual([horario]);
    component.seleccionarNota(pendiente);
    expect(component.idItemsSeleccionados()).toEqual([10]);
    expect(component.horarios()).toEqual([]);
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

  it("rechaza fechas anteriores a hoy aunque se asignen fuera del calendario", () => {
    component.form.controls.fecha.setValue(new Date(2026, 9, 14));
    component.buscarHorarios();
    expect(component.error()).toContain("desde hoy");
    expect(service.obtenerHorariosExamen).not.toHaveBeenCalled();
  });

  it("permite hoy desde medianoche y las fechas futuras", () => {
    expect(component.fechaMinima).toEqual(new Date(2026, 9, 15));
    component.buscarHorarios();
    expect(service.obtenerHorariosExamen).toHaveBeenCalledWith("2026-10-15", 2, "documento");
    component.form.controls.fecha.setValue(new Date(2026, 9, 16));
    component.buscarHorarios();
    expect(service.obtenerHorariosExamen).toHaveBeenCalledWith("2026-10-16", 2, "documento");
  });

  it("nunca ofrece vacantes negativas o con capacidad desconocida", () => {
    expect(vacantesDisponibles({ ...horario, matriculados: 6 })).toBe(0);
    expect(vacantesDisponibles({ ...horario, capacidad: undefined })).toBe(0);
  });
});
