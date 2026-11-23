import { ChangeDetectorRef } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { of, throwError } from "rxjs";
import { AlumnoService } from "../../services/alumno.service";
import { AuthService } from "../../services/auth.service";
import { NiubizService } from "../../services/niubiz.service";
import { RegistroService } from "../../services/registro.service";
import { ResumenExamenComponent } from "./resumen-examen.component";

describe("Actividad del examen rezagado", () => {
  let component: ResumenExamenComponent;
  let alumno: jasmine.SpyObj<AlumnoService>;
  let niubiz: jasmine.SpyObj<NiubizService>;
  let registro: jasmine.SpyObj<RegistroService>;
  let estadoAnterior: unknown;
  const pendiente = { idItem: 1, item: "Speaking", formato: "Regular", nota: 0, tieneNota: false };
  const ceroRegistrado = { idItem: 2, item: "Writing", formato: "Regular", nota: 0, tieneNota: true };

  beforeEach(() => {
    estadoAnterior = history.state;
    history.replaceState({
      horario: { idHorarioExamen: 10, costo: 30 },
      tipoExamen: { idTipoExamen: 3, abreviatura: "R" },
      idItems: [1],
    }, "");
    alumno = jasmine.createSpyObj("AlumnoService", ["obtenerNotasRegistro"]);
    alumno.obtenerNotasRegistro.and.returnValue(of({ idRegistro: 20, items: [pendiente, ceroRegistrado] }));
    registro = jasmine.createSpyObj("RegistroService", ["obtenerUltimoRegistroPorAlumno"]);
    registro.obtenerUltimoRegistroPorAlumno.and.returnValue(of({
      idRegistro: 20, idHorario: 30, curso: "Basic 01",
    } as any));
    niubiz = jasmine.createSpyObj("NiubizService", ["prepararYCrearSession"]);
    niubiz.prepararYCrearSession.and.returnValue(of({ sessionKey: "sesion", expirationTime: 20, webSessionID: "web" }));
    TestBed.configureTestingModule({ providers: [
      { provide: Router, useValue: jasmine.createSpyObj("Router", ["navigate"]) },
      { provide: ChangeDetectorRef, useValue: jasmine.createSpyObj("ChangeDetectorRef", ["markForCheck", "detectChanges"]) },
      { provide: AuthService, useValue: { currentUser: () => ({ codigo: 123, userName: "01234567" }) } },
      { provide: AlumnoService, useValue: alumno },
      { provide: RegistroService, useValue: registro },
      { provide: NiubizService, useValue: niubiz },
    ] });
    component = TestBed.runInInjectionContext(() => new ResumenExamenComponent());
    component.terminosAceptados = true;
  });

  afterEach(() => history.replaceState(estadoAnterior, ""));

  it("consulta las notas del registro actual y conserva los ceros registrados", () => {
    component.cargarNotas();
    expect(registro.obtenerUltimoRegistroPorAlumno).toHaveBeenCalledWith("01234567");
    expect(alumno.obtenerNotasRegistro).toHaveBeenCalledWith(30, 20, true);
    expect(component.notas).toEqual([pendiente, ceroRegistrado]);
    component.idItemsSeleccionados = [];
    component.seleccionarNota(ceroRegistrado);
    expect(component.actividadValida).toBeFalse();
    component.seleccionarNota(pendiente);
    expect(component.actividadesSeleccionadas.map(nota => nota.item)).toEqual(["Speaking"]);
  });

  it("exige una actividad pendiente antes de preparar el pago", () => {
    component.idItemsSeleccionados = [];
    component.cargarNotas();
    component.iniciarPago();
    expect(niubiz.prepararYCrearSession).not.toHaveBeenCalled();
    expect(component.mensajeClase).toBe("error");
  });

  it("envía el idItem y fija la selección al preparar la sesión", () => {
    component.cargarNotas();
    component.iniciarPago();
    expect(niubiz.prepararYCrearSession).toHaveBeenCalledWith(jasmine.objectContaining({
      idItems: [1], idHorario: 10, idTipoExamen: 3,
    }), 123);
    expect("actividad" in niubiz.prepararYCrearSession.calls.mostRecent().args[0]).toBeFalse();
    component.seleccionarNota(ceroRegistrado);
    expect(component.actividadesSeleccionadas.map(nota => nota.item)).toEqual(["Speaking"]);
  });

  it("envía idItem en la URL de retorno y en el formulario de confirmación", () => {
    const checkoutAnterior = (window as any).VisanetCheckout;
    const pedidoAnterior = sessionStorage.getItem("niubiz_purchase_number");
    const configure = jasmine.createSpy("configure");
    const open = jasmine.createSpy("open");
    let formulario: HTMLFormElement | undefined;
    spyOn(HTMLFormElement.prototype, "submit").and.callFake(function (this: HTMLFormElement) {
      formulario = this;
    });
    (window as any).VisanetCheckout = { configure, open };
    try {
      const otro = { ...pendiente, idItem: 10, item: "Reading" };
      alumno.obtenerNotasRegistro.and.returnValue(of({ idRegistro: 20, items: [pendiente, otro] }));
      component.idItemsSeleccionados = [1, 10];
      component.cargarNotas();
      component.terminosAceptados = true;
      component.iniciarPago();
      expect(niubiz.prepararYCrearSession).toHaveBeenCalledWith(jasmine.objectContaining({
        idItems: [1, 10], amount: 30,
      }), 123);
      expect(open).not.toHaveBeenCalled();
      expect(configure).not.toHaveBeenCalled();
      component.abrirPagoNiubiz();
      expect(configure).toHaveBeenCalledTimes(1);
      expect(open).toHaveBeenCalledTimes(1);
      // Si se cierra el checkout, Pagar con Niubiz reutiliza la sesión preparada.
      component.abrirPagoNiubiz();
      expect(open).toHaveBeenCalledTimes(2);
      expect(niubiz.prepararYCrearSession).toHaveBeenCalledTimes(1);
      const configuracion = configure.calls.mostRecent().args[0];
      expect(new URL(configuracion.action).searchParams.getAll("idItems")).toEqual(["1", "10"]);
      expect(new URL(configuracion.action).searchParams.has("actividad")).toBeFalse();
      configuracion.complete({ transactionToken: "token-prueba" });
      expect(formulario).toBeDefined();
      expect(new FormData(formulario!).getAll("idItems")).toEqual(["1", "10"]);
      expect(new FormData(formulario!).has("actividad")).toBeFalse();
    } finally {
      formulario?.remove();
      (window as any).VisanetCheckout = checkoutAnterior;
      if (pedidoAnterior === null) sessionStorage.removeItem("niubiz_purchase_number");
      else sessionStorage.setItem("niubiz_purchase_number", pedidoAnterior);
    }
  });

  it("rechaza selecciones excesivas, duplicadas o con notas registradas", () => {
    for (const ids of [[1, 1], [1, 2], [1, 10, 11], [999]]) {
      component.idItemsSeleccionados = ids;
      component.cargarNotas();
      component.iniciarPago();
      expect(component.actividadValida).toBeFalse();
      expect(niubiz.prepararYCrearSession).not.toHaveBeenCalled();
    }
  });

  it("bloquea el pago si falla la consulta de notas", () => {
    alumno.obtenerNotasRegistro.and.returnValue(throwError(() => new Error("sin conexión")));
    component.cargarNotas();
    component.iniciarPago();
    expect(component.errorNotas).toBeTruthy();
    expect(component.cargandoNotas).toBeFalse();
    expect(niubiz.prepararYCrearSession).not.toHaveBeenCalled();
  });

  it("no interpreta respuestas antiguas sin indicador como notas vacías", () => {
    alumno.obtenerNotasRegistro.and.returnValue(of({ idRegistro: 20, items: [{ ...pendiente, tieneNota: undefined }] } as any));
    component.cargarNotas();
    expect(component.errorNotas).toBeTruthy();
    expect(component.actividadValida).toBeFalse();
  });

  it("mantiene el pago de clasificación sin actividad", () => {
    history.replaceState({ horario: { idHorarioExamen: 10, costo: 30 }, tipoExamen: { idTipoExamen: 2, abreviatura: "C" } }, "");
    component = TestBed.runInInjectionContext(() => new ResumenExamenComponent());
    component.terminosAceptados = true;
    component.iniciarPago();
    expect(component.actividadValida).toBeTrue();
    expect(niubiz.prepararYCrearSession.calls.mostRecent().args[0].idItems).toBeUndefined();
    expect(alumno.obtenerNotasRegistro).not.toHaveBeenCalled();
  });

  it("no prepara el pago hasta aceptar los términos", () => {
    component.cargarNotas();
    component.terminosAceptados = false;
    component.iniciarPago();
    expect(niubiz.prepararYCrearSession).not.toHaveBeenCalled();
  });
});
