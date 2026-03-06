export interface CodigoPlataforma {
    id: number;
    idHorario: number;
    idCurso: number;
    codigo: string;
    codigoTeacher: string;
    idUsuarioCreacion: number;
    fechaCreacion: Date;
    idUsuarioModificacion?: number;
    fechaModificacion?: Date;
}