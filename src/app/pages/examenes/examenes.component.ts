import { Component, DestroyRef, inject, OnInit, signal } from "@angular/core";
import { CurrencyPipe, DatePipe } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from "@angular/material/core";
import { MatTableModule } from "@angular/material/table";
import { MatSelectModule } from "@angular/material/select";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { Router } from "@angular/router";
import { catchError, EMPTY, finalize, forkJoin, of, Subject, switchMap, throwError } from "rxjs";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { UltimoCursoComponent } from "../../components/ultimo-curso/ultimo-curso.component";
import { HorarioExamen, TipoExamen, vacantesDisponibles } from "../../models/examen";
import { UltimoRegistro } from "../../models/ultimo-registro";
import { AuthService } from "../../services/auth.service";
import { ExamenService } from "../../services/examen.service";
import { RegistroService } from "../../services/registro.service";
import { AlumnoService } from "../../services/alumno.service";
import { NotaRegistroItem } from "../../models/notas-registro";

type Consulta = { fecha: string; idTipoExamen: number; idItems?: number[] };

@Component({
  selector: "app-examenes",
  standalone: true,
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, MatButtonModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatDatepickerModule, MatTableModule, MatSelectModule, MatCheckboxModule, PageHeaderComponent, UltimoCursoComponent],
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: "es-PE" }],
  templateUrl: "./examenes.component.html",
  styleUrl: "./examenes.component.scss",
})
export class ExamenesComponent implements OnInit {
  private readonly examenService = inject(ExamenService);
  private readonly registroService = inject(RegistroService);
  private readonly alumnoService = inject(AlumnoService);
  private readonly consultasNotas = new Subject<boolean>();
  readonly notas = signal<NotaRegistroItem[]>([]);
  readonly cargandoNotas = signal(false);
  readonly errorNotas = signal("");
  readonly idItemsSeleccionados = signal<number[]>([]);

  get esRezagado(): boolean {
    return this.tipos().find(tipo => tipo.idTipoExamen === this.form.controls.idTipoExamen.value)
      ?.abreviatura?.trim().toUpperCase() === "R";
  }

  get notasSeleccionadas(): NotaRegistroItem[] {
    return this.notas().filter(nota => this.idItemsSeleccionados().includes(nota.idItem) && nota.tieneNota === false);
  }

  get seleccionValida(): boolean {
    return this.idItemsSeleccionados().length >= 1 && this.idItemsSeleccionados().length <= 2 &&
      this.notasSeleccionadas.length === this.idItemsSeleccionados().length;
  }
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly consultas = new Subject<Consulta | null>();
  readonly ultimoRegistro = signal<UltimoRegistro | null>(null);
  readonly cargandoCurso = signal(false);
  readonly errorCurso = signal("");
  readonly tipos = signal<TipoExamen[]>([]);
  readonly cargandoTipos = signal(false);
  readonly errorTipos = signal("");
  readonly horarios = signal<HorarioExamen[]>([]);
  readonly cargando = signal(false);
  readonly consultado = signal(false);
  readonly registrado = signal<boolean | null>(null);
  readonly error = signal("");
  readonly seleccionado = signal<HorarioExamen | null>(null);
  readonly vacantes = vacantesDisponibles;
  readonly columnas = ["fecha", "hora", "profesor", "sede", "aula", "modalidad", "costo", "vacantes", "seleccion"];
  readonly fechaMinima = new Date(new Date().setHours(0, 0, 0, 0));
  readonly fechaMaxima = new Date("9999-12-30T00:00:00");
  readonly form = new FormGroup({
    idTipoExamen: new FormControl<number | null>(null, Validators.required),
    fecha: new FormControl<Date | null>(null, Validators.required),
  });

  ngOnInit(): void {
    this.consultas.pipe(
      switchMap(consulta => {
        if (!consulta) return EMPTY;
        const codigo = this.auth.currentUser()?.codigo;
        const docid = this.auth.currentUser()?.userName?.trim();
        if (!docid || !Number.isInteger(codigo) || codigo <= 0) {
          this.error.set("No se pudo identificar al alumno. Vuelve a iniciar sesión.");
          return EMPTY;
        }
        this.cargando.set(true);
        const esRezagado = this.tipos().find(tipo => tipo.idTipoExamen === consulta.idTipoExamen)
          ?.abreviatura?.trim().toUpperCase() === "R";
        return forkJoin({
          horarios: consulta.idItems?.length
            ? this.examenService.obtenerHorariosExamen(consulta.fecha, consulta.idTipoExamen, docid, consulta.idItems)
            : this.examenService.obtenerHorariosExamen(consulta.fecha, consulta.idTipoExamen, docid),
          // El backend valida el límite por periodo para los rezagados.
          registrado: esRezagado ? of(false) : this.examenService.alumnoRegistradoEnExamen(codigo, consulta.idTipoExamen),
        }).pipe(
          catchError((error: HttpErrorResponse) => {
            this.error.set(typeof error.error === "string" && error.error.trim()
              ? error.error
              : "No se pudieron consultar los horarios y el registro del alumno. Intenta nuevamente.");
            return EMPTY;
          }),
          finalize(() => this.cargando.set(false)),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(resultado => {
      this.horarios.set(resultado.horarios);
      this.registrado.set(resultado.registrado);
      this.consultado.set(true);
    });
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.limpiarConsulta());
    this.consultasNotas.pipe(
      switchMap(cargar => {
        this.idItemsSeleccionados.set([]);
        this.notas.set([]);
        this.errorNotas.set("");
        if (!cargar) return EMPTY;
        const documento = this.auth.currentUser()?.userName;
        if (!documento) {
          this.errorNotas.set("No se pudo identificar al alumno. Vuelve a iniciar sesión.");
          return EMPTY;
        }
        this.cargandoNotas.set(true);
        return this.registroService.obtenerUltimoRegistroPorAlumno(documento).pipe(
          switchMap(registro => {
            if (!registro?.idHorario || !registro.idRegistro) return throwError(() => new Error("Sin curso actual"));
            return this.alumnoService.obtenerNotasRegistro(registro.idHorario, registro.idRegistro, true);
          }),
          catchError(() => {
            this.errorNotas.set("No se pudieron cargar las notas del curso actual. Intenta nuevamente.");
            return EMPTY;
          }),
          finalize(() => this.cargandoNotas.set(false)),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(detalle => {
      if (!Array.isArray(detalle.items) || detalle.items.some(nota => typeof nota.tieneNota !== "boolean")) {
        this.errorNotas.set("El servicio de notas debe actualizarse para identificar las notas pendientes.");
        return;
      }
      this.notas.set(detalle.items);
    });
    this.form.controls.idTipoExamen.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.consultasNotas.next(this.esRezagado));
    this.cargarTipos();
    this.cargarUltimoCurso();
  }

  cargarTipos(): void {
    if (this.cargandoTipos()) return;
    this.errorTipos.set("");
    this.cargandoTipos.set(true);
    this.examenService.listarTiposExamen().pipe(
      finalize(() => this.cargandoTipos.set(false)), takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: tipos => this.tipos.set(tipos.filter(tipo => tipo.estado)),
      error: () => this.errorTipos.set("No se pudieron cargar los tipos de examen."),
    });
  }

  cargarUltimoCurso(): void {
    const documento = this.auth.currentUser()?.userName;
    if (!documento) {
      this.errorCurso.set("No se pudo identificar al alumno para consultar su último curso.");
      return;
    }
    if (this.cargandoCurso()) return;
    this.errorCurso.set("");
    this.cargandoCurso.set(true);
    this.registroService.obtenerUltimoRegistroPorAlumno(documento).pipe(
      finalize(() => this.cargandoCurso.set(false)), takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: registro => this.ultimoRegistro.set(registro),
      error: () => this.errorCurso.set("No se pudo obtener el último curso registrado."),
    });
  }

  buscarHorarios(): void {
    this.limpiarConsulta();
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    if (this.esRezagado && (this.cargandoNotas() || this.errorNotas() || !this.seleccionValida)) {
      this.error.set("Selecciona una o dos notas pendientes antes de consultar los horarios.");
      return;
    }
    const { fecha: dia, idTipoExamen } = this.form.getRawValue();
    if (!(dia instanceof Date) || !Number.isFinite(dia.getTime()) ||
        dia < this.fechaMinima || dia > this.fechaMaxima) {
      this.error.set("Selecciona una fecha desde hoy y anterior al 31/12/9999.");
      return;
    }
    // Enviar el día local seleccionado sin desplazar la fecha al convertirla a UTC.
    const fecha = `${String(dia.getFullYear()).padStart(4, "0")}-${String(dia.getMonth() + 1).padStart(2, "0")}-${String(dia.getDate()).padStart(2, "0")}`;
    if (!this.tipos().some(tipo => tipo.idTipoExamen === idTipoExamen)) return;
    this.consultas.next({ fecha, idTipoExamen, ...(this.esRezagado ? { idItems: [...this.idItemsSeleccionados()] } : {}) });
  }

  cargarNotas(): void {
    this.limpiarConsulta();
    this.consultasNotas.next(this.esRezagado);
  }

  seleccionarNota(nota: NotaRegistroItem): void {
    if (!this.esRezagado || this.cargandoNotas() || !this.notas().includes(nota) || nota.tieneNota !== false) return;
    const ids = this.idItemsSeleccionados();
    if (!ids.includes(nota.idItem) && ids.length >= 2) return;
    this.limpiarConsulta();
    this.idItemsSeleccionados.set(ids.includes(nota.idItem)
      ? ids.filter(id => id !== nota.idItem) : [...ids, nota.idItem]);
  }

  seleccionarHorario(horario: HorarioExamen): void {
    if (this.cargando() || this.registrado() !== false || this.vacantes(horario) <= 0 ||
        !this.horarios().includes(horario)) return;
    if (this.esRezagado && !this.seleccionValida) return;
    this.seleccionado.set(horario);
    const tipoExamen = this.tipos().find(tipo => tipo.idTipoExamen === horario.idTipoExamen);
    if (tipoExamen) {
      this.router.navigate(["/resumen-examen"], { state: { horario, tipoExamen,
        ...(this.esRezagado ? { idItems: [...this.idItemsSeleccionados()] } : {}) } });
    }
  }

  descripcionTipoExamen(horario: HorarioExamen): string {
    return this.tipos().find(tipo => tipo.idTipoExamen === horario.idTipoExamen)?.descripcion ?? "Tipo de examen";
  }

  private limpiarConsulta(): void {
    this.consultas.next(null);
    this.horarios.set([]);
    this.seleccionado.set(null);
    this.registrado.set(null);
    this.consultado.set(false);
    this.error.set("");
  }
}
