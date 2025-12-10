
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/mockDb';
import { CitaEstado } from '../types';
import { Plus, Search, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';

export default function Appointments() {
  const [activeTab, setActiveTab] = useState<'agenda' | 'programar'>('agenda');
  const [citas, setCitas] = useState<any[]>([]);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Lists for dropdowns
  const [medicos, setMedicos] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    idPaciente: '',
    idMedico: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: '09:00',
    motivo: '',
    tipo: 'Control'
  });

  useEffect(() => {
      const loadData = async () => {
          if (activeTab === 'agenda') {
              const data = await dbService.getCitas();
              setCitas(data);
          } else {
              const meds = await dbService.getMedicos();
              const pats = await dbService.getPacientesSimple();
              setMedicos(meds);
              setPacientes(pats);
          }
      };
      loadData();
  }, [activeTab]);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const result = await dbService.programarCita({
        idPaciente: Number(formData.idPaciente),
        idMedico: Number(formData.idMedico),
        fecha: formData.fecha,
        hora: formData.hora,
        motivo: formData.motivo,
        tipo: formData.tipo
    });

    if (result.success) {
      setMsg({ type: 'success', text: result.message });
      setFormData({...formData, motivo: ''}); // reset text
    } else {
      setMsg({ type: 'error', text: result.message });
    }
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Programada': return 'bg-yellow-100 text-yellow-800';
          case 'Confirmada': return 'bg-blue-100 text-blue-800';
          case 'Atendida': return 'bg-green-100 text-green-800';
          case 'Cancelada': return 'bg-red-100 text-red-800';
          default: return 'bg-gray-100 text-gray-800';
      }
  };

  return (
    <div className="space-y-6">
       <div className="flex space-x-4 border-b border-gray-200">
        <button
          className={`pb-2 px-4 ${activeTab === 'agenda' ? 'border-b-2 border-hospital-600 text-hospital-600 font-medium' : 'text-slate-500'}`}
          onClick={() => setActiveTab('agenda')}
        >
          Agenda Médica (VW_AgendaMedica)
        </button>
        <button
          className={`pb-2 px-4 ${activeTab === 'programar' ? 'border-b-2 border-hospital-600 text-hospital-600 font-medium' : 'text-slate-500'}`}
          onClick={() => setActiveTab('programar')}
        >
          Programar Cita (SP_ProgramarCita)
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg.type === 'success' ? <CheckCircle size={20}/> : <AlertTriangle size={20}/>}
          <span>{msg.text}</span>
        </div>
      )}

      {activeTab === 'agenda' && (
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
           <table className="min-w-full divide-y divide-gray-200">
             <thead className="bg-gray-50">
               <tr>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha/Hora</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Médico</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
               </tr>
             </thead>
             <tbody className="bg-white divide-y divide-gray-200">
               {citas.length === 0 ? (
                 <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No hay citas programadas.</td></tr>
               ) : (
                 citas.map((c) => (
                    <tr key={c.IdCita}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(c.FechaCita).toLocaleDateString()} <br/> <span className="text-gray-500">{c.HoraInicio?.substring(0,5)} - {c.HoraFin?.substring(0,5)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-hospital-600">{c.NombrePaciente}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.NombreMedico}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.TipoCita}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(c.Estado)}`}>
                            {c.Estado}
                            </span>
                        </td>
                    </tr>
                 ))
               )}
             </tbody>
           </table>
         </div>
      )}

      {activeTab === 'programar' && (
        <form onSubmit={handleSchedule} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-2xl">
            <h3 className="text-lg font-medium mb-4">Detalles de la Cita</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Paciente</label>
                    <select required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={formData.idPaciente} onChange={e => setFormData({...formData, idPaciente: e.target.value})}>
                        <option value="">Seleccione Paciente</option>
                        {pacientes.map(p => <option key={p.IdPaciente} value={p.IdPaciente}>{p.Nombres} {p.Apellidos}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Médico</label>
                    <select required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={formData.idMedico} onChange={e => setFormData({...formData, idMedico: e.target.value})}>
                        <option value="">Seleccione Médico</option>
                        {medicos.map(m => <option key={m.IdMedico} value={m.IdMedico}>{m.Nombres} {m.Apellidos} ({m.NombreEspecialidad})</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha</label>
                    <input type="date" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Hora Inicio</label>
                    <input type="time" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={formData.hora} onChange={e => setFormData({...formData, hora: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo Cita</label>
                    <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})}>
                        <option value="PrimeraVez">Primera Vez</option>
                        <option value="Control">Control</option>
                        <option value="Emergencia">Emergencia</option>
                    </select>
                </div>
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Motivo</label>
                    <textarea required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" rows={3} value={formData.motivo} onChange={e => setFormData({...formData, motivo: e.target.value})} />
                </div>
            </div>
            <button type="submit" className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-hospital-600 hover:bg-hospital-700 focus:outline-none">
              <Calendar size={16} className="mr-2" />
              Agendar Cita
            </button>
        </form>
      )}
    </div>
  );
}
