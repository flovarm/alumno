import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Component, DestroyRef, Inject, computed, signal, inject } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { AlumnoService } from "../../services/alumno.service";
import { NumeroHorasMaximoTurno, TurnoService } from "../../services/turno.service";

@Component({
  selector: "app-notas-detalle-dialog",
  standalone: true,
  imports: [
    MatDialogModule,
    MatIconModule,
    CommonModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title class="dialog-header">
      <mat-icon aria-hidden="true">school</mat-icon>
      Detalle académico
    </h2>
    <mat-dialog-content>
      <div class="detalle-list">
        <div class="detalle-item full-row">
          <mat-icon aria-hidden="true">person</mat-icon>
          <dl>
            <dt>Alumno</dt>
            <dd>{{ data?.element?.completo | titlecase }}</dd>
          </dl>
        </div>
        <div class="detalle-item">
          <mat-icon aria-hidden="true">description</mat-icon>
          <dl>
            <dt>Curso</dt>
            <dd>{{ data?.element?.descripcion || "" }}</dd>
          </dl>
        </div>
        @if (data?.element?.nombre) {
          <div class="detalle-item">
            <mat-icon aria-hidden="true">schedule</mat-icon>
            <dl>
              <dt>Turno</dt>
              <dd>{{ data?.element?.nombre }}</dd>
            </dl>
          </div>
        }
        @if (data?.element?.nombreAula) {
          <div class="detalle-item">
            <mat-icon aria-hidden="true">meeting_room</mat-icon>
            <dl>
              <dt>Aula</dt>
              <dd>{{ data?.element?.nombreAula }}</dd>
            </dl>
          </div>
        }
        @if (data?.element?.nombreCompleto) {
          <div class="detalle-item">
            <mat-icon aria-hidden="true">school</mat-icon>
            <dl>
              <dt>Profesor</dt>
              <dd>{{ data?.element?.nombreCompleto }}</dd>
            </dl>
          </div>
        }
      </div>
        <!-- Resumen de asistencia -->
        <div class="asistencia-resumen" aria-label="Resumen de asistencia">
          <div class="resumen-item resumen-asistencias">
            <strong>{{ resumenAsistencia().asistio }}</strong><span>Asistencias</span>
          </div>
          <div class="resumen-item resumen-tardanzas">
            <strong>{{ resumenAsistencia().tardanza }}</strong><span>Tardanzas</span>
          </div>
          <div class="resumen-item resumen-faltas">
            <strong>{{ resumenAsistencia().falta }}</strong><span>Faltas registradas</span>
            @if (balanceAsistencia(); as balance) {
              <span>{{ balance.minutosFaltas | number: '1.0-2' }} min pendientes</span>
            }
          </div>
        </div>
          <div
        aria-live="polite"
        class="limite-asistencia"
        [class.limite-asistencia--advertencia]="balanceAsistencia()?.advertencia"
        [class.limite-asistencia--inhabilitado]="balanceAsistencia()?.inhabilitado"
        [class.limite-asistencia--error]="!balanceAsistencia() && (errorLimite() || errorAsistencia())"
      >
        <h3 class="limite-asistencia-titulo">
          <mat-icon aria-hidden="true">info</mat-icon>
          Máximo permitido de inasistencias
        </h3>
        @if (balanceAsistencia(); as balance) {
          <table class="calculo-inasistencias" aria-label="Cálculo de minutos de inasistencia">
            <thead>
              <tr><th scope="col">Concepto</th><th scope="col">Minutos</th></tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Faltas registradas ({{ resumenAsistencia().falta }})</th>
                <td>+ {{ balance.minutosFaltasRegistradas | number: '1.0-2' }}</td>
              </tr>
              <tr>
                <th scope="row">Tardanzas en clases regulares</th>
                <td>+ {{ minutosTardanza() | number: '1.0-2' }}</td>
              </tr>
              <tr>
                <th scope="row">Descuento por recuperaciones</th>
                <td>− {{ balance.minutosDescontados | number: '1.0-2' }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">Total de inasistencias</th>
                <td>= {{ balance.totalMinutos | number: '1.0-2' }}</td>
              </tr>
            </tfoot>
          </table>
          <p>
            Máximo permitido:
            <strong class="limite-asistencia-permitido">{{ balance.maximoMinutos | number: '1.0-2' }} minutos</strong>.
          </p>
          <p class="margen-asistencia">
            @if (balance.restantes < 0) {
              Exceso sobre el límite: <strong>{{ -balance.restantes | number: '1.0-2' }} minutos</strong>.
            } @else {
              Margen disponible antes de superar el límite: <strong>{{ balance.restantes | number: '1.0-2' }} minutos</strong>.
            }
          </p>
          @if (balance.minutosRecuperados > balance.minutosDescontados) {
            <p class="recuperaciones-nota">
              Minutos recuperados: {{ balance.minutosRecuperados | number: '1.0-2' }}.
              El descuento se limita a los minutos de faltas registradas.
            </p>
          }
          @if (recuperacionesSinDuracion()) {
            <p class="recuperaciones-nota" role="alert">
              Hay recuperaciones sin duración disponible; no se descontaron sus minutos.
            </p>
          }
          @if (balance.inhabilitado) {
            <p class="limite-asistencia-alerta" role="alert">
              Condición actual del alumno: Inhabilitado por exceso de faltas.
            </p>
          } @else if (balance.advertencia) {
            <p class="limite-asistencia-alerta" role="alert">
              Condición actual del alumno: Crítica, a punto de ser inhabilitado.
            </p>
          } @else {
            <p class="limite-asistencia-alerta">
              Condición actual del alumno: Habilitado.
            </p>
          }
        } @else if (faltasSinDuracion()) {
          <p role="alert">No se puede calcular el total de faltas: faltan duraciones válidas en el detalle de horario de algunas fechas.</p>
        } @else if (errorLimite() || errorAsistencia()) {
          <p>No se pudo verificar el límite de inasistencias. {{ errorLimite() || errorAsistencia() }}</p>
        } @else {
          <p>Consultando el límite de inasistencias...</p>
        }
      </div>
      @if (dataSource().length > 0) {
        <div class="notas-asistencia-row mt-2">

        
          <!-- Notas -->
          <div class="notas-col">
            <h3 class="nota-vertical-title"><mat-icon aria-hidden="true">grade</mat-icon> Notas</h3>
            <table class="table-EC" aria-label="Notas del curso">
              @for (col of columns(); track col) {
                <tr [class.nota-final]="col === 'finalGrade'">
                  <th
                    class="mt-2 mb-2 nota-vertical-header"
                  [ngClass]="{
                    'text-promedio':
                      formatColumnNameLine1(col) === 'finalGrade',
                  }"
                    >
                    {{ col === 'finalGrade' ? 'Nota final' : formatColumnNameLine1(col) }}
                    {{ formatColumnNameLine2(col) }}
                  </th>
                  <td
                  [ngClass]="{
                    'text-success':
                      formatColumnNameLine1(col) === 'finalGrade' &&
                      data?.element?.apruebaReg === 'P',
                    'text-danger':
                      formatColumnNameLine1(col) === 'finalGrade' &&
                      data?.element?.apruebaReg !== 'P',
                  }"
                    >
                    {{
                    dataSource()[0][col] !== undefined &&
                    dataSource()[0][col] !== null &&
                    dataSource()[0][col] !== ""
                    ? dataSource()[0][col]
                    : 0
                    }}
                  </td>
                </tr>
              }
            </table>
          </div>
          <!-- Asistencia -->
          @if (
            asistenciaFechas().length > 0 && asistenciaData(); as asistencia
            ) {
            <div
              class="asistencia-col"
              >
              <h3 class="nota-vertical-title">
                <mat-icon aria-hidden="true">event_available</mat-icon> Asistencia
              </h3>
              <table class="table-EC" aria-label="Registro de asistencia">
                @for (fecha of asistenciaFechas(); track fecha) {
                  <tr>
                    <th class="nota-vertical-header">
                      {{ fecha | date: "dd-MM-yyyy" }}
                    </th>
                    <td
                  [ngClass]="{
                    'text-asistencia': isPresente(asistencia[fecha]),
                    'text-falta': isFalta(asistencia[fecha]),
                    'text-tardanza': isTardanzaValue(asistencia[fecha]),
                    'text-falta-no-registrada': isNoRegistrado(
                      asistencia[fecha]
                    ),
                    'asistencia-right': true,
                  }"
                      >
                      {{ formatAsistencia(asistencia[fecha]) }}
                    </td>
                  </tr>
                }
              </table>
              <!-- Recuperaciones -->
              @if (recuperacionesList().length > 0) {
                <div class="recuperaciones">
                  <h3 class="nota-vertical-title">
                    <mat-icon aria-hidden="true">event_repeat</mat-icon> Recuperaciones
                  </h3>
                  <table class="table-EC" aria-label="Registro de recuperaciones">
                    @for (rec of recuperacionesList(); track rec) {
                      <tr>
                        <th class="nota-vertical-header">
                          {{ rec.fecha | date: "dd-MM-yyyy" }}
                        </th>
                        <td
                    [ngClass]="{
                      'text-asistencia': isPresente(rec.estado),
                      'text-falta': isFalta(rec.estado),
                      'text-tardanza': isTardanzaValue(rec.estado),
                      'text-falta-no-registrada': isNoRegistrado(rec.estado),
                      'asistencia-right': true,
                    }"
                          >
                          {{ formatAsistencia(rec.estado, rec.minTardanza) }}
                        </td>
                      </tr>
                    }
                  </table>
                </div>
              }
            </div>
          }
        </div>
      
            } @else {
              <div class="estado-vacio">No se encontraron notas para este registro.</div>
            }
      
          </mat-dialog-content>
          <mat-dialog-actions align="end">
            <button mat-flat-button mat-dialog-close>Cerrar</button>
          </mat-dialog-actions>
    `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        min-height: 0;
        color: var(--mat-sys-on-surface);
      }
      .dialog-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin: 0;
        padding: 12px 24px;
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--mat-sys-primary);
        border-bottom: 1px solid var(--mat-sys-outline-variant);
      }
      .dialog-header::before { display: none; }
      mat-dialog-content { padding: 20px 24px !important; }
      mat-dialog-actions {
        padding: 12px 24px;
        border-top: 1px solid var(--mat-sys-outline-variant);
        background: var(--mat-sys-surface-container-low);
      }
      mat-dialog-actions button { min-width: 100px; }
      .detalle-list {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.375rem;
        padding: 0;
        margin-bottom: 1rem;
      }
      .full-row { grid-column: 1 / -1; }
      .detalle-list .detalle-item {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
        padding: 8px 16px;
        border-radius: 12px;
        background: var(--mat-sys-surface-container);
      }
      .detalle-item mat-icon {
        flex: 0 0 24px;
        margin: 0;
      }
      .detalle-item dl {
        min-width: 0;
        margin: 0;
      }
      .detalle-item dt, .detalle-item dd {
        margin: 0;
        padding: 0;
        line-height: 1.35;
      }
      .detalle-list .detalle-item.full-row {
        background: var(--mat-sys-primary-container);
      }
      .detalle-list dt {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--mat-sys-on-surface-variant);
      }
      .detalle-list dd {
        white-space: normal;
        overflow-wrap: anywhere;
        font-size: 0.9rem;
        color: var(--mat-sys-on-surface);
      }
      .detalle-list .full-row dd {
        font-size: 1rem;
        font-weight: 700;
      }
      .detalle-list .full-row dt,
      .detalle-list .full-row dd,
      .detalle-list .full-row mat-icon {
        color: var(--mat-sys-on-primary-container);
      }
      .detalle-list mat-icon { color: var(--mat-sys-primary); }
      .notas-asistencia-row {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
        align-items: start;
      }
      .notas-col, .asistencia-col {
        min-width: 0;
        padding: 0.875rem;
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 14px;
        background: var(--mat-sys-surface-container-low);
      }
      .nota-vertical-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0 0 0.75rem;
        font-size: 1rem;
        font-weight: 700;
        color: var(--mat-sys-primary);
      }
      .table-EC {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
        font-variant-numeric: tabular-nums;
      }
      .table-EC th, .table-EC td {
        padding: 9px 6px;
        border-bottom: 1px solid var(--mat-sys-outline-variant);
        vertical-align: middle;
      }
      .table-EC th {
        text-align: left;
        font-weight: 400;
        color: var(--mat-sys-on-surface);
        overflow-wrap: anywhere;
      }
      .table-EC td { text-align: right; }
      .table-EC tr:last-child th, .table-EC tr:last-child td { border-bottom: 0; }
      .table-EC .nota-final th, .table-EC .nota-final td {
        color: var(--mat-sys-primary);
        font-weight: 700;
      }
      .table-EC .nota-final td.text-danger {
        color: var(--mat-sys-error);
      }
      .recuperaciones {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px dashed var(--mat-sys-outline-variant);
      }
      .text-asistencia { color: var(--mat-sys-primary); font-weight: 600; }
      .text-falta { color: var(--mat-sys-error); font-weight: 600; }
      .text-tardanza { color: var(--mat-sys-tertiary); font-weight: 600; }
      .text-falta-no-registrada { color: var(--mat-sys-on-surface-variant); }
      .asistencia-resumen {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.75rem;
        margin-top: 1rem;
      }
      .resumen-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 0.75rem 0.25rem;
        border-radius: 12px;
        text-align: center;
      }
      .resumen-item strong { font-size: 1.5rem; line-height: 1.2; }
      .resumen-item span { font-size: 0.8rem; font-weight: 500; }
      .resumen-asistencias {
        background: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container);
      }
      .resumen-tardanzas {
        background: var(--mat-sys-tertiary-container);
        color: var(--mat-sys-on-tertiary-container);
      }
      .resumen-faltas {
        background: var(--mat-sys-error-container);
        color: var(--mat-sys-on-error-container);
      }
      .estado-vacio {
        padding: 1.5rem;
        border-radius: 12px;
        background: var(--mat-sys-surface-container);
        text-align: center;
      }
      .recuperaciones-nota { font-size: 0.875rem; }
      .limite-asistencia {
        margin-top: 1.25rem;
        padding: 1rem 1.25rem;
        border: 1px solid var(--mat-sys-outline-variant);
        border-radius: 12px;
        background-color: var(--mat-sys-primary-container);
        color: var(--mat-sys-on-primary-container);
        line-height: 1.6;
        overflow-wrap: anywhere;
      }
      .limite-asistencia--advertencia {
        border-color: var(--mat-sys-tertiary);
        background-color: var(--mat-sys-tertiary-container);
        color: var(--mat-sys-on-tertiary-container);
      }
      .limite-asistencia--inhabilitado {
        border-color: var(--mat-sys-outline-variant);
        background-color: var(--mat-sys-error-container);
        color: var(--mat-sys-on-error-container);
      }
      .limite-asistencia--error {
        border-color: var(--mat-sys-outline-variant);
        background-color: var(--mat-sys-surface-container-high);
        color: var(--mat-sys-on-surface);
      }
      .limite-asistencia-titulo {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0 0 0.5rem;
        font-size: 1rem;
        font-weight: 700;
        color: inherit;
      }
      .limite-asistencia-titulo mat-icon {
        flex-shrink: 0;
      }
      .limite-asistencia p {
        margin: 0;
      }
      .calculo-inasistencias {
        width: 100%;
        border-collapse: collapse;
        margin: 0 0 0.75rem;
        font-size: 0.875rem;
        font-variant-numeric: tabular-nums;
      }
      .calculo-inasistencias th, .calculo-inasistencias td {
        padding: 0.375rem 0.5rem;
        border-bottom: 1px solid var(--mat-sys-outline-variant);
        text-align: left;
      }
      .calculo-inasistencias tbody th { font-weight: 400; }
      .calculo-inasistencias td, .calculo-inasistencias thead th:last-child {
        text-align: right;
        white-space: nowrap;
      }
      .calculo-inasistencias tfoot {
        border-top: 2px solid currentColor;
        font-weight: 700;
      }
      .limite-asistencia-permitido {
        text-decoration: underline;
        text-decoration-thickness: 2px;
        text-underline-offset: 3px;
      }
      .limite-asistencia .limite-asistencia-alerta {
        margin-top: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid var(--mat-sys-outline-variant);
        font-weight: 600;
      }

      @media (max-width: 600px) {
        .dialog-header { padding: 10px 16px; }
        mat-dialog-content { padding: 16px !important; }
        mat-dialog-actions { padding: 12px 16px; }
        .detalle-list, .notas-asistencia-row { grid-template-columns: 1fr; }
        .asistencia-resumen { gap: 0.5rem; }
        .limite-asistencia { padding: 1rem; }
      }
    `,
  ],
})
export class NotasDetalleDialogComponent {
  private destroyRef = inject(DestroyRef);
  private _columns = signal<string[]>([]);
  columns = computed(() => this._columns());
  private _dataSource = signal<any[]>([]);
  dataSource = computed(() => this._dataSource());

  // Asistencia
  private asistenciaService = inject(AlumnoService);
  private turnoService = inject(TurnoService);
  limiteTurno = signal<NumeroHorasMaximoTurno | null>(null);
  errorLimite = signal("");
  errorAsistencia = signal("");
  asistenciaFechas = signal<string[]>([]);
  asistenciaData = signal<{ [fecha: string]: string } | null>(null);
  minutosClasePorFecha = signal<Record<string, number | null>>({});
  faltasSinDuracion = computed(() => Object.entries(this.asistenciaData() ?? {}).some(
    ([fecha, estado]) => this.isFalta(estado) && !this.duracionValida(this.minutosClasePorFecha()[fecha]),
  ));

  private duracionValida(minutos: unknown): minutos is number {
    return typeof minutos === 'number' && Number.isFinite(minutos) && minutos > 0;
  }

  // Recuperaciones
  recuperacionesList = signal<{
    fecha: string;
    estado: string;
    minTardanza?: number | null;
    minutosRecuperados: number | null;
  }[]>([]);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<NotasDetalleDialogComponent>
  ) {
    // PROVISIONAL: data.notas proviene del controlador Nota/Detalle,
    // consultado mediante AlumnoService.listarNotas antes de abrir el diálogo.
    // Cuando itemDetalle incluya las notas, reemplazar esta fuente por la siguiente
    // y retirar la consulta provisional de verDetalle en el componente de historial.
    // const result = Array.isArray(data.element?.itemDetalle)
    //   ? data.element.itemDetalle
    //   : [];
    const result = Array.isArray(data.notas) ? data.notas : [];
    // Lógica para construir columnas y datasource en formato vertical
    if (result.length > 0) {
      const notaEjemplo = result[0];
      let columns = Object.keys(notaEjemplo.notas || {}).filter(
        (c) => c.toLowerCase() !== "finalgrade",
      );
      if ("finalGrade" in notaEjemplo) {
        columns.push("finalGrade");
      }
      this._columns.set(columns);
      this._dataSource.set(
        result.map((n) => ({
          ...n,
          ...n.notas,
        })),
      );
    } else {
      this._columns.set([]);
      this._dataSource.set([]);
    }
    this.loadAsistencia();
    this.loadLimiteTurno();
  }

  private loadLimiteTurno() {

    const idTurno = Number(this.data?.element?.idTurno ?? this.data?.element?.IdTurno);
    if (!Number.isInteger(idTurno) || idTurno <= 0) {
      this.errorLimite.set("No se encontró el identificador del turno.");
      return;
    }
    this.turnoService.numeroHorasMaximoTurno(idTurno).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (limite) => {
        if (!limite || !Number.isFinite(limite.numeroMaximoFaltas) ||
            limite.numeroMaximoFaltas < 0 || !Number.isFinite(limite.totalHorasMaximoFalta) ||
            limite.totalHorasMaximoFalta < 0) {
          this.errorLimite.set("La configuración del turno no es válida.");
          return;
        }
        this.limiteTurno.set(limite);
      },
      error: () => this.errorLimite.set("No se pudo consultar la configuración del turno."),
    });
  }

  minutosTardanza = computed(() =>
    Object.values(this.asistenciaData() ?? {}).reduce((total, valor) => {
      return total + this.getMinutosTardanza(valor);
    }, 0),
  );

  minutosRecuperados = computed(() => this.recuperacionesList().reduce(
    (total, rec) => total + (rec.minutosRecuperados ?? 0), 0,
  ));

  recuperacionesSinDuracion = computed(() => this.recuperacionesList().some(
    rec => rec.minutosRecuperados === null &&
      (this.isPresente(rec.estado) || this.isTardanzaValue(rec.estado)),
  ));

  formatHorasMinutos(totalMinutos: number): string {
    const minutosTotales = Math.round(totalMinutos);
    const horas = Math.floor(minutosTotales / 60);
    const minutos = minutosTotales % 60;
    return horas + " h con " + minutos + " min";
  }

  private getMinutosTardanza(valor: any, minutosRegistrados?: number | null): number {
    if (this.isPresente(valor) || this.isFalta(valor) || !this.isTardanzaValue(valor)) return 0;
    if (typeof minutosRegistrados === 'number' && Number.isFinite(minutosRegistrados) && minutosRegistrados >= 0) {
      return minutosRegistrados;
    }
    const minutos = String(valor).match(/T\s*[-:]?\s*(\d+(?:[.,]\d+)?)|\b(\d+(?:[.,]\d+)?)\s*min/i);
    return minutos ? Number((minutos[1] ?? minutos[2]).replace(",", ".")) : 5;
  }

  balanceAsistencia = computed(() => {
    const limite = this.limiteTurno();
    const asistencia = this.asistenciaData();
    if (!limite || !asistencia || this.faltasSinDuracion()) return null;
    const duraciones = this.minutosClasePorFecha();
    const minutosFaltasRegistradas = Object.entries(asistencia).reduce(
      (total, [fecha, estado]) => total + (this.isFalta(estado) ? duraciones[fecha]! : 0), 0,
    );
    const minutosClase = Math.max(0, ...Object.values(duraciones).filter(m => this.duracionValida(m)));
    const minutosRecuperados = this.minutosRecuperados();
    const minutosDescontados = Math.min(minutosFaltasRegistradas, minutosRecuperados);
    const minutosFaltas = minutosFaltasRegistradas - minutosDescontados;
    const totalMinutos = minutosFaltas + this.minutosTardanza();
    const maximoMinutos = limite.totalHorasMaximoFalta * 60;
    const restantes = maximoMinutos - totalMinutos;
    return {
      minutosFaltasRegistradas, minutosRecuperados, minutosDescontados,
      minutosFaltas, totalMinutos, maximoMinutos, restantes,
      inhabilitado: totalMinutos > maximoMinutos,
      // Advertir cuando queda la duración de una clase registrada o menos.
      advertencia: restantes >= 0 && restantes <= minutosClase,
    };
  });

  private loadAsistencia() {
    const idHorario =
      this.data?.element?.idHorario ?? this.data?.element?.IdHorario;
    const codigo = this.data?.element?.codigo ?? this.data?.element?.codigo;
    if (!idHorario || !codigo) {
      this.errorAsistencia.set("Faltan los datos del horario o del alumno.");
      return;
    }

    this.asistenciaService.ObtenerLista(idHorario, codigo).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result: any[]) => {
        // Busca el objeto que tenga asistenciasPorFecha
        const asistenciaObj = Array.isArray(result)
          ? result.find(
              (a) =>
                a.asistenciasPorFecha &&
                typeof a.asistenciasPorFecha === "object",
            )
          : null;

        if (asistenciaObj && asistenciaObj.asistenciasPorFecha) {
          const asistenciasPorFecha = asistenciaObj.asistenciasPorFecha;
          const fechas = Object.keys(asistenciasPorFecha);
          this.asistenciaFechas.set(fechas);
          this.asistenciaData.set(asistenciasPorFecha);
          this.minutosClasePorFecha.set(asistenciaObj.minutosClasePorFecha ?? {});
        } else {
          this.asistenciaFechas.set([]);
          this.asistenciaData.set(null);
          this.minutosClasePorFecha.set({});
          this.errorAsistencia.set("No se encontraron registros de asistencia.");
        }

        // Recuperaciones (ahora arreglo de objetos)
        if (Array.isArray(result)) {
          const asistenciaObj = result.find(
            (a) =>
              a.asistenciasPorFecha &&
              typeof a.asistenciasPorFecha === "object",
          );
          if (asistenciaObj && Array.isArray(asistenciaObj.recuperaciones)) {
            const recList = asistenciaObj.recuperaciones.map((rec: any) => ({
              fecha: rec.fechaRecuperacion,
              estado: rec.estado,
              minTardanza: rec.minTardanza ?? null,
              minutosRecuperados: typeof rec.minutosRecuperados === 'number' &&
                Number.isFinite(rec.minutosRecuperados) && rec.minutosRecuperados >= 0
                  ? rec.minutosRecuperados : null,
            }));
            this.recuperacionesList.set(recList);
          } else {
            this.recuperacionesList.set([]);
          }
        } else {
          this.recuperacionesList.set([]);
        }
      },
      error: () => {
        this.errorAsistencia.set("No se pudo consultar la asistencia.");
        this.asistenciaFechas.set([]);
        this.asistenciaData.set(null);
        this.minutosClasePorFecha.set({});
        this.recuperacionesList.set([]);
      },
    });
  }

  // Determina si una columna es una nota (contiene "_")
  isNotaColumn(col: string): boolean {
    return col.includes("_");
  }

  // Extrae el valor máximo desde el nombre de la columna (ej. Vocabulary_30 → 30)
  getValorMaximo(col: string): number {
    const parts = col.split("_");
    return Number(parts[1]) || 0;
  }

  formatColumnNameLine1(col: string): string {
    return this.isNotaColumn(col) ? col.split("_")[0] : col;
  }

  formatColumnNameLine2(col: string): string {
    return this.isNotaColumn(col) ? `(${col.split("_")[1]})` : "";
  }

  // Helpers para identificar estados (case-insensitive) y tardanzas con minutos
  isPresente(val: any): boolean {
    const s =
      val === undefined || val === null ? "" : String(val).trim().toUpperCase();
    // Treat values starting with 'P' (e.g. 'P - 0') as present
    return /^P\b/.test(s);
  }

  isFalta(val: any): boolean {
    const s =
      val === undefined || val === null ? "" : String(val).trim().toUpperCase();
    // Treat values that start with 'A' (like 'A - 0') as absent/falta
    return /^A\b/.test(s);
  }

  isNoRegistrado(val: any): boolean {
    const s =
      val === undefined || val === null ? "" : String(val).trim().toUpperCase();
    return s === "" || s === "F";
  }

  isTardanzaValue(val: any): boolean {
    if (val === undefined || val === null) return false;
    const s = String(val).trim();
    // Matches formats like: "T", "T - 10", "T:10", "t-10", "10 min", "10min"
    return (
      /^T\b/i.test(s) || /T\s*[-:]?\s*\d+/i.test(s) || /\b\d+\s*min\b/i.test(s)
    );
  }

  // Formatea un valor de asistencia/recuperación mostrando minutos si aplica (ej. "T - 10" → "Tardanza(10 min)"; "T" → "Tardanza")
  formatAsistencia(valor: any, minutosRegistrados?: number | null): string {
    if (valor === "" || valor === undefined || valor === null)
      return "No se registró";
    const s = String(valor).trim();
    const upper = s.toUpperCase();

    // Treat values that start with 'P' (like 'P - 0') as present
    if (/^P\b/.test(upper)) return "Asistió";
    // Treat values that start with 'A' (like 'A - 0') as absent/falta
    if (/^A\b/.test(upper)) return "Falta";
    if (upper === "F" || s === "") return "No se registró";

    if (this.isTardanzaValue(valor)) {
      return `Tardanza(${this.getMinutosTardanza(valor, minutosRegistrados)} min)`;
    }

    // Otherwise return raw value
    return s;
  }

  resumenAsistencia = computed(() => {
    const asistencia = this.asistenciaData();
    if (!asistencia) return { asistio: 0, tardanza: 0, falta: 0 };
    let asistio = 0,
      tardanza = 0,
      falta = 0;
    Object.values(asistencia).forEach((valor) => {
      const s =
        valor === undefined || valor === null ? "" : String(valor).trim();
      const upper = s.toUpperCase();

      // Treat values that start with 'P' (e.g. 'P - 0') as present
      if (/^P\b/.test(upper)) {
        asistio++;
        return;
      }
      // Treat values that start with 'A' (like 'A - 0') as absent/falta
      if (/^A\b/.test(upper)) {
        falta++;
        return;
      }

      // Consider as tardanza if:
      // - starts with T (T, t, T - 10, etc.)
      // - contains 'T' followed by minutes (T - 10)
      // - or is a minutes string like '10 min'
      if (
        /^T\b/i.test(s) ||
        /T\s*[-:]?\s*\d+/i.test(s) ||
        /\b\d+\s*min\b/i.test(s)
      ) {
        tardanza++;
        return;
      }
    });
    for (const rec of this.recuperacionesList()) {
      if (this.isPresente(rec.estado)) {
        asistio++;
      } else if (!this.isFalta(rec.estado) && this.isTardanzaValue(rec.estado)) {
        tardanza++;
      }
    }
    return { asistio, tardanza, falta };
  });
}
