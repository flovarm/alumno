import { UltimoCursoComponent } from "../../components/ultimo-curso/ultimo-curso.component";
import { UltimoRegistro } from "../../models/ultimo-registro";
import {
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  signal,
  Signal,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  ViewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { PeriodoService } from "../../services/periodo.service";
import { RegistroService } from "../../services/registro.service";
import { HorarioService } from "../../services/horario.service";
import { PaymentSpinnerService } from "../../services/loading.service";
import { MatTableModule, MatTableDataSource } from "@angular/material/table";
import { Router, RouterLink } from "@angular/router";
import { ReactiveFormsModule, FormControl, FormGroup } from "@angular/forms";
import { MatListModule } from "@angular/material/list";
import { MatDividerModule } from "@angular/material/divider";
import { MatStepperModule } from "@angular/material/stepper";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { environment } from "../../../environments/environment.development";
import { MatOption, MatSelectModule } from "@angular/material/select";
import { PostulanteService } from "../../_services/postulante.service";
import { NiubizService } from "../../services/niubiz.service";

@Component({
  selector: "app-registro-matricula",
  standalone: true,
  styleUrls: ["./registro-matricula.component.scss"],
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    PageHeaderComponent,
    UltimoCursoComponent,
    MatTableModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatListModule,
    MatDividerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    RouterLink,
    MatOption,
  ],
  template: `
    <div class="page-container">
      <app-page-header
        title="Registro de Matrícula"
        description="Gestiona tu matrícula y horarios"
        icon="assignment"
      >
      </app-page-header>

      <!-- Último Registro -->
      @if (ultimoRegistro()) {
        <app-ultimo-curso [registro]="ultimoRegistro()" />
        <div class="curso-calificacion">
          Nota mínima aprobatoria: {{ ultimoRegistro()?.notaMinimaAprobatoria }}
        </div>
        @if (!ultimoRegistro()?.registroCerrado) {
          <div class="curso-warning">
            <mat-icon>warning</mat-icon>
            El curso no está cerrado aún. Las notas podrían variar.
          </div>
        }
        @if (
          ultimoRegistro()?.mesesDejoEstudiar > 6 &&
          !porExamenClasificacion()
        ) {
          <div class="curso-danger">
            <mat-icon>warning</mat-icon>
            Necesitas volver a rendir tu examen de clasificación porque has
            dejado de estudiar más de 6 meses.
          </div>
        }
        @if (ultimoRegistro()?.deudaReg > 0) {
          <div class="curso-danger">
            <mat-icon>warning</mat-icon>
            No puedes matricularte porque tienes deudas pendientes. Por favor,
            regulariza tu situación
            <a [routerLink]="['/pago-deuda']">Desde aquí</a>.
          </div>
        }
      }

      @if (porExamenClasificacion()) {
        <div class="curso-calificacion">
          Horarios obtenidos por Examen de clasificación
        </div>
      }

      <mat-horizontal-stepper
        #stepper
        [selectedIndex]="stepIndex"
        style="margin-bottom:2rem;"
      >
        <mat-step label="Selecciona horario">
          <form [formGroup]="form">
            <div class="section-heading">
              <h2>Encuentra tu próximo horario</h2>
              <p>Filtra por sede o busca tu curso y revisa las vacantes disponibles.</p>
            </div>
            <div class="filter-container">
              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Buscar</mat-label>
                <input
                  matInput
                  type="text"
                  placeholder="Buscar por modalidad, aula, curso, profesor..."
                  formControlName="busqueda"
                  (keyup)="applyFilter($event)"
                />
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>
              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Seleccionar Sede</mat-label>
                <mat-select
                  formControlName="sede"
                  (selectionChange)="onSedeChange()"
                >
                  <mat-option value="">Todas las sedes</mat-option>
                  <mat-option value="TRUJILLO">Trujillo</mat-option>
                  <mat-option value="CHACHAPOYAS">Chachapoyas</mat-option>
                </mat-select>
                <mat-icon matSuffix>location_on</mat-icon>
              </mat-form-field>
            </div>
            <div class="table-container" role="region" aria-label="Horarios disponibles" tabindex="0">
              <table
                mat-table
                [dataSource]="horarios"
                class="horarios-table"
                style="width:100%;margin-bottom:1rem;"
              >
                <!-- MODALIDAD -->
                <ng-container matColumnDef="modalidad">
                  <th mat-header-cell *matHeaderCellDef>MODALIDAD</th>
                  <td mat-cell *matCellDef="let h">{{ h.modalidad }}</td>
                </ng-container>
                <!-- NOMBRE AULA -->
                <ng-container matColumnDef="nombreAula">
                  <th mat-header-cell *matHeaderCellDef>AULA</th>
                  <td mat-cell *matCellDef="let h">{{ h.nombreAula }}</td>
                </ng-container>
                <!-- NOMBRE CURSO -->
                <ng-container matColumnDef="nombreCurso">
                  <th mat-header-cell *matHeaderCellDef>CURSO</th>
                  <td mat-cell *matCellDef="let h">
                    {{ h.nombreCurso | titlecase }}
                  </td>
                </ng-container>
                <!-- NOMBRE PROFESOR -->
                <ng-container matColumnDef="nombreProfesor">
                  <th mat-header-cell *matHeaderCellDef>PROFESOR</th>
                  <td mat-cell *matCellDef="let h">
                    {{ h.nombreProfesor | titlecase }}
                  </td>
                </ng-container>
                <!-- NOMBRE SEDE -->
                <ng-container matColumnDef="nombreSede">
                  <th mat-header-cell *matHeaderCellDef>SEDE</th>
                  <td mat-cell *matCellDef="let h">
                    <strong>{{ h.nombreSede }}</strong>
                  </td>
                </ng-container>
                <!-- TURNO -->
                <ng-container matColumnDef="turno">
                  <th mat-header-cell *matHeaderCellDef>TURNO</th>
                  <td mat-cell *matCellDef="let h">{{ h.turno }}</td>
                </ng-container>
                <!-- VACANTES DISPONIBLES -->
                <ng-container matColumnDef="vacantesDisponibles">
                  <th mat-header-cell *matHeaderCellDef>DISPONIBLES</th>
                  <td mat-cell *matCellDef="let h">
                    <span class="vacantes-badge" [class.sin-vacantes]="h.vacantes - h.matriculados <= 0">
                      {{ h.vacantes - h.matriculados }}
                    </span>
                  </td>
                </ng-container>
                <!-- ACCIONES -->
                <ng-container matColumnDef="acciones">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let h">
                    <button
                      mat-flat-button
                      color="primary"
                      [disabled]="isRowDisabled(h)"
                      (click)="seleccionarHorarioFila(h)"
                      matStepperNext
                    >
                      Seleccionar
                    </button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr
                  mat-row
                  *matRowDef="let row; columns: displayedColumns"
                  [class.row-disabled]="isRowDisabled(row)"
                ></tr>
              </table>
            </div>
          </form>
        </mat-step>
        <mat-step label="Realizar Pago">
          @if (selectedHorario?.idHorario && user?.userName) {
            <div class="payment-container">
              @if (resumen) {
                <div class="payment-grid">
                  <!-- Columna izquierda: Resumen (8 columnas) -->
                  <div class="payment-summary">
                    <mat-card>
                      <mat-card-header>
                        <mat-icon mat-card-avatar>event_note</mat-icon>
                        <mat-card-title>Horario Seleccionado</mat-card-title>
                        <mat-card-subtitle
                          >Detalle del horario a matricular</mat-card-subtitle
                        >
                      </mat-card-header>
                      <mat-card-content>
                        <mat-list class="deuda-list" style="margin-top:1rem;">
                          <mat-list-item>
                            <mat-icon matListItemIcon>meeting_room</mat-icon>
                            <span matListItemTitle>{{
                              formatearAula(resumen.aula)
                            }}</span>
                            <span matListItemLine>Aula</span>
                          </mat-list-item>

                          <mat-list-item>
                            <mat-icon matListItemIcon>school</mat-icon>
                            <span matListItemTitle>{{
                              resumen.modalidad
                            }}</span>
                            <span matListItemLine>Modalidad</span>
                          </mat-list-item>

                          <mat-list-item>
                            <mat-icon matListItemIcon>book</mat-icon>
                            <span matListItemTitle>{{
                              resumen.curso
                            }}</span>
                            <span matListItemLine>Curso</span>
                          </mat-list-item>

                          <mat-list-item>
                            <mat-icon matListItemIcon>person</mat-icon>
                            <span matListItemTitle>{{
                              resumen.docente
                            }}</span>
                            <span matListItemLine>Docente</span>
                          </mat-list-item>

                          <mat-list-item>
                            <mat-icon matListItemIcon>schedule</mat-icon>
                            <span matListItemTitle>{{ resumen.turno }}</span>
                            <span matListItemLine>Turno</span>
                          </mat-list-item>

                          <!-- <mat-list-item>
                            <mat-icon matListItemIcon>calendar_today</mat-icon>
                            <div matListItemTitle>Días</div>
                            <div matListItemLine>{{ resumen.dias }}</div>
                          </mat-list-item> -->

                          <mat-list-item>
                            <mat-icon matListItemIcon>date_range</mat-icon>
                            <span matListItemTitle>{{
                              resumen.fechaInicio | date: "dd/MM/yyyy"
                            }}</span>
                            <span matListItemLine>Fecha de inicio</span>
                          </mat-list-item>

                          <mat-list-item>
                            <mat-icon matListItemIcon>date_range</mat-icon>
                            <span matListItemTitle>{{
                              resumen.fechaFinal | date: "dd/MM/yyyy"
                            }}</span>
                            <span matListItemLine>Fecha de fin</span>
                          </mat-list-item>

                          <mat-list-item>
                            <mat-icon matListItemIcon>location_on</mat-icon>
                            <span matListItemTitle>{{ resumen.sede }}</span>
                            <span matListItemLine>Sede</span>
                          </mat-list-item>

                        </mat-list>

                        <div class="terms-notice">
                          <mat-checkbox
                            [checked]="terminosAceptados"
                            (change)="actualizarAceptacionTerminos($event.checked)"
                            [disabled]="procesandoPago"
                          >
                            He leído y acepto los
                            <a
                              href="https://www.elcultural.com.pe/terminos-y-condiciones-del-servicio/"
                              target="_blank"
                              rel="noopener noreferrer"
                              class="terms-link"
                              (click)="$event.stopPropagation()"
                            >
                              Términos y Condiciones
                              <mat-icon class="external-link-icon"
                                >open_in_new</mat-icon
                              >
                            </a>
                          </mat-checkbox>
                        </div>

                        <!-- Mensaje de pago -->
                        <div
                          id="payment-message"
                          class="payment-message"
                          role="status"
                          aria-live="polite"
                          [style.display]="paymentMessage ? 'block' : 'none'"
                          [ngClass]="paymentMessageClass"
                        >
                          {{ paymentMessage }}
                        </div>
                          <div
                              class="payment-form-container"
                              [class.visible]="formularioNiubizAbierto || procesandoPago"
                            >
                        <div id="iframeContainer"></div>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  </div>

                  <!-- Formulario de pago Niubiz -->

                    <!-- <mat-card>
                      <mat-card-content>

                      </mat-card-content>
                    </mat-card> -->

                </div>
              }
            </div>
          } @else {
            <div class="seleccion-notice">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg
                    class="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium">Atención</p>
                  <p class="text-sm">
                    Primero debe seleccionar un horario para poder realizar el
                    pago. Regrese al paso anterior y elija un horario
                    disponible.
                  </p>
                </div>
              </div>
            </div>
          }

          <div class="stepper-actions" style="margin-top: 2rem;">
            <button mat-button matStepperPrevious>
              <mat-icon>arrow_back</mat-icon>
              Volver al paso anterior
            </button>
          </div>
        </mat-step>
      </mat-horizontal-stepper>
    </div>
  `,

  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RegistroMatriculaComponent implements OnInit {
  periodoActual = signal<any>(null);
  ultimoRegistro = signal<UltimoRegistro | null>(null);
  porExamenClasificacion = signal(false);
  horariosData = signal<any[]>([]);
  horarios = new MatTableDataSource<any>([]);
  estaRegistrado = signal<boolean>(false);
  resumen: any = null;

  user = JSON.parse(localStorage.getItem("alumno_currentUser"));
  displayedColumns = [
    "modalidad",
    "nombreAula",
    "nombreCurso",
    "nombreProfesor",
    "nombreSede",
    "turno",
    "vacantesDisponibles",
    "acciones",
  ];
  form = new FormGroup({
    busqueda: new FormControl(""),
    sede: new FormControl(""),
  });
  horarioControl = new FormControl<number | null>(null);
  selectedHorario: any = null;
  stepIndex = 0;
  private changeDetector = inject(ChangeDetectorRef);
  private pagoEnviado = false;
  procesandoPago = false;
  terminosAceptados = false;
  formularioNiubizAbierto = false;
  procesandoMatricula = false; // Nueva flag para evitar duplicados de matrícula
  paymentMessage: string = "";
  paymentMessageClass: string = "";
  private sessionKeyActual: string | null = null;
  private montoActual: string = "0";
  private orderNumberActual: string | null = null;
  private matriculaDataActual: any = null;
  private postulanteService = inject(PostulanteService);
  private periodoService = inject(PeriodoService);
  private registroService = inject(RegistroService);
  private horarioService = inject(HorarioService);
  private router = inject(Router);
  private niubizService = inject(NiubizService);

  cargarHorariosPorUltimoRegistro(idCurso: number, idPeriodo: number) {
    this.porExamenClasificacion.set(false);
    this.horarioService
      .obtenerHorarioPorCursoYPeriodo(idCurso, idPeriodo, this.user.userName)
      .subscribe({
        next: (response: any) => {
          if (response && typeof response === "object" && response.message) {
            this.estaRegistrado.set(true);
            this.horariosData.set([]);
            this.horarios.data = [];
          } else if (Array.isArray(response?.horarios)) {
            this.porExamenClasificacion.set(response.porExamenClasificacion === true);
            this.horariosData.set(response.horarios);
            this.horarios.data = response.horarios;
            this.estaRegistrado.set(false);
          } else {
            this.horariosData.set([]);
            this.horarios.data = [];
            this.estaRegistrado.set(false);
          }
        },
        error: (error) => {
          this.porExamenClasificacion.set(false);
          this.horariosData.set([]);
          this.horarios.data = [];
          this.estaRegistrado.set(false);
        },
      });
  }

  ngOnInit() {
    this.cargarCheckoutNiubiz();
    this.verificarRetornoPagoNiubiz();
    this.verificarMatriculaPendiente();

    // Configurar filtro personalizado para buscar en múltiples campos
    this.horarios.filterPredicate = (data: any, filter: string) => {
      const [searchText, selectedSede] = filter.split("|");
      const sedeMatch = !selectedSede || data.nombreSede === selectedSede;
      const textMatch =
        data.modalidad?.toLowerCase().includes(searchText) ||
        data.nombreAula?.toLowerCase().includes(searchText) ||
        data.nombreCurso?.toLowerCase().includes(searchText) ||
        data.nombreProfesor?.toLowerCase().includes(searchText) ||
        data.turno?.toLowerCase().includes(searchText);

      return sedeMatch && textMatch;
    };

    this.periodoService.ultimos12Periodos().subscribe((periodos: any) => {
      if (Array.isArray(periodos) && periodos.length > 0) {
        this.periodoActual.set(periodos[0]);
        this.obtenerUltimoRegistroPorAlumno();
      }
    });
  }

  obtenerUltimoRegistroPorAlumno() {
    this.registroService
      .obtenerUltimoRegistroPorAlumno(this.user.userName)
      .subscribe((registro) => {
        this.ultimoRegistro.set(registro);

        let idUltimoCurso: number | undefined;
        if (registro) {
          if (registro.apruebaReg === "P") {
            idUltimoCurso = registro.idCursoAprobado;
          } else if (registro.apruebaReg === "F") {
            idUltimoCurso = registro.idCursoDesaprobado;
          }
        }
        if (typeof idUltimoCurso === "number") {
          this.cargarHorariosPorUltimoRegistro(
            idUltimoCurso,
            this.periodoActual().idPeriodo,
          );
        } else if (!registro) {
          this.obtenerDatosPostulante();
        }
      });
  }

  obtenerDatosPostulante() {
    this.postulanteService.getByNumeroDocumento(this.user.userName).subscribe({
      next: (postulante: any) => {
        if (postulante && postulante.cursoSeleccionado) {
          this.cargarHorariosPorUltimoRegistro(
            postulante.cursoSeleccionado,
            this.periodoActual().idPeriodo,
          );
        }
      },
    });
  }

  private verificarRetornoPagoNiubiz() {
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get("payment");
    if (!payment) return;
    this.limpiarParametrosURL();
  }

  private verificarMatriculaPendiente() {
    const pendienteStr = localStorage.getItem("matricula_pendiente");
    if (!pendienteStr) return;

    let pendiente: any;
    try {
      pendiente = JSON.parse(pendienteStr);
    } catch {
      localStorage.removeItem("matricula_pendiente");
      return;
    }

    // Ignorar si tiene más de 24 horas (transacción expirada)
    const veinticuatroHoras = 24 * 60 * 60 * 1000;
    if (Date.now() - pendiente.timestamp > veinticuatroHoras) {
      localStorage.removeItem("matricula_pendiente");
      return;
    }

  }


  private limpiarParametrosURL() {
    // Limpiar parámetros de URL sin recargar la página
    const url = new URL(window.location.href);
    url.searchParams.delete("payment");
    url.searchParams.delete("transactionId");
    window.history.replaceState({}, document.title, url.toString());
  }

  getNotaColor(nota: number, estadoReg: string): string {
    if (nota >= 0 && estadoReg === "P") {
      return "var(--mat-sys-primary)";
    }
    return "var(--mat-sys-secondary";
  }

  irAResumenMatricula(idHorario: number) {
    this.router.navigate(["/registro-matricula/resumenmatricula"], {
      state: { idHorario },
    });
  }

  seleccionarHorario() {
    const idHorario = this.horarioControl.value;
    if (idHorario) {
      this.irAResumenMatricula(idHorario);
    }
  }

  seleccionarHorarioTabla() {
    const horario = this.selectedHorario;
    if (horario) {
      this.irAResumenMatricula(horario.idHorario);
    }
  }

  seleccionarHorarioFila(horario: any) {
    this.terminosAceptados = false;
    this.resumen = null;
    this.selectedHorario = horario;
    this.procesandoPago = false;
    this.formularioNiubizAbierto = false;

    setTimeout(() => {
      this.mostrarResumen(horario.idHorario, this.user.userName);
    }, 100);
  }

  onRowClick(row: any) {
    const isDisabled = this.isRowDisabled(row);
    if (!isDisabled) {
      this.selectedHorario = row;
    }
  }

  isRowDisabled(row: any): boolean {
    return (
      row.vacantes - row.matriculados <= 0 ||
      !row.cursoAbierto ||
      (this.ultimoRegistro()?.mesesDejoEstudiar > 6 &&
        !this.porExamenClasificacion()) ||
      this.ultimoRegistro()?.deudaReg > 0
    );
  }

  mostrarResumen(idHorario: number, docId: string) {
    this.horarioService.obtenerResumenPago(idHorario, docId).subscribe({
      next: (res: any) => {
        this.resumen = res;
        // Esperar a que Angular renderice el DOM completamente antes de iniciar el pago
        setTimeout(() => {
          // Verificar que el componente esté visible antes de procesar el pago
          this.waitForContainerAndProcessPayment(res.costo);
        }, 1000);
      },
      error: (err) => {
        this.resumen = null;
      },
    });
  }

  private waitForContainerAndProcessPayment(amount: number) {
    const checkContainer = () => {
      const container = document.getElementById("iframeContainer");
      if (container && this.formularioNiubizAbierto === false) {
        this.procesarPago(amount);
      } else {
        // Reintentar después de 500ms
        setTimeout(checkContainer, 500);
      }
    };
    checkContainer();
  }

  procesarPago(precio: number) {
    if (
      this.procesandoPago ||
      this.procesandoMatricula ||
      this.formularioNiubizAbierto
    ) {
      return;
    }

    this.procesandoPago = true;
    this.paymentMessage = "";

    const merchantId = environment.niubiz.merchantId;
    const purchaseNumber = this.obtenerPurchaseNumber();
    if (!purchaseNumber) {
      this.showPaymentMessage(
        "No se pudo generar el número de compra. Intente nuevamente.",
        "error",
      );
      this.procesandoPago = false;
      return;
    }

  //  this.currentTransactionId = transactionId;

    // const matriculaData = {
    //   docid: this.user.userName,
    //   IdHorario: this.resumen.idHorario,
    //   Costo: precio,
    //   Modalidad: this.resumen.modalidad,
    //   Periodo: this.resumen.periodo,
    //   Curso: this.resumen.curso,
    //   Turno: this.resumen.turno,
    //   Aula: this.resumen.aula,
    //   Profesor: this.resumen.docente,
    //   TransactionId:  merchantId,
    //   OrderNumber: orderNumber,
    //   transactionToken: '',
    //   customerEmail: this.user.email || '',
    //   channel: 'web',
    //   url: '',
    //   merchantId: merchantId,
    //   purchaseNumber: orderNumber,
    //   monto: precio,
    //   currency: 'PEN'
    // };

          this.niubizService.prepararYCrearSession(
            {
              purchaseNumber,
              amount: precio,
              merchantId,
              tipoOperacion: "matricula",
              docid: this.user?.userName,
              idHorario: this.resumen?.idHorario,
            },
            this.user.codigo,
          )
            .subscribe({
              next: (sessionResponse) => {
                this.procesandoPago = false;
                this.formularioNiubizAbierto = true;
                setTimeout(() => {
                  this.renderizarFormularioNiubiz(
                    sessionResponse.sessionKey,
                    precio,
                    purchaseNumber
                  );
                }, 100);
              },
              error: (err) => {
                console.error('Error al crear sesión Niubiz', err);
                this.showPaymentMessage("Error al obtener sesión de pago", "error");
                this.procesandoPago = false;
              },
            });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.updateTableFilter();

    if (this.horarios.paginator) {
      this.horarios.paginator.firstPage();
    }
  }

  onSedeChange() {
    this.updateTableFilter();

    if (this.horarios.paginator) {
      this.horarios.paginator.firstPage();
    }
  }

  private updateTableFilter() {
    const searchText = this.form.get("busqueda")?.value?.toLowerCase() || "";
    const selectedSede = this.form.get("sede")?.value || "";
    this.horarios.filter = `${searchText}|${selectedSede}`;
  }

  private renderizarFormularioNiubiz(
    sessionKey: string,
    amount: number,
    orderNumber: string
  ) {
    const container = document.getElementById("iframeContainer");
    if (!container) {
      this.showPaymentMessage("Error al cargar el contenedor del formulario de pago", "error");
      return;
    }

    container.innerHTML = "";

    this.sessionKeyActual = sessionKey;
    this.montoActual = amount.toFixed(2);
    this.orderNumberActual = orderNumber;

    // Actualizar matriculaData con los valores finales
    if (this.matriculaDataActual) {
      this.matriculaDataActual.monto = amount;
      this.matriculaDataActual.purchaseNumber = orderNumber;
      this.matriculaDataActual.OrderNumber = orderNumber;
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "niubizPayButton";
    btn.textContent = `Pagar S/ ${amount.toFixed(2)}`;
    btn.classList.add("niubiz-pay-button");
    btn.disabled = !this.terminosAceptados || this.procesandoPago;
    btn.addEventListener("click", () => this.abrirPagoNiubiz());
    container.appendChild(btn);

    setTimeout(() => {
      const paymentFormContainer = document.querySelector(".payment-form-container");
      if (paymentFormContainer) {
        paymentFormContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 1000);
  }

  private obtenerPurchaseNumber(): string | null {
    const idHorario = this.resumen?.idHorario;
    const codigoAlumno = this.user?.codigo;

    if (
      idHorario === null ||
      idHorario === undefined ||
      codigoAlumno === null ||
      codigoAlumno === undefined ||
      String(idHorario).trim() === "" ||
      String(codigoAlumno).trim() === ""
    ) {
      return null;
    }

    const purchaseNumber = `${idHorario}${codigoAlumno}`.trim();
    return purchaseNumber || null;
  }

  actualizarAceptacionTerminos(aceptados: boolean): void {
    this.terminosAceptados = aceptados;
    const botonPago = document.getElementById("niubizPayButton") as HTMLButtonElement | null;
    if (botonPago) {
      botonPago.disabled = !aceptados || this.procesandoPago || this.pagoEnviado;
    }
  }

  private abrirPagoNiubiz() {
    if (!this.terminosAceptados || this.pagoEnviado) return;
    const w = window as any;
    if (!w.VisanetCheckout || !this.sessionKeyActual) {
      this.showPaymentMessage(
        "El formulario de pago aún no está disponible. Intente nuevamente.",
        "error",
      );
      return;
    }

    const merchantId = environment.niubiz.merchantId;
    const idHorario = this.matriculaDataActual?.IdHorario ?? this.resumen?.idHorario;
    const docid = this.matriculaDataActual?.docid ?? this.user?.userName;
    const purchaseNumber = this.obtenerPurchaseNumber();
    if (!purchaseNumber) {
      this.showPaymentMessage(
        "No se pudo obtener el número de compra. Intente nuevamente.",
        "error",
      );
      return;
    }
    const actionUrl = `${environment.apiUrl}Pago/ProcesarPagoNiubiz/${merchantId}/${idHorario}/${docid}/${purchaseNumber}`;
    sessionStorage.setItem("niubiz_purchase_number", purchaseNumber);

    w.VisanetCheckout.configure({
      sessiontoken: this.sessionKeyActual,
      channel: this.matriculaDataActual?.channel || "web",
      merchantid: merchantId,
      purchasenumber: purchaseNumber,
      amount: parseFloat(this.montoActual),
      expirationminutes: "20",
      timeouturl: `${window.location.origin}/registro-matricula`,
      merchantlogo: "https://elcultural.edu.pe/images/navbarLogo.png",
      formbuttoncolor: "#1C04A4",
      action: actionUrl,
      complete: (params: any) => {
        if (this.pagoEnviado) return;
        this.pagoEnviado = true;
        this.procesandoPago = true;
        const botonPago = document.getElementById("niubizPayButton") as HTMLButtonElement | null;
        if (botonPago) {
          botonPago.disabled = true;
          botonPago.textContent = "Procesando pago...";
          botonPago.setAttribute("aria-busy", "true");
        }
        // El callback del SDK puede ejecutarse fuera de Angular.
        this.changeDetector.detectChanges();
        const formData = new FormData();
        formData.append("channel", this.matriculaDataActual?.channel || "web");
        formData.append("order.tokenId", params.transactionToken || "");
        formData.append("order.purchaseNumber", purchaseNumber);
        formData.append("order.amount", this.montoActual);
        formData.append("order.currency", "PEN");

        // El backend procesa el pago, genera la boleta y redirige a
        // /pago-exitoso?purchaseNumber=...&boleta=... con los datos de la boleta.
        const form = document.createElement("form");
        form.method = "POST";
        form.action = actionUrl;
        form.style.display = "none";
        formData.forEach((value, key) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value.toString();
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
      }
    });

    w.VisanetCheckout.open();
  }

  private cargarCheckoutNiubiz() {
    const w = window as any;
    if (w.VisanetCheckout) return;
    if (document.getElementById("niubizCheckoutScript")) return;

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.id = "niubizCheckoutScript";
    script.src = environment.niubiz.scriptUrl;
    document.head.appendChild(script);
  }

  private showPaymentMessage(message: string, type: "success" | "error") {
    this.paymentMessage = message;
    this.paymentMessageClass =
      type === "success" ? "payment-success" : "payment-error";
    // Desbloquear botón y resetear flags en caso de error
    if (type === "error") {
      this.formularioNiubizAbierto = false;
      this.procesandoMatricula = false;
    }
  }

  formatearAula(aula: string): string {
    if (!aula) return "";

    const aulaUpper = aula.toUpperCase();

    if (aulaUpper.startsWith("CG")) {
      return `Casa Grande ${aula}`;
    } else if (aulaUpper.startsWith("N")) {
      return `Colegio ${aula}`;
    } else if (aulaUpper.startsWith("P")) {
      return `Porvenir ${aula}`;
    } else if (aulaUpper.startsWith("C")) {
      return `Casona ${aula}`;
    } else if (aulaUpper.startsWith("V")) {
      return `Clase Virtual`;
    } else {
      return `Sede Principal ${aula}`;
    }
  }

}
