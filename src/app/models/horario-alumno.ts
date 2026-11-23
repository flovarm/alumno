export interface EventoHorarioAlumno {
  id: number | string;
  tipo: string;
  start: string;
  end: string;
  title: string;
  content: string;
  color: string;
  modalidad?: string;
  idTipoPrograma?: number | string | null;
  url?: string | null;
  // Conservar los identificadores relacionados que envía el endpoint.
  [campo: string]: unknown;
}

export function esHorarioVirtual(horario: { modalidad?: string; content?: string } | null | undefined): boolean {
  const modalidad = horario?.modalidad?.trim();
  return /\bvirtual(?:es)?\b/i.test(modalidad || horario?.content || '');
}
