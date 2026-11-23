export interface NotaRegistroItem {
  idItem: number;
  item: string;
  formato: string;
  valorMaximo?: number | null;
  nota: number;
  tieneNota: boolean;
}

export interface DetalleNotasRegistro {
  idRegistro: number;
  finalGrade?: number | null;
  apruebaReg?: string | null;
  items: NotaRegistroItem[];
}
