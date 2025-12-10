// Enums mirroring SQL Checks
export enum Sexo {
  M = 'M',
  F = 'F'
}

export enum Estado {
  Activo = 'A',
  Inactivo = 'I',
  Fallecido = 'F',
  Suspendido = 'S',
  Retirado = 'R'
}

export enum CitaEstado {
  Programada = 'Programada',
  Confirmada = 'Confirmada',
  Atendida = 'Atendida',
  Cancelada = 'Cancelada',
  Reprogramada = 'Reprogramada'
}

export enum Rol {
  Administrador = 1,
  Medico = 2,
  Enfermera = 3,
  Recepcionista = 4,
  Farmacia = 5,
  Auditor = 6
}

// Interfaces mirroring Tables
export interface Paciente {
  IdPaciente: number;
  NroHistoriaClinica: string;
  Nombres: string;
  Apellidos: string;
  DNI: string;
  FechaNacimiento: string; // ISO Date
  Sexo: Sexo;
  GrupoSanguineo: string;
  Direccion: string;
  Telefono: string;
  Email: string;
  AntecedentesFamiliares: string;
  AntecedentesPersonales: string;
  Alergias: string;
  Estado: string;
  FechaRegistro: string;
}

export interface Medico {
  IdMedico: number;
  Nombres: string;
  Apellidos: string;
  DNI: string;
  CMP: string;
  RNE?: string;
  IdEspecialidad: number;
  NombreEspecialidad?: string; // Joined
  Telefono: string;
  Email: string;
  Estado: string;
}

export interface Especialidad {
  IdEspecialidad: number;
  NombreEspecialidad: string;
  Descripcion: string;
}

export interface Cita {
  IdCita: number;
  CodigoCita: string;
  IdPaciente: number;
  PacienteNombre?: string; // Joined
  IdMedico: number;
  MedicoNombre?: string; // Joined
  FechaCita: string;
  HoraInicio: string;
  HoraFin: string;
  MotivoConsulta: string;
  TipoCita: 'PrimeraVez' | 'Control' | 'Emergencia';
  Estado: CitaEstado;
}

export interface Consulta {
  IdConsulta: number;
  IdCita: number;
  IdPaciente: number;
  IdMedico: number;
  FechaConsulta: string;
  PresionArterial: string;
  Temperatura: number;
  FrecuenciaCardiaca: number;
  Peso: number;
  Talla: number;
  IMC: number;
  MotivoConsulta: string;
  ExamenFisico: string;
  Diagnosticos?: Diagnostico[];
}

export interface Diagnostico {
  IdDiagnostico: number;
  IdConsulta: number;
  CodigoCIE10: string;
  DescripcionDiagnostico: string;
  TipoDiagnostico: 'Presuntivo' | 'Definitivo';
  Clasificacion: 'Principal' | 'Secundario' | 'Complicacion';
}

export interface Medicamento {
  IdMedicamento: number;
  CodigoMedicamento: string;
  NombreGenerico: string;
  NombreComercial: string;
  Presentacion: string;
  Concentracion: string;
  FormaFarmaceutica: string;
  UnidadMedida: string;
  StockMinimo: number;
  StockActual: number;
  PrecioUnitario: number;
  RequiereReceta: boolean;
  Estado: string;
}

export interface AuditLog {
  IdAudit: number;
  TablaAfectada: string;
  Operacion: 'INSERT' | 'UPDATE' | 'DELETE';
  IdRegistro: number;
  UsuarioID: number;
  UsuarioNombre: string;
  FechaHora: string;
  ValoresNuevos: string; // JSON
}

export interface User {
  IdUsuario: number;
  NombreUsuario: string;
  NombreCompleto: string;
  IdRol: Rol;
  RolNombre: string;
}

export interface BackupJob {
    id: string;
    name: string;
    type: 'Full' | 'Differential' | 'Log';
    lastRun: string;
    status: 'Success' | 'Failed' | 'Running' | 'Idle';
}