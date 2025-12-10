import React, { useState, useEffect } from 'react';
import { dbService } from './services/mockDb';
import { User, Rol } from './types';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import Consultations from './pages/Consultations';
import AdminPanel from './pages/AdminPanel';
import { 
  LayoutDashboard, Users, Calendar, Stethoscope, 
  ShieldAlert, Database, LogOut, Menu, X, Wifi, WifiOff
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Sync service user
    dbService.currentUser = user;
  }, [user]);

  // Check backend health periodically
  useEffect(() => {
      const checkStatus = async () => {
          const status = await dbService.checkHealth();
          setIsOnline(status);
      };
      checkStatus();
      const interval = setInterval(checkStatus, 10000); // Check every 10 sec
      return () => clearInterval(interval);
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const navItemClass = (view: string) => `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${currentView === view ? 'bg-hospital-600 text-white' : 'text-slate-300 hover:bg-hospital-900 hover:text-white'}`;

  // Role Based Access Helper
  const canAccess = (roles: Rol[]) => roles.includes(user.IdRol);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-800 text-white transform transition-transform duration-300 lg:transform-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold tracking-tight text-hospital-500">SIGHC</h1>
          <p className="text-xs text-slate-400 mt-1">Hosp. Regional Ayacucho</p>
        </div>
        
        <nav className="p-4 space-y-2">
          <div onClick={() => setCurrentView('dashboard')} className={navItemClass('dashboard')}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </div>

          {(canAccess([Rol.Administrador, Rol.Recepcionista, Rol.Enfermera, Rol.Medico])) && (
            <div onClick={() => setCurrentView('patients')} className={navItemClass('patients')}>
              <Users size={20} />
              <span>Pacientes</span>
            </div>
          )}

          {(canAccess([Rol.Administrador, Rol.Recepcionista, Rol.Enfermera, Rol.Medico])) && (
            <div onClick={() => setCurrentView('appointments')} className={navItemClass('appointments')}>
              <Calendar size={20} />
              <span>Citas</span>
            </div>
          )}

          {(canAccess([Rol.Administrador, Rol.Medico])) && (
            <div onClick={() => setCurrentView('consultations')} className={navItemClass('consultations')}>
              <Stethoscope size={20} />
              <span>Consultas</span>
            </div>
          )}

          {(canAccess([Rol.Administrador, Rol.Auditor])) && (
             <div onClick={() => setCurrentView('admin')} className={navItemClass('admin')}>
              <ShieldAlert size={20} />
              <span>Auditoría & DB</span>
            </div>
          )}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-700">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-hospital-500 flex items-center justify-center font-bold">
              {user.NombreUsuario.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.NombreCompleto}</p>
              <p className="text-xs text-slate-400">{user.RolNombre}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center space-x-2 text-slate-400 hover:text-red-400 w-full px-2">
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-slate-500">
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-semibold text-slate-800">
              {currentView === 'dashboard' && 'Resumen Ejecutivo'}
              {currentView === 'patients' && 'Gestión de Pacientes (M01)'}
              {currentView === 'appointments' && 'Gestión de Citas (M02)'}
              {currentView === 'consultations' && 'Consultas Médicas (M03)'}
              {currentView === 'admin' && 'Panel de Administrador y Auditoría'}
            </h2>
            
            {/* Status Indicator */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${isOnline ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
              {isOnline ? <Wifi size={16}/> : <WifiOff size={16}/>}
              <span className="hidden md:inline">
                  {isOnline ? 'SQL Server Conectado' : 'Modo Simulación'}
              </span>
            </div>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 overflow-y-auto p-6 pb-24">
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'patients' && <Patients />}
          {currentView === 'appointments' && <Appointments />}
          {currentView === 'consultations' && <Consultations />}
          {currentView === 'admin' && <AdminPanel />}
        </main>
      </div>
    </div>
  );
}