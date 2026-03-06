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
import { FormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { AlumnoService } from "../../services/alumno.service";
import { HorarioService } from "../../services/horario.service";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { MatInputModule } from "@angular/material/input";
import { NotasDetalleDialogComponent } from "./detalle-Historial.component";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Clipboard } from '@angular/cdk/clipboard';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Component as NgComponent, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

@Component({
  selector: "app-historial-academico",
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    PageHeaderComponent,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: "./historial-academico.component.html",
  styleUrls: ["./historial-academico.component.scss"],
})
export class HistorialAcademicoComponent implements OnInit, AfterViewInit {
  historial: any;
  filtro: string = "";
  displayedColumns: string[] = [
    "descripcion",
    "anio",
    "mes",
    "nombreAula",
    "nombreCompleto",
    "modalidad",
    "estado",
    "notaReg",
  ];
  dataSource = new MatTableDataSource<any>([]);
  private alumnoService = inject(AlumnoService);
  private horarioService = inject(HorarioService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
    // Obtener el DNI del usuario logueado desde localStorage
    let dni: string | null = null;

    const userStr = localStorage.getItem("alumno_currentUser");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.userName) {
        dni = user.userName;
      }
    }
    if (dni) {
      this.obtenerCodigoYHistorial(dni);
    } else {
      console.warn("No se encontró el DNI del usuario logueado.");
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  obtenerCodigoYHistorial(dni: string): void {
    this.alumnoService.verificarDni(dni).subscribe({
      next: (resp) => {
        if (resp.existe && resp.codigo) {
          this.alumnoService.getHistorialAcademico(resp.codigo).subscribe({
            next: (data) => {
              // Asegura que historial sea un array plano de objetos
              this.historial =
                Array.isArray(data) && Array.isArray(data[0]) ? data[0] : data;
              this.dataSource.data = this.historial;
              // paginator y sort ya están asignados en ngAfterViewInit
            },
            error: (err: any) => {
              console.error("Error al obtener historial académico:", err);
            },
          });
        } else {
          this.historial = null;
          this.dataSource.data = [];
        }
      },
      error: (err: any) => {
        console.error("Error al verificar DNI:", err);
      },
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  constructor() {
    // Configura el filtro personalizado para buscar en todos los campos
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      return Object.values(data).some(
        (val) => val && val.toString().toLowerCase().includes(filter),
      );
    };
  }

  async verDetalle(element: any): Promise<void> {
    // Obtener las notas usando el servicio NotasService
    // Se asume que element tiene idHorario, idFormatoNota, idregistro
    const idHorario = element.idHorario ?? element.IdHorario;
    const idFormatoNota = element.idFormatoNota ?? element.IdFormatoNota;
    const idRegistro = element.idregistro ?? element.Idregistro;

    if (!idHorario || !idFormatoNota) return;

    const notas: any = await this.alumnoService
      .listarNotas(idHorario, idFormatoNota, idRegistro)
      .toPromise();
    this.dialog.open(NotasDetalleDialogComponent, {
      width: "600px",
      data: { notas, element },
    });
  }

  abrirModalCodigoPlataforma(element: any): void {
    const idHorario = element.idHorario ?? element.IdHorario;
    
    if (!idHorario) {
      this.snackBar.open('No se encontró el ID del horario', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    this.horarioService.obtenerCodigoPlataforma(idHorario).subscribe({
      next: (codigo) => {
        if (codigo && codigo.codigo) {
          // Crear un diálogo simple para mostrar el código
          const dialogRef = this.dialog.open(CodigoPlataformaDialogComponent, {
            width: '400px',
            height: 'auto',
            data: {
              codigo: codigo.codigo,
              codigoTeacher: codigo.codigoTeacher,
              curso: element.descripcion || 'Curso'
            }
          });
        } else {
          this.snackBar.open('No se encontró código de plataforma para este horario', 'Cerrar', {
            duration: 3000
          });
        }
      }
    });
  }
  // Getter para obtener el alumno actual
  get selectedAlumno() {
    try {
      const userStr = localStorage.getItem("alumno_currentUser");
      if (userStr) {
        return JSON.parse(userStr);
      }
    } catch {
      return null;
    }
    return null;
  }

  // Getter para obtener el historial actual
  get allHistorialData() {
    return this.dataSource.data || [];
  }

  public generarPdfHistorial(): void {
    const alumno = this.selectedAlumno;
    const historial = this.allHistorialData;
    if (!alumno || !historial || historial.length === 0) return;

    // Extraer codigo y docid del primer elemento del historial si no están en alumno
    const firstHist = historial[0] || {};
    const codigo = alumno.codigo || firstHist.codigo || "";
    const docid = alumno.docid || firstHist.docid || "";

    const doc = new jsPDF();

    const img = new Image();
    img.src = "images/navbarLogo.png";

    img.onload = () => {
      // Logo más pequeño: ancho 40px, alto 14px
      doc.addImage(img, "PNG", 14, 10, 40, 14);

      // Línea debajo del logo (color #003384), más delgada y de ancho completo
      doc.setDrawColor(0, 51, 132); // RGB de #003384
      doc.setLineWidth(0.5);
      doc.line(0, 26, doc.internal.pageSize.getWidth(), 26);

      // Título centrado en color #C50E08
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(197, 14, 8); // #C50E08
      const pageWidth = doc.internal.pageSize.getWidth();
      const title = "Historial Académico";
      const titleWidth = doc.getTextWidth(title);
      doc.text(title, (pageWidth - titleWidth) / 2, 40);

      // Texto Nombre, DNI y Código in color #003384
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 51, 132); // #003384
      doc.text("Nombre:", 40, 50);
      doc.text("DNI:", 40, 56);
      doc.text("Código:", 40, 62);

      // Datos en negro y normal
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(`${alumno.completo || alumno.nombreCompleto || ""}`, 60, 50);
      doc.text(`${docid}`, 55, 56);
      doc.text(`${codigo}`, 60, 62);

      // Define columnas para el PDF (incluye docente)
      const columns = [
        { header: "Año", dataKey: "anio" },
        { header: "Mes", dataKey: "mes" },
        { header: "Curso", dataKey: "descripcion" },
        { header: "Modalidad", dataKey: "modalidad" },
        { header: "Aula", dataKey: "nombreAula" },
        { header: "Docente", dataKey: "nombreCompleto" },
        { header: "Nota", dataKey: "notaReg" },
        { header: "Estado", dataKey: "estado" },
      ];

      // Filas
      const rows = historial.map((item) => ({
        anio: item.anio,
        mes: item.mes,
        descripcion: item.descripcion,
        modalidad: item.modalidad,
        nombreAula: item.nombreAula,
        nombreCompleto: item.nombreCompleto,
        notaReg: item.notaReg,
        estado: item.estado,
      }));

      autoTable(doc, {
        startY: 70,
        head: [columns.map((col) => col.header.toUpperCase())],
        body: rows.map((row) => columns.map((col) => row[col.dataKey] ?? "")),
        styles: { fontSize: 9 },
        headStyles: {
          fillColor: [0, 51, 132],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
      });

      doc.save(`HistorialAcademico_${codigo}.pdf`);
    };

    // Si la imagen ya está cargada en caché, dispara manualmente el evento
    if (img.complete) {
      img.onload!(null as any);
    }
  }
}

// Componente de diálogo para mostrar el código de plataforma
@NgComponent({
  selector: 'app-codigo-plataforma-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    ClipboardModule,
    MatTooltipModule
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title class="dialog-title">
        <mat-icon>code</mat-icon>
        Código de Plataforma
      </h2>
      
      <div mat-dialog-content class="dialog-content">
        <mat-card class="info-card">
          <mat-card-header>
            <mat-card-subtitle>{{data.curso | titlecase}}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="codigo-section">
              <div class="codigo-container">
                <div class="codigo-value">{{data.codigo}}</div>
                <button mat-icon-button 
                        (click)="copiarCodigo(data.codigo)"
                        matTooltip="Copiar código"
                        class="copy-button">
                  <mat-icon>content_copy</mat-icon>
                </button>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
      
      <div mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="cerrar()" color="primary">
          <mat-icon>close</mat-icon>
          Cerrar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 10px;
    }
    
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 5px;
      color: var(--mat-sys-primary);
      margin-bottom: 10px;
    }
    
    .dialog-content {
      min-height: 100px;
    }
    
    .info-card {
      margin-bottom: 16px;
    }
    
    .codigo-section {
      margin-bottom: 16px;
    }
    
    .codigo-section h4 {
      color: var(--mat-sys-primary);
      margin: 0 0 8px 0;
      font-weight: 600;
    }
    
    .codigo-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .codigo-value {
      background: var(--mat-sys-container);
      padding: 12px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 16px;
      font-weight: bold;
      color: #333;
      border-left: 4px solid var(--mat-sys-secondary);
      flex: 1;
    }
    
    .copy-button {
      background: var(--mat-sys-primary);
      color: white;
      min-width: 40px;
      height: 40px;
    }
    
    .copy-button:hover {
      background: var(--mat-sys-primary-container);
    }
    
    .dialog-actions {
      justify-content: flex-end;
      padding-top: 20px;
    }
    
    .dialog-actions button {
      margin-left: 10px;
    }
  `]
})
export class CodigoPlataformaDialogComponent {
  private clipboard = inject(Clipboard);
  private snackBar = inject(MatSnackBar);

  constructor(
    public dialogRef: MatDialogRef<CodigoPlataformaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  copiarCodigo(codigo: string): void {
    if (this.clipboard.copy(codigo)) {
      this.snackBar.open('Código copiado al portapapeles', 'Cerrar', {
        duration: 2000,
        panelClass: ['success-snackbar']
      });
    } else {
      this.snackBar.open('Error al copiar el código', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
