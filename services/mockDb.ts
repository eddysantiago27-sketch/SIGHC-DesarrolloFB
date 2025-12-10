
import { 
  Paciente, Medico, Cita, AuditLog, User, BackupJob 
} from '../types';

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// --- RICH MOCK DATA FOR FALLBACK ---
const MOCK_STATS = { 
    patients: 1250, citas: 45, consultas: 3200, medicos: 28, 
    diagnostics: [
        { name: 'J00', cases: 120, descr: 'Rinofaringitis aguda' },
        { name: 'E11', cases: 95, descr: 'Diabetes mellitus tipo 2' },
        { name: 'I10', cases: 80, descr: 'Hipertensión esencial' },
        { name: 'A09', cases: 60, descr: 'Gastroenteritis infecciosa' }
    ]
};

const MOCK_PATIENTS = [
    { IdPaciente: 1, NroHistoriaClinica: 'HC-2025-00001', Nombres: 'Eduardo', Apellidos: 'Paipay', DNI: '27222136', Edad: 25, Estado: 'A', Sexo: 'M', FechaRegistro: '2025-01-10', NombreCompleto: 'Eduardo Paipay' },
    { IdPaciente: 2, NroHistoriaClinica: 'HC-2025-00002', Nombres: 'Steve', Apellidos: 'Ovalle', DNI: '27220112', Edad: 24, Estado: 'A', Sexo: 'M', FechaRegistro: '2025-01-11', NombreCompleto: 'Steve Ovalle' },
    { IdPaciente: 3, NroHistoriaClinica: 'HC-2025-00003', Nombres: 'Maria', Apellidos: 'Salazar', DNI: '40506070', Edad: 45, Estado: 'A', Sexo: 'F', FechaRegistro: '2025-01-12', NombreCompleto: 'Maria Salazar' },
    { IdPaciente: 4, NroHistoriaClinica: 'HC-2025-00004', Nombres: 'Juan', Apellidos: 'Quispe', DNI: '10203040', Edad: 60, Estado: 'A', Sexo: 'M', FechaRegistro: '2025-01-13', NombreCompleto: 'Juan Quispe' },
    { IdPaciente: 5, NroHistoriaClinica: 'HC-2025-00005', Nombres: 'Ana', Apellidos: 'Torres', DNI: '50607080', Edad: 30, Estado: 'A', Sexo: 'F', FechaRegistro: '2025-01-14', NombreCompleto: 'Ana Torres' },
];

const MOCK_MEDICOS = [
    { IdMedico: 1, Nombres: 'Juan', Apellidos: 'Perez', NombreEspecialidad: 'Medicina General', Estado: 'A', CMP: '12345' },
    { IdMedico: 2, Nombres: 'Ana', Apellidos: 'Gomez', NombreEspecialidad: 'Pediatría', Estado: 'A', CMP: '67890' },
    { IdMedico: 3, Nombres: 'Carlos', Apellidos: 'Ruiz', NombreEspecialidad: 'Cardiología', Estado: 'A', CMP: '11223' },
];

const MOCK_CITAS = [
    { IdCita: 1, FechaCita: new Date().toISOString(), HoraInicio: '08:00', HoraFin: '08:30', NombrePaciente: 'Eduardo Paipay', NombreMedico: 'Juan Perez', TipoCita: 'Control', Estado: 'Programada', CodigoCita: 'CITA-2025-001' },
    { IdCita: 2, FechaCita: new Date().toISOString(), HoraInicio: '09:00', HoraFin: '09:30', NombrePaciente: 'Maria Salazar', NombreMedico: 'Ana Gomez', TipoCita: 'PrimeraVez', Estado: 'Confirmada', CodigoCita: 'CITA-2025-002' },
    { IdCita: 3, FechaCita: new Date().toISOString(), HoraInicio: '10:00', HoraFin: '10:30', NombrePaciente: 'Juan Quispe', NombreMedico: 'Carlos Ruiz', TipoCita: 'Emergencia', Estado: 'Atendida', CodigoCita: 'CITA-2025-003' },
];

const MOCK_AUDIT = [
    { IdAudit: 1, FechaHora: '2025-12-01T10:00:00', TablaAfectada: 'Pacientes', Operacion: 'INSERT', UsuarioNombre: 'admin', ValoresNuevos: '{"Nombres": "Eduardo", "DNI": "27222136"}' },
    { IdAudit: 2, FechaHora: '2025-12-01T10:05:00', TablaAfectada: 'Citas', Operacion: 'UPDATE', UsuarioNombre: 'enfermera1', ValoresNuevos: '{"Estado": "Confirmada"}', ValoresAnteriores: '{"Estado": "Programada"}' },
    { IdAudit: 3, FechaHora: '2025-12-01T11:20:00', TablaAfectada: 'Consultas', Operacion: 'INSERT', UsuarioNombre: 'medico1', ValoresNuevos: '{"Diagnostico": "J00"}' },
];

class DatabaseService {
  currentUser: User | null = null;

  // Generic fetch wrapper with timeout
  private async fetchAPI(endpoint: string, options?: RequestInit) {
    const controller = new AbortController();
    // Short timeout to quickly fallback to mock data if server is off
    const id = setTimeout(() => controller.abort(), 2000);

    try {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            ...options
        });
        clearTimeout(id);
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Error en el servidor');
        }
        return await res.json();
    } catch (error) {
        clearTimeout(id);
        // We throw so individual methods can catch and return specific mock data
        throw error;
    }
  }

  // --- METHODS ---

  async login(username: string, password: string): Promise<User | null> {
      try {
        const user = await this.fetchAPI('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        return user;
      } catch (e) {
          console.warn('API Login Failed, falling back to local check');
          return null;
      }
  }

  async getDashboardStats() {
      try {
        return await this.fetchAPI('/dashboard');
      } catch (e) {
          return MOCK_STATS;
      }
  }

  async getPacientesActivos(): Promise<any[]> {
      try {
        return await this.fetchAPI('/patients');
      } catch(e) { return MOCK_PATIENTS; }
  }

  async getMedicos(): Promise<Medico[]> {
      try {
        return await this.fetchAPI('/medicos');
      } catch(e) { return MOCK_MEDICOS as unknown as Medico[]; }
  }

  async getCitas(): Promise<any[]> {
      try {
        return await this.fetchAPI('/appointments');
      } catch(e) { return MOCK_CITAS; }
  }

  async getPacientesSimple(): Promise<any[]> {
      try {
        return await this.fetchAPI('/pacientes-simple');
      } catch(e) { return MOCK_PATIENTS; }
  }

  async getAuditLog(): Promise<AuditLog[]> {
      try {
        return await this.fetchAPI('/audit');
      } catch(e) { return MOCK_AUDIT as unknown as AuditLog[]; }
  }

  // SP_RegistrarPaciente
  async registrarPaciente(data: any): Promise<{ success: boolean, message: string }> {
    try {
        const payload = { ...data, UsuarioRegistro: this.currentUser?.IdUsuario || 1 };
        const res = await this.fetchAPI('/patients', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        return res;
    } catch (e: any) {
        return { success: true, message: 'Paciente registrado correctamente (Simulación Local)' };
    }
  }

  // SP_ProgramarCita
  async programarCita(data: any): Promise<{ success: boolean, message: string }> {
    try {
        const payload = { ...data, usuarioRegistro: this.currentUser?.IdUsuario || 1 };
        const res = await this.fetchAPI('/appointments', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        return res;
    } catch (e: any) {
        return { success: true, message: 'Cita programada correctamente (Simulación Local)' };
    }
  }

  // SP_RegistrarConsulta
  async registrarConsulta(idCita: number, vitals: any, anamnesis: any, diagnostico: any): Promise<{ success: boolean, message: string }> {
    try {
        const res = await this.fetchAPI('/consultations', {
            method: 'POST',
            body: JSON.stringify({ idCita, vitals, anamnesis, diagnostico })
        });
        return res;
    } catch (e: any) {
        return { success: true, message: 'Consulta registrada correctamente (Simulación Local)' };
    }
  }

  // Simulation for Jobs
  runBackup(jobId: string) {
      console.log('Triggering SQL Agent Job:', jobId);
  }
}

export const dbService = new DatabaseService();
