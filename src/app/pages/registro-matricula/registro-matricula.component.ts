import { Component, inject, OnInit, signal, Signal, computed, CUSTOM_ELEMENTS_SCHEMA, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { PeriodoService } from '../../services/periodo.service';
import { RegistroService } from '../../services/registro.service';
import { HorarioService } from '../../services/horario.service';
import { MatTableModule } from '@angular/material/table';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatStepperModule } from '@angular/material/stepper';
import { environment } from '../../../environments/environment.development';



@Component({
  selector: 'app-registro-matricula',
  standalone: true,
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
    RouterLink
],
  template: `
    <div class="page-container">
      <app-page-header
        title="Registro de Matrícula"
        description="Gestiona tu matrícula y horarios"
        icon="assignment">
      </app-page-header>

      <!-- Último Registro -->
      @if (ultimoRegistro()) {
        <mat-card class="ultimo-registro-card" style="margin-bottom: 2rem;">
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
                  <div class="registro-value">{{ultimoRegistro()?.periodo}}</div>
                </div>
              </div>
              
              <div class="registro-item">
                <mat-icon>book</mat-icon>
                <div>
                  <div class="registro-label">Curso</div>
                  <div class="registro-value">{{ultimoRegistro()?.curso | titlecase}}</div>
                </div>
              </div>
              
              <div class="registro-item">
                <mat-icon>grade</mat-icon>
                <div>
                  <div class="registro-label">Nota</div>
                  <div class="registro-value" 
                       [style.color]="ultimoRegistro()?.apruebaReg === 'P' ? 'var(--mat-sys-primary)' : 'var(--mat-sys-secondary)'">
                    {{ultimoRegistro()?.notaRegistro}}
                  </div>
                 
                </div>
              </div>
              
              <div class="registro-item">
                <mat-icon>location_on</mat-icon>
                <div>
                  <div class="registro-label">Sede</div>
                  <div class="registro-value">{{ultimoRegistro()?.nombreSed}}</div>
                </div>
              </div>
              
              <div class="registro-item">
                <mat-icon>schedule</mat-icon>
                <div>
                  <div class="registro-label">Turno</div>
                  <div class="registro-value">{{ultimoRegistro()?.turno}}</div>
                </div>
              </div>
            </div>
          </mat-card-content>

        </mat-card>
        <div class="registro-lienal">Nota mínima aprobatoria: {{ultimoRegistro()?.notaMinimaAprobatoria}}</div>
        @if (!ultimoRegistro()?.registroCerrado) {
          <div class="curso-warning">
            <mat-icon>warning</mat-icon>
            El curso no está cerrado aún. Las notas podrían variar.
          </div>
        }
        @if (ultimoRegistro()?.mesesDejoEstudiar > 6 && !examenCalificacion()?.idCurso) {
          <div class="curso-danger">
            <mat-icon>warning</mat-icon>
            Necesitas volver a rendir tu examen de clasificación porque has dejado de estudiar más de 6 meses.
          </div>
        }
        @if (ultimoRegistro()?.deudaReg > 0) {
          <div class="curso-danger">
            <mat-icon>warning</mat-icon>
            No puedes matricularte porque tienes deudas pendientes. Por favor, regulariza tu situación <a [routerLink]="['/pago-deuda']">Desde aquí</a>.
          </div>
        }
      }      

      <mat-horizontal-stepper #stepper [selectedIndex]="stepIndex" style="margin-bottom:2rem;">
        <mat-step label="Selecciona horario">
          <!-- ...existing horario selection UI... -->
          <form [formGroup]="form">
            <div class="table-container">
              <table mat-table [dataSource]="horarios()" class="mat-elevation-z1" style="width:100%;margin-bottom:1rem;">
                <!-- MODALIDAD -->
                <ng-container matColumnDef="modalidad">
                  <th mat-header-cell *matHeaderCellDef>MODALIDAD</th>
                  <td mat-cell *matCellDef="let h">{{h.modalidad}}</td>
                </ng-container>
                <!-- NOMBRE AULA -->
                <ng-container matColumnDef="nombreAula">
                  <th mat-header-cell *matHeaderCellDef>AULA</th>
                  <td mat-cell *matCellDef="let h">{{h.nombreAula}}</td>
                </ng-container>
                <!-- NOMBRE CURSO -->
                <ng-container matColumnDef="nombreCurso">
                  <th mat-header-cell *matHeaderCellDef>CURSO</th>
                  <td mat-cell *matCellDef="let h">{{h.nombreCurso | titlecase}}</td>
                </ng-container>
                <!-- NOMBRE PROFESOR -->
                <ng-container matColumnDef="nombreProfesor">
                  <th mat-header-cell *matHeaderCellDef>PROFESOR</th>
                  <td mat-cell *matCellDef="let h">{{h.nombreProfesor | titlecase}}</td>
                </ng-container>
                <!-- TURNO -->
                <ng-container matColumnDef="turno">
                  <th mat-header-cell *matHeaderCellDef>TURNO</th>
                  <td mat-cell *matCellDef="let h">{{h.turno}}</td>
                </ng-container>
                <!-- VACANTES -->
                <ng-container matColumnDef="vacantes">
                  <th mat-header-cell *matHeaderCellDef>VACANTES</th>
                  <td mat-cell *matCellDef="let h">{{h.vacantes}}</td>
                </ng-container>
                <!-- MATRICULADOS -->
                <ng-container matColumnDef="matriculados">
                  <th mat-header-cell *matHeaderCellDef>MATRICULADOS</th>
                  <td mat-cell *matCellDef="let h">{{h.matriculados}}</td>
                </ng-container>
                <!-- ACCIONES -->
                <ng-container matColumnDef="acciones">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let h">
                    <button mat-flat-button color="primary"
                      [disabled]="h.vacantes <= h.matriculados || !h.cursoAbierto || (ultimoRegistro()?.mesesDejoEstudiar > 6 && !examenCalificacion()) || ultimoRegistro()?.deudaReg > 0"
                      (click)="seleccionarHorarioFila(h)" matStepperNext>
                      Seleccionar
                    </button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                  [class.row-disabled]="isRowDisabled(row)">
                </tr>
              </table>
            </div>
          </form>
        </mat-step>
        <mat-step label="Realizar Pago">
          @if (selectedHorario?.idHorario && user?.userName) {
           <div>
    <mat-card>
        <mat-card-header>
            <mat-card-title>
            Horario Seleccionado
            </mat-card-title>
            <mat-card-subtitle></mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>

            @if (resumen) {
        
                <mat-list  style="margin-top:1rem;">
                  <mat-list-item>
                    <mat-icon matListItemIcon>meeting_room</mat-icon>
                    <div matListItemTitle>Aula</div>
                    <div matListItemLine>{{formatearAula(resumen.aula)}}</div>
                  </mat-list-item>
                  <mat-divider></mat-divider>
                  
                  <mat-list-item>
                    <mat-icon matListItemIcon>school</mat-icon>
                    <div matListItemTitle>Modalidad</div>
                    <div matListItemLine>{{resumen.modalidad}}</div>
                  </mat-list-item>
                  <mat-divider></mat-divider>
                  
                  <mat-list-item>
                    <mat-icon matListItemIcon>book</mat-icon>
                    <div matListItemTitle>Curso</div>
                    <div matListItemLine>{{resumen.curso}}</div>
                  </mat-list-item>
                  <mat-divider></mat-divider>
                  
                  <mat-list-item>
                    <mat-icon matListItemIcon>person</mat-icon>
                    <div matListItemTitle>Profesor</div>
                    <div matListItemLine>{{resumen.docente | titlecase}}</div>
                  </mat-list-item>
                  <mat-divider></mat-divider>
                  
                  <mat-list-item>
                    <mat-icon matListItemIcon>schedule</mat-icon>
                    <div matListItemTitle>Turno</div>
                    <div matListItemLine>{{resumen.turno}}</div>
                  </mat-list-item>
                  <mat-divider></mat-divider>
                  
                  <mat-list-item>
                    <mat-icon matListItemIcon>event</mat-icon>
                    <div matListItemTitle>Fecha de Inicio</div>
                    <div matListItemLine>{{resumen.fechaInicio | date:'dd/MM/yyyy'}}</div>
                  </mat-list-item>
                  <mat-divider></mat-divider>
                  
                  <mat-list-item>
                    <mat-icon matListItemIcon>event_available</mat-icon>
                    <div matListItemTitle>Fecha de Fin</div>
                    <div matListItemLine>{{resumen.fechaFinal | date:'dd/MM/yyyy'}}</div>
                  </mat-list-item>
                  <mat-divider></mat-divider>
                  
                  <mat-list-item>
                    <mat-icon matListItemIcon>group</mat-icon>
                    <div matListItemTitle>Vacantes Disponibles</div>
                    <div matListItemLine>{{resumen.vacantesDisponibles}}</div>
                  </mat-list-item>
                  <mat-divider></mat-divider>
                  
                  <mat-list-item>
                    <mat-icon matListItemIcon>location_on</mat-icon>
                    <div matListItemTitle>Sede</div>
                    <div matListItemLine>{{resumen.sede}}</div>
                  </mat-list-item>
                </mat-list>
                
                <div style="margin-top:2rem; text-align:center;">
                  <button mat-flat-button color="accent" style="font-size:1.2rem; padding:1rem 2rem;"
                  (click)="procesarPago(resumen.costo)"
                  [disabled]="procesandoPago || formularioIziPayAbierto ">
                  <mat-icon>payment</mat-icon>
                  {{ 
                    procesandoPago ? 'Procesando...' : 
                    formularioIziPayAbierto ? 'Procesando...' : 
                    'Pagar S/ ' + resumen.costo 
                  }}
                </button>
                </div>
                
                <!-- Mensaje de pago -->
                <div id="payment-message" 
                     class="payment-message" 
                     [style.display]="paymentMessage ? 'block' : 'none'"
                     [ngClass]="paymentMessageClass">
                  {{ paymentMessage }}
                </div>
                
                <!-- Container para el formulario de IziPay -->
                <div id="iframeContainer"></div>
              }
        </mat-card-content>
    </mat-card>
     
    </div>
          }@else {
            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-yellow-700 font-medium">
                    Atención
                  </p>
                  <p class="text-sm text-yellow-600">
                    Primero debe seleccionar un horario para poder realizar el pago. 
                    Regrese al paso anterior y elija un horario disponible.
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
  styles: [`
    .page-container {
      max-width: 1200px;
      margin: 0 auto;
    }



    .content-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .info-card {
      background: var(--mat-sys-surface-container);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 16px;
    }

    .metric-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--mat-sys-primary);
      margin: 0.5rem 0;
    }

    .metric-label {
      color: var(--mat-sys-on-surface-variant);
      margin: 0;
      font-size: 0.875rem;
    }

    .registro-lienal{
      background: var(--mat-sys-tertiary);
      color: var(--mat-sys-on-tertiary);
      padding: 0.25rem 0.5rem;
      margin-bottom: 2rem;
      width: fit-content;
    }

    .schedule-card {
      background: var(--mat-sys-surface-container);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 16px;
    }

    .schedule-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .schedule-day {
      background: var(--mat-sys-surface-container-high);
      border-radius: 12px;
      padding: 1rem;
      border: 1px solid var(--mat-sys-outline-variant);
    }

    .schedule-day h3 {
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--mat-sys-primary);
      text-align: center;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid var(--mat-sys-primary-container);
    }

    .schedule-item {
      background: var(--mat-sys-surface);
      border-radius: 8px;
      padding: 0.75rem;
      margin-bottom: 0.75rem;
      border: 1px solid var(--mat-sys-outline-variant);
      box-shadow: 0 1px 3px var(--mat-sys-shadow);
    }

    .schedule-item:last-child {
      margin-bottom: 0;
    }

    .time {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--mat-sys-primary);
      margin-bottom: 0.25rem;
    }

    .subject {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--mat-sys-on-surface);
      margin-bottom: 0.25rem;
      line-height: 1.2;
    }

    .room {
      font-size: 0.8rem;
      color: var(--mat-sys-on-surface-variant);
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .room::before {
      content: "📍";
      font-size: 0.7rem;
    }

    .mdc-list-item--with-trailing-radio.mdc-list-item, .mdc-list-item--with-trailing-checkbox.mdc-list-item {
    padding-left: 16px;
    padding-right: 0;
    height: 180px;
}

    ::ng-deep mat-list-option .horario-card {
      min-height: var(--mat-list-item-min-height, 120px);
      margin-bottom: var(--mat-list-item-spacing, 16px);
      display: block;
      background: var(--mat-sys-surface);
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.07);
      border: 1px solid var(--mat-sys-outline-variant);
      transition: box-shadow 0.2s;
    }

    ::ng-deep mat-list-option.mat-list-item-selected .horario-card {
      box-shadow: 0 4px 16px var(--mat-sys-shadow);
      border: 2px solid var(--mat-sys-primary);
    }

    .horario-atributo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
      margin-bottom: 6px;
    }

    .horario-atributo mat-icon {
      font-size: 1.3rem;
      vertical-align: middle;
      color: var(--mat-sys-primary);
    }

    .horario-card-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    @media (max-width: 700px) {
      .horario-card-grid {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }
    }

    @media (max-width: 768px) {
      .content-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      
       .mdc-list-item--with-trailing-radio.mdc-list-item, .mdc-list-item--with-trailing-checkbox.mdc-list-item {
    padding-left: 8px;
    padding-right: 0;
    height: 300px;
}
      
      .schedule-grid {
        grid-template-columns: 1fr;
      }
      
      .schedule-day {
        padding: 0.75rem;
      }
    }

    .row-disabled {
      pointer-events: none;
      opacity: 0.5;
      background: var(--mat-sys-surface-variant);
    }

    .table-container {
      overflow-x: auto;
      width: 100%;
    }

    @media (max-width: 768px) {
      .table-container {
        overflow-x: scroll;
        -webkit-overflow-scrolling: touch;
      }
      
      table {
        min-width: 800px;
      }
    }

    .ultimo-registro-card {
      background: var(--mat-sys-surface-container);
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 16px;
    }

    .ultimo-registro-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-top: 1rem;
    }

    .registro-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: var(--mat-sys-surface-container-high);
      border-radius: 12px;
      border: 1px solid var(--mat-sys-outline-variant);
    }

    .registro-item mat-icon {
      color: var(--mat-sys-primary);
      font-size: 1.5rem;
    }

    .registro-label {
      font-size: 0.875rem;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 0.25rem;
    }

    .registro-value {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
    }

    @media (max-width: 768px) {
      .ultimo-registro-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
    }

    .curso-warning {
      background: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
      border-left: 4px solid var(--mat-sys-tertiary);
      padding: 1rem;
      margin-bottom: 1rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .curso-calificacion {
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      border-left: 4px solid var(--mat-sys-primary);
      padding: 1rem;
      margin-bottom: 1rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .curso-warning mat-icon {
      color: var(--mat-sys-tertiary);
    }
    .curso-danger {
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
      border-left: 4px solid var(--mat-sys-secondary);
      padding: 1rem;
      margin-bottom: 1rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .curso-danger mat-icon {
      color: var(--mat-sys-secondary);
    }

    .payment-message {
      margin-top: 1rem;
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
      font-weight: 500;
    }

    .payment-success {
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
      border: 1px solid var(--mat-sys-primary);
    }

    .payment-error {
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
      border: 1px solid var(--mat-sys-error);
    }

    .stepper-actions {
      display: flex;
      justify-content: flex-start;
      padding: 1rem 0;
      border-top: 1px solid var(--mat-sys-outline-variant);
    }

    .stepper-actions button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  `],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class RegistroMatriculaComponent implements OnInit {
  periodoActual = signal<any>(null);
  ultimoRegistro = signal<any>(null);
  examenCalificacion = signal<any>(null);
  horarios = signal<any[]>([]);
  estaRegistrado = signal<boolean>(false);
  resumen: any = null;
 
  user = JSON.parse(localStorage.getItem('alumno_currentUser'));
  displayedColumns = [
    'modalidad', 'nombreAula', 'nombreCurso',
    'nombreProfesor', 'turno', 'vacantes', 'matriculados', 'acciones'
  ];
  form = new FormGroup({});
  horarioControl = new FormControl<number | null>(null);
  selectedHorario: any = null;
  stepIndex = 0;
  procesandoPago = false;
  formularioIziPayAbierto = false; // Nueva propiedad para controlar el estado
  paymentMessage: string = '';
  paymentMessageClass: string = '';
  private izipayLoaded = false;

  private periodoService = inject(PeriodoService);
  private registroService = inject(RegistroService);
  private horarioService = inject(HorarioService);
  private router = inject(Router);

  cargarHorariosPorUltimoRegistro(idCurso: number , idPeriodo: number) {

      this.horarioService.obtenerHorarioPorCursoYPeriodo(idCurso, idPeriodo, this.user.userName)
        .subscribe({
          next: (response: any) => {
            if (response && typeof response === 'object' && response.message) {
              this.estaRegistrado.set(true);
              this.horarios.set([]);
            } else if (Array.isArray(response)) {
              this.horarios.set(response);
              this.estaRegistrado.set(false);
            } else {
              this.horarios.set([]);
              this.estaRegistrado.set(false);
            }
          },
          error: (error) => {
            this.horarios.set([]);
            this.estaRegistrado.set(false);
          }
        });
  }

  ngOnInit() {
    this.periodoService.ultimos12Periodos().subscribe((periodos: any) => {
      if (Array.isArray(periodos) && periodos.length > 0) {
        this.periodoActual.set(periodos[0]);
      }
    });

    
      this.registroService.obtenerUltimoRegistroPorAlumno(this.user.userName)
      .subscribe((registro: any) => {
          this.ultimoRegistro.set(registro);
          console.log('Último registro obtenido:', registro);
          let idCurso: number | undefined;
          if (registro) {
             if (registro.apruebaReg === 'P') {
              idCurso = registro.idCursoAprobado;
            } else if (registro.apruebaReg === 'F') {
              idCurso = registro.idCursoDesaprobado;
            } 
            if (registro.mesesDejoEstudiar > 6 ) {
              this.obtenerExamenCalificacion();
            } else if(registro.mesesDejoEstudiar <= 6) {
              this.cargarHorariosPorUltimoRegistro(idCurso!, this.periodoActual().idPeriodo);
            }       
          }else {
            this.obtenerExamenCalificacion();
          }
        });
    
  }

  obtenerExamenCalificacion() {
    this.registroService.obtenerExamenDeCalificacion(this.user.userName)
      .subscribe((examen: any) => {
        this.examenCalificacion.set(examen);
        this.cargarHorariosPorUltimoRegistro(examen.idCurso, this.periodoActual().idPeriodo);
      });
  }

  getNotaColor(nota: number, estadoReg: string): string {
    if (nota >= 0 && estadoReg === 'P') {
      return 'var(--mat-sys-primary)';
    }
    return 'var(--mat-sys-secondary';
  }

  irAResumenMatricula(idHorario: number) {
    this.router.navigate(['/registro-matricula/resumenmatricula'], {
      state: { idHorario }
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
    return row.vacantes <= row.matriculados ||
      !row.cursoAbierto ||
      this.ultimoRegistro()?.mesesDeJoEstudiar >= 6;
  }

  mostrarResumen(idHorario : number, docId: string) {
    this.horarioService.obtenerResumenPago(idHorario, docId).subscribe({
      next: (res: any) => {
        this.resumen = res;
      },
      error: err => {
        this.resumen = null;
      }
    });
  }

  procesarPago(precio: number) {
    this.procesandoPago = true;
    this.paymentMessage = '';
    
    // Simular pago en desarrollo
    if (environment.simulatePayment) {
      this.simularPagoExitoso(precio);
      return;
    }
    
    // Pago real
    const transactionId = Date.now().toString() + Math.random().toString().substr(2, 5);
    const orderNumber = this.resumen.idHorario  + this.user.userName;
    this.registroService.obtenerTokenPago(precio, transactionId, orderNumber).subscribe({
      next: (tokenResponse: any) => {
        if (tokenResponse.code === '00') {
          this.initializeIziPay(tokenResponse, precio, transactionId , orderNumber);
        } else {
          this.showPaymentMessage('Error al obtener token de pago', 'error');
        }
        this.procesandoPago = false;
      },
      error: (err) => {
        console.error('Error al obtener token de pago:', err);
        this.showPaymentMessage('Error al procesar el pago', 'error');
        this.procesandoPago = false;
      }
    });
  }

  private simularPagoExitoso(precio: number): void {
    this.showPaymentMessage('🧪 Simulando pago exitoso (modo desarrollo)...', 'success');
    
    // Simular delay de procesamiento
    setTimeout(() => {
      const simulatedResponse = {
        code: '00',
        message: 'Pago simulado exitoso',
        transactionId: 'SIM_' + Date.now(),
        amount: precio
      };
      
      this.procesandoPago = false;
      this.handlePaymentResponse(simulatedResponse);
    }, 2000);
  }

  private initializeIziPay(tokenResponse: any, amount: number, transactionId: string , orderNumber: string) {
    if (!this.izipayLoaded) {
      this.loadIziPayScript().then(() => {
        this.setupIziPayForm(tokenResponse, amount, transactionId, orderNumber);
      });
    } else {
      this.setupIziPayForm(tokenResponse, amount, transactionId, orderNumber);
    }
  }

  private loadIziPayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).Izipay) {
        this.izipayLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = environment.izipay.scriptUrl;
      script.onload = () => {
        this.izipayLoaded = true;
        resolve();
      };
      script.onerror = () => reject(new Error('Error cargando IziPay script'));
      document.head.appendChild(script);
    });
  }

  private setupIziPayForm(tokenResponse: any, amount: number, transactionId: string, orderNumber: string) {
    const dateTimeTransaction = (Date.now() * 1000).toString();
    
    const iziConfig = {
      config: {
        transactionId: transactionId,
        action: (window as any).Izipay.enums.payActions.PAY,
        merchantCode: environment.izipay.merchantCode,
        order: {
          orderNumber: orderNumber,
          currency: 'PEN',
          amount: amount.toFixed(2),
          processType: (window as any).Izipay.enums.processType.AUTHORIZATION,
          merchantBuyerId: environment.izipay.merchantCode,
          dateTimeTransaction: dateTimeTransaction,
          payMethod: (window as any).Izipay.enums.showMethods.ALL
        },
        billing: {
          firstName: this.resumen?.nombres || 'Juan',
          lastName: this.resumen?.apellidoPaterno || 'Perez',
          email: this.resumen?.correo || 'test@example.com',
          phoneNumber: this.user?.telefono || '999666333',
          street: 'Av. Venezuela 128',
          city: 'trujillo',
          state: 'Trujillo',
          country: 'PE',
          postalCode: '13001',
          document: this.user?.userName || '12345678',
          documentType: (window as any).Izipay.enums.documentType.DNI
        },
        render: {
          typeForm: (window as any).Izipay.enums.typeForm.POP_UP,
          container: '#iframeContainer',
          showButtonProcessForm: false
        },
        appearance: {
          logo: 'https://elcultural.edu.pe/images/asset6.png'
        }
      }
    };

    try {
      const checkout = new (window as any).Izipay(iziConfig);
      
      // Bloquear botón cuando se abre el formulario
      this.formularioIziPayAbierto = true;
      
      checkout.LoadForm({
        authorization: tokenResponse.response.token,
        keyRSA: 'RSA',
        callbackResponse: (response: any) => {
          // Desbloquear botón cuando se recibe respuesta
          this.formularioIziPayAbierto = false;
          this.handlePaymentResponse(response);
        }
      });
    } catch (error) {
      console.error('Error inicializando IziPay:', error);
      this.formularioIziPayAbierto = false; // Desbloquear en caso de error
      this.showPaymentMessage('Error al inicializar el formulario de pago', 'error');
    }
  }

  private handlePaymentResponse(response: any) {
    if (response.code === '00') {
      this.showPaymentMessage('Pago exitoso. Procesando matrícula...', 'success');
      
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
        Profesor: this.resumen.docente
      };

      // Llamar al endpoint de matrícula
      this.registroService.matricularAlumno(matriculaData).subscribe({
        next: (matriculaResponse: any) => {
          this.showPaymentMessage('¡Matrícula completada exitosamente!', 'success');
          matriculaResponse.fechaInicio = this.resumen.fechaInicio;
          // Redirigir directamente a la boleta electrónica
          setTimeout(() => {
            this.router.navigate(['/boleta-electronica'], {
              state: matriculaResponse,
              replaceUrl: false
            });
          }, 1500);
        },
        error: (matriculaError) => {
          console.error('Error en matrícula:', matriculaError);
          this.showPaymentMessage('Error al procesar la matrícula. Contacte soporte.', 'error');
        }
      });
    } else {
      this.showPaymentMessage(`Error en el pago: ${JSON.stringify(response)}`, 'error');
    }
  }

  private showPaymentMessage(message: string, type: 'success' | 'error') {
    this.paymentMessage = message;
    this.paymentMessageClass = type === 'success' ? 'payment-success' : 'payment-error';
    // Desbloquear botón en caso de error
    if (type === 'error') {
      this.formularioIziPayAbierto = false;
    }
  }

  formatearAula(aula: string): string {
    if (!aula) return '';
    
    const aulaUpper = aula.toUpperCase();
    
    if (aulaUpper.startsWith('CG')) {
      return `Casa Grande ${aula}`;
    } else if (aulaUpper.startsWith('N')) {
      return `Colegio ${aula}`;
    } else if (aulaUpper.startsWith('P')) {
      return `Porvenir ${aula}`;
    } else if (aulaUpper.startsWith('C')) {
      return `Casona ${aula}`;
    } else if (aulaUpper.startsWith('V')) {
      return `Clase Virtual`;
    } else {
      return `Sede Principal ${aula}`;
    }
  }
}