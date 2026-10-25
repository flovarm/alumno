import { Component, DestroyRef, inject, OnInit, signal } from "@angular/core";
import { CurrencyPipe, DatePipe } from "@angular/common";
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
import { Router } from "@angular/router";
import { catchError, EMPTY, finalize, forkJoin, Subject, switchMap } from "rxjs";
import { PageHeaderComponent } from "../../components/page-header/page-header.component";
import { UltimoCursoComponent } from "../../components/ultimo-curso/ultimo-curso.component";
import { HorarioExamen, TipoExamen, vacantesDisponibles } from "../../models/examen";
import { UltimoRegistro } from "../../models/ultimo-registro";
import { AuthService } from "../../services/auth.service";
import { ExamenService } from "../../services/examen.service";
import { RegistroService } from "../../services/registro.service";

type Consulta = { fecha: string; idTipoExamen: number };

@Component({
  selector: "app-examenes",
  standalone: true,
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, MatButtonModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatDatepickerModule, MatTableModule, MatSelectModule, PageHeaderComponent, UltimoCursoComponent],
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: "es-PE" }],
  templateUrl: "./examenes.component.html",
  styleUrl: "./examenes.component.scss",
})
export class ExamenesComponent implements OnInit {
  private readonly examenService = inject(ExamenService);
  private readonly registroService = inject(RegistroService);
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
  readonly columnas = ["fecha", "hora", "profesor", "sede", "aula", "costo", "vacantes", "seleccion"];
  readonly fechaMinima = new Date("0001-01-01T00:00:00");
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
        if (!Number.isInteger(codigo) || codigo <= 0) {
          this.error.set("No se pudo identificar al alumno. Vuelve a iniciar sesión.");
          return EMPTY;
        }
        this.cargando.set(true);
        return forkJoin({
          horarios: this.examenService.obtenerHorariosExamen(consulta.fecha, consulta.idTipoExamen),
          registrado: this.examenService.alumnoRegistradoEnExamen(codigo, consulta.idTipoExamen),
        }).pipe(
          catchError(() => {
            this.error.set("No se pudieron consultar los horarios y el registro del alumno. Intenta nuevamente.");
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
    const { fecha: dia, idTipoExamen } = this.form.getRawValue();
    if (!(dia instanceof Date) || !Number.isFinite(dia.getTime()) ||
        dia < this.fechaMinima || dia > this.fechaMaxima) {
      this.error.set("Selecciona una fecha válida anterior al 31/12/9999.");
      return;
    }
    // Enviar el día local seleccionado sin desplazar la fecha al convertirla a UTC.
    const fecha = `${String(dia.getFullYear()).padStart(4, "0")}-${String(dia.getMonth() + 1).padStart(2, "0")}-${String(dia.getDate()).padStart(2, "0")}`;
    if (!this.tipos().some(tipo => tipo.idTipoExamen === idTipoExamen)) return;
    this.consultas.next({ fecha, idTipoExamen });
  }

  seleccionarHorario(horario: HorarioExamen): void {
    if (this.cargando() || this.registrado() !== false || this.vacantes(horario) <= 0 ||
        !this.horarios().includes(horario)) return;
    this.seleccionado.set(horario);
    const tipoExamen = this.tipos().find(tipo => tipo.idTipoExamen === horario.idTipoExamen);
    if (tipoExamen) {
      this.router.navigate(["/resumen-examen"], { state: { horario, tipoExamen } });
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
