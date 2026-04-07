import {
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

@Component({
  selector: "app-registro-matricula",
  standalone: true,
  styleUrls: ["./registro-matricula.component.scss"],
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    PageHeaderComponent,
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
        <mat-card class="ultimo-registro-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>history</mat-icon>
            <mat-card-title>Último Registro Académico</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="ultimo-registro-grid">
              <div class="registro-item">
                <mat-icon>calendar_today</mat-icon>
                <div>
                  <div class="registro-label">Período</div>
                  <div class="registro-value">
                    {{ ultimoRegistro()?.periodo }}
                  </div>
                </div>
              </div>

              <div class="registro-item">
                <mat-icon>book</mat-icon>
                <div>
                  <div class="registro-label">Curso</div>
                  <div class="registro-value">
                    {{ ultimoRegistro()?.curso | titlecase }}
                  </div>
                </div>
              </div>

              <div class="registro-item">
                <mat-icon>grade</mat-icon>
                <div>
                  <div class="registro-label">Nota</div>
                  <div
                    class="registro-value"
                    [style.color]="
                      ultimoRegistro()?.apruebaReg === 'P'
                        ? 'var(--mat-sys-primary)'
                        : 'var(--mat-sys-secondary)'
                    "
                  >
                    {{ ultimoRegistro()?.notaRegistro }}
                  </div>
                </div>
              </div>

              <div class="registro-item">
                <mat-icon>location_on</mat-icon>
                <div>
                  <div class="registro-label">Sede</div>
                  <div class="registro-value">
                    {{ ultimoRegistro()?.nombreSed }}
                  </div>
                </div>
              </div>

              <div class="registro-item">
                <mat-icon>schedule</mat-icon>
                <div>
                  <div class="registro-label">Turno</div>
                  <div class="registro-value">
                    {{ ultimoRegistro()?.turno }}
                  </div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
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
          !examenCalificacion()?.idCurso
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

      @if (examenCalificacion()?.idCurso) {
        <div class="curso-calificacion">
          Cargando Horarios según examen de clasificación 
        </div>
      }

      <mat-horizontal-stepper
        #stepper
        [selectedIndex]="stepIndex"
        style="margin-bottom:2rem;"
      >
        <mat-step label="Selecciona horario">
          <form [formGroup]="form">
            <div class="filter-container">
              <mat-form-field class="filter-field">
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
              <mat-form-field class="filter-field">
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
            <div class="table-container">
              <table
                mat-table
                [dataSource]="horarios"
                class="mat-elevation-z1"
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
                    {{ h.vacantes - h.matriculados }}
                  </td>
                </ng-container>
                <!-- ACCIONES -->
                <ng-container matColumnDef="acciones">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let h">
                    <button
                      mat-flat-button
                      color="primary"
                      [disabled]="
                        h.vacantes - h.matriculados <= 0 ||
                        !h.cursoAbierto ||
                        (ultimoRegistro()?.mesesDejoEstudiar > 6 &&
                          !examenCalificacion()) ||
                        ultimoRegistro()?.deudaReg > 0
                      "
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
                        <mat-card-title>Horario Seleccionado</mat-card-title>
                      </mat-card-header>
                      <mat-card-content>
                        <mat-list style="margin-top:1rem;">
                          <mat-list-item>
                            <mat-icon matListItemIcon>meeting_room</mat-icon>
                            <div matListItemTitle>Aula</div>
                            <div matListItemLine>
                              {{ formatearAula(resumen.aula) }}
                            </div>
                          </mat-list-item>
                          <mat-divider></mat-divider>

                          <mat-list-item>
                            <mat-icon matListItemIcon>school</mat-icon>
                            <div matListItemTitle>Modalidad</div>
                            <div matListItemLine>{{ resumen.modalidad }}</div>
                          </mat-list-item>
                          <mat-divider></mat-divider>

                          <mat-list-item>
                            <mat-icon matListItemIcon>book</mat-icon>
                            <div matListItemTitle>Curso</div>
                            <div matListItemLine>{{ resumen.curso }}</div>
                          </mat-list-item>
                          <mat-divider></mat-divider>

                          <mat-list-item>
                            <mat-icon matListItemIcon>person</mat-icon>
                            <div matListItemTitle>Docente</div>
                            <div matListItemLine>{{ resumen.docente }}</div>
                          </mat-list-item>
                          <mat-divider></mat-divider>

                          <mat-list-item>
                            <mat-icon matListItemIcon>schedule</mat-icon>
                            <div matListItemTitle>Horario</div>
                            <div matListItemLine>
                              {{ resumen.turno }}
                            </div>
                          </mat-list-item>
                          <mat-divider></mat-divider>

                          <!-- <mat-list-item>
                            <mat-icon matListItemIcon>calendar_today</mat-icon>
                            <div matListItemTitle>Días</div>
                            <div matListItemLine>{{ resumen.dias }}</div>
                          </mat-list-item>
                          <mat-divider></mat-divider> -->

                          <mat-list-item>
                            <mat-icon matListItemIcon>date_range</mat-icon>
                            <div matListItemTitle>Fecha de inicio</div>
                            <div matListItemLine>
                              {{ resumen.fechaInicio | date: "dd/MM/yyyy" }}
                            </div>
                          </mat-list-item>
                          <mat-divider></mat-divider>

                          <mat-list-item>
                            <mat-icon matListItemIcon>attach_money</mat-icon>
                            <div matListItemTitle>Costo</div>
                            <div matListItemLine>S/ {{ resumen.costo }}</div>
                          </mat-list-item>
                          <mat-divider></mat-divider>

                          <mat-list-item>
                            <mat-icon matListItemIcon>location_on</mat-icon>
                            <div matListItemTitle>Sede</div>
                            <div matListItemLine>{{ resumen.sede }}</div>
                          </mat-list-item>
                        </mat-list>

                        <div class="terms-notice">
                          <mat-icon class="terms-icon">info</mat-icon>
                          <span>
                            Al registrar tu matrícula estás aceptando nuestros
                            <a
                              href="https://www.elcultural.com.pe/terminos-y-condiciones-del-servicio/"
                              target="_blank"
                              rel="noopener noreferrer"
                              class="terms-link"
                            >
                              Términos y Condiciones
                              <mat-icon class="external-link-icon"
                                >open_in_new</mat-icon
                              >
                            </a>
                          </span>
                        </div>

                        <div style="margin-top:1rem; text-align:center;">
                          <div class="payment-status">
                            @if (procesandoPago) {
                              <mat-icon class="spinning"
                                >hourglass_empty</mat-icon
                              >
                              <span>Preparando formulario de pago...</span>
                            } @else if (formularioIziPayAbierto) {
                              <mat-icon color="primary">payment</mat-icon>
                              <span>Complete el formulario de pago →</span>
                            }
                          </div>
                        </div>

                        <!-- Mensaje de pago -->
                        <div
                          id="payment-message"
                          class="payment-message"
                          [style.display]="paymentMessage ? 'block' : 'none'"
                          [ngClass]="paymentMessageClass"
                        >
                          {{ paymentMessage }}
                        </div>
                      </mat-card-content>
                    </mat-card>
                  </div>

                  <!-- Columna derecha: Formulario de pago (4 columnas) -->
                  <div
                    class="payment-form-container"
                    [class.visible]="formularioIziPayAbierto || procesandoPago"
                  >
                    <mat-card>
                      <mat-card-content>
                        @if (procesandoPago && !formularioIziPayAbierto) {
                          <div class="loading-payment">
                            <mat-spinner diameter="40"></mat-spinner>
                            <p>Preparando formulario de pago seguro...</p>
                          </div>
                        } @else {
                          <div class="payment-form-info">
                            <mat-icon color="primary">security</mat-icon>
                            <span>Formulario seguro procesado por IziPay</span>
                          </div>
                          <!-- Container para el formulario de IziPay -->
                          <div id="iframeContainer"></div>

                          <!-- Mensaje importante debajo del formulario -->
                          <div class="payment-footer-messages">
                            <div class="importante">
                              <mat-icon>warning</mat-icon>
                              No cierre está página hasta que se genere su
                              comprobante de pago!
                            </div>
                          </div>
                        }
                      </mat-card-content>
                    </mat-card>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg
                    class="h-5 w-5 text-yellow-400"
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
                  <p class="text-sm text-yellow-700 font-medium">Atención</p>
                  <p class="text-sm text-yellow-600">
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
  ultimoRegistro = signal<any>(null);
  examenCalificacion = signal<any>(null);
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
  procesandoPago = false;
  formularioIziPayAbierto = false; // Nueva propiedad para controlar el estado
  procesandoMatricula = false; // Nueva flag para evitar duplicados de matrícula
  paymentMessage: string = "";
  paymentMessageClass: string = "";
  private izipayLoaded = false;
  private currentTransactionId: string | null = null; // Para rastrear transacción actual
  private currentOrderNumber: string | null = null; // Para rastrear order number actual
  private processedTransactions = new Set<string>(); // Para rastrear transacciones ya procesadas
  private postulanteService = inject(PostulanteService);
  private periodoService = inject(PeriodoService);
  private registroService = inject(RegistroService);
  private horarioService = inject(HorarioService);
  private router = inject(Router);
  private paymentSpinner = inject(PaymentSpinnerService);

  cargarHorariosPorUltimoRegistro(idCurso: number, idPeriodo: number) {
    this.horarioService
      .obtenerHorarioPorCursoYPeriodo(idCurso, idPeriodo, this.user.userName)
      .subscribe({
        next: (response: any) => {
          if (response && typeof response === "object" && response.message) {
            this.estaRegistrado.set(true);
            this.horariosData.set([]);
            this.horarios.data = [];
          } else if (Array.isArray(response)) {
            this.horariosData.set(response);
            this.horarios.data = response;
            this.estaRegistrado.set(false);
          } else {
            this.horariosData.set([]);
            this.horarios.data = [];
            this.estaRegistrado.set(false);
          }
        },
        error: (error) => {
          this.horariosData.set([]);
          this.horarios.data = [];
          this.estaRegistrado.set(false);
        },
      });
  }

  ngOnInit() {
    // Verificar si viene de un retorno de pago
    this.verificarRetornoDePago();

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
      }
    });

    this.obtenerExamenCalificacion((examen: any) => {
      this.registroService
        .obtenerUltimoRegistroPorAlumno(this.user.userName)
        .subscribe((registro: any) => {
          this.ultimoRegistro.set(registro);

          let idUltimoCurso: number | undefined;
          if (registro) {
            if (registro.apruebaReg === "P") {
              idUltimoCurso = registro.idCursoAprobado;
            } else if (registro.apruebaReg === "F") {
              idUltimoCurso = registro.idCursoDesaprobado;
            }
          }

          const idCursoExamen = examen?.idCurso;
          let idCursoSeleccionado: number | undefined;

          if (typeof idCursoExamen === "number" && typeof idUltimoCurso === "number") {
            idCursoSeleccionado = Math.max(idCursoExamen, idUltimoCurso);
          } else {
            idCursoSeleccionado = idCursoExamen ?? idUltimoCurso;
          }

          if (typeof idCursoSeleccionado === "number") {
            this.cargarHorariosPorUltimoRegistro(
              idCursoSeleccionado,
              this.periodoActual().idPeriodo,
            );
          } else if (!registro) {
            this.obtenerDatosPostulante();
          }
        });
    });

  }


  obtenerDatosPostulante() {
     this.postulanteService.getByNumeroDocumento(this.user.userName).subscribe({
              next: (postulante: any) => {
                console.log("Datos del postulante:", postulante);
                if (postulante && postulante.cursoSeleccionado) {
                  this.cargarHorariosPorUltimoRegistro(postulante.cursoSeleccionado, this.periodoActual().idPeriodo);
                } 
              }
            }); 
  }

  private verificarRetornoDePago() {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get("payment");
    const transactionId = urlParams.get("transactionId");

    if (paymentStatus && transactionId) {
      if (paymentStatus === "success") {
        // Verificar el estado del pago en el servidor
        this.registroService.verificarEstadoPago(transactionId).subscribe({
          next: (response: any) => {
            if (response.success) {
              this.showPaymentMessage(
                "¡Pago procesado exitosamente! Tu matrícula se ha completado.",
                "success",
              );
              // Limpiar parámetros de URL
              this.limpiarParametrosURL();
              // Recargar datos inmediatamente
              window.location.reload();
            } else {
              this.showPaymentMessage(
                "El pago está siendo procesado. Te notificaremos cuando se complete.",
                "error",
              );
              this.limpiarParametrosURL();
            }
          },
          error: (err) => {
            this.showPaymentMessage(
              "Error verificando el estado del pago. Contacta al soporte.",
              "error",
            );
            this.limpiarParametrosURL();
          },
        });
      } else if (paymentStatus === "error") {
        this.showPaymentMessage(
          "El pago no se pudo completar. Por favor, inténtalo nuevamente.",
          "error",
        );
        this.limpiarParametrosURL();
      }
    }
  }

  private limpiarParametrosURL() {
    // Limpiar parámetros de URL sin recargar la página
    const url = new URL(window.location.href);
    url.searchParams.delete("payment");
    url.searchParams.delete("transactionId");
    window.history.replaceState({}, document.title, url.toString());
  }

  obtenerExamenCalificacion(callback?: (examen: any) => void) {
    this.registroService
      .obtenerExamenDeCalificacion(this.user.userName)
      .subscribe({
        next: (examen: any) => {
          if (examen) {
            this.examenCalificacion.set(examen);
          }
          callback?.(examen);
        },
        error: () => {
          callback?.(null);
        },
      });
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
    this.resumen = null;
    this.selectedHorario = horario;
    this.procesandoPago = false;
    this.formularioIziPayAbierto = false;

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
      this.ultimoRegistro()?.mesesDeJoEstudiar >= 6
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
      if (container && this.formularioIziPayAbierto === false) {
        this.procesarPago(amount);
      } else {
        // Reintentar después de 500ms
        setTimeout(checkContainer, 500);
      }
    };
    checkContainer();
  }

  procesarPago(precio: number) {
    // Validar si ya se está procesando un pago o matrícula
    if (
      this.procesandoPago ||
      this.procesandoMatricula ||
      this.formularioIziPayAbierto
    ) {
      return;
    }

    this.procesandoPago = true;
    this.paymentMessage = "";

    // Mostrar spinner de pago
    // Pago real
    const transactionId =
      Date.now().toString() + Math.random().toString().substr(2, 5);
    const orderNumber = this.resumen.idHorario + this.user.userName;

    // Guardar el ID de transacción y order number actuales
    this.currentTransactionId = transactionId;
    this.currentOrderNumber = orderNumber;

    // Preparar datos de matrícula para guardar como pendiente
    const matriculaData = {
      docid: this.user.userName,
      IdHorario: this.resumen.idHorario,
      Costo: precio,
      Modalidad: this.resumen.modalidad,
      Periodo: this.resumen.periodo,
      Curso: this.resumen.curso,
      Turno: this.resumen.turno,
      Aula: this.resumen.aula,
      Profesor: this.resumen.docente,
      TransactionId: transactionId,
      OrderNumber: orderNumber,
    };

    // Primero guardar la matrícula pendiente
    this.registroService
      .guardarMatriculaPendiente(transactionId, orderNumber, matriculaData)
      .subscribe({
        next: () => {
          // Luego obtener el token de pago
          this.registroService
            .obtenerTokenPago(precio, transactionId, orderNumber)
            .subscribe({
              next: (tokenResponse: any) => {
                if (tokenResponse.code === "00") {
                  this.initializeIziPay(
                    tokenResponse,
                    precio,
                    transactionId,
                    orderNumber,
                  );
                } else {
                  this.showPaymentMessage(
                    "Error al obtener token de pago",
                    "error",
                  );
                  this.currentTransactionId = null;
                }
                this.procesandoPago = false;
              },
              error: (err) => {
                this.showPaymentMessage("Error al procesar el pago", "error");
                this.procesandoPago = false;
                this.currentTransactionId = null;
              },
            });
        },
        error: (err) => {
          this.paymentSpinner.hideSpinner();
          this.showPaymentMessage("Error al preparar el pago", "error");
          this.procesandoPago = false;
          this.currentTransactionId = null;
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

  private async initializeIziPay(
    tokenResponse: any,
    amount: number,
    transactionId: string,
    orderNumber: string,
  ) {
    try {
      if (!this.izipayLoaded) {
        await this.loadIziPayScript();
      }
      await this.setupIziPayForm(
        tokenResponse,
        amount,
        transactionId,
        orderNumber,
      );
    } catch (error) {
      console.error("Error initializing IziPay:", error);
      this.formularioIziPayAbierto = false;
      this.procesandoPago = false;
      this.showPaymentMessage(
        "Error al cargar el formulario de pago. Inténtelo nuevamente.",
        "error",
      );
    }
  }

  private waitForContainer(
    maxAttempts: number = 10,
  ): Promise<HTMLElement | null> {
    return new Promise((resolve) => {
      let attempts = 0;
      const checkContainer = () => {
        const container = document.getElementById("iframeContainer");
        if (container) {
          resolve(container);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkContainer, 300);
        } else {
          resolve(null);
        }
      };
      checkContainer();
    });
  }

  private loadIziPayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).Izipay) {
        this.izipayLoaded = true;
        this.configureIziPayGlobally();
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = environment.izipay.scriptUrl;
      script.onload = () => {
        this.izipayLoaded = true;
        this.configureIziPayGlobally();
        resolve();
      };
      script.onerror = () => reject(new Error("Error cargando IziPay script"));
      document.head.appendChild(script);
    });
  }

  private configureIziPayGlobally() {
    // Add minimal styles to ensure embedded mode works properly
    if ((window as any).Izipay) {
      const globalStyle = document.createElement("style");
      globalStyle.id = "izipay-embedded-styles";
      globalStyle.innerHTML = `
        #iframeContainer .izipay-form,
        #iframeContainer .izipay-embedded {
          width: 100% !important;
          height: auto !important;
          border: none !important;
          border-radius: 8px !important;
        }
      `;

      if (!document.getElementById("izipay-embedded-styles")) {
        document.head.appendChild(globalStyle);
      }
    }
  }

  private async setupIziPayForm(
    tokenResponse: any,
    amount: number,
    transactionId: string,
    orderNumber: string,
  ) {
    const dateTimeTransaction = (Date.now() * 1000).toString();

    // Configuración específica para sandbox vs producción
    const isSandbox = !environment.production;

    // Wait for container to be available in DOM
    const container = await this.waitForContainer();
    if (!container) {
      throw new Error("Container #iframeContainer not found after waiting");
    }

    const iziConfig = {
      config: {
        transactionId: transactionId,
        action: "pay",
        merchantCode: environment.izipay.merchantCode,
        order: {
          orderNumber: orderNumber,
          currency: "PEN",
          amount: amount.toFixed(2),
          processType: "AT",
          merchantBuyerId: this.user?.userName || "12345678",
          dateTimeTransaction: dateTimeTransaction,
        },
        billing: {
          firstName: this.resumen?.nombres || "Juan",
          lastName: this.resumen?.apellidoPaterno || "Perez",
          email: this.getValidEmail(this.resumen?.correo),
          phoneNumber: this.user?.telefono || "999666333",
          street: "Av. Venezuela 128",
          city: "Trujillo",
          state: "La Libertad",
          country: "PE",
          postalCode: "13001",
          document: this.user?.userName || "12345678",
          documentType:
            this.user?.userName && this.user.userName.length > 8 ? "CE" : "DNI",
        },
        render: {
          typeForm: "embedded",
          container: "#iframeContainer",
          showButtonProcessForm: true,
        },
        appearance: {
          logo: "https://elcultural.edu.pe/images/asset6.png",
        },
        urlIPN: (environment as any).webhookUrl + "Registro/webhook/izipay",
      },
    };

    try {
      const checkout = new (window as any).Izipay(iziConfig);

      // Ocultar spinner cuando se abre IziPay (IziPay tiene su propio loading)
      this.paymentSpinner.hideSpinner();

      // Activar el formulario y ocultar procesando
      this.procesandoPago = false;
      this.formularioIziPayAbierto = true;

      // Clear container before loading
      if (container) {
        container.innerHTML = "";
      }

      checkout.LoadForm({
        authorization: tokenResponse.response.token,
        keyRSA: "RSA",
        callbackResponse: (response: any) => {
          // Desbloquear botón cuando se recibe respuesta
          this.formularioIziPayAbierto = false;
          this.handlePaymentResponse(response);
        },
      });

      // Scroll to the embedded form after it loads
      setTimeout(() => {
        const paymentFormContainer = document.querySelector(
          ".payment-form-container",
        );
        if (paymentFormContainer) {
          paymentFormContainer.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }
      }, 1000);
    } catch (error) {
      this.formularioIziPayAbierto = false;
      this.procesandoPago = false;

      console.error("IziPay Error:", error);

      // Mensaje específico para diferentes tipos de errores
      let errorMessage = "Error al inicializar el formulario de pago";

      if (error?.toString().includes("CORS")) {
        errorMessage =
          "Error de CORS detectado. Esto es común en sandbox. El pago puede funcionar normalmente.";
      } else if (error?.message?.includes("allowedValues")) {
        errorMessage =
          "Error de configuración en el formulario de pago. Contacte soporte técnico.";
      } else if (error?.message?.includes("Container")) {
        errorMessage = "Error al cargar el contenedor del formulario de pago.";
      }

      this.showPaymentMessage(errorMessage, "error");
    }
  }

  private handlePaymentResponse(response: any) {
    if (response.code === "00") {
      // Validar que no se haya procesado ya esta transacción
      const transactionKey = `${this.currentTransactionId}_${this.selectedHorario.idHorario}_${this.user.userName}`;

      if (this.processedTransactions.has(transactionKey)) {
        return;
      }

      // Validar que no se esté procesando ya una matrícula
      if (this.procesandoMatricula) {
        return;
      }

      // Marcar como procesando matrícula
      this.procesandoMatricula = true;

      // Agregar a transacciones procesadas
      this.processedTransactions.add(transactionKey);

      this.showPaymentMessage(
        "Pago exitoso. Procesando matrícula...",
        "success",
      );

      // Preparar datos para la matrícula
      const matriculaData = {
        docid: this.user.userName,
        IdHorario: this.selectedHorario.idHorario,
        Costo: this.resumen.costo,
        Modalidad: this.resumen.modalidad,
        Periodo: this.resumen.periodo,
        Curso: this.resumen.curso,
        Turno: this.resumen.turno,
        Aula: this.resumen.aula,
        Profesor: this.resumen.docente,
        TransactionId: this.currentTransactionId,
        OrderNumber: this.currentOrderNumber,
      };

      // Mostrar spinner solo cuando inicia el registro de matrícula
      this.paymentSpinner.showSpinner("Registrando matrícula...");

      // Llamar al endpoint de matrícula
      this.registroService.matricularAlumno(matriculaData).subscribe({
        next: (matriculaResponse: any) => {
          matriculaResponse.fechaInicio = this.resumen.fechaInicio;
          // Redirigir directamente a la boleta electrónica
          this.paymentSpinner.hideSpinner();
          this.router.navigate(["/boleta-electronica"], {
            state: matriculaResponse,
            replaceUrl: true,
          });
          // Limpiar flags después de la navegación
          this.procesandoMatricula = false;
          this.currentTransactionId = null;
        },
        error: (matriculaError) => {
          this.paymentSpinner.hideSpinner();

          // Si el error es por duplicado, no mostrar error severo
          if (
            matriculaError.status === 409 ||
            matriculaError.error?.message?.includes("ya existe")
          ) {
            this.showPaymentMessage(
              "La matrícula ya fue registrada. Redirigiendo...",
              "success",
            );
            this.router.navigate(["/home"]);
          } else {
            this.showPaymentMessage(
              "Error al procesar la matrícula. Contacte soporte.",
              "error",
            );
            // Remover de transacciones procesadas si hubo error real
            this.processedTransactions.delete(transactionKey);
          }

          this.procesandoMatricula = false;
        },
      });
    } else {
      this.paymentSpinner.hideSpinner();
      this.showPaymentMessage(
        `Error en el pago: ${response.message || JSON.stringify(response)}`,
        "error",
      );
    }
  }

  private showPaymentMessage(message: string, type: "success" | "error") {
    this.paymentMessage = message;
    this.paymentMessageClass =
      type === "success" ? "payment-success" : "payment-error";
    // Desbloquear botón y resetear flags en caso de error
    if (type === "error") {
      this.formularioIziPayAbierto = false;
      this.procesandoMatricula = false;
      this.currentTransactionId = null;
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

  private isValidEmail(email: string): boolean {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private getValidEmail(emailString: string): string {
    if (!emailString) return "test@example.com";

    // Si contiene múltiples emails separados por " / ", tomar el primero
    const emails = emailString.split(" / ");
    const firstEmail = emails[0].trim();

    // Validar el primer email
    if (this.isValidEmail(firstEmail)) {
      return firstEmail;
    }

    // Si el primer email no es válido, intentar con el segundo si existe
    if (emails.length > 1) {
      const secondEmail = emails[1].trim();
      if (this.isValidEmail(secondEmail)) {
        return secondEmail;
      }
    }

    // Si ningún email es válido, usar el fallback
    return "test@example.com";
  }
}
