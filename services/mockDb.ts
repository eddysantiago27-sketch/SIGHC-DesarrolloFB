import { 
  Paciente, Medico, Cita, AuditLog, User, BackupJob, Medicamento
} from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

const MOCK_STATS = { 
    patients: 1250, citas: 45, consultas: 3200, medicos: 28, 
    diagnostics: [
        { name: 'J00', cases: 120, descr: 'Rinofaringitis aguda' },
        { name: 'E11', cases: 95, descr: 'Diabetes mellitus tipo 2' }
    ]
};

const MOCK_PATIENTS = [
    { IdPaciente: 1, NroHistoriaClinica: 'HC-2025-00001', Nombres: 'Simulado', Apellidos: 'Local', DNI: '00000000', Edad: 25, Estado: 'A', Sexo: 'M', FechaRegistro: '2025-01-10', NombreCompleto: 'Simulado Local' }
];

class DatabaseService {
  currentUser: User | null = null;
  isBackendOnline: boolean = false;

  private async fetchAPI(endpoint: string, options?: RequestInit) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 8000); // 8 sec timeout

    try {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            ...options
        });
        clearTimeout(id);
        
        const data = await res.json();

        // Si el servidor responde un error (400/500), lanzamos error pero mantenemos estado Online
        if (!res.ok) {
            this.isBackendOnline = true; 
            throw new Error(data.message || 'Error en el servidor');
        }
        
        this.isBackendOnline = true;
        return data;
    } catch (error: any) {
        clearTimeout(id);
        
        // Solo marcar offline si es error de red
        if (error.name === 'AbortError' || error.message.includes('Failed to fetch') || error.code === 'ECONNREFUSED') {
             console.error(`API Offline (${endpoint}):`, error);
             this.isBackendOnline = false;
        }
        throw error;
    }
  }

  async checkHealth(): Promise<boolean> {
      try {
          const res = await this.fetchAPI('/health');
          return res.status === 'online';
      } catch (e) {
          return false;
      }
  }

  // ... (Login y Getters igual que antes, usando fetchAPI) ...
  async login(username: string, password: string): Promise<User | null> {
      try {
        return await this.fetchAPI('/login', { method: 'POST', body: JSON.stringify({ username, password }) });
      } catch (e) { return null; }
  }
  async getDashboardStats() { try { return await this.fetchAPI('/dashboard'); } catch (e) { return MOCK_STATS; } }
  async getPacientesActivos(): Promise<any[]> { try { return await this.fetchAPI('/patients'); } catch(e) { return MOCK_PATIENTS; } }
  async getMedicos(): Promise<Medico[]> { try { return await this.fetchAPI('/medicos'); } catch(e) { return []; } }
  async getCitas(): Promise<any[]> { try { return await this.fetchAPI('/appointments'); } catch(e) { return []; } }
  async getPacientesSimple(): Promise<any[]> { try { return await this.fetchAPI('/pacientes-simple'); } catch(e) { return []; } }
  async getAuditLog(): Promise<AuditLog[]> { try { return await this.fetchAPI('/audit'); } catch(e) { return []; } }
  async getMedicamentos(): Promise<Medicamento[]> { try { return await this.fetchAPI('/medicamentos'); } catch(e) { return []; } }

  async registrarMedicamento(data: any): Promise<{ success: boolean, message: string }> {
      try {
          return await this.fetchAPI('/medicamentos', { method: 'POST', body: JSON.stringify(data) });
      } catch (e: any) {
          if (this.isBackendOnline) return { success: false, message: e.message };
          return { success: true, message: 'Medicamento guardado (Simulación)' };
      }
  }

  async registrarPaciente(data: any): Promise<{ success: boolean, message: string }> {
    try {
        const payload = { ...data, UsuarioRegistro: this.currentUser?.IdUsuario || 1 };
        return await this.fetchAPI('/patients', { method: 'POST', body: JSON.stringify(payload) });
    } catch (e: any) {
        if (this.isBackendOnline) {
            // Error real de SQL (ej: DNI duplicado)
            return { success: false, message: e.message }; 
        }
        return { success: true, message: 'Paciente registrado (Modo Simulación - Sin BD)' };
    }
  }

  async programarCita(data: any): Promise<{ success: boolean, message: string }> {
    try {
        const payload = { ...data, usuarioRegistro: this.currentUser?.IdUsuario || 1 };
        return await this.fetchAPI('/appointments', { method: 'POST', body: JSON.stringify(payload) });
    } catch (e: any) {
        if (this.isBackendOnline) return { success: false, message: e.message };
        return { success: true, message: 'Cita programada (Simulación)' };
    }
  }

  async registrarConsulta(idCita: number, vitals: any, anamnesis: any, diagnostico: any): Promise<{ success: boolean, message: string }> {
    try {
        return await this.fetchAPI('/consultations', { method: 'POST', body: JSON.stringify({ idCita, vitals, anamnesis, diagnostico }) });
    } catch (e: any) {
        if (this.isBackendOnline) return { success: false, message: e.message };
        return { success: true, message: 'Consulta registrada (Simulación)' };
    }
  }

  runBackup(jobId: string) { console.log('Job:', jobId); }
}

export const dbService = new DatabaseService();