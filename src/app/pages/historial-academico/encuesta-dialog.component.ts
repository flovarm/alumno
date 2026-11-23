import { Component, Inject, inject, OnInit, signal } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from "@angular/forms";
import { MatRadioModule } from "@angular/material/radio";
import { MatCheckboxModule } from "@angular/material/checkbox";
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
    MatCheckboxModule,
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
                <p class="pregunta-texto">
                  {{ pregunta.descripcion }}
                  @if (esRequerida(pregunta)) {
                    <span class="requerida-mark">*</span>
                  } @else {
                    <span class="opcional-label">(Opcional)</span>
                  }
                </p>
              </div>

              @if (esLibreONumerica(pregunta)) {
                @if (esNumerica(pregunta)) {
                  <mat-form-field appearance="outline" class="full-width">
                    <input
                      matInput
                      type="number"
                      formControlName="respuestaLibre"
                      min="0"
                      max="20"
                      placeholder="Ingresa un valor del 0 al 20"
                      [required]="esRequerida(pregunta)"
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
                      [required]="esRequerida(pregunta)"
                    ></textarea>
                    @if (respuestasArray.at(i).get('respuestaLibre')?.hasError('required') && (respuestasArray.at(i).get('respuestaLibre')?.touched || submitted())) {
                      <mat-error>Esta respuesta es obligatoria</mat-error>
                    }
                  </mat-form-field>
                }
              } @else if (esMultipleRespuesta(pregunta)) {
                <div class="opciones-group">
                  @for (opcion of pregunta.opciones; track opcion.id) {
                    <mat-checkbox
                      class="opcion-radio"
                      [checked]="isOpcionSeleccionada(i, opcion.id)"
                      (change)="onCheckboxChange(i, opcion.id, $event.checked)"
                    >
                      {{ opcion.descripcion }}
                    </mat-checkbox>
                  }
                </div>
                @if (respuestasArray.at(i).get('opcionesIds')?.hasError('required') && (respuestasArray.at(i).get('opcionesIds')?.touched || submitted())) {
                  <div class="error-text">Selecciona al menos una opción</div>
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

    .requerida-mark {
      color: var(--mat-sys-error);
      font-weight: 700;
      margin-left: 2px;
    }

    .opcional-label {
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.85rem;
      font-weight: 400;
      margin-left: 4px;
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
          const requerida = this.esRequerida(p);
          const esLibre = this.esLibreONumerica(p);
          const esMultiple = !esLibre && this.esMultipleRespuesta(p);
          return this.fb.group({
            preguntaId: [p.id],
            opcionId: [
              null,
              !esLibre && !esMultiple && requerida ? [Validators.required] : [],
            ],
            opcionesIds: [[], esMultiple && requerida ? [Validators.required] : []],
            respuestaLibre: [
              '',
              esLibre
                ? [
                    ...(requerida ? [Validators.required] : []),
                    ...(this.esNumerica(p)
                      ? [Validators.min(0), Validators.max(20)]
                      : []),
                  ]
                : [],
            ],
          });
        })
      ),
    });
  }

  get respuestasArray(): FormArray {
    return this.form.get('respuestas') as FormArray;
  }

  isOpcionSeleccionada(preguntaIndex: number, opcionId: number): boolean {
    const seleccionadas: number[] =
      this.respuestasArray.at(preguntaIndex).get('opcionesIds')?.value ?? [];
    return seleccionadas.includes(opcionId);
  }

  onCheckboxChange(
    preguntaIndex: number,
    opcionId: number,
    checked: boolean
  ): void {
    const control = this.respuestasArray.at(preguntaIndex).get('opcionesIds');
    if (!control) return;
    const actuales: number[] = control.value ?? [];
    const nuevas = checked
      ? actuales.includes(opcionId)
        ? actuales
        : [...actuales, opcionId]
      : actuales.filter((id) => id !== opcionId);
    control.setValue(nuevas);
    control.markAsTouched();
    control.updateValueAndValidity();
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

    const respuestas = this.respuestasArray.value.flatMap((r: any, i: number) => {
      const pregunta = this.preguntas[i];
      if (this.esLibreONumerica(pregunta)) {
        const valorLibre = r.respuestaLibre;
        if (
          valorLibre === null ||
          valorLibre === undefined ||
          String(valorLibre).trim() === ''
        ) {
          return [];
        }
        return [
          {
            preguntaId: r.preguntaId,
            opcionesRespuestaId: pregunta.opciones[0]?.id ?? 0,
            descripcion: this.esNumerica(pregunta)
              ? String(Number(valorLibre))
              : String(valorLibre),
          },
        ];
      }
      if (this.esMultipleRespuesta(pregunta)) {
        const opcionesIds: number[] = r.opcionesIds ?? [];
        return opcionesIds.map((opcionId: number) => ({
          preguntaId: r.preguntaId,
          opcionesRespuestaId: opcionId,
          descripcion: null as string | null,
        }));
      }
      if (r.opcionId === null || r.opcionId === undefined) {
        return [];
      }
      return [
        {
          preguntaId: r.preguntaId,
          opcionesRespuestaId: r.opcionId,
          descripcion: null as string | null,
        },
      ];
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

  private obtenerNombreTipoPregunta(pregunta: any): string {
    if (typeof pregunta?.tipoPregunta === 'string') {
      return pregunta.tipoPregunta;
    }
    if (pregunta?.tipoPregunta && typeof pregunta.tipoPregunta === 'object') {
      return (
        pregunta.tipoPregunta.descripcion ??
        pregunta.tipoPregunta.Descripcion ??
        pregunta.tipoPregunta.nombre ??
        pregunta.tipoPregunta.Nombre ??
        ''
      );
    }
    return '';
  }

  esLibreONumerica(pregunta: any): boolean {
    const tipo = this.obtenerNombreTipoPregunta(pregunta);
    return (
      tipo === 'Respuest Libre' ||
      tipo === 'Numerica' ||
      this.esNumerica(pregunta)
    );
  }

  esNumerica(pregunta: any): boolean {
    const tipo = this.obtenerNombreTipoPregunta(pregunta);
    return (
      tipo === 'Numerica' ||
      (pregunta.opciones?.some((o: any) => o.descripcion === 'numerica') ??
        false)
    );
  }

  esMultipleRespuesta(pregunta: any): boolean {
    return Boolean(
      pregunta?.multipleRespuesta ??
        pregunta?.MultipleRespuesta ??
        pregunta?.tipoPregunta?.multipleRespuesta ??
        pregunta?.tipoPregunta?.MultipleRespuesta
    );
  }

  esRequerida(pregunta: any): boolean {
    return Boolean(pregunta?.requerida ?? pregunta?.Requerida ?? true);
  }
}
