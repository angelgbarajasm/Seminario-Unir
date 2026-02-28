
import React, { useState } from 'react';
import { ThirdParty, ProviderType, RiskLevel } from '../types';

interface Props {
  onSubmit: (tp: ThirdParty) => void;
}

const ProviderForm: React.FC<Props> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    industry: '',
    contractType: '',
    providerType: ProviderType.SaaS,
    criticalService: false,
    sensitiveDataLevel: RiskLevel.Medium,
    personalDataProcessing: false,
    networkIntegration: false,
    operationalDependency: RiskLevel.Low
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tp: ThirdParty = {
      id: `tp-${Date.now()}`,
      assessmentDate: new Date().toISOString(),
      ...formData,
      riskProfile: {
        criticalService: formData.criticalService,
        sensitiveDataLevel: formData.sensitiveDataLevel,
        personalDataProcessing: formData.personalDataProcessing,
        networkIntegration: formData.networkIntegration,
        operationalDependency: formData.operationalDependency
      }
    };
    onSubmit(tp);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Alta de Proveedor</h2>
        <p className="text-slate-500">Complete la información general y el perfil de riesgo para generar el alcance de la evaluación.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase text-slate-400 tracking-wider">Información General</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Empresa</label>
            <input 
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="p.ej. Acme Corp"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">País</label>
            <input 
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={formData.country}
              onChange={e => setFormData({...formData, country: e.target.value})}
              placeholder="p.ej. España"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Industria</label>
            <input 
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={formData.industry}
              onChange={e => setFormData({...formData, industry: e.target.value})}
              placeholder="p.ej. Fintech"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Proveedor</label>
            <select 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={formData.providerType}
              onChange={e => setFormData({...formData, providerType: e.target.value as ProviderType})}
            >
              {Object.values(ProviderType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase text-slate-400 tracking-wider">Perfil de Riesgo</h3>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:bg-slate-100 transition">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" 
                checked={formData.criticalService}
                onChange={e => setFormData({...formData, criticalService: e.target.checked})}
              />
              <span className="text-sm font-medium text-slate-700">Servicio Crítico</span>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:bg-slate-100 transition">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" 
                checked={formData.personalDataProcessing}
                onChange={e => setFormData({...formData, personalDataProcessing: e.target.checked})}
              />
              <span className="text-sm font-medium text-slate-700">Tratamiento de Datos Personales</span>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:bg-slate-100 transition">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" 
                checked={formData.networkIntegration}
                onChange={e => setFormData({...formData, networkIntegration: e.target.checked})}
              />
              <span className="text-sm font-medium text-slate-700">Integración de Red</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nivel de Sensibilidad de Datos</label>
            <div className="flex gap-2">
              {[RiskLevel.Low, RiskLevel.Medium, RiskLevel.High].map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({...formData, sensitiveDataLevel: level})}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${formData.sensitiveDataLevel === level ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  {level === RiskLevel.Low ? 'Bajo' : level === RiskLevel.Medium ? 'Medio' : 'Alto'}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="pt-6 border-t border-slate-100 flex justify-end">
        <button 
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95"
        >
          Iniciar Evaluación
        </button>
      </div>
    </form>
  );
};

export default ProviderForm;
