
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/mockDb';
import { Sexo } from '../types';
import { Plus, Search, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Patients() {
  const [activeTab, setActiveTab] = useState<'list' | 'register'>('list');
  const [patients, setPatients] = useState<any[]>([]);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    Nombres: '', Apellidos: '', DNI: '', FechaNacimiento: '', 
    Sexo: Sexo.M, Direccion: '', Telefono: '', Email: '', GrupoSanguineo: 'O+',
    AntecedentesFamiliares: '', AntecedentesPersonales: '', Alergias: ''
  });

  const loadPatients = async () => {
      const data = await dbService.getPacientesActivos();
      setPatients(data);
  };

  useEffect(() => {
      if (activeTab === 'list') {
          loadPatients();
      }
  }, [activeTab]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const result = await dbService.registrarPaciente(formData);
    
    if (result.success) {
      setMsg({ type: 'success', text: result.message });
      setFormData({
        Nombres: '', Apellidos: '', DNI: '', FechaNacimiento: '', 
        Sexo: Sexo.M, Direccion: '', Telefono: '', Email: '', GrupoSanguineo: 'O+',
        AntecedentesFamiliares: '', AntecedentesPersonales: '', Alergias: ''
      });
    } else {
      setMsg({ type: 'error', text: result.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          className={`pb-2 px-4 ${activeTab === 'list' ? 'border-b-2 border-hospital-600 text-hospital-600 font-medium' : 'text-slate-500'}`}
          onClick={() => setActiveTab('list')}
        >
          Listado de Pacientes
        </button>
        <button
          className={`pb-2 px-4 ${activeTab === 'register' ? 'border-b-2 border-hospital-600 text-hospital-600 font-medium' : 'text-slate-500'}`}
          onClick={() => setActiveTab('register')}
        >
          Registrar Nuevo (SP_RegistrarPaciente)
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg.type === 'success' ? <CheckCircle size={20}/> : <AlertTriangle size={20}/>}
          <span>{msg.text}</span>
        </div>
      )}

      {activeTab === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center">
            <Search className="text-slate-400 mr-2" size={20} />
            <input type="text" placeholder="Buscar por DNI o Nombre..." className="bg-transparent border-none focus:ring-0 w-full text-sm" />
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Historia Clínica</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DNI</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patients.map((p) => (
                <tr key={p.IdPaciente}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-hospital-600">{p.NroHistoriaClinica}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.NombreCompleto || (p.Nombres + ' ' + p.Apellidos)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.DNI}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.Edad} años</td>
                   <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Activo
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'register' && (
        <form onSubmit={handleRegister} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-medium mb-4">Datos Demográficos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">DNI</label>
              <input required maxLength={8} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={formData.DNI} onChange={e => setFormData({...formData, DNI: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombres</label>
              <input required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={formData.Nombres} onChange={e => setFormData({...formData, Nombres: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Apellidos</label>
              <input required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={formData.Apellidos} onChange={e => setFormData({...formData, Apellidos: e.target.value})} />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Fecha Nacimiento</label>
              <input type="date" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={formData.FechaNacimiento} onChange={e => setFormData({...formData, FechaNacimiento: e.target.value})} />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Sexo</label>
              <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={formData.Sexo} onChange={e => setFormData({...formData, Sexo: e.target.value as Sexo})}>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
              </select>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Grupo Sanguineo</label>
              <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={formData.GrupoSanguineo} onChange={e => setFormData({...formData, GrupoSanguineo: e.target.value})}>
                  <option value="O+">O+</option>
                  <option value="A+">A+</option>
                  <option value="B+">B+</option>
                  <option value="AB+">AB+</option>
                  <option value="O-">O-</option>
              </select>
            </div>
          </div>

          <h3 className="text-lg font-medium mb-4">Contacto y Antecedentes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
             <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Dirección</label>
              <input className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={formData.Direccion} onChange={e => setFormData({...formData, Direccion: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Teléfono</label>
              <input className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={formData.Telefono} onChange={e => setFormData({...formData, Telefono: e.target.value})} />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" value={formData.Email} onChange={e => setFormData({...formData, Email: e.target.value})} />
            </div>
             <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Alergias (Importante)</label>
              <input className="mt-1 block w-full rounded-md border-red-300 shadow-sm border p-2 focus:ring-red-500 focus:border-red-500" placeholder="Ej: Penicilina, Ibuprofeno..." value={formData.Alergias} onChange={e => setFormData({...formData, Alergias: e.target.value})} />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-hospital-600 hover:bg-hospital-700 focus:outline-none">
              <Plus size={16} className="mr-2" />
              Registrar Paciente
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
