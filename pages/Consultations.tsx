
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/mockDb';
import { CheckCircle, AlertTriangle, FileText, Activity, Stethoscope } from 'lucide-react';

export default function Consultations() {
    const [selectedCitaId, setSelectedCitaId] = useState<string>('');
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [pendingAppointments, setPendingAppointments] = useState<any[]>([]);

    const [vitals, setVitals] = useState({ presion: '120/80', temperatura: 36.5, fc: 72, peso: 70, talla: 1.70 });
    const [anamnesis, setAnamnesis] = useState({ motivo: '', examen: '' });
    const [diag, setDiag] = useState({ CodigoCIE10: 'J00', DescripcionDiagnostico: 'Rinofaringitis aguda', TipoDiagnostico: 'Definitivo', Clasificacion: 'Principal' });

    useEffect(() => {
        const loadAppointments = async () => {
            const citas = await dbService.getCitas();
            // Filter by Pendiente/Confirmada based on VW_AgendaMedica 'EstadoDescriptivo' or raw 'Estado'
            setPendingAppointments(citas.filter(c => c.Estado === 'Programada' || c.Estado === 'Confirmada'));
        };
        loadAppointments();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!selectedCitaId) return;

        const result = await dbService.registrarConsulta(
            Number(selectedCitaId),
            vitals,
            anamnesis,
            diag as any
        );

        if (result.success) {
            setMsg({ type: 'success', text: result.message });
            setSelectedCitaId('');
            // Reload list
            const citas = await dbService.getCitas();
            setPendingAppointments(citas.filter(c => c.Estado === 'Programada' || c.Estado === 'Confirmada'));
        } else {
            setMsg({ type: 'error', text: result.message });
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-700 mb-4">Registro de Consulta Médica (SP_RegistrarConsulta)</h2>
            
            {msg && (
                <div className={`p-4 rounded-lg flex items-center space-x-2 ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {msg.type === 'success' ? <CheckCircle size={20}/> : <AlertTriangle size={20}/>}
                <span>{msg.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List of Patients Waiting */}
                <div className="col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <h3 className="font-medium text-slate-500 mb-4 uppercase text-xs tracking-wider">Pacientes en Espera</h3>
                    {pendingAppointments.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">No hay citas pendientes.</p>
                    ) : (
                        <ul className="space-y-3">
                            {pendingAppointments.map(c => (
                                <li 
                                    key={c.IdCita} 
                                    onClick={() => setSelectedCitaId(c.IdCita.toString())}
                                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedCitaId === c.IdCita.toString() ? 'border-hospital-500 bg-hospital-50' : 'border-slate-200 hover:border-hospital-300'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-slate-800">{c.NombrePaciente}</p>
                                            <p className="text-xs text-slate-500">{new Date(c.FechaCita).toLocaleDateString()} • {c.HoraInicio?.substring(0,5)}</p>
                                        </div>
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{c.CodigoCita}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Consultation Form */}
                <div className="col-span-1 lg:col-span-2">
                    {selectedCitaId ? (
                        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                            
                            <div>
                                <div className="flex items-center space-x-2 mb-4 text-hospital-600 border-b pb-2">
                                    <Activity size={20} />
                                    <h3 className="font-semibold">Signos Vitales</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div><label className="text-xs text-slate-500">P. Arterial</label><input className="w-full border rounded p-1" value={vitals.presion} onChange={e => setVitals({...vitals, presion: e.target.value})} /></div>
                                    <div><label className="text-xs text-slate-500">Temp (°C)</label><input type="number" className="w-full border rounded p-1" value={vitals.temperatura} onChange={e => setVitals({...vitals, temperatura: Number(e.target.value)})} /></div>
                                    <div><label className="text-xs text-slate-500">F. Cardíaca</label><input type="number" className="w-full border rounded p-1" value={vitals.fc} onChange={e => setVitals({...vitals, fc: Number(e.target.value)})} /></div>
                                    <div><label className="text-xs text-slate-500">Peso (kg)</label><input type="number" className="w-full border rounded p-1" value={vitals.peso} onChange={e => setVitals({...vitals, peso: Number(e.target.value)})} /></div>
                                    <div><label className="text-xs text-slate-500">Talla (m)</label><input type="number" className="w-full border rounded p-1" value={vitals.talla} onChange={e => setVitals({...vitals, talla: Number(e.target.value)})} /></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center space-x-2 mb-4 text-hospital-600 border-b pb-2">
                                    <FileText size={20} />
                                    <h3 className="font-semibold">Anamnesis y Examen</h3>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">Motivo Consulta</label>
                                        <input required className="mt-1 block w-full border-gray-300 rounded-md border p-2" value={anamnesis.motivo} onChange={e => setAnamnesis({...anamnesis, motivo: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">Examen Físico</label>
                                        <textarea required rows={3} className="mt-1 block w-full border-gray-300 rounded-md border p-2" value={anamnesis.examen} onChange={e => setAnamnesis({...anamnesis, examen: e.target.value})} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center space-x-2 mb-4 text-hospital-600 border-b pb-2">
                                    <FileText size={20} />
                                    <h3 className="font-semibold">Diagnóstico (CIE-10)</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">Código CIE-10</label>
                                        <input required className="mt-1 block w-full border-gray-300 rounded-md border p-2" value={diag.CodigoCIE10} onChange={e => setDiag({...diag, CodigoCIE10: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">Descripción</label>
                                        <input required className="mt-1 block w-full border-gray-300 rounded-md border p-2" value={diag.DescripcionDiagnostico} onChange={e => setDiag({...diag, DescripcionDiagnostico: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700">Tipo</label>
                                        <select className="mt-1 block w-full border-gray-300 rounded-md border p-2" value={diag.TipoDiagnostico} onChange={e => setDiag({...diag, TipoDiagnostico: e.target.value})}>
                                            <option>Presuntivo</option>
                                            <option>Definitivo</option>
                                        </select>
                                    </div>
                                     <div>
                                        <label className="block text-sm font-medium text-slate-700">Clasificación</label>
                                        <select className="mt-1 block w-full border-gray-300 rounded-md border p-2" value={diag.Clasificacion} onChange={e => setDiag({...diag, Clasificacion: e.target.value})}>
                                            <option>Principal</option>
                                            <option>Secundario</option>
                                            <option>Complicacion</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button type="submit" className="bg-hospital-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-hospital-700">
                                    Finalizar Consulta
                                </button>
                            </div>

                        </form>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300 p-12">
                            <Stethoscope size={48} className="mb-4 opacity-50" />
                            <p>Seleccione un paciente de la lista para iniciar la consulta.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
