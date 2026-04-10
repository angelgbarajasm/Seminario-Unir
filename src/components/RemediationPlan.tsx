
import React from 'react';
import { Assessment, ThirdParty, RemediationAction } from '../types';
// Import Brain icon from lucide-react
import { ArrowLeft, Rocket, Calendar, Sparkles, Clock, CheckCircle, Target, Loader2, ShieldAlert, Cpu, Brain, FileText } from 'lucide-react';

interface Props {
  assessment: Assessment;
  provider: ThirdParty;
  plan?: RemediationAction[];
  isGenerating: boolean;
  onGenerate: () => void;
  onBack: () => void;
  onViewReport?: () => void;
}

const RemediationPlan: React.FC<Props> = ({ assessment, provider, plan, isGenerating, onGenerate, onBack, onViewReport }) => {
  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'High': return 'text-red-600 bg-red-50 border-red-100';
      case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-100';
      default: return 'text-blue-600 bg-blue-50 border-blue-100';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500">
      <header className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-full transition border border-slate-100">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
              <Rocket size={24} className="text-indigo-600" />
              Estrategia de Mitigación (ISO/NIST)
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
               <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                 <Sparkles size={12} className="text-blue-500"/> Impulsado por Gemini 3.1 Pro
               </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {onViewReport && plan && (
            <button onClick={onViewReport} className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg bg-slate-900 text-white hover:bg-black transition-all active:scale-95">
              <FileText size={18} /> Ver Reporte Final
            </button>
          )}
          {!plan && !isGenerating && (
            <button 
              onClick={onGenerate} 
              className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20 transition-all active:scale-95"
            >
              <Target size={18} />
              Generar Plan de Remediación
            </button>
          )}
        </div>
      </header>

      {isGenerating ? (
        <div className="bg-white p-20 rounded-3xl border border-slate-200 shadow-xl text-center space-y-6">
           <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20"></div>
              <div className="relative bg-indigo-600 rounded-full w-20 h-20 flex items-center justify-center text-white shadow-lg">
                 <Brain size={40} className="animate-pulse" />
              </div>
           </div>
           <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">Generando acciones técnicas...</h3>
              <p className="text-slate-400 text-sm animate-pulse font-medium italic">Gemini está analizando brechas frente a ISO 27001 y NIST SP 800-53</p>
           </div>
        </div>
      ) : !plan ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-8">
           <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600">
              <ShieldAlert size={40} />
           </div>
           <div className="max-w-md mx-auto space-y-3">
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Análisis de Brechas Pendiente</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                El motor de IA analizará los controles con hallazgos negativos y sugerirá una hoja de ruta técnica para el cumplimiento total.
                <span className="block mt-2 text-indigo-600 text-xs font-black uppercase tracking-tight italic">Basado en mejores prácticas internacionales</span>
              </p>
           </div>
           <button 
             onClick={onGenerate} 
             className="px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl bg-slate-900 text-white hover:bg-black transition-all active:scale-95"
           >
             Solicitar Hoja de Ruta Gemini
           </button>
        </div>
      ) : plan.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
                <div className="text-[10px] font-black text-slate-500 uppercase mb-1">Hallazgos Identificados</div>
                <div className="text-4xl font-black">{plan.length}</div>
             </div>
             <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Prioridad Crítica</div>
                <div className="text-4xl font-black text-red-600">{plan.filter(p => p.priority === 'High').length}</div>
             </div>
             <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-lg">
                <div className="text-[10px] font-black text-indigo-200 uppercase mb-1">Costo de Mitigación</div>
                <div className="text-4xl font-black">Estimado</div>
             </div>
          </div>

          <div className="space-y-4 mt-4">
            {plan.map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all flex flex-col md:flex-row gap-6 group">
                 <div className="shrink-0">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black group-hover:bg-indigo-50 group-hover:text-indigo-600 transition">
                       {item.controlId}
                    </div>
                 </div>
                 <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                       <h4 className="font-bold text-slate-900 text-lg tracking-tight">{item.controlName}</h4>
                       <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                       </span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 group-hover:border-indigo-100 transition">
                       <p className="text-slate-700 text-sm font-semibold mb-1">Acción Técnica Sugerida:</p>
                       <p className="text-slate-600 text-sm font-medium leading-relaxed italic">
                          "{item.action}"
                       </p>
                    </div>
                 </div>
                 <div className="md:w-48 shrink-0 flex flex-col justify-center border-l border-slate-100 md:pl-6">
                    <div className="text-[9px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1">
                       <Clock size={10} /> Plazo Máximo Sugerido
                    </div>
                    <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                       <Calendar size={14} className="text-indigo-600" />
                       {item.deadline}
                    </div>
                    <div className="mt-4">
                       <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Esfuerzo</div>
                       <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded uppercase">{item.estimatedEffort}</span>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-6">
           <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600">
              <CheckCircle size={32} />
           </div>
           <h3 className="text-xl font-bold text-slate-800">Cumplimiento Total</h3>
           <p className="text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">
             No se han identificado brechas críticas que requieran un plan de remediación en este momento.
           </p>
        </div>
      )}
    </div>
  );
};

export default RemediationPlan;
