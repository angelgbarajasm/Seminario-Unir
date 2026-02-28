
import React from 'react';
import { Assessment, EvaluationAI, EvaluationHuman, ControlStatus } from '../types';
// Fix: Added missing ShieldCheck import from lucide-react
import { CheckCircle, Clock, AlertTriangle, FileSearch, ArrowRight, Brain, UserCheck, Zap, Sparkles, MessageCircle, Calculator, Scale, ShieldCheck } from 'lucide-react';

interface Props {
  assessment: Assessment;
  aiEvaluations: Record<string, EvaluationAI>;
  humanEvaluations: Record<string, EvaluationHuman>;
  onReviewControl: (id: string) => void;
}

const AssessmentDashboard: React.FC<Props> = ({ assessment, aiEvaluations, humanEvaluations, onReviewControl }) => {
  
  const getStatusIcon = (status: ControlStatus) => {
    switch (status) {
      case ControlStatus.Compliant: return <CheckCircle className="text-green-500" size={18} />;
      case ControlStatus.PartiallyCompliant: return <Clock className="text-amber-500" size={18} />;
      case ControlStatus.NonCompliant: return <AlertTriangle className="text-red-500" size={18} />;
      case ControlStatus.InsufficientEvidence: return <FileSearch className="text-slate-400" size={18} />;
      default: return <Clock className="text-slate-300" size={18} />;
    }
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

  const scoring = assessment.scoring;
  const validatedCount = Object.keys(humanEvaluations).filter(k => k.startsWith(assessment.id)).length;

  return (
    <div className="space-y-6">
      {/* Resumen de Scoring y Kappa */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
              <Calculator size={24} />
           </div>
           <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score de Riesgo</div>
              <div className="text-2xl font-black text-slate-900">
                 {scoring ? (scoring.globalScoreHuman * 100).toFixed(1) : '0.0'}%
              </div>
           </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
              <Scale size={24} />
           </div>
           <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Índice Kappa (Concordancia)</div>
              <div className="flex items-baseline gap-2">
                 <div className="text-2xl font-black text-slate-900">
                    {scoring ? scoring.kappa.toFixed(3) : '0.000'}
                 </div>
                 <span className="text-[9px] font-bold text-indigo-500 uppercase">{scoring?.kappaInterpretation}</span>
              </div>
           </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl shadow-lg flex items-center gap-4 text-white">
           <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-blue-400 shrink-0">
              <ShieldCheck size={24} />
           </div>
           <div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado de Decisión</div>
              <div className="text-sm font-black text-blue-400 uppercase">
                 {scoring?.decision.decision.replace('_', ' ') ?? 'EN PROCESO'}
              </div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
             Controles en Alcance
             <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">
                {assessment.scope.controls.length}
             </span>
          </h3>
          <div className="text-[10px] text-slate-400 font-black tracking-widest uppercase flex items-center gap-4">
             <div className="flex items-center gap-1"><Zap size={10} className="text-blue-500" /> IA</div>
             <div className="flex items-center gap-1"><Sparkles size={10} className="text-indigo-500" /> HUMANO</div>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {assessment.scope.controls.map(control => {
            const aiEval = aiEvaluations[`${assessment.id}_${control.id}`];
            const humanEval = humanEvaluations[`${assessment.id}_${control.id}`];
            const isHybrid = !!humanEval;
            const needsValidation = aiEval && !humanEval;
            
            return (
              <div key={control.id} className={`p-4 hover:bg-slate-50 transition group flex flex-col md:flex-row md:items-center gap-4 ${isHybrid ? 'border-l-4 border-l-green-500' : (needsValidation ? 'border-l-4 border-l-blue-400 animate-pulse-slow' : 'border-l-4 border-l-transparent')}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-tighter border border-slate-200">{control.domain}</span>
                    <span className="text-sm font-bold text-slate-900">{control.id}: {control.name}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">{control.description}</p>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-center">
                    <div className="text-[8px] uppercase font-black text-slate-400 mb-1 tracking-widest">IA</div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border min-w-[130px] transition-all ${aiEval ? 'bg-slate-900 border-slate-800 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-40'}`}>
                      {aiEval ? (
                        <>
                          <div className="shrink-0">{getStatusIcon(aiEval.status)}</div>
                          <span className="text-[10px] font-black text-white truncate">{getStatusLabel(aiEval.status)}</span>
                        </>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300 italic uppercase">PENDIENTE</span>
                      )}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-[8px] uppercase font-black text-slate-400 mb-1 tracking-widest">AUDITOR</div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border min-w-[130px] transition-all ${humanEval ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                      {humanEval ? (
                         <>
                          <div className="shrink-0">{getStatusIcon(humanEval.humanStatus)}</div>
                          <span className="text-[10px] font-black text-green-800 truncate">{getStatusLabel(humanEval.humanStatus)}</span>
                         </>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300 italic uppercase">SIN VALIDAR</span>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => onReviewControl(control.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase transition-all shadow-sm ${needsValidation ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20' : 'bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-400'}`}
                  >
                    {needsValidation ? 'Validar' : 'Entrar'}
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AssessmentDashboard;
