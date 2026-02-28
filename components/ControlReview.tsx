
import React, { useState, useEffect, useRef } from 'react';
import { ControlDefinition, Assessment, EvidenceChunk, EvaluationAI, EvaluationHuman, ControlStatus } from '../types';
// Fix: Correctly point to gemini service instead of legacy or local providers
import { evaluateControlWithRAG } from '../services/gemini';
import { calculateControlScore, calculateConsistencyIndex, calculateConfidenceAdjustedScore } from '../services/scoring';
import { STATUS_VALUES } from '../constants';
import { Brain, UserCheck, ShieldCheck, Quote, AlertCircle, Loader2, BarChart3, CheckCircle2, MessageSquare, Info, ShieldAlert, XCircle, Timer, Cpu } from 'lucide-react';

interface Props {
  control: ControlDefinition;
  assessment: Assessment;
  chunks: EvidenceChunk[];
  aiEvaluation?: EvaluationAI;
  humanEvaluation?: EvaluationHuman;
  onBack: () => void;
  onSaveAI: (e: EvaluationAI) => void;
  onSaveHuman: (e: EvaluationHuman) => void;
}

const ControlReview: React.FC<Props> = ({ 
  control, assessment, chunks, aiEvaluation, humanEvaluation, onBack, onSaveAI, onSaveHuman 
}) => {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  
  const [humanDecision, setHumanDecision] = useState<ControlStatus>(humanEvaluation?.humanStatus || aiEvaluation?.status || ControlStatus.Pending);
  const [humanJustification, setHumanJustification] = useState(humanEvaluation?.humanJustification || '');
  const [humanComment, setHumanComment] = useState(humanEvaluation?.comment || '');
  
  const [reviewTimer, setReviewTimer] = useState(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setReviewTimer(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRunAI = async () => {
    setIsEvaluating(true);
    try {
      const result = await evaluateControlWithRAG(control, chunks);
      const score = calculateControlScore(result.status as ControlStatus, control.weight);
      
      const enrichedAI: EvaluationAI = {
        ...result,
        value: STATUS_VALUES[result.status as ControlStatus],
        score,
        adjustedScore: calculateConfidenceAdjustedScore(score, result.confidence)
      } as EvaluationAI;
      
      onSaveAI(enrichedAI);
      if (humanDecision === ControlStatus.Pending) setHumanDecision(result.status as ControlStatus);
    } catch (error) {
      console.error("Error en evaluación IA Gemini:", error);
      alert("Error al conectar con Gemini API.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleAcceptAI = () => {
    if (!aiEvaluation) return;
    setHumanDecision(aiEvaluation.status);
    setHumanJustification(`[ACEPTADO IA GEMINI] ${aiEvaluation.justification}`);
    setShowErrors(false);
  };

  const validate = () => {
    const hasDecision = humanDecision !== ControlStatus.Pending;
    const hasJustification = humanJustification.trim().length > 10;
    return { hasDecision, hasJustification, isValid: hasDecision && hasJustification };
  };

  const handleSaveHuman = () => {
    const { isValid } = validate();
    if (!isValid) {
      setShowErrors(true);
      return;
    }
    setIsSaving(true);
    const reviewDuration = Date.now() - startTimeRef.current;
    
    setTimeout(() => {
      const consistency = calculateConsistencyIndex(aiEvaluation?.status || ControlStatus.Pending, humanDecision);
      const score = calculateControlScore(humanDecision, control.weight);

      const evaluation: EvaluationHuman = {
        controlId: control.id,
        aiStatus: aiEvaluation?.status || ControlStatus.Pending,
        humanStatus: humanDecision,
        humanValue: STATUS_VALUES[humanDecision],
        justification: aiEvaluation?.justification || 'Sin justificación IA',
        humanJustification: humanJustification,
        comment: humanComment,
        deltaFlag: aiEvaluation?.status !== humanDecision,
        agreementIndex: consistency,
        score,
        timestamp: new Date().toISOString(),
        reviewTimeMs: reviewDuration 
      };
      
      onSaveHuman(evaluation);
      onBack();
    }, 400);
  };

  const getStatusLabel = (status: ControlStatus) => {
    switch(status) {
      case ControlStatus.Compliant: return 'CUMPLE';
      case ControlStatus.PartiallyCompliant: return 'CUMPLE PARCIAL';
      case ControlStatus.NonCompliant: return 'NO CUMPLE';
      case ControlStatus.InsufficientEvidence: return 'EVIDENCIA INSUF.';
      default: return 'PENDIENTE';
    }
  };

  const { hasDecision, hasJustification } = validate();
  const isDelta = aiEvaluation && aiEvaluation.status !== humanDecision && humanDecision !== ControlStatus.Pending;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
        <div>
          <button onClick={onBack} className="text-slate-400 hover:text-slate-800 text-xs font-black uppercase tracking-widest mb-1 flex items-center gap-1 group">
             &larr; Dashboard
          </button>
          <h2 className="text-2xl font-black flex items-center gap-2">
            <span className="text-blue-600">{control.id}:</span> {control.name}
          </h2>
          <div className="flex items-center gap-3 mt-1">
             <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{control.domain} • Peso: {control.weight.toFixed(2)}</p>
             <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black border border-blue-100">
                <Timer size={10} /> {reviewTimer}s registrados
             </div>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button disabled={isEvaluating || chunks.length === 0 || isSaving} onClick={handleRunAI} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold transition shadow-sm border ${isEvaluating ? 'bg-slate-100 text-slate-400 border-slate-100' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300'}`}>
            {isEvaluating ? <Loader2 className="animate-spin" size={18} /> : <Brain size={18} />} Analizar con Gemini
          </button>
          <button disabled={isSaving} onClick={handleSaveHuman} className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${isSaving ? 'bg-indigo-600 scale-95' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'}`}>
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />} Guardar Validación
          </button>
        </div>
      </header>

      {showErrors && (!hasDecision || !hasJustification) && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-800 animate-in shake duration-500">
          <XCircle size={20} className="shrink-0" />
          <p className="text-sm font-bold">Campos obligatorios pendientes (*)</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Requisito Técnico</h3>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 font-medium italic text-sm leading-relaxed"> "{control.description}" </div>
          </div>

          <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"> <Brain size={120} /> </div>
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-blue-400 font-black uppercase text-[10px] tracking-widest flex items-center gap-2"> <ShieldAlert size={16} /> Propuesta IA (Gemini 3.1) </h3>
                   {aiEvaluation && (
                     <button onClick={handleAcceptAI} className="text-[10px] font-black bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-full transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95"> <CheckCircle2 size={12} /> Adoptar Proposición </button>
                   )}
                </div>
                {aiEvaluation ? (
                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <div className={`px-4 py-1.5 rounded-lg font-black text-xs uppercase shadow-sm border ${aiEvaluation.status === ControlStatus.Compliant ? 'bg-green-500/20 border-green-500/30 text-green-300' : 'bg-amber-500/20 border-amber-500/30 text-amber-300'}`}> {getStatusLabel(aiEvaluation.status)} </div>
                         <div className="text-right">
                            <div className="text-[10px] text-slate-400 uppercase font-black tracking-tight">Confianza IA</div>
                            <div className="text-2xl font-black font-mono">{(aiEvaluation.confidence * 100).toFixed(0)}%</div>
                         </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase"> <MessageSquare size={12} /> Justificación del Modelo </div>
                        <p className="text-sm leading-relaxed text-slate-200 font-medium italic"> {aiEvaluation.justification} </p>
                      </div>
                      {aiEvaluation.citations.length > 0 && (
                        <div className="pt-4 border-t border-white/10">
                           <div className="text-[10px] font-bold text-blue-400 uppercase mb-3">Evidencia Extraída</div>
                           <div className="space-y-2">
                              {aiEvaluation.citations.map((cite, i) => (
                                <div key={i} className="text-xs bg-black/40 p-3 rounded-xl border border-white/5 text-blue-100 italic"> "{cite}" </div>
                              ))}
                           </div>
                        </div>
                      )}
                   </div>
                ) : ( <div className="text-center py-16 opacity-30"> <Brain className="mx-auto mb-2" size={48} /> <p className="text-sm uppercase font-black">IA No Ejecutada</p> </div> )}
             </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"> <UserCheck size={120} /> </div>
            <div className="relative z-10 flex flex-col h-full">
               <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-8 flex items-center gap-2"> <UserCheck size={18} /> Juicio del Auditor Humano </h3>
               <div className="space-y-8 flex-1">
                  <div className={`p-5 rounded-2xl border transition-colors ${showErrors && !hasDecision ? 'bg-red-50 border-red-200' : 'bg-indigo-50/30 border-indigo-100'}`}>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-indigo-800 mb-4"> Estado Final Definitivo * </label>
                    <div className="grid grid-cols-2 gap-3">
                       {[ControlStatus.Compliant, ControlStatus.PartiallyCompliant, ControlStatus.NonCompliant, ControlStatus.InsufficientEvidence].map(status => (
                          <button key={status} onClick={() => { setHumanDecision(status); if (showErrors) setShowErrors(false); }} className={`px-3 py-4 rounded-xl text-[10px] font-black border transition-all ${humanDecision === status ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-[1.02]' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-400'}`}> {getStatusLabel(status)} </button>
                       ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                     <div>
                        <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2"> <span>Justificación Técnica de Auditoría *</span> </label>
                        <textarea className={`w-full h-40 px-4 py-3 bg-white border rounded-xl focus:ring-4 outline-none transition text-sm font-medium ${showErrors && !hasJustification ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:ring-indigo-100'}`} placeholder="Explique su decisión basándose en la evidencia contrastada..." value={humanJustification} onChange={e => { setHumanJustification(e.target.value); if (showErrors) setShowErrors(false); }} />
                     </div>
                  </div>
                  {aiEvaluation && (
                     <div className="mt-auto pt-6 border-t border-slate-100 flex gap-4">
                        <div className={`flex-1 p-4 rounded-xl border ${isDelta ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                           <div className="text-[9px] font-black uppercase text-slate-400">Estado Delta</div>
                           <div className={`text-sm font-bold ${isDelta ? 'text-amber-700' : 'text-green-700'}`}> {isDelta ? 'Diferencia de Criterio' : 'Acuerdo IA/Human'} </div>
                        </div>
                        <div className="flex-1 p-4 rounded-xl border border-slate-100 bg-slate-50">
                           <div className="text-[9px] font-black uppercase text-slate-400">Consistencia</div>
                           <div className="text-xl font-black text-slate-900 font-mono"> {(calculateConsistencyIndex(aiEvaluation.status, humanDecision) * 100).toFixed(0)}% </div>
                        </div>
                     </div>
                  )}
               </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ControlReview;
