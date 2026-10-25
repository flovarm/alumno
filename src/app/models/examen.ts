export interface TipoExamen {
  idTipoExamen: number;
  descripcion: string;
  estado: boolean;
  costo: number;
  abreviatura: string;
  clasSap: string | null;
}

export interface HorarioExamen {
  idHorarioExamen: number;
  dia: string;
  hora: string;
  descripcionDia: string;
  idAula: number;
  idProfesor: number;
  capacidad: number;
  matriculados: number;
  costo: number;
  idPeriodo: number;
  horaInicio: string;
  idTipoPrograma: number;
  tipo: string | null;
  idTipoExamen: number | null;
  idSede: string | null;
  nombreCompleto: string | null;
  descripcion: string;
  nombreSed: string | null;
}

export function vacantesDisponibles(horario: HorarioExamen): number {
  if (!Number.isFinite(horario.capacidad) || !Number.isFinite(horario.matriculados)) return 0;
  return Math.max(0, horario.capacidad - horario.matriculados);
}
