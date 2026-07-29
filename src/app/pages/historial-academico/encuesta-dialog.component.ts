import { Component, Inject, inject, OnInit, signal } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from "@angular/forms";
import { MatRadioModule } from "@angular/material/radio";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { MatDividerModule } from "@angular/material/divider";
import { EncuestaService } from "../../services/encuesta.service";

@Component({
  selector: "app-encuesta-dialog",
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatRadioModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatDividerModule,
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <div class="dialog-title-row">
        <mat-icon>poll</mat-icon>
        {{ data.encuesta.descripcionEncuesta }}
      </div>
      @if (data.nombreDocente || data.nombreCurso) {
        <div class="dialog-subtitle">
          {{ data.nombreDocente  | titlecase}} — {{ data.nombreCurso | titlecase}}
        </div>
      }
    </h2>

    <mat-dialog-content style="overflow-y: auto; max-height: 70vh;">
      <div class="info-banner">
        <mat-icon class="info-icon">info</mat-icon>
        <div class="info-text">
          <strong>Esta encuesta es totalmente anónima.</strong><br>
          Es necesario completarla para poder ver tus notas y asistencias.
        </div>
      </div>
      <div [formGroup]="form" class="encuesta-form">
        <div formArrayName="respuestas" class="preguntas-container">
          @for (pregunta of preguntas; track pregunta.id; let i = $index) {
            <div [formGroupName]="i" class="pregunta-card">
              <div class="pregunta-header">
                <span class="pregunta-numero">{{ i + 1 }}.</span>
                <p class="pregunta-texto">{{ pregunta.descripcion }}</p>
              </div>

              @if (pregunta.tipoPregunta === 'Respuest Libre' || pregunta.tipoPregunta === 'Numerica') {
                @if (esNumerica(pregunta) || pregunta.tipoPregunta === 'Numerica') {
                  <mat-form-field appearance="outline" class="full-width">
                    <input
                      matInput
                      type="number"
                      formControlName="respuestaLibre"
                      min="0"
                      max="20"
                      placeholder="Ingresa un valor del 0 al 20"
                      required
                    >
                    @if (respuestasArray.at(i).get('respuestaLibre')?.hasError('required') && (respuestasArray.at(i).get('respuestaLibre')?.touched || submitted())) {
                      <mat-error>Este campo es obligatorio</mat-error>
                    }
                    @if (respuestasArray.at(i).get('respuestaLibre')?.hasError('min') || respuestasArray.at(i).get('respuestaLibre')?.hasError('max')) {
                      <mat-error>Debe ser un valor entre 0 y 20</mat-error>
                    }
                  </mat-form-field>
                } @else {
                  <mat-form-field appearance="outline" class="full-width">
                    <textarea
                      matInput
                      formControlName="respuestaLibre"
                      rows="3"
                      placeholder="Escribe tu respuesta..."
                      required
                    ></textarea>
                    @if (respuestasArray.at(i).get('respuestaLibre')?.hasError('required') && (respuestasArray.at(i).get('respuestaLibre')?.touched || submitted())) {
                      <mat-error>Esta respuesta es obligatoria</mat-error>
                    }
                  </mat-form-field>
                }
              } @else {
                <mat-radio-group formControlName="opcionId" class="opciones-group">
                  @for (opcion of pregunta.opciones; track opcion.id) {
                    <mat-radio-button [value]="opcion.id" class="opcion-radio">
                      {{ opcion.descripcion }}
                    </mat-radio-button>
                  }
                </mat-radio-group>
                @if (respuestasArray.at(i).get('opcionId')?.hasError('required') && (respuestasArray.at(i).get('opcionId')?.touched || submitted())) {
                  <div class="error-text">Selecciona una opción</div>
                }
              }
            </div>
          }
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button (click)="cerrar()">Cancelar</button>
      <button
        mat-flat-button
        class="btn-primary"
        [disabled]="form.invalid || isLoading()"
        (click)="enviarEncuesta()"
      >
        @if (isLoading()) {
          Enviando...
        } @else {
          <ng-container>
            <mat-icon>send</mat-icon>
            Enviar Encuesta
          </ng-container>
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      color: var(--mat-sys-primary);
    }

    .dialog-title-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .dialog-subtitle {
      font-size: 1-5rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface-variant);
      margin-top: 4px;
      padding-left: 2rem;
    }

    .info-banner {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      background: var(--mat-sys-primary-container);
      border: 1px solid var(--mat-sys-outline-variant);
      color: var(--mat-sys-on-primary-container);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      margin-bottom: 1rem;
    }

    .info-icon {
      color: var(--mat-sys-primary);
      font-size: 1.25rem;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .info-text {
      font-size: 1rem;
      line-height: 1.4;
      color: var(--mat-sys-on-primary-container);
    }

    .encuesta-form {
      min-width: 500px;
      padding-top: 0.5rem;
    }

    .preguntas-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .pregunta-card {
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 8px;
      padding: 1rem;
      background: var(--mat-sys-surface-container-low);
    }

    .pregunta-header {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .pregunta-numero {
      font-weight: 700;
      color: var(--mat-sys-primary);
      min-width: 1.5rem;
    }

    .pregunta-texto {
      margin: 0;
      font-weight: 500;
      line-height: 1.5;
    }

    .opciones-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding-left: 2rem;
    }

    .opcion-radio {
      margin: 0.25rem 0;
    }

    .full-width {
      width: 100%;
      padding-left: 2rem;
    }

    .dialog-actions {
      gap: 0.5rem;
      padding: 1rem 1.5rem;
    }

    .btn-primary {
      background-color: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
    }

    .btn-primary[disabled] {
      opacity: 0.7;
    }

    .error-text {
      color: var(--mat-sys-error);
      font-size: 12px;
      padding-left: 2rem;
      margin-top: 4px;
    }

    @media (max-width: 600px) {
      .encuesta-form {
        min-width: 100%;
      }
    }
  `],
})
export class EncuestaDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private encuestaService = inject(EncuestaService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<EncuestaDialogComponent>);

  isLoading = signal(false);
  submitted = signal(false);
  preguntas: any[] = [];
  form: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.preguntas = [...data.encuesta.preguntas].sort(
      (a: any, b: any) => a.orden - b.orden
    );
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      respuestas: this.fb.array(
        this.preguntas.map((p) => {
          const esLibre = p.tipoPregunta === 'Respuest Libre' || p.tipoPregunta === 'Numerica';
          return this.fb.group({
            preguntaId: [p.id],
            opcionId: [null, esLibre ? [] : Validators.required],
            respuestaLibre: ['', esLibre ? (this.esNumerica(p) ? [Validators.required, Validators.min(0), Validators.max(20)] : Validators.required) : []],
          });
        })
      ),
    });
  }

  get respuestasArray(): FormArray {
    return this.form.get('respuestas') as FormArray;
  }

  enviarEncuesta(): void {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach((key) => {
        this.form.get(key)?.markAllAsTouched();
      });
      return;
    }

    this.submitted.set(true);
    this.isLoading.set(true);

    const userStr = localStorage.getItem('alumno_currentUser');
    const user = userStr ? JSON.parse(userStr) : null;
    const idUsuarioRegistro = user?.id ?? '';

    const respuestas = this.respuestasArray.value.map((r: any, i: number) => {
      const pregunta = this.preguntas[i];
      if (pregunta.tipoPregunta === 'Respuest Libre' || pregunta.tipoPregunta === 'Numerica') {
        return {
          preguntaId: r.preguntaId,
          opcionesRespuestaId: pregunta.opciones[0]?.id ?? 0,
          descripcion: this.esNumerica(pregunta) ? String(Number(r.respuestaLibre)) : (r.respuestaLibre || ''),
        };
      }
      return {
        preguntaId: r.preguntaId,
        opcionesRespuestaId: r.opcionId,
        descripcion: null as string | null,
      };
    });

    const payload = {
      idRegistro: this.data.idRegistro,
      idUsuarioRegistro,
      respuestas,
    };

    this.encuestaService.guardarRespuestas(payload).subscribe({
      next: () => {
        this.snackBar.open('Encuesta enviada con éxito', 'Cerrar', {
          duration: 3000,
        });
        this.dialogRef.close(true);
      },
      error: () => {
        this.snackBar.open('Error al enviar la encuesta', 'Cerrar', {
          duration: 3000,
        });
        this.isLoading.set(false);
      },
    });
  }

  cerrar(): void {
    this.dialogRef.close(false);
  }

  esNumerica(pregunta: any): boolean {
    return pregunta.tipoPregunta === 'Numerica' || (pregunta.opciones?.some((o: any) => o.descripcion === 'numerica') ?? false);
  }
}
