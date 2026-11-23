import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { EventoHorarioAlumno } from '../../models/horario-alumno';
import { AuthService } from '../../services/auth.service';
import { HorarioService } from '../../services/horario.service';
import { MiHorarioComponent, normalizarEvento } from './mi-horario.component';

const clase: EventoHorarioAlumno = {
  id: 'clase-1', tipo: 'Clase', start: '2026-11-11T09:00:00', end: '2026-11-11T11:00:00',
  title: 'Inglés', content: 'Aula 2', color: '#2563eb', idHorario: 15,
};

describe('Mi horario: fechas del calendario', () => {
  it('identifica exámenes virtuales cuando el aula del detalle empieza con V', () => {
    expect(normalizarEvento({ ...clase, tipo: 'Examen', content: 'Aula: V01 | Docente: RESERVADO 01' })!.esVirtual).toBeTrue();
    expect(normalizarEvento({ ...clase, tipo: 'Examen', content: 'Aula: v102 | Docente: RESERVADO 01' })!.esVirtual).toBeTrue();
    expect(normalizarEvento({ ...clase, tipo: 'Examen', content: 'Aula: A01 | Docente: RESERVADO 01' })!.esVirtual).toBeFalse();
  });

  it('interpreta fechas sin zona como hora peruana y conserva los datos relacionados', () => {
    const evento = normalizarEvento(clase)!;
    expect(evento.start.toISOString()).toBe('2026-11-11T14:00:00.000Z');
    expect(evento.end.toISOString()).toBe('2026-11-11T16:00:00.000Z');
    expect(evento.origen['idHorario']).toBe(15);
  });

  it('asigna una hora al examen aunque el final recibido tenga otra duración', () => {
    const evento = normalizarEvento({ ...clase, tipo: 'Examen rezagado', end: '2026-11-11T09:15:00' })!;
    expect(evento.esExamen).toBeTrue();
    expect(evento.end.getTime() - evento.start.getTime()).toBe(3600000);
  });

  it('respeta fechas con zona explícita', () => {
    expect(normalizarEvento({ ...clase, start: '2026-11-11T14:00:00Z' })!.start.toISOString())
      .toBe('2026-11-11T14:00:00.000Z');
  });

  it('descarta clases con fechas inválidas o rangos invertidos', () => {
    expect(normalizarEvento({ ...clase, start: 'inválido' })).toBeNull();
    expect(normalizarEvento({ ...clase, end: '2026-11-11T08:00:00' })).toBeNull();
  });

  it('clasifica exámenes de clasificación y rezagados y conserva el enlace de Teams del backend', () => {
    const clasificacion = normalizarEvento({
      ...clase,
      tipo: 'Examen',
      title: 'Examen de Clasificación',
      content: 'Aula: V01 | <a href="https://teams.microsoft.com/meet/backend-link">Unirse</a>',
    })!;
    expect(clasificacion.esExamen).toBeTrue();
    expect(clasificacion.esVirtual).toBeTrue();
    expect(clasificacion.esClasificacion).toBeTrue();
    expect(clasificacion.esRezagado).toBeFalse();
    expect(clasificacion.url).toBe('https://teams.microsoft.com/meet/backend-link');

    const rezagado = normalizarEvento({
      ...clase,
      tipo: 'Examen rezagado',
      title: 'Rezagado Virtual',
      content: 'Aula: V02',
      url: 'https://teams.microsoft.com/meet/rezagado-link',
    })!;
    expect(rezagado.esExamen).toBeTrue();
    expect(rezagado.esVirtual).toBeTrue();
    expect(rezagado.esClasificacion).toBeFalse();
    expect(rezagado.esRezagado).toBeTrue();
    expect(rezagado.url).toBe('https://teams.microsoft.com/meet/rezagado-link');
  });

  it('resuelve el caso de examen de clasificación según modalidad e idTipoPrograma', () => {
    const ninosPresencial = normalizarEvento({
      ...clase,
      tipo: 'Examen',
      title: 'Examen: CLASIFICACION',
      content: 'Aula: LAB | Docente: RESERVADO 01 | 04:00 pm',
      modalidad: 'Presencial',
      idTipoPrograma: 2,
    })!;
    expect(ninosPresencial.esVirtual).toBeFalse();
    expect(ninosPresencial.idTipoPrograma).toBe(2);
    expect(ninosPresencial.casoClasificacion).toBe('ninos-presencial');

    const adultosPresencial = normalizarEvento({
      ...clase,
      tipo: 'Examen',
      title: 'Examen: CLASIFICACION',
      content: 'Aula: LAB | Docente: RESERVADO 01 | 04:00 pm',
      modalidad: 'Presencial',
      idTipoPrograma: 1,
    })!;
    expect(adultosPresencial.esVirtual).toBeFalse();
    expect(adultosPresencial.idTipoPrograma).toBe(1);
    expect(adultosPresencial.casoClasificacion).toBe('adultos-presencial');

    const adultosVirtual = normalizarEvento({
      ...clase,
      tipo: 'Examen',
      title: 'Examen: CLASIFICACION',
      content: 'Aula: V101 | Docente: RESERVADO 01 | 09:00 am',
      modalidad: 'Virtual',
      idTipoPrograma: '1',
    })!;
    expect(adultosVirtual.esVirtual).toBeTrue();
    expect(adultosVirtual.idTipoPrograma).toBe(1);
    expect(adultosVirtual.casoClasificacion).toBe('adultos-virtual');

    const ninosVirtual = normalizarEvento({
      ...clase,
      tipo: 'Examen',
      title: 'Examen: CLASIFICACION',
      content: 'Aula: V101 | Docente: RESERVADO 01',
      modalidad: 'Virtual',
      idTipoPrograma: 2,
    })!;
    expect(ninosVirtual.esVirtual).toBeTrue();
    expect(ninosVirtual.idTipoPrograma).toBe(2);
    expect(ninosVirtual.casoClasificacion).toBeNull();
  });

  it('prioriza la modalidad explícita sobre el prefijo del aula', () => {
    const presencialConAulaV = normalizarEvento({
      ...clase,
      tipo: 'Examen',
      title: 'Examen: CLASIFICACION',
      content: 'Aula: V-LAB | Docente: RESERVADO 01',
      modalidad: 'Presencial',
      idTipoPrograma: 1,
    })!;
    expect(presencialConAulaV.esVirtual).toBeFalse();
    expect(presencialConAulaV.casoClasificacion).toBe('adultos-presencial');

    const virtualSinAulaV = normalizarEvento({
      ...clase,
      tipo: 'Examen',
      title: 'Examen: CLASIFICACION',
      content: 'Aula: LAB | Docente: RESERVADO 01',
      modalidad: 'Virtual',
      idTipoPrograma: 1,
    })!;
    expect(virtualSinAulaV.esVirtual).toBeTrue();
    expect(virtualSinAulaV.casoClasificacion).toBe('adultos-virtual');
  });
});

describe('MiHorarioComponent', () => {
  let component: MiHorarioComponent;
  let consultas: Subject<EventoHorarioAlumno[]>[];
  let horarioService: jasmine.SpyObj<HorarioService>;

  beforeEach(() => {
    consultas = [];
    horarioService = jasmine.createSpyObj('HorarioService', ['obtenerHorarioAlumno']);
    horarioService.obtenerHorarioAlumno.and.callFake(() => {
      const respuesta = new Subject<EventoHorarioAlumno[]>();
      consultas.push(respuesta);
      return respuesta;
    });
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { currentUser: () => ({ codigo: 12345 }) } },
        { provide: HorarioService, useValue: horarioService },
      ],
    });
    component = TestBed.runInInjectionContext(() => new MiHorarioComponent());
    component.ngOnInit();
  });

  it('consulta usando el código del alumno con la fecha del mes mostrado y cancela respuestas anteriores al cambiar de mes', () => {
    const mesInicial = `${component.hoy.slice(0, 7)}-01`;
    expect(horarioService.obtenerHorarioAlumno).toHaveBeenCalledWith(12345, mesInicial);

    component.moverMes(1);
    const fechaSiguiente = component.mes();
    const mesSiguiente = `${fechaSiguiente.getFullYear()}-${String(fechaSiguiente.getMonth() + 1).padStart(2, '0')}-01`;
    expect(horarioService.obtenerHorarioAlumno).toHaveBeenCalledWith(12345, mesSiguiente);

    consultas[0].next([clase]);
    expect(component.eventos()).toEqual([]);
    expect(component.cargando()).toBeTrue();
    consultas[1].next([{ ...clase, id: 'actual' }]);
    consultas[1].complete();
    expect(component.eventos()[0].id).toBe('actual');
    expect(component.cargando()).toBeFalse();
  });

  it('solo vuelve a consultar cuando cambia el mes seleccionado', () => {
    expect(horarioService.obtenerHorarioAlumno).toHaveBeenCalledTimes(1);
    component.seleccionarFecha(`${component.hoy.slice(0, 7)}-15`);
    expect(horarioService.obtenerHorarioAlumno).toHaveBeenCalledTimes(1);

    component.seleccionarFecha('2027-02-10');
    expect(horarioService.obtenerHorarioAlumno).toHaveBeenCalledTimes(2);
    expect(horarioService.obtenerHorarioAlumno).toHaveBeenCalledWith(12345, '2027-02-01');
  });

  it('incluye eventos que cruzan medianoche sin agregarlos al día en que terminan a las 00:00', () => {
    component.seleccionarFecha('2026-11-11');
    const consultaActiva = consultas[consultas.length - 1];
    consultaActiva.next([{ ...clase, start: '2026-11-11T23:00:00', end: '2026-11-13T00:00:00' }]);
    component.seleccionarFecha('2026-11-12');
    expect(component.eventosSeleccionados().length).toBe(1);
    component.seleccionarFecha('2026-11-13');
    expect(component.eventosSeleccionados().length).toBe(0);
  });

  it('permite reintentar después de un error enviando la fecha del mes actual del calendario', () => {
    const mesInicial = `${component.hoy.slice(0, 7)}-01`;
    consultas[0].error(new Error('Error de red'));
    expect(component.error()).toContain('No se pudo cargar');
    component.cargarHorario();
    expect(horarioService.obtenerHorarioAlumno).toHaveBeenCalledWith(12345, mesInicial);
    consultas[1].next([clase]);
    consultas[1].complete();
    expect(component.error()).toBe('');
    expect(component.eventos().length).toBe(1);
  });
});

describe('MiHorarioComponent (indicaciones de clasificación)', () => {
  let consultas: Subject<EventoHorarioAlumno[]>[];
  let horarioService: jasmine.SpyObj<HorarioService>;

  function crearVista(evento: EventoHorarioAlumno): HTMLElement {
    consultas = [];
    horarioService = jasmine.createSpyObj('HorarioService', ['obtenerHorarioAlumno']);
    horarioService.obtenerHorarioAlumno.and.callFake(() => {
      const respuesta = new Subject<EventoHorarioAlumno[]>();
      consultas.push(respuesta);
      return respuesta;
    });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [MiHorarioComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { currentUser: () => ({ codigo: 12345 }) } },
        { provide: HorarioService, useValue: horarioService },
      ],
    });
    const fixture = TestBed.createComponent(MiHorarioComponent);
    fixture.detectChanges();
    fixture.componentInstance.seleccionarFecha(evento.start.slice(0, 10));
    consultas[consultas.length - 1].next([evento]);
    consultas[consultas.length - 1].complete();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('muestra las indicaciones de clasificación presencial para niños (idTipoPrograma = 2)', () => {
    const el = crearVista({
      id: 'clas-ninos-presencial',
      tipo: 'Examen',
      start: '2026-11-20T16:00:00',
      end: '2026-11-20T17:00:00',
      title: 'Examen: CLASIFICACION',
      content: 'Aula: LAB | Docente: RESERVADO 01 | 04:00 pm',
      color: '#b45309',
      modalidad: 'Presencial',
      idTipoPrograma: 2,
    });
    const texto = el.textContent || '';
    expect(texto).toContain('La duración del examen es referencial y depende del nivel y del tipo de examen.');
    expect(texto).toContain('2.° a 6.° de primaria:');
    expect(texto).toContain('1.° de secundaria a más:');
    expect(texto).toContain('LABORATORIO MULTIMEDIA – 3ER PISO, Local principal Av. Venezuela 125 Urb. El Recreo');
    expect(texto).toContain('Ver ubicación en Google Maps (Av. Venezuela 125)');
    expect(el.querySelector<HTMLAnchorElement>('a.maps-link')?.getAttribute('href'))
      .toBe('https://maps.app.goo.gl/HnfX63HFUSY1FLW47?g_st=aw');
  });

  it('muestra las indicaciones de clasificación presencial para adultos (idTipoPrograma = 1)', () => {
    const el = crearVista({
      id: 'clas-adultos-presencial',
      tipo: 'Examen',
      start: '2026-11-20T16:00:00',
      end: '2026-11-20T17:00:00',
      title: 'Examen: CLASIFICACION',
      content: 'Aula: LAB | Docente: RESERVADO 01 | 04:00 pm',
      color: '#b45309',
      modalidad: 'Presencial',
      idTipoPrograma: 1,
    });
    const texto = el.textContent || '';
    expect(texto).toContain('La duración del examen escrito: 70 minutos. La entrevista será posterior a la evaluación escrita, según el orden de término.');
    expect(texto).not.toContain('2.° a 6.° de primaria:');
    expect(texto).not.toContain('1.° de secundaria a más:');
    expect(texto).toContain('LABORATORIO MULTIMEDIA – 3ER PISO, Local principal Av. Venezuela 125 Urb. El Recreo');
    expect(texto).toContain('Ver ubicación en Google Maps (Av. Venezuela 125)');
    expect(el.querySelector<HTMLAnchorElement>('a.maps-link')?.getAttribute('href'))
      .toBe('https://maps.app.goo.gl/HnfX63HFUSY1FLW47?g_st=aw');
  });

  it('muestra las indicaciones de clasificación virtual para adultos (idTipoPrograma = 1)', () => {
    const el = crearVista({
      id: 'clas-adultos-virtual',
      tipo: 'Examen',
      start: '2026-11-20T09:00:00',
      end: '2026-11-20T10:00:00',
      title: 'Examen: CLASIFICACION',
      content: 'Aula: V101 | Docente: RESERVADO 01 | 09:00 am',
      color: '#b45309',
      modalidad: 'Virtual',
      idTipoPrograma: 1,
      url: 'https://teams.microsoft.com/meet/clasificacion',
    });
    const texto = el.textContent || '';
    expect(texto).toContain('La duración del examen es referencial y depende del nivel y del tipo de examen.');
    expect(texto).toContain('Hora de escrito: 9:00 AM.');
    expect(texto).toContain('https://aulavirtual.elcultural.com.pe/');
    expect(texto).toContain('La Entrevista: 10:00 AM.');
    expect(texto).toContain('Acceder al examen');
  });

  it('no muestra indicaciones virtuales ni de rezagado si llega clasificación virtual para niños (idTipoPrograma = 2)', () => {
    const el = crearVista({
      id: 'clas-ninos-virtual',
      tipo: 'Examen',
      start: '2026-11-20T09:00:00',
      end: '2026-11-20T10:00:00',
      title: 'Examen: CLASIFICACION',
      content: 'Aula: V101 | Docente: RESERVADO 01 | 09:00 am',
      color: '#b45309',
      modalidad: 'Virtual',
      idTipoPrograma: 2,
    });
    const texto = el.textContent || '';
    expect(texto).not.toContain('Hora de escrito:');
    expect(texto).not.toContain('INDICACIONES IMPORTANTES');
  });

  it('muestra las indicaciones de rezagado presencial para niños (idTipoPrograma = 2)', () => {
    const el = crearVista({
      id: 'rez-ninos-presencial',
      tipo: 'Examen',
      start: '2026-11-18T17:30:00',
      end: '2026-11-18T18:30:00',
      title: 'Examen: REZAGADO',
      content: 'Aula: LAB | Docente: RESERVADO 01 | 05:30 pm',
      color: '#b45309',
      modalidad: 'Presencial',
      idTipoPrograma: 2,
    });
    const texto = el.textContent || '';
    expect(texto).toContain('Examen presencial');
    expect(texto).toContain('Dirección: Av. Venezuela 125');
    expect(texto).toContain('En caso del programa de NIÑOS Y JUNIORS debe traer su binder (cuadernillo de prácticas y cartuchera).');
    expect(texto).toContain('Sus notas figuran en 24 hrs, y puede visualizar en su Intranet.');
  });

  it('muestra las indicaciones de rezagado presencial y virtual para adultos (idTipoPrograma = 1) y oculta virtual para niños', () => {
    const presencial = crearVista({
      id: 'rez-adultos-presencial',
      tipo: 'Examen',
      start: '2026-11-18T17:30:00',
      end: '2026-11-18T18:30:00',
      title: 'Examen: REZAGADO',
      content: 'Aula: LAB | Docente: RESERVADO 01 | 05:30 pm',
      color: '#b45309',
      modalidad: 'Presencial',
      idTipoPrograma: 1,
    });
    expect(presencial.textContent || '').toContain('Si es del programa de NIÑOS Y JUNIORS debe traer su binder (cuadernillo de prácticas y cartuchera).');

    const virtual = crearVista({
      id: 'rez-adultos-virtual',
      tipo: 'Examen',
      start: '2026-11-18T10:00:00',
      end: '2026-11-18T11:00:00',
      title: 'Examen: REZAGADO',
      content: 'Aula: V101 | Docente: RESERVADO 01 | 10:00 am',
      color: '#b45309',
      modalidad: 'Virtual',
      idTipoPrograma: 1,
      url: 'https://teams.microsoft.com/meet/248440630010403?p=xsG9EiBLatxyCfvjMv',
    });
    const textoVirtual = virtual.textContent || '';
    expect(textoVirtual).toContain('INDICACIONES IMPORTANTES');
    expect(textoVirtual).toContain('1. 1st y/o 2nd Writing:');
    expect(textoVirtual).toContain('2. Examen Final:');
    expect(textoVirtual).toContain('3. Homework:');
    expect(textoVirtual).toContain('CONSULTA DE NOTAS: Estarán disponibles en 24 horas en la Intranet.');

    const ninosVirtual = crearVista({
      id: 'rez-ninos-virtual',
      tipo: 'Examen',
      start: '2026-11-18T10:00:00',
      end: '2026-11-18T11:00:00',
      title: 'Examen: REZAGADO',
      content: 'Aula: V101 | Docente: RESERVADO 01 | 10:00 am',
      color: '#b45309',
      modalidad: 'Virtual',
      idTipoPrograma: 2,
    });
    expect(ninosVirtual.textContent || '').not.toContain('INDICACIONES IMPORTANTES');
  });

  it('muestra las indicaciones de sustitutorio presencial para niños y adultos sin iconos y oculta modalidad virtual', () => {
    const ninos = crearVista({
      id: 'sus-ninos-presencial',
      tipo: 'Examen',
      start: '2026-11-18T17:00:00',
      end: '2026-11-18T18:00:00',
      title: 'Examen SUSTITUTORIO',
      content: 'Aula: LAB | Docente: RESERVADO 01 | 5:00 pm',
      color: '#b45309',
      modalidad: 'Presencial',
      idTipoPrograma: 2,
    });
    const textoNinos = ninos.textContent || '';
    expect(textoNinos).toContain('Leer cuidadosamente las indicaciones');
    expect(textoNinos).toContain('La nota obtenida reemplaza al puntaje final, no promedia.');
    expect(textoNinos).toContain('En el nivel de junior, nota mínima aprobatoria es 70 puntos.');
    expect(textoNinos).toContain('La nota máxima es 100 puntos.');
    expect(textoNinos).toContain('CONSULTA DE NOTAS: Estarán disponibles en 24 horas en la Intranet.');
    expect(textoNinos).not.toMatch(/[🚨👉📌]/);

    const adultos = crearVista({
      id: 'sus-adultos-presencial',
      tipo: 'Examen',
      start: '2026-11-18T16:00:00',
      end: '2026-11-18T17:00:00',
      title: 'Examen SUSTITUTORIO',
      content: 'Aula: LAB | Docente: RESERVADO 01 | 4:00 pm',
      color: '#b45309',
      modalidad: 'Presencial',
      idTipoPrograma: 1,
    });
    const textoAdultos = adultos.textContent || '';
    expect(textoAdultos).toContain('En básico e intermedio regular, nota mínima aprobatoria es 70 puntos, en avanzado 1 al 8 es 75 puntos.');
    expect(textoAdultos).not.toContain('En el nivel de junior');
    expect(textoAdultos).not.toMatch(/[🚨👉📌]/);

    const virtual = crearVista({
      id: 'sus-adultos-virtual',
      tipo: 'Examen',
      start: '2026-11-18T16:00:00',
      end: '2026-11-18T17:00:00',
      title: 'Examen SUSTITUTORIO',
      content: 'Aula: V101 | Docente: RESERVADO 01 | 4:00 pm',
      color: '#b45309',
      modalidad: 'Virtual',
      idTipoPrograma: 1,
    });
    const textoVirtual = virtual.textContent || '';
    expect(textoVirtual).not.toContain('La nota obtenida reemplaza');
    expect(textoVirtual).not.toContain('INDICACIONES IMPORTANTES');
  });
});
