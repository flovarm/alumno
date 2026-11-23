import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EMPTY, Subject, catchError, finalize, map, switchMap } from 'rxjs';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { AuthService } from '../../services/auth.service';
import { HorarioService } from '../../services/horario.service';
import { EventoHorarioAlumno, esHorarioVirtual } from '../../models/horario-alumno';

export const TIPO_PROGRAMA_ADULTOS = 1;
export const TIPO_PROGRAMA_NINOS = 2;
export const GOOGLE_MAPS_AV_VENEZUELA_URL = 'https://maps.app.goo.gl/HnfX63HFUSY1FLW47?g_st=aw';

export type CasoClasificacion =
  | 'adultos-presencial'
  | 'adultos-virtual'
  | 'ninos-presencial';

export type CasoRezagado =
  | 'adultos-presencial'
  | 'adultos-virtual'
  | 'ninos-presencial';

export type CasoSustitutorio =
  | 'adultos-presencial'
  | 'ninos-presencial';

interface EventoCalendario extends Pick<EventoHorarioAlumno, 'id' | 'tipo' | 'title' | 'content' | 'color' | 'url'> {
  start: Date;
  end: Date;
  esExamen: boolean;
  esVirtual: boolean;
  esClasificacion: boolean;
  esRezagado: boolean;
  esSustitutorio: boolean;
  idTipoPrograma: number | null;
  casoClasificacion: CasoClasificacion | null;
  casoRezagado: CasoRezagado | null;
  casoSustitutorio: CasoSustitutorio | null;
  colorEvento: string;
  contenidoDetalle: string;
  origen: EventoHorarioAlumno;
}

// Las fechas sin zona del servicio corresponden a la hora de Perú.
function fechaEvento(valor: string): Date {
  const fecha = valor?.replace(' ', 'T');
  return new Date(fecha && !/(Z|[+-]\d{2}:?\d{2})$/i.test(fecha)
    ? `${fecha.length === 10 ? fecha + 'T00:00:00' : fecha}-05:00` : fecha);
}

function obtenerIdTipoPrograma(evento: EventoHorarioAlumno): number | null {
  const valor = evento.idTipoPrograma ?? evento['IdTipoPrograma'];
  if (valor === null || valor === undefined || String(valor).trim() === '') return null;
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

function esEventoVirtual(evento: EventoHorarioAlumno, esExamen: boolean, aula: string): boolean {
  const modalidad = evento.modalidad?.trim() || '';
  if (/\bpresencial(?:es)?\b/i.test(modalidad)) return false;
  if (/\bvirtual(?:es)?\b/i.test(modalidad)) return true;
  return esHorarioVirtual(evento) || (esExamen && /^V/i.test(aula));
}

function resolverCasoClasificacion(
  esClasificacion: boolean,
  esVirtual: boolean,
  idTipoPrograma: number | null,
): CasoClasificacion | null {
  if (!esClasificacion) return null;
  if (esVirtual) {
    if (idTipoPrograma === TIPO_PROGRAMA_NINOS) return null;
    return idTipoPrograma === TIPO_PROGRAMA_ADULTOS || idTipoPrograma === null
      ? 'adultos-virtual'
      : null;
  }
  if (idTipoPrograma === TIPO_PROGRAMA_ADULTOS) return 'adultos-presencial';
  if (idTipoPrograma === TIPO_PROGRAMA_NINOS) return 'ninos-presencial';
  return null;
}

function resolverCasoRezagado(
  esRezagado: boolean,
  esVirtual: boolean,
  idTipoPrograma: number | null,
): CasoRezagado | null {
  if (!esRezagado) return null;
  if (esVirtual) {
    if (idTipoPrograma === TIPO_PROGRAMA_NINOS) return null;
    return idTipoPrograma === TIPO_PROGRAMA_ADULTOS || idTipoPrograma === null
      ? 'adultos-virtual'
      : null;
  }
  if (idTipoPrograma === TIPO_PROGRAMA_ADULTOS) return 'adultos-presencial';
  if (idTipoPrograma === TIPO_PROGRAMA_NINOS) return 'ninos-presencial';
  return null;
}

function resolverCasoSustitutorio(
  esSustitutorio: boolean,
  esVirtual: boolean,
  idTipoPrograma: number | null,
): CasoSustitutorio | null {
  if (!esSustitutorio || esVirtual) return null;
  if (idTipoPrograma === TIPO_PROGRAMA_ADULTOS) return 'adultos-presencial';
  if (idTipoPrograma === TIPO_PROGRAMA_NINOS) return 'ninos-presencial';
  return null;
}

export function normalizarEvento(evento: EventoHorarioAlumno): EventoCalendario | null {
  const start = fechaEvento(evento.start);
  const esExamen = String(evento.tipo).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().includes('examen');
  const end = esExamen ? new Date(start.getTime() + 60 * 60 * 1000) : fechaEvento(evento.end);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) return null;
  const aula = String(evento['aula'] || evento['nombreAula'] ||
    evento.content?.match(/\bAula\s*:\s*([^|<\r\n]+)/i)?.[1] || '').trim();
  const textoExamen = esExamen
    ? `${evento.tipo ?? ''} ${evento.title ?? ''} ${evento.content ?? ''} ${evento['tipoExamen'] ?? ''} ${evento['descripcionTipoExamen'] ?? ''}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
    : '';
  const abreviatura = String(evento['abreviatura'] ?? '').trim().toUpperCase();
  const esClasificacion = esExamen && (textoExamen.includes('clasific') || textoExamen.includes('ubicac') || abreviatura === 'C');
  const esSustitutorio = esExamen && !esClasificacion && (textoExamen.includes('sustitut') || abreviatura === 'S');
  const esRezagado = esExamen && !esClasificacion && !esSustitutorio && (textoExamen.includes('rezagad') || textoExamen.includes('homework') || abreviatura === 'R');
  const esVirtual = esEventoVirtual(evento, esExamen, aula);
  const idTipoPrograma = obtenerIdTipoPrograma(evento);
  const casoClasificacion = resolverCasoClasificacion(esClasificacion, esVirtual, idTipoPrograma);
  const casoRezagado = resolverCasoRezagado(esRezagado, esVirtual, idTipoPrograma);
  const casoSustitutorio = resolverCasoSustitutorio(esSustitutorio, esVirtual, idTipoPrograma);
  const url = evento.url?.trim() ||
    evento.content?.match(/href\s*=\s*["']([^"']+)["']/i)?.[1]?.trim() ||
    null;
  return {
    ...evento, url, start, end, esExamen, esClasificacion, esRezagado, esSustitutorio,
    esVirtual, idTipoPrograma, casoClasificacion, casoRezagado, casoSustitutorio, origen: evento,
    contenidoDetalle: (evento.content || '').replace(/<a\b[^>]*>[\s\S]*?<\/a\s*>/gi, '')
      .split('|').map(parte => parte.trim()).filter(Boolean).join('\n'),
    colorEvento: /^#[\da-f]{3,8}$/i.test(evento.color) ? evento.color : esExamen ? '#b45309' : '#2563eb',
  };
}

function clavePeru(fecha: Date): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(fecha);
  const parte = (tipo: string) => partes.find(p => p.type === tipo)?.value;
  return `${parte('year')}-${parte('month')}-${parte('day')}`;
}

function claveLocal(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-mi-horario',
  standalone: true,
  imports: [DatePipe, RouterLink, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, PageHeaderComponent],
  templateUrl: './mi-horario.component.html',
  styleUrl: './mi-horario.component.scss',
})
export class MiHorarioComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly horarioService = inject(HorarioService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly consultas = new Subject<string>();
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly advertencia = signal('');
  readonly eventos = signal<EventoCalendario[]>([]);
  readonly hoy = clavePeru(new Date());
  readonly diaSeleccionado = signal(this.hoy);
  readonly mes = signal(new Date(`${this.hoy.slice(0, 7)}-01T12:00:00`));
  readonly diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  readonly googleMapsUrl = GOOGLE_MAPS_AV_VENEZUELA_URL;
  readonly tipoProgramaNinos = TIPO_PROGRAMA_NINOS;
  readonly tituloMes = computed(() => new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(this.mes()));
  readonly fechaSeleccionada = computed(() => new Intl.DateTimeFormat('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(`${this.diaSeleccionado()}T12:00:00`)));
  readonly dias = computed(() => {
    const mes = this.mes();
    const inicio = new Date(mes.getFullYear(), mes.getMonth(), 1);
    inicio.setDate(inicio.getDate() - (inicio.getDay() + 6) % 7);
    return Array.from({ length: 42 }, (_, indice) => {
      const fecha = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + indice);
      const clave = claveLocal(fecha);
      return { clave, numero: fecha.getDate(), otroMes: fecha.getMonth() !== mes.getMonth(), eventos: this.eventosDelDia(clave) };
    });
  });
  readonly eventosSeleccionados = computed(() => this.eventosDelDia(this.diaSeleccionado()));
  readonly totalExamenes = computed(() => this.eventos().filter(e => e.esExamen).length);
  readonly totalClases = computed(() => this.eventos().length - this.totalExamenes());

  ngOnInit(): void {
    this.consultas.pipe(
      switchMap(fechaConsulta => {
        this.eventos.set([]);
        this.error.set('');
        this.advertencia.set('');
        const codigo = this.auth.currentUser()?.codigo;
        if (!Number.isInteger(codigo) || codigo <= 0) {
          this.error.set('No se pudo identificar al alumno. Vuelve a iniciar sesión.');
          return EMPTY;
        }
        this.cargando.set(true);
        return this.horarioService.obtenerHorarioAlumno(codigo, fechaConsulta).pipe(
          map(respuesta => ({ fechaConsulta, respuesta })),
          catchError(() => {
            this.error.set('No se pudo cargar tu horario. Intenta nuevamente.');
            return EMPTY;
          }),
          finalize(() => this.cargando.set(false)),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ fechaConsulta, respuesta }) => {
      if (!Array.isArray(respuesta)) {
        this.error.set('El servicio devolvió un horario con formato inválido.');
        return;
      }
      const eventos = respuesta.map(normalizarEvento).filter((evento): evento is EventoCalendario => evento !== null)
        .sort((a, b) => a.start.getTime() - b.start.getTime());
      this.eventos.set(eventos);
      if (eventos.length !== respuesta.length) this.advertencia.set('Algunos eventos no tienen fechas válidas y no se pudieron mostrar.');
      if (!this.eventosDelDia(this.diaSeleccionado()).length) {
        const prefijoMes = fechaConsulta.slice(0, 7);
        const eventosDelMes = eventos.filter(e => clavePeru(e.start).startsWith(prefijoMes));
        const referencia = prefijoMes === this.hoy.slice(0, 7) ? this.hoy : fechaConsulta;
        const fecha = eventosDelMes.find(e => clavePeru(e.start) >= referencia)?.start ?? eventosDelMes[0]?.start;
        if (fecha) this.diaSeleccionado.set(clavePeru(fecha));
      }
    });
    this.cargarHorario();
  }

  cargarHorario(): void {
    this.consultas.next(claveLocal(this.mes()));
  }

  moverMes(cantidad: number): void {
    const mes = this.mes();
    this.seleccionarFecha(claveLocal(new Date(mes.getFullYear(), mes.getMonth() + cantidad, 1)));
  }

  seleccionarFecha(clave: string): void {
    const mesAnterior = claveLocal(this.mes()).slice(0, 7);
    this.diaSeleccionado.set(clave);
    const fecha = new Date(`${clave}T12:00:00`);
    const nuevoMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
    this.mes.set(nuevoMes);
    if (claveLocal(nuevoMes).slice(0, 7) !== mesAnterior) {
      this.cargarHorario();
    }
  }

  private eventosDelDia(clave: string): EventoCalendario[] {
    const inicio = new Date(`${clave}T00:00:00-05:00`).getTime();
    const fin = inicio + 24 * 60 * 60 * 1000;
    return this.eventos().filter(evento => evento.start.getTime() < fin && evento.end.getTime() > inicio);
  }
}
