export interface TelefonoPostulante {
  id: number;
  postulanteId: number;
  tipo: string;
  numero: string;
  esPrincipal: boolean;
}

export interface Postulante {
  id: number;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  sexo?: string;
  fechaNacimiento?: string;
  email?: string;
  direccion?: string;
  procedencia?: string;
  departamentoId?: string;
  provinciaId?: string;
  distritoId?: string;
  permiteCorreo: boolean;
  permiteLlamadas: boolean;
  permiteMensajes: boolean;
  permiteFotosPublicidad: boolean;
  persona: string;
  cursoSeleccionado?: string;
  enteramiento?: string;
  tipoSeguro?: string;
  condicionEspecial: boolean;
  tipoCondicionEspecial?: string;
  documentoFrontal?: string;
  documentoPosterior?: string;
  documentoPdf?: string;
  documentoCondicionEspecial?: string;
  firmaDigitalBase64?: string;
  apoderadoNombres?: string;
  apoderadoApellidos?: string;
  apoderadoTipoDocumento?: string;
  apoderadoNumeroDocumento?: string;
  apoderadoParentesco?: string;
  apoderadoTelefono?: string;
  apoderadoCorreo?: string;
  aceptaTerminos: boolean;
  presentaBeneficio: boolean;
  permiteRetiro: boolean;
  aprobado: boolean;
  comentario?: string;
  firmaAlumno: boolean;
  fechaRegistro: string;
  fechaValidacionRegistro?: string;
  fechaActualizacion?: string;
  usuarioValidacion?: number;
  telefonos: TelefonoPostulante[];
}
