import { Component, Inject, computed, signal, inject } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { MatDivider, MatDividerModule } from "@angular/material/divider";
import { MatButtonModule } from "@angular/material/button";
import { MatListModule } from "@angular/material/list";
import { AlumnoService } from "../../services/alumno.service";

@Component({
  selector: "app-notas-detalle-dialog",
  standalone: true,
  imports: [
    MatDialogModule,
    MatIconModule,
    CommonModule,
    MatDivider,
    MatButtonModule,
    MatDividerModule,
    MatListModule,
  ],
  template: `
    <div mat-dialog-title class="dialog-header">
      <mat-list class="detalle-list">
        <mat-list-item class="full-row">
          <mat-icon matListItemIcon>person</mat-icon>
          <span matListItemTitle>Alumno</span>
          <span matListItemLine>{{ data?.element?.completo | titlecase }}</span>
        </mat-list-item>
        <mat-list-item>
          <mat-icon matListItemIcon>description</mat-icon>
          <span matListItemTitle>Curso</span>
          <span matListItemLine>{{ data?.element?.descripcion || "" }}</span>
        </mat-list-item>
        @if (data?.element?.nombre) {
          <mat-list-item>
            <mat-icon matListItemIcon>schedule</mat-icon>
            <span matListItemTitle>Turno</span>
            <span matListItemLine>{{ data?.element?.nombre }}</span>
          </mat-list-item>
        }
        @if (data?.element?.nombreAula) {
          <mat-list-item>
            <mat-icon matListItemIcon>meeting_room</mat-icon>
            <span matListItemTitle>Aula</span>
            <span matListItemLine>{{ data?.element?.nombreAula }}</span>
          </mat-list-item>
        }
        @if (data?.element?.nombreCompleto) {
          <mat-list-item>
            <mat-icon matListItemIcon>school</mat-icon>
            <span matListItemTitle>Profesor</span>
            <span matListItemLine>{{ data?.element?.nombreCompleto }}</span>
          </mat-list-item>
        }
      </mat-list>
    </div>
    <mat-dialog-content>
      @if (dataSource().length > 0) {
        <div class="notas-asistencia-row">
          <!-- Notas -->
          <div class="notas-col">
            <h3 class="nota-vertical-title text-center mt-3 mb-2">Notas</h3>
            <table class="table-EC" style="width:100%">
              @for (col of columns(); track col) {
                <tr>
                  <th
                    class="mt-2 mb-2 nota-vertical-header"
                  [ngClass]="{
                    'text-promedio':
                      formatColumnNameLine1(col) === 'finalGrade',
                  }"
                    >
                    {{ formatColumnNameLine1(col) }}
                    {{ formatColumnNameLine2(col) }}
                    <mat-divider></mat-divider>
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
                    <mat-divider></mat-divider>
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
              <h3 class="nota-vertical-title text-center mt-3 mb-2">
                Asistencia
              </h3>
              <table class="table-EC" style="width:100%">
                @for (fecha of asistenciaFechas(); track fecha) {
                  <tr>
                    <th class="nota-vertical-header">
                      {{ fecha | date: "dd-MM-yyyy" }}
                      <mat-divider></mat-divider>
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
                      <mat-divider></mat-divider>
                    </td>
                  </tr>
                }
              </table>
              <!-- Recuperaciones -->
              @if (recuperacionesList().length > 0) {
                <div>
                  <h3 class="nota-vertical-title text-center mt-3 mb-2">
                    Recuperación
                  </h3>
                  <table class="table-EC" style="width:100%">
                    @for (rec of recuperacionesList(); track rec) {
                      <tr>
                        <th class="nota-vertical-header">
                          {{ rec.fecha | date: "dd-MM-yyyy" }}
                          <mat-divider></mat-divider>
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
                          {{ formatAsistencia(rec.estado) }}
                          <mat-divider></mat-divider>
                        </td>
                      </tr>
                    }
                  </table>
                </div>
              }
            </div>
          }
        </div>
        <!-- Resumen de asistencia -->
        <div class="asistencia-resumen mt-3 mb-2">
          <span class="text-asistencia"
            >Asistencias: {{ resumenAsistencia().asistio }}</span
            >
            |
            <span class="text-tardanza"
              >Tardanzas: {{ resumenAsistencia().tardanza }}</span
              >
              |
              <span class="text-falta"
                >Faltas: {{ resumenAsistencia().falta }}</span
                >
              </div>
            } @else {
              <div>No se encontraron notas para este registro.</div>
            }
          </mat-dialog-content>
          <mat-dialog-actions align="end">
            <button mat-button mat-dialog-close>Cerrar</button>
          </mat-dialog-actions>
    `,
  styles: [
    `
      .notas-asistencia-row {
        display: flex;
        flex-direction: row;
        gap: 2rem;
        justify-content: space-between;
        align-items: flex-start;
        width: 100%;
      }
      .notas-col,
      .asistencia-col {
        flex: 1 1 0;
        min-width: 0;
        max-width: 50%;
      }
      .notas-col {
        border-right: 1px solid #e0e0e0;
        padding-right: 1rem;
      }
      .asistencia-col {
        padding-left: 1rem;
      }
      .nota-vertical-card {
        border-radius: 8px;
        margin-bottom: 1.5rem;
        padding: 1rem;
        
      }
      .nota-vertical-header {
        margin-bottom: 0.5rem;
        font-weight: 400;
        color: var(--mat-sys-primary);
      }
      .nota-vertical-title {
        color: var(--mat-sys-primary);
        font-weight: 900;
      }
      .dialog-header {
        margin-top: 0;
        padding-top: 0 !important;
        padding-bottom: 0.25rem;
      }
      .detalle-list {
        padding-top: 0;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.25rem 0.75rem;
      }
      .full-row {
        grid-column: 1 / -1;
      }
      .detalle-list mat-list-item {
        border-radius: 8px;
        background: var(--mat-sys-surface-container);
      }
      .detalle-list [matListItemTitle] {
        color: var(--mat-sys-primary);
        font-weight: 800;
      }
      .detalle-list mat-icon[matListItemIcon] {
        color: var(--mat-sys-primary);
      }
      .nota-vertical-index {
        color: var(--mat-sys-on-surface-variant);
        font-size: 0.95em;
      }
      .tabla-EC th {
        text-align: left;
        background: var(--mat-sys-surface-variant);
        font-weight: 600;
        padding: 4px 8px;
        width: 40%;
      }
      .tabla-EC td {
        padding: 4px 8px;
      }
      .text-promedio {
        font-weight: 600;
        color: var(--mat-sys-primary);
      }
      .asistencia-right {
        text-align: right;
        padding-right: 16px;
      }
      .asistencia-resumen {
        font-size: 1rem;
        font-weight: 600;
        text-align: center;
        margin-top: 12px;
      }

      .text-asistencia {
        font-weight: 600;
        color: var(--mat-sys-primary);
      }
      .text-falta {
        color: var(--mat-sys-error);
        font-weight: 600;
      }
      .text-tardanza {
        color: var(--mat-sys-tertiary);
        font-weight: 600;
      }

      @media (max-width: 900px) {
        .detalle-list {
          grid-template-columns: 1fr;
        }
        .notas-asistencia-row {
          flex-direction: column;
          gap: 1rem;
        }
        .notas-col,
        .asistencia-col {
          max-width: 100%;
          min-width: 100%;
          width: 100%;
          border-right: none;
          padding-right: 0;
          padding-left: 0;
        }
        .table-EC,
        .tabla-EC {
          width: 100% !important;
          min-width: 100% !important;
          font-size: 1.1em;
        }
        .nota-vertical-header,
        .tabla-EC th,
        .tabla-EC td {
          font-size: 1em;
          padding-left: 8px;
          padding-right: 8px;
        }
      }
    `,
  ],
})
export class NotasDetalleDialogComponent {
  private _columns = signal<string[]>([]);
  columns = computed(() => this._columns());
  private _dataSource = signal<any[]>([]);
  dataSource = computed(() => this._dataSource());

  // Asistencia
  private asistenciaService = inject(AlumnoService);
  asistenciaFechas = signal<string[]>([]);
  asistenciaData = signal<{ [fecha: string]: string } | null>(null);

  // Recuperaciones
  recuperacionesList = signal<{ fecha: string; estado: string }[]>([]);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<NotasDetalleDialogComponent>,
  ) {
    // Lógica para construir columnas y datasource en formato vertical
    const result = Array.isArray(data.notas) ? data.notas : [];
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
  }

  private loadAsistencia() {
    const idHorario =
      this.data?.element?.idHorario ?? this.data?.element?.IdHorario;
    const codigo = this.data?.element?.codigo ?? this.data?.element?.codigo;
    if (!idHorario || !codigo) return;

    this.asistenciaService.ObtenerLista(idHorario, codigo).subscribe({
      next: (result: any[]) => {
        // Busca el objeto que tenga asistenciasPorFecha
        console.log(result);
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
        } else {
          this.asistenciaFechas.set([]);
          this.asistenciaData.set(null);
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
        this.asistenciaFechas.set([]);
        this.asistenciaData.set(null);
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
  formatAsistencia(valor: any): string {
    if (valor === "" || valor === undefined || valor === null)
      return "No se registró";
    const s = String(valor).trim();
    const upper = s.toUpperCase();

    // Treat values that start with 'P' (like 'P - 0') as present
    if (/^P\b/.test(upper)) return "Asistió";
    // Treat values that start with 'A' (like 'A - 0') as absent/falta
    if (/^A\b/.test(upper)) return "Falta";
    if (upper === "F" || s === "") return "No se registró";

    // If it's like "T - 10" or "T:10" or "T10" -> extract minutes
    const tMatch = s.match(/T\s*[-:]?\s*(\d+)/i);
    if (tMatch && tMatch[1]) {
      return `Tardanza(${tMatch[1]} min)`;
    }

    // If it's like "10 min" or "10min"
    const minMatch = s.match(/(\d+)\s*min/i);
    if (minMatch && minMatch[1]) {
      return `Tardanza(${minMatch[1]} min)`;
    }

    // If it starts with T but no minutes
    if (/^T\b/i.test(s)) return "Tardanza";

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
    return { asistio, tardanza, falta };
  });
}
