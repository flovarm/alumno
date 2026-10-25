import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';
import { AlumnoService } from '../../services/alumno.service';
import { TurnoService } from '../../services/turno.service';
import { NotasDetalleDialogComponent } from './detalle-Historial.component';

describe('Minutos de asistencia del detalle académico', () => {
  let component: NotasDetalleDialogComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AlumnoService, useValue: {} },
        { provide: TurnoService, useValue: {} },
      ],
    });
    component = TestBed.runInInjectionContext(() => new NotasDetalleDialogComponent(
      { element: {} }, {} as MatDialogRef<NotasDetalleDialogComponent>,
    ));
    component.limiteTurno.set({
      numeroHorasTurno: 2, numeroMaximoFaltas: 2, totalHorasMaximoFalta: 4,
    });
    component.asistenciaData.set({ '2026-10-01': 'A', '2026-10-02': 'T - 15' });
    component.minutosClasePorFecha.set({ '2026-10-01': 120, '2026-10-02': 90 });
  });

  it('descuenta una recuperación parcial en minutos y conserva la falta registrada', () => {
    // Recuperación de 60 minutos con 10 minutos de tardanza: 50 recuperados.
    component.recuperacionesList.set([
      { fecha: '2026-10-03', estado: 'T - 10', minutosRecuperados: 50 },
    ]);
    expect(component.resumenAsistencia().falta).toBe(1);
    expect(component.minutosTardanza()).toBe(15);
    expect(component.balanceAsistencia()).toEqual(jasmine.objectContaining({
      minutosFaltasRegistradas: 120, minutosRecuperados: 50,
      minutosFaltas: 70, totalMinutos: 85,
    }));
  });

  it('limita el descuento al total de faltas sin borrar tardanzas regulares', () => {
    component.recuperacionesList.set([
      { fecha: '2026-10-03', estado: 'P', minutosRecuperados: 180 },
    ]);
    expect(component.balanceAsistencia()).toEqual(jasmine.objectContaining({
      minutosDescontados: 120, minutosFaltas: 0, totalMinutos: 15,
    }));
  });

  it('no descuenta recuperaciones sin duración e informa el dato faltante', () => {
    component.recuperacionesList.set([
      { fecha: '2026-10-03', estado: 'P', minutosRecuperados: null },
      { fecha: '2026-10-04', estado: 'A', minutosRecuperados: 0 },
    ]);
    expect(component.recuperacionesSinDuracion()).toBeTrue();
    expect(component.balanceAsistencia()?.totalMinutos).toBe(135);
  });

  it('actualiza la condición del alumno según los minutos pendientes', () => {
    component.asistenciaData.set({ a: 'A', b: 'A', c: 'A' });
    component.minutosClasePorFecha.set({ a: 120, b: 120, c: 120 });
    expect(component.balanceAsistencia()?.inhabilitado).toBeTrue();
    component.recuperacionesList.set([
      { fecha: '2026-10-03', estado: 'P', minutosRecuperados: 120 },
    ]);
    expect(component.balanceAsistencia()?.inhabilitado).toBeFalse();
    expect(component.balanceAsistencia()?.advertencia).toBeTrue();
  });

  it('suma las duraciones de cada fecha aunque difieran del turno', () => {
    component.asistenciaData.set({ a: 'A', b: 'A', c: 'P' });
    component.minutosClasePorFecha.set({ a: 45, b: 90, c: 180 });
    expect(component.balanceAsistencia()?.minutosFaltasRegistradas).toBe(135);
    component.limiteTurno.update(limite => ({ ...limite!, numeroHorasTurno: 8 }));
    expect(component.balanceAsistencia()?.minutosFaltasRegistradas).toBe(135);
  });

  it('no sustituye una duración faltante o inválida con la duración del turno', () => {
    component.minutosClasePorFecha.set({});
    expect(component.faltasSinDuracion()).toBeTrue();
    expect(component.balanceAsistencia()).toBeNull();
    component.minutosClasePorFecha.set({ '2026-10-01': -10 });
    expect(component.balanceAsistencia()).toBeNull();
  });

  it('muestra los 10 minutos registrados de recuperación aunque el estado solo sea T', () => {
    const servicio = TestBed.inject(AlumnoService);
    servicio.ObtenerLista = () => of([{
      alumno: 'Alumno', idAlumno: 1,
      asistenciasPorFecha: { '2026-10-01': 'A' },
      minutosClasePorFecha: { '2026-10-01': 120 },
      recuperaciones: [{
        fechaRecuperacion: '2026-10-03', estado: 'T',
        minTardanza: 10, minutosRecuperados: 50,
      }],
    }]);
    const detalle = TestBed.runInInjectionContext(() => new NotasDetalleDialogComponent(
      { element: { idHorario: 1, codigo: 1 } }, {} as MatDialogRef<NotasDetalleDialogComponent>,
    ));
    const rec = detalle.recuperacionesList()[0];
    expect(detalle.formatAsistencia(rec.estado, rec.minTardanza)).toBe('Tardanza(10 min)');
    expect(detalle.minutosRecuperados()).toBe(50);
  });

  it('respeta cero minutos registrados y muestra minutos solo para tardanzas', () => {
    expect(component.formatAsistencia('T', 0)).toBe('Tardanza(0 min)');
    expect(component.formatAsistencia('P', 10)).toBe('Asistió');
    expect(component.formatAsistencia('A', 10)).toBe('Falta');
  });
  it('asigna 5 minutos a tardanzas sin minutos y conserva los valores explicitos', () => {
    component.asistenciaData.set({
      dia1: 'T', dia2: 't -', dia3: 'T - 10', dia4: 'T:0',
      dia5: '2,5 min', dia6: 'T1.5', dia7: 'P', dia8: 'A', dia9: 'F', dia10: '',
    });

    expect(component.minutosTardanza()).toBe(24);
    expect(component.formatAsistencia('T')).toBe('Tardanza(5 min)');
    expect(component.formatAsistencia('T:0')).toBe('Tardanza(0 min)');
    expect(component.formatAsistencia('2,5 min')).toBe('Tardanza(2.5 min)');
  });

});
