import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { DocumentoService, DocumentoAlumnoReturn } from '../../services/documento.service';
import { AlumnoService } from '../../services/alumno.service';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

@Component({
  selector: 'app-historial-pagos',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    PageHeaderComponent
  ],
  template: `
    <div class="page-container">
      <app-page-header 
        title="Historial de Pagos" 
        description="Revisa tus pagos y documentos asociados" 
        icon="payment">
      </app-page-header>

      <div class="content-grid">
        <mat-card class="history-card">
          <mat-card-content>
            <div class="mat-elevation-z8">
              <div class="table-responsive">
                <table mat-table [dataSource]="dataSource" matSort class="mat-table custom-mat-table">
                  <!-- Correlativo -->
                  <ng-container matColumnDef="correlativo">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header> CORRELATIVO </th>
                    <td mat-cell *matCellDef="let doc">{{ doc.correlativo }}</td>
                  </ng-container>
                  <!-- Fecha Documento -->
                  <ng-container matColumnDef="fecha_Doc">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header> FECHA </th>
                    <td mat-cell *matCellDef="let doc">{{ doc.fecha_Doc | date:'dd/MM/yyyy' }}</td>
                  </ng-container>
                  <!-- Total -->
                  <ng-container matColumnDef="total">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header> TOTAL </th>
                    <td mat-cell *matCellDef="let doc">S/ {{ doc.total | number:'1.2-2' }}</td>
                  </ng-container>
                  <!-- Detalle Documento -->
                  <ng-container matColumnDef="detalle_Doc">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header> DETALLE </th>
                    <td mat-cell *matCellDef="let doc">{{ doc.detalle_Doc }}</td>
                  </ng-container>
                  <!-- Descargar PDF -->
                  <ng-container matColumnDef="descargar">
                    <th mat-header-cell *matHeaderCellDef> DESCARGAR PDF </th>
                    <td mat-cell *matCellDef="let doc">
                      <a *ngIf="doc.urlPdf" [href]="doc.urlPdf" target="_blank" rel="noopener">
                        <button mat-button >
                          <mat-icon>picture_as_pdf</mat-icon> Descargar Comprobante
                        </button>
                      </a>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
                  <tr class="mat-row" *matNoDataRow>
                    <td class="mat-cell" colspan="5">No hay documentos de pagos disponibles</td>
                  </tr>
                </table>
              </div>
              <mat-paginator [pageSize]="10" [pageSizeOptions]="[5, 10, 20]" showFirstLastButtons aria-label="Seleccionar página"></mat-paginator>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  
})
export class HistorialPagosComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['correlativo', 'fecha_Doc', 'total', 'detalle_Doc', 'descargar'];
  dataSource = new MatTableDataSource<DocumentoAlumnoReturn>([]);
  private documentoService = inject(DocumentoService);
  private alumnoService = inject(AlumnoService);
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
    // Obtener el DNI del usuario logueado
    let dni: number | null = null;
    try {
      const userStr = localStorage.getItem('alumno_currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.userName) {
          dni = Number(user.userName);
        }
      }
    } catch (e) {
      console.error('No se pudo obtener el usuario logueado:', e);
    }
    if (dni) {
      // Obtener el código del alumno y luego los documentos
      this.alumnoService.verificarDni(dni).subscribe({
        next: (resp) => {
          if (resp.existe && resp.codigo) {
            this.documentoService.getDocumentosByAlumnoId(+resp.codigo).subscribe({
              next: (docs) => {
                console.log('Documentos recibidos:', docs);
                this.dataSource.data = docs;
              },
              error: (err) => {
                console.error('Error al obtener documentos:', err);
                this.dataSource.data = [];
              }
            });
          } else {
            this.dataSource.data = [];
            console.warn('No existe alumno con ese DNI');
          }
        },
        error: (err) => {
          console.error('Error al verificar DNI:', err);
          this.dataSource.data = [];
        }
      });
    } else {
      console.warn('No se encontró el DNI del usuario logueado.');
      this.dataSource.data = [];
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}