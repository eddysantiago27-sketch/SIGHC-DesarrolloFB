
import React, { useState } from 'react';
import { dbService } from '../services/mockDb';
import { User } from '../types';
import { Activity } from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: Props) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123'); // Visual only, simulating the hash check
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper for demo purposes (Local Fallback Users)
  const INITIAL_USERS = [
      { IdUsuario: 1, NombreUsuario: 'admin', NombreCompleto: 'Administrador Web', IdRol: 1, RolNombre: 'Administrador' },
      { IdUsuario: 2, NombreUsuario: 'medico1', NombreCompleto: 'Juan Perez', IdRol: 2, RolNombre: 'Médico' },
      { IdUsuario: 3, NombreUsuario: 'enfermera1', NombreCompleto: 'Maria Nurse', IdRol: 3, RolNombre: 'Enfermera' },
      { IdUsuario: 4, NombreUsuario: 'recep1', NombreCompleto: 'Rosa Recep', IdRol: 4, RolNombre: 'Recepcionista' },
      { IdUsuario: 5, NombreUsuario: 'auditor1', NombreCompleto: 'Carlos Audit', IdRol: 6, RolNombre: 'Auditor' },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. Try API Login
    let user = await dbService.login(username, password);

    // 2. Fallback to Local Simulation if API failed or returned null
    if (!user) {
       // Simple local check
       user = INITIAL_USERS.find(u => u.NombreUsuario === username) as any;
       // Note: In real auth we would check password hash here too
    }
    
    if (user) {
      onLogin(user);
    } else {
      setError('Credenciales inválidas (Intente: admin, medico1, enfermera1, recep1, auditor1)');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-hospital-600 p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
             <Activity className="text-hospital-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">SIGHC</h1>
          <p className="text-hospital-100 mt-2">Sistema Integral de Gestión de Historias Clínicas</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">Usuario</label>
              <select 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-hospital-500 focus:border-hospital-500 sm:text-sm rounded-md border"
              >
                {INITIAL_USERS.map(u => (
                  <option key={u.IdUsuario} value={u.NombreUsuario}>
                    {u.NombreUsuario} ({u.RolNombre})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
               <label className="block text-sm font-medium text-slate-700">Contraseña (Simulada)</label>
               <input 
                 type="password" 
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-hospital-500 focus:border-hospital-500 sm:text-sm"
               />
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-hospital-600 hover:bg-hospital-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-hospital-500 disabled:opacity-50"
            >
              {loading ? 'Conectando...' : 'Iniciar Sesión'}
            </button>
          </form>
          
          <div className="mt-6 text-xs text-center text-slate-400">
             Validación de BD SQL Server • Modo Híbrido (API/Local)
          </div>
        </div>
      </div>
    </div>
  );
}
