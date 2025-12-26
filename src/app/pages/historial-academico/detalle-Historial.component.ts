import { Component, Inject, computed, signal, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NgIf, NgFor, CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDivider, MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { AlumnoService } from '../../services/alumno.service';


@Component({
  selector: 'app-notas-detalle-dialog',
  standalone: true,
  imports: [MatDialogModule, MatIconModule, CommonModule, MatDivider, MatButtonModule, MatDividerModule],
  template: `
    <h3 mat-dialog-title class="nota-vertical-title text-center">
      <div class="nota-vertical-title text-center mb-2">
        {{data?.element?.completo | titlecase}}
      </div>
      {{ data?.element?.descripcion || '' }}
      <span *ngIf="data?.element?.nombre"> - {{ data?.element?.nombre }}</span>
      <span *ngIf="data?.element?.nombreAula"> - {{ data?.element?.nombreAula }} - {{data?.element?.nombreCompleto}}</span>
    </h3>
    <mat-dialog-content>
      <ng-container *ngIf="dataSource().length > 0; else noNotas">
        <div class="notas-asistencia-row">
          <!-- Notas -->
          <div class="notas-col">
            <h3 class="nota-vertical-title text-center mt-3 mb-2">Notas</h3>
            <table class="table-EC" style="width:100%">
              <tr *ngFor="let col of columns()">
                <th class="mt-2 mb-2 nota-vertical-header"
                    [ngClass]="{
                      'text-promedio': formatColumnNameLine1(col) === 'finalGrade'
                    }"
                >
                  {{ formatColumnNameLine1(col) }}  {{ formatColumnNameLine2(col) }}
                  <mat-divider></mat-divider>
                </th>
                <td
                  [ngClass]="{
                    'text-success': formatColumnNameLine1(col) === 'finalGrade' && data?.element?.apruebaReg === 'P',
                    'text-danger': formatColumnNameLine1(col) === 'finalGrade' && data?.element?.apruebaReg !== 'P'
                  }"
                >{{ (dataSource()[0][col] !== undefined && dataSource()[0][col] !== null && dataSource()[0][col] !== '') ? dataSource()[0][col] : 0 }}
                  <mat-divider></mat-divider>
                </td>
              </tr>
            </table>
          </div>
          <!-- Asistencia -->
          <div class="asistencia-col" *ngIf="asistenciaFechas().length > 0 && asistenciaData() as asistencia">
            <h3 class="nota-vertical-title text-center mt-3 mb-2">Asistencia</h3>
            <table class="table-EC" style="width:100%">
              <tr *ngFor="let fecha of asistenciaFechas()">
                <th class="nota-vertical-header">{{ fecha | date:'dd-MM-yyyy' }}
                  <mat-divider></mat-divider>
                </th>
                <td
                  [ngClass]="{
                    'text-success': asistencia[fecha] === 'P',
                    'text-danger': asistencia[fecha] === 'A',
                    'text-warning': asistencia[fecha] === 'T',
                    'text-falta-no-registrada': asistencia[fecha] === 'F' || asistencia[fecha] === '' || asistencia[fecha] === undefined || asistencia[fecha] === null,
                    'asistencia-right': true
                  }"
                >
                  {{
                    asistencia[fecha] === 'P' ? 'Asistió' :
                    asistencia[fecha] === 'A' ? 'Falta' :
                    asistencia[fecha] === 'T' ? 'Tardanza' :
                    asistencia[fecha]  === 'F' ? 'No se registró' :
                    (asistencia[fecha] === '' || asistencia[fecha] === undefined || asistencia[fecha] === null ? 'No se registró' : asistencia[fecha])
                  }}
                  <mat-divider></mat-divider>
                </td>
              </tr>
            </table>
            <!-- Recuperaciones -->
            <div *ngIf="recuperacionesList().length > 0">
              <h3 class="nota-vertical-title text-center mt-3 mb-2">Recuperación</h3>
              <table class="table-EC" style="width:100%">
                <tr *ngFor="let rec of recuperacionesList()">
                  <th class="nota-vertical-header">{{ rec.fecha | date:'dd-MM-yyyy' }}
                    <mat-divider></mat-divider>
                  </th>
                  <td
                    [ngClass]="{
                      'text-success': rec.estado === 'P',
                      'text-danger': rec.estado === 'A',
                      'text-warning': rec.estado === 'T',
                      'text-falta-no-registrada': rec.estado === 'F' || rec.estado === '' || rec.estado === undefined || rec.estado === null,
                      'asistencia-right': true
                    }"
                  >
                    {{
                      rec.estado === 'P' ? 'Asistió' :
                      rec.estado === 'A' ? 'Falta' :
                      rec.estado === 'T' ? 'Tardanza' :
                      rec.estado === 'F' ? 'No se registró' :
                     (rec.estado === '' || rec.estado === undefined || rec.estado === null  ? 'No se registró' : rec.estado)
                    }}
                    <mat-divider></mat-divider>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </div>
        <!-- Resumen de asistencia -->
        <div class="asistencia-resumen mt-3 mb-2">
          <span class="text-success">Asistencias: {{ resumenAsistencia().asistio }}</span> |
          <span class="text-warning">Tardanzas: {{ resumenAsistencia().tardanza }}</span> |
          <span class="text-danger">Faltas: {{ resumenAsistencia().falta }}</span>
        </div>
      </ng-container>
      <ng-template #noNotas>
        <div>No se encontraron notas para este registro.</div>
      </ng-template>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .notas-asistencia-row {
      display: flex;
      flex-direction: row;
      gap: 2rem;
      justify-content: space-between;
      align-items: flex-start;
      width: 100%;
    }
    .notas-col, .asistencia-col {
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
      color:  var(--mat-sys-primary);
      font-weight: 900;
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
    .text-promedio{
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
   
    @media (max-width: 900px) {
      .notas-asistencia-row {
        flex-direction: column;
        gap: 1rem;
      }
      .notas-col, .asistencia-col {
        max-width: 100%;
        min-width: 100%;
        width: 100%;
        border-right: none;
        padding-right: 0;
        padding-left: 0;
      }
      .table-EC, .tabla-EC {
        width: 100% !important;
        min-width: 100% !important;
        font-size: 1.1em;
      }
      .nota-vertical-header, .tabla-EC th, .tabla-EC td {
        font-size: 1em;
        padding-left: 8px;
        padding-right: 8px;
      }
    }
  `]
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
  recuperacionesList = signal<{ fecha: string, estado: string }[]>([]);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<NotasDetalleDialogComponent>
  ) {
    // Lógica para construir columnas y datasource en formato vertical
    const result = Array.isArray(data.notas) ? data.notas : [];
    if (result.length > 0) {
      const notaEjemplo = result[0];
      let columns = Object.keys(notaEjemplo.notas || {}).filter(
        c => c.toLowerCase() !== 'finalgrade'
      );
      if ('finalGrade' in notaEjemplo) {
        columns.push('finalGrade');
      }
      this._columns.set(columns);
      this._dataSource.set(result.map(n => ({
        ...n,
        ...n.notas
      })));
    } else {
      this._columns.set([]);
      this._dataSource.set([]);
    }
    this.loadAsistencia();
  }

  private loadAsistencia() {
    const idHorario = this.data?.element?.idHorario ?? this.data?.element?.IdHorario;
    const codigo = this.data?.element?.codigo ?? this.data?.element?.codigo;
    if (!idHorario || !codigo) return;

    this.asistenciaService.ObtenerLista(idHorario, codigo).subscribe({
      next: (result: any[]) => {
        // Busca el objeto que tenga asistenciasPorFecha
        console.log(result);
        const asistenciaObj = Array.isArray(result)
          ? result.find(a => a.asistenciasPorFecha && typeof a.asistenciasPorFecha === 'object')
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
          const asistenciaObj = result.find(a => a.asistenciasPorFecha && typeof a.asistenciasPorFecha === 'object');
          if (asistenciaObj && Array.isArray(asistenciaObj.recuperaciones)) {
            const recList = asistenciaObj.recuperaciones.map((rec: any) => ({
              fecha: rec.fechaRecuperacion,
              estado: rec.estado
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
      }
    });
  }

  // Determina si una columna es una nota (contiene "_")
  isNotaColumn(col: string): boolean {
    return col.includes('_');
  }

  // Extrae el valor máximo desde el nombre de la columna (ej. Vocabulary_30 → 30)
  getValorMaximo(col: string): number {
    const parts = col.split('_');
    return Number(parts[1]) || 0;
  }

  formatColumnNameLine1(col: string): string {
    return this.isNotaColumn(col) ? col.split('_')[0] : col;
  }

  formatColumnNameLine2(col: string): string {
    return this.isNotaColumn(col) ? `(${col.split('_')[1]})` : '';
  }

  resumenAsistencia = computed(() => {
    const asistencia = this.asistenciaData();
    if (!asistencia) return { asistio: 0, tardanza: 0, falta: 0 };
    let asistio = 0, tardanza = 0, falta = 0;
    Object.values(asistencia).forEach(valor => {
      if (valor === 'P') asistio++;
      else if (valor === 'T') tardanza++;
      else if (valor === 'A') falta++;
    });
    return { asistio, tardanza, falta };
  });
}
