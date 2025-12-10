
import React, { useEffect, useState } from 'react';
import { dbService } from '../services/mockDb';
import { Users, CalendarCheck, ClipboardList, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({ patients: 0, citas: 0, consultas: 0, medicos: 0, diagnostics: [] });

  useEffect(() => {
    const loadStats = async () => {
        const data = await dbService.getDashboardStats();
        setStats(data);
    };
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Pacientes Activos</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{stats.patients}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Users size={24} />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400">Fuente: VW_PacientesActivos</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Citas Hoy</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{stats.citas}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <CalendarCheck size={24} />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400">Fuente: VW_AgendaMedica</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Consultas</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{stats.consultas}</p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <ClipboardList size={24} />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400">Tabla: Consultas</div>
        </div>
        
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Médicos Disp.</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{stats.medicos}</p>
            </div>
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
              <Activity size={24} />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400">Tabla: Medicos</div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Diagnósticos Frecuentes (Top 4)</h3>
        <div className="h-80 w-full">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={stats.diagnostics}>
               <CartesianGrid strokeDasharray="3 3" />
               <XAxis dataKey="name" />
               <YAxis />
               <Tooltip />
               <Bar dataKey="cases" fill="#0ea5e9" name="Casos" radius={[4, 4, 0, 0]} />
             </BarChart>
           </ResponsiveContainer>
        </div>
        <div className="mt-4 text-xs text-center text-slate-400">Basado en vista VW_EstadisticasDiagnosticos</div>
      </div>
    </div>
  );
}
