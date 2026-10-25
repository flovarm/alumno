export interface UltimoRegistro {
  idCurso: number;
  idSede: string;
  periodo: string;
  curso: string;
  notaRegistro: number | string | null;
  nombreSed: string;
  turno: string;
  apruebaReg: string;
  notaMinimaAprobatoria?: number;
  registroCerrado?: boolean;
  mesesDejoEstudiar?: number;
  deudaReg?: number;
  idCursoAprobado?: number;
  idCursoDesaprobado?: number;
}
