import {
  Component,
  OnInit,
  ViewChild,
  AfterViewInit,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatTableModule, MatTableDataSource } from "@angular/material/table";
import { MatSort, MatSortModule } from "@angular/material/sort";
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";
import {
  DocumentoService,
  DocumentoAlumnoReturn,
  BoletaElectronicaResponse,
} from "../../services/documento.service";
import { AlumnoService } from "../../services/alumno.service";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";

@Component({
  selector: "app-historial-pagos",
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    PageHeaderComponent,
  ],
  template: `
    <div class="page-container">
      <app-page-header
        title="Historial de Pagos"
        description="Revisa tus pagos y documentos asociados"
        icon="payment"
      >
      </app-page-header>

      <div class="content-grid">
        <mat-card class="history-card">
          <mat-card-content>
            <div class="mat-elevation-z8">
              <div class="table-responsive">
                <table
                  mat-table
                  [dataSource]="dataSource"
                  matSort
                  class="mat-table custom-mat-table"
                >
                  <!-- Correlativo -->
                  <ng-container matColumnDef="correlativo">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>
                      CORRELATIVO
                    </th>
                    <td mat-cell *matCellDef="let doc">
                      {{ doc.correlativo }}
                    </td>
                  </ng-container>
                  <!-- Fecha Documento -->
                  <ng-container matColumnDef="fecha_Doc">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>
                      FECHA
                    </th>
                    <td mat-cell *matCellDef="let doc">
                      {{ doc.fecha_Doc | date: "dd/MM/yyyy" }}
                    </td>
                  </ng-container>
                  <!-- Total -->
                  <ng-container matColumnDef="total">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>
                      TOTAL
                    </th>
                    <td mat-cell *matCellDef="let doc">
                      S/ {{ doc.total | number: "1.2-2" }}
                    </td>
                  </ng-container>
                  <!-- Detalle Documento -->
                  <ng-container matColumnDef="detalle_Doc">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>
                      DETALLE
                    </th>
                    <td mat-cell *matCellDef="let doc">
                      {{ doc.detalle_Doc }}
                    </td>
                  </ng-container>

                  <!-- Opción de Imprimir -->
                  <ng-container matColumnDef="imprimir">
                    <th mat-header-cell *matHeaderCellDef>IMPRIMIR</th>
                    <td mat-cell *matCellDef="let doc">
                      <button
                        mat-raised-button
                        color="primary"
                        (click)="
                          imprimirBoletaDirecta(
                            doc.idDocumento || doc.correlativo
                          )
                        "
                        matTooltip="Imprimir"
                      >
                        <mat-icon>print</mat-icon>
                        Imprimir
                      </button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr
                    mat-row
                    *matRowDef="let row; columns: displayedColumns"
                  ></tr>
                  <tr class="mat-row" *matNoDataRow>
                    <td class="mat-cell" colspan="5">
                      No hay documentos de pagos disponibles
                    </td>
                  </tr>
                </table>
              </div>
              <mat-paginator
                [pageSize]="10"
                [pageSizeOptions]="[5, 10, 20]"
                showFirstLastButtons
                aria-label="Seleccionar página"
              ></mat-paginator>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [
    `
      .mat-column-imprimir {
        text-align: center;
        width: 180px;
      }

      .mat-column-imprimir button {
        min-width: 160px;
        font-weight: 500;
      }

      .mat-column-imprimir mat-icon {
        margin-right: 8px;
      }

      @media (max-width: 768px) {
        .mat-column-imprimir {
          width: 140px;
        }

        .mat-column-imprimir button {
          min-width: 120px;
          font-size: 0.875rem;
          padding: 8px 12px;
        }

        .mat-column-imprimir mat-icon {
          margin-right: 4px;
          font-size: 1rem;
        }
      }

      @media (max-width: 480px) {
        .mat-column-imprimir button {
          min-width: 100px;
          font-size: 0.75rem;
          padding: 6px 10px;
        }

        .mat-column-imprimir button .mat-button-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    `,
  ],
})
export class HistorialPagosComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    "correlativo",
    "fecha_Doc",
    "total",
    "detalle_Doc",
    "imprimir", // Solo opción de imprimir
  ];
  dataSource = new MatTableDataSource<DocumentoAlumnoReturn>([]);
  private documentoService = inject(DocumentoService);
  private alumnoService = inject(AlumnoService);
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Properties needed for printing functionality
  boletaData: BoletaElectronicaResponse | null = null;

  ngOnInit(): void {
    // Obtener el DNI del usuario logueado
    const user = JSON.parse(localStorage.getItem("alumno_currentUser"));
    if (user) {
      this.alumnoService.verificarDni(user.userName).subscribe({
        next: (resp) => {
          if (resp.existe && resp.codigo) {
            this.documentoService
              .getDocumentosByAlumnoId(+resp.codigo)
              .subscribe({
                next: (docs) => {
                  this.dataSource.data = docs;
                },
                error: (err) => {
                  console.error("Error al obtener documentos:", err);
                  this.dataSource.data = [];
                },
              });
          } else {
            this.dataSource.data = [];
            console.warn("No existe alumno con ese DNI");
          }
        },
        error: (err) => {
          console.error("Error al verificar DNI:", err);
          this.dataSource.data = [];
        },
      });
    } else {
      console.warn("No se encontró el DNI del usuario logueado.");
      this.dataSource.data = [];
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  /**
   * Imprime una boleta específica obteniendo los datos desde la API
   * @param idOrCorrelativo ID del documento (number) o correlativo (string)
   */
  imprimirBoletaDirecta(idOrCorrelativo: number | string) {
    const documentoId = this.getDocumentoId(idOrCorrelativo);

    if (documentoId) {
      this.imprimirBoletaPorId(documentoId);
    } else {
      console.error("No se pudo obtener el ID del documento:", idOrCorrelativo);
      alert(
        "No se pudo procesar el documento para impresión. Verifique los datos.",
      );
    }
  }

  /**
   * Obtiene el ID del documento desde el valor proporcionado
   * @param idOrCorrelativo ID del documento (number) o correlativo (string)
   * @returns ID numérico del documento
   */
  private getDocumentoId(idOrCorrelativo: number | string): number | null {
    // Si ya es un número, lo retornamos directamente
    if (typeof idOrCorrelativo === "number") {
      return idOrCorrelativo;
    }

    // Si es string, intentamos extraer el ID del correlativo (fallback)
    return this.extractDocumentIdFromCorrelativo(idOrCorrelativo);
  }

  /**
   * Imprime una boleta específica obteniendo los datos desde la API
   * @param documentoId ID del documento a imprimir
   */
  imprimirBoletaPorId(documentoId: number) {
    this.documentoService.obtenerBoleta(documentoId).subscribe({
      next: (boletaData: BoletaElectronicaResponse) => {
        this.imprimirFormatoNormalConDatos(boletaData);
      },
      error: (error) => {
        console.error("Error al obtener boleta para impresión:", error);
        alert("Error al cargar los datos de la boleta para impresión");
      },
    });
  }

  /**
   * @deprecated Usar imprimirBoletaDirecta() en su lugar
   * Imprime una boleta específica obteniendo los datos desde la API usando el correlativo
   * @param correlativo Correlativo del documento
   */
  imprimirBoletaPorCorrelativo(correlativo: string) {
    console.warn(
      "imprimirBoletaPorCorrelativo() está deprecado. Usar imprimirBoletaDirecta() en su lugar.",
    );
    this.imprimirBoletaDirecta(correlativo);
  }

  /**
   * Método original modificado para trabajar con datos específicos
   */
  imprimirFormatoNormal() {
    if (!this.boletaData) {
      console.warn("No hay datos de boleta disponibles para imprimir");
      return;
    }
    this.imprimirFormatoNormalConDatos(this.boletaData);
  }

  /**
   * Imprime el formato normal usando datos específicos de boleta
   * @param boletaData Datos de la boleta a imprimir
   */
  private imprimirFormatoNormalConDatos(boletaData: BoletaElectronicaResponse) {
    const servicioContentNormal = this.esVentaLibro(boletaData)
      ? `<div class="course-grid">
           <div class="course-item full-width">
             <strong>Tipo:</strong> Venta de Libro
           </div>
           ${boletaData?.nombreLibro ? `<div class="course-item full-width"><strong>Libro:</strong> ${boletaData.nombreLibro}</div>` : ""}
         </div>`
      : `<div class="course-grid">
           <div class="course-item"><strong>Periodo:</strong> ${boletaData?.periodo || "N/A"}</div>
           <div class="course-item"><strong>Curso:</strong> ${boletaData?.curso || "N/A"}</div>
           <div class="course-item"><strong>Turno:</strong> ${boletaData?.turno || "N/A"}</div>
           <div class="course-item"><strong>Aula:</strong> ${boletaData?.aula || "N/A"}</div>
           <div class="course-item"><strong>Profesor:</strong> ${boletaData?.profesor || "N/A"}</div>
         </div>`;

    const WindowPrt = window.open(
      "",
      "",
      "width=900,height=650,scrollbars=yes,resizable=yes",
    );
    if (!WindowPrt) {
      alert(
        "No se pudo abrir la ventana de impresión. Verifica que no esté bloqueada por el navegador.",
      );
      return;
    }

    // Generate complete HTML content for printing
    const htmlContent = this.generarHTMLCompleto(
      boletaData,
      servicioContentNormal,
    );

    WindowPrt.document.write(htmlContent);
    WindowPrt.document.close();
  }

  /**
   * Genera el HTML completo para la impresión
   * @param boletaData Datos de la boleta
   * @param servicioContent Contenido HTML del servicio
   * @returns HTML string completo
   */
  private generarHTMLCompleto(
    boletaData: BoletaElectronicaResponse,
    servicioContent: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${this.getTipoDocumento(boletaData)} Electrónica</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            padding: 0;
            background: white;
            color: black !important;
            line-height: 1.4;
          }

          * {
            color: black !important;
          }

          .boleta-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 0;
            background: white;
            color: black;
          }

          .boleta-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #ddd;
          }

          .company-info {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
          }

          .company-logo {
            width: 80px;
            height: auto;
          }

          .company-details h1 {
            margin: 0 0 0.5rem 0;
            font-size: 1.5rem;
            font-weight: bold;
            color: black !important;
          }

          .company-details p {
            margin: 0.2rem 0;
            font-size: 0.9rem;
            color: black !important;
          }

          .document-info {
            text-align: center;
            border: 2px solid black;
            padding: 1rem;
            border-radius: 8px;
            background: #f8f9fa;
          }

          .document-type h2 {
            margin: 0 0 0.5rem 0;
            font-size: 1.2rem;
            color: black !important;
          }

          .document-number {
            font-size: 1.1rem;
            font-weight: bold;
            color: black !important;
          }

          .client-info, .course-info {
            margin: 1.5rem 0;
          }

          .client-info h3, .course-info h3 {
            margin: 0 0 1rem 0;
            font-size: 1.1rem;
            color: black !important;
            border-bottom: 2px solid black;
            padding-bottom: 0.5rem;
          }

          .client-grid, .course-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.5rem;
          }

          .course-item:last-child {
            grid-column: 1 / -1;
          }

          .client-item.full-width {
            grid-column: 1 / -1;
          }

          .client-item, .course-item {
            padding: 0.5rem 0;
          }

          .service-table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
          }

          .service-table th,
          .service-table td {
            border: 1px solid #000;
            padding: 0.75rem;
            text-align: left;
            color: black !important;
          }

          .service-table th {
            background-color: #f5f5f5;
            font-weight: bold;
            text-align: center;
            color: black !important;
          }

          .service-table td:nth-child(2),
          .service-table td:nth-child(3),
          .service-table td:nth-child(4),
          .service-table td:nth-child(5) {
            text-align: center;
          }

          .totals-section {
            margin-top: 2rem;
          }

          .totals-grid {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            max-width: 300px;
            margin-left: auto;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            width: 100%;
            padding: 0.25rem 0;
            border-bottom: 1px solid #eee;
          }

          .total-row.final-total {
            border-top: 2px solid black;
            border-bottom: 2px solid black;
            font-weight: bold;
            font-size: 1.1rem;
            margin-top: 0.5rem;
            padding: 0.5rem 0;
            background: #f8f9fa;
          }

          .total-label {
            font-weight: 500;
            color: black !important;
          }

          .total-value {
            font-weight: bold;
            min-width: 100px;
            text-align: right;
            color: black !important;
          }

          .footer-info {
            margin-top: 2rem;
            text-align: center;
            border-top: 1px solid #ddd;
            padding-top: 1rem;
          }

          .emission-date {
            margin-bottom: 1rem;
            font-size: 0.9rem;
            font-weight: bold;
          }

          .footer-text p {
            margin: 0.5rem 0;
            font-style: italic;
            color: black !important;
          }

          @media print {
            body {
              margin: 0;
              padding: 0;
            }

            .boleta-container {
              margin: 0;
              padding: 0;
            }
          }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        <div class="boleta-container">
          <!-- Header -->
          <div class="boleta-header">
            <div class="company-info">
              <img src="https://elcultural.edu.pe/images/asset6.png" alt="Logo" class="company-logo" />
              <div class="company-details">
                <h1>Centro Peruano Americano El Cultural</h1>
                <p>RUC: 20132111082</p>
                <p>Av. Venezuela 128 - Trujillo - La Libertad</p>
                <p>Teléfono: (044) 231512</p>
              </div>
            </div>
            <div class="document-info">
              <div class="document-type">
                <h2>${this.getTipoDocumento(boletaData)} DE VENTA ELECTRÓNICA</h2>
                <div class="document-number">
                  ${boletaData?.serie || "N/A"}-${boletaData?.numero || "N/A"}
                </div>
              </div>
            </div>
          </div>

          <!-- Datos del Cliente -->
          <div class="client-info">
            <h3>DATOS DEL CLIENTE</h3>
            <div class="client-grid">
              <div class="client-item"><strong>Código:</strong> ${boletaData?.codigo || "N/A"}</div>
              <div class="client-item"><strong>DNI:</strong> ${boletaData?.docId || "N/A"}</div>
              <div class="client-item full-width"><strong>Nombre Completo:</strong> ${boletaData?.completo || "N/A"}</div>
            </div>
          </div>

          <!-- Datos del Servicio -->
          <div class="course-info">
            <h3>DATOS DEL SERVICIO</h3>
            ${servicioContent}
          </div>

          <!-- Tabla de Servicios -->
          <div class="service-details">
            <table class="service-table">
              <thead>
                <tr>
                  <th>DESCRIPCIÓN</th>
                  <th>CANTIDAD</th>
                  <th>PRECIO UNIT.</th>
                  <th>IMPORTE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    ${boletaData?.concepto || "N/A"} -
                    ${this.esVentaLibro(boletaData) ? boletaData?.nombreLibro || "Libro" : boletaData?.curso || "N/A"}
                  </td>
                  <td>1</td>
                  <td>S/ ${(boletaData?.costo || 0).toFixed(2)}</td>
                  <td>S/ ${(boletaData?.total || 0).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Totales -->
          <div class="totals-section">
            <div class="totals-grid">
              <div class="total-row">
                <span class="total-label">Sub Total:</span>
                <span class="total-value">S/ ${(boletaData?.costo || 0).toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span class="total-label">IGV (0%):</span>
                <span class="total-value">S/ 0.00</span>
              </div>
              <div class="total-row final-total">
                <span class="total-label">MONTO CANCELADO:</span>
                <span class="total-value">S/ ${(boletaData?.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer-info">
            <div class="emission-date">
              <strong>Fecha de Emisión:</strong>
              ${boletaData?.fechaEmision ? new Date(boletaData.fechaEmision).toLocaleString("es-PE") : "N/A"}
            </div>
            <div class="footer-text">
              <p>Gracias por su preferencia</p>
              <p>¡Éxito en sus estudios!</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Determina si es venta de libro basado en el concepto
   * @param boletaData Datos de la boleta
   * @returns true si es venta de libro
   */
  private esVentaLibro(boletaData: BoletaElectronicaResponse | null): boolean {
    if (!boletaData) return false;
    const concepto = boletaData?.concepto || "";
    return (
      concepto.toLowerCase().includes("venta") ||
      concepto.toLowerCase().startsWith("venta")
    );
  }

  /**
   * Determina el tipo de documento basado en la serie
   * @param boletaData Datos de la boleta
   * @returns 'FACTURA' si la serie empieza con 'F', 'BOLETA' en otros casos
   */
  private getTipoDocumento(
    boletaData: BoletaElectronicaResponse | null,
  ): string {
    if (!boletaData) return "BOLETA";
    const serie = boletaData?.serie || "";
    return serie.toUpperCase().startsWith("F") ? "FACTURA" : "BOLETA";
  }

  /**
   * Extrae el ID numérico del correlativo
   * Ajusta esta lógica según el formato de tus correlativos
   * @param correlativo String del correlativo (ej: "B012-00000001" o directamente el ID)
   * @returns ID numérico o null si no se puede extraer
   */
  private extractDocumentIdFromCorrelativo(correlativo: string): number | null {
    // Opción 1: Si el correlativo es directamente el ID
    const numericId = parseInt(correlativo, 10);
    if (!isNaN(numericId)) {
      return numericId;
    }

    // Opción 2: Si el correlativo tiene formato como "B012-00000001"
    // Extraer la parte numérica después del guión
    const match = correlativo.match(/-([0-9]+)$/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }

    // Opción 3: Extraer todos los números del correlativo
    const allNumbers = correlativo.replace(/\D/g, "");
    if (allNumbers) {
      return parseInt(allNumbers, 10);
    }

    return null;
  }
}
