
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/mockDb';
import { Database, ShieldCheck, PlayCircle, Loader2, CheckCircle2 } from 'lucide-react';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'backups' | 'audits'>('audits');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [refresh, setRefresh] = useState(0); 

  useEffect(() => {
      const loadAudits = async () => {
          if (activeTab === 'audits') {
              const logs = await dbService.getAuditLog();
              setAuditLogs(logs);
          }
      };
      loadAudits();
  }, [activeTab, refresh]);

  const handleRunBackup = (id: string) => {
      dbService.runBackup(id);
      setRefresh(prev => prev + 1);
  };

  // Mock jobs for UI (API doesn't list jobs yet)
  const backupJobs = [
    { id: '1', name: 'SIGHC_Backup_Completo_Semanal', type: 'Full', lastRun: '2025-10-26 02:00:00', status: 'Success' },
    { id: '2', name: 'SIGHC_Backup_Diferencial_Diario', type: 'Differential', lastRun: '2025-10-27 02:00:00', status: 'Success' },
    { id: '3', name: 'SIGHC_Backup_TransactionLog', type: 'Log', lastRun: '2025-10-27 10:15:00', status: 'Success' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          className={`pb-2 px-4 ${activeTab === 'audits' ? 'border-b-2 border-hospital-600 text-hospital-600 font-medium' : 'text-slate-500'}`}
          onClick={() => setActiveTab('audits')}
        >
          Logs de Auditoría (AuditLog)
        </button>
        <button
          className={`pb-2 px-4 ${activeTab === 'backups' ? 'border-b-2 border-hospital-600 text-hospital-600 font-medium' : 'text-slate-500'}`}
          onClick={() => setActiveTab('backups')}
        >
          SQL Agent Jobs (Backups)
        </button>
      </div>

      {activeTab === 'audits' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                 <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                     <ShieldCheck size={18}/> Tabla Inmutable AuditLog
                 </h3>
                 <span className="text-xs text-slate-400">Registros recientes (Top 100)</span>
             </div>
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha/Hora</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tabla</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operación</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalle (JSON)</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {auditLogs.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No hay registros de auditoría o conexión fallida.</td></tr>
                        ) : (
                            auditLogs.map(log => (
                                <tr key={log.IdAudit}>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">{new Date(log.FechaHora).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.TablaAfectada}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.Operacion === 'INSERT' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {log.Operacion}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.UsuarioNombre}</td>
                                    <td className="px-6 py-4 text-xs text-gray-500 font-mono max-w-xs truncate">{log.ValoresNuevos || log.ValoresAnteriores}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
             </div>
        </div>
      )}

      {activeTab === 'backups' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-700 mb-6 flex items-center gap-2">
                  <Database size={20} className="text-hospital-600"/>
                  SQL Server Agent Jobs
              </h3>
              <div className="grid gap-4">
                  {backupJobs.map(job => (
                      <div key={job.id} className="border border-slate-200 rounded-lg p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div>
                              <p className="font-medium text-slate-800">{job.name}</p>
                              <div className="flex items-center gap-4 mt-1">
                                  <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded">{job.type}</span>
                                  <span className="text-xs text-slate-500">Last Run: {job.lastRun}</span>
                              </div>
                          </div>
                          <div className="flex items-center gap-4">
                                {job.status === 'Running' ? (
                                    <span className="flex items-center gap-2 text-blue-600 text-sm font-medium">
                                        <Loader2 size={16} className="animate-spin"/> Running...
                                    </span>
                                ) : job.status === 'Success' ? (
                                    <span className="flex items-center gap-2 text-green-600 text-sm font-medium">
                                        <CheckCircle2 size={16}/> Success
                                    </span>
                                ) : (
                                    <span className="text-slate-400 text-sm">Idle</span>
                                )}
                                <button 
                                    onClick={() => handleRunBackup(job.id)}
                                    disabled={job.status === 'Running'}
                                    className="p-2 text-hospital-600 hover:bg-hospital-100 rounded-full disabled:opacity-50"
                                    title="Ejecutar Job Manualmente"
                                >
                                    <PlayCircle size={24} />
                                </button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
}
