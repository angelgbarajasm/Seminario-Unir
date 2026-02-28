
import React, { useState } from 'react';
import { ThirdParty, ControlDefinition } from '../types';
import { Brain, ShieldPlus, ChevronRight, CheckCircle2, Loader2, Sparkles, Info, BookOpen, ListChecks } from 'lucide-react';

interface Props {
  provider: ThirdParty;
  suggestions: any[];
  isLoading: boolean;
  baseControlCount: number;
  onFinalize: (selected: ControlDefinition[]) => void;
  onBack: () => void;
}

const IAScopeSuggestions: React.FC<Props> = ({ provider, suggestions, isLoading, baseControlCount, onFinalize, onBack }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleFinalize = () => {
    const selectedControls: ControlDefinition[] = suggestions
      .filter(s => selectedIds.includes(s.id))
      .map(s => ({
        id: s.id,
        domain: s.domain,
        name: s.name,
        description: s.description,
        weight: 1.0 // Peso base para controles suplementarios
      }));
    onFinalize(selectedControls);
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
       <header className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-black uppercase tracking-widest mb-4">
             <Sparkles size={14} />
             IA Scoping Overlay (Beta)
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-2">Definición de Alcance Inteligente</h2>
          <p className="text-slate-500 max-w-2xl mx-auto font-medium">
             Basado en el perfil de <strong>{provider.name}</strong>, el agente ha analizado riesgos específicos y propone los siguientes controles adicionales.
          </p>
       </header>

       {isLoading ? (
          <div className="bg-white p-20 rounded-3xl border border-slate-200 shadow-xl text-center space-y-6">
             <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
                <div className="relative bg-blue-600 rounded-full w-20 h-20 flex items-center justify-center text-white shadow-lg">
                   <Brain size={40} className="animate-pulse" />
                </div>
             </div>
             <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-800">Analizando Riesgos con IA...</h3>
                <p className="text-slate-400 text-sm animate-pulse">Consultando catálogos ISO 27001 y NIST SP 800-53...</p>
             </div>
          </div>
       ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between px-2">
                   <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
                      <BookOpen size={16} className="text-blue-600" />
                      Sugerencias del Agente (ISO/NIST)
                   </h3>
                   <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                      <span className="text-[10px] font-black text-blue-700 uppercase tracking-tight">{suggestions.length} Controles identificados</span>
                   </div>
                </div>

                <div className="space-y-4">
                   {suggestions.map((s) => (
                      <div 
                        key={s.id}
                        onClick={() => toggleSelection(s.id)}
                        className={`group relative p-6 bg-white rounded-2xl border-2 transition-all cursor-pointer ${selectedIds.includes(s.id) ? 'border-blue-500 shadow-blue-500/10 shadow-xl bg-blue-50/20' : 'border-slate-100 hover:border-slate-200 shadow-sm'}`}
                      >
                         <div className="flex items-start gap-4">
                            <div className={`mt-1 p-2 rounded-lg transition ${selectedIds.includes(s.id) ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                               <ShieldPlus size={20} />
                            </div>
                            <div className="flex-1">
                               <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{s.standard}</span>
                                  <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition">{s.id}: {s.name}</h4>
                               </div>
                               <p className="text-sm text-slate-600 font-medium mb-3 leading-relaxed">{s.description}</p>
                               <div className="flex items-center gap-2 p-3 bg-white border border-slate-100 rounded-xl">
                                  <Info size={14} className="text-amber-500 shrink-0" />
                                  <p className="text-[11px] text-slate-500 font-medium leading-tight">
                                     <span className="font-black text-slate-700 uppercase mr-1">Riesgo Mitigado:</span>
                                     {s.reason}
                                  </p>
                               </div>
                            </div>
                            <div className={`shrink-0 w-6 h-6 rounded-full border-2 transition flex items-center justify-center ${selectedIds.includes(s.id) ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-200'}`}>
                               {selectedIds.includes(s.id) && <CheckCircle2 size={16} />}
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             <div className="space-y-6">
                <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-5">
                      <ListChecks size={160} />
                   </div>
                   <div className="relative z-10">
                      <h3 className="text-xl font-black mb-8 flex items-center gap-2">
                         <ChevronRight className="text-blue-400" />
                         Cálculo de Alcance
                      </h3>
                      
                      <div className="space-y-6 mb-10">
                         <div className="flex justify-between items-center pb-4 border-b border-white/5">
                            <span className="text-xs text-white/40 font-bold uppercase tracking-widest">Base (Obligatorios)</span>
                            <span className="text-xl font-black font-mono">{baseControlCount}</span>
                         </div>
                         <div className="flex justify-between items-center pb-4 border-b border-white/5">
                            <div className="flex flex-col">
                               <span className="text-xs text-blue-400/60 font-black uppercase tracking-widest">IA Sugeridos</span>
                               <span className="text-[9px] text-slate-500 font-bold italic">Seleccione en la lista &rarr;</span>
                            </div>
                            <div className="text-right">
                               <div className="text-xl font-black font-mono text-blue-400">+{selectedIds.length}</div>
                               <div className="text-[9px] text-slate-500 font-bold">DE {suggestions.length} DISPONIBLES</div>
                            </div>
                         </div>
                         <div className="pt-2">
                            <span className="text-[10px] text-white/30 font-black uppercase tracking-widest block mb-1">Total Final Auditoría</span>
                            <div className="flex items-baseline gap-2">
                               <div className="text-6xl font-black tracking-tighter">{baseControlCount + selectedIds.length}</div>
                               <div className="text-xs font-bold text-slate-500 uppercase">Controles</div>
                            </div>
                         </div>
                      </div>

                      <button 
                        onClick={handleFinalize}
                        disabled={selectedIds.length === 0 && suggestions.length > 0}
                        className={`w-full py-4 rounded-2xl font-black shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${selectedIds.length > 0 || suggestions.length === 0 ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20' : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'}`}
                      >
                         {selectedIds.length > 0 ? 'Confirmar Selección' : 'Continuar con Base'}
                         <ChevronRight size={20} />
                      </button>
                      <button 
                        onClick={onBack}
                        className="w-full mt-6 text-white/30 hover:text-white font-bold text-xs uppercase transition tracking-widest"
                      >
                         &larr; Reajustar Perfil
                      </button>
                   </div>
                </div>

                <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl">
                   <div className="flex gap-3">
                      <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                         Haga clic en las tarjetas de la izquierda para incluir los controles suplementarios en su evaluación. La IA ha detectado riesgos que los controles base podrían no cubrir.
                      </p>
                   </div>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

export default IAScopeSuggestions;
