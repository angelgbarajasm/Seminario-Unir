
import React, { useState } from 'react';
import { ThirdParty, Assessment, RiskLevel } from '../types';
import { Search, Plus, Filter, ArrowUpRight, Globe, Building2, ShieldCheck, AlertTriangle } from 'lucide-react';

interface Props {
  providers: ThirdParty[];
  assessments: Assessment[];
  onSelectProvider: (id: string) => void;
  onNewAssessment: () => void;
}

const ProviderList: React.FC<Props> = ({ providers, assessments, onSelectProvider, onNewAssessment }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProviders = providers.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.industry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.High: return 'text-red-600 bg-red-50 border-red-100';
      case RiskLevel.Medium: return 'text-amber-600 bg-amber-50 border-amber-100';
      case RiskLevel.Low: return 'text-green-600 bg-green-50 border-green-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const getRiskLabel = (level: RiskLevel) => {
    switch(level) {
      case RiskLevel.High: return 'ALTO';
      case RiskLevel.Medium: return 'MEDIO';
      case RiskLevel.Low: return 'BAJO';
      default: return 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Inventario de Proveedores</h2>
          <p className="text-slate-500 font-medium">Gestione y supervise todos los terceros incorporados.</p>
        </div>
        <button 
          onClick={onNewAssessment}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95 whitespace-nowrap"
        >
          <Plus size={20} />
          Registrar Nuevo Proveedor
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar por nombre de empresa o industria..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-semibold flex items-center gap-2 hover:bg-slate-50 transition shadow-sm">
          <Filter size={18} />
          Filtros
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredProviders.length > 0 ? (
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Perfil de Empresa</th>
                <th className="px-6 py-4">Estado de Evaluación</th>
                <th className="px-6 py-4">Sensibilidad de Datos</th>
                <th className="px-6 py-4">Criticidad</th>
                <th className="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProviders.map(p => {
                const pAsmts = assessments.filter(a => a.providerId === p.id);
                const isActive = pAsmts.some(a => a.status === 'active');

                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                          <Building2 size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 leading-tight">{p.name}</div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                            <Globe size={12} />
                            {p.country} • {p.industry}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${isActive ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                        {isActive ? <ShieldCheck size={14} /> : <div className="w-2 h-2 rounded-full bg-slate-400" />}
                        {isActive ? 'EVALUACIÓN ACTIVA' : 'SIN AUDITORÍA ACTIVA'}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getRiskColor(p.riskProfile.sensitiveDataLevel)}`}>
                        {getRiskLabel(p.riskProfile.sensitiveDataLevel)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                       {p.riskProfile.criticalService ? (
                         <div className="flex items-center gap-1.5 text-red-600 font-bold text-xs uppercase italic">
                            <AlertTriangle size={14} />
                            Crítico
                         </div>
                       ) : (
                         <span className="text-slate-400 text-xs font-medium uppercase tracking-tight">No Crítico</span>
                       )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        disabled={!isActive}
                        onClick={() => onSelectProvider(p.id)}
                        className={`inline-flex items-center gap-1 px-4 py-2 rounded-lg font-bold transition-all ${isActive ? 'text-blue-600 hover:bg-blue-50' : 'text-slate-300 cursor-not-allowed'}`}
                      >
                        Detalles
                        <ArrowUpRight size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 size={40} className="text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No se encontraron proveedores</h3>
            <p className="text-slate-500 max-w-sm mx-auto mb-8">
              Comience registrando su primer proveedor externo para iniciar el proceso de evaluación de riesgo cibernético.
            </p>
            <button 
              onClick={onNewAssessment}
              className="px-6 py-2.5 border-2 border-slate-200 rounded-xl font-bold text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-all active:scale-95"
            >
              Dar de Alta Primer Proveedor
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderList;
