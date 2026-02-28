
import React from 'react';
import { Assessment, ThirdParty, EvaluationAI, EvaluationHuman, ControlStatus, RemediationAction } from '../types';
import { ShieldCheck, FileText, ChevronLeft, Printer, Calculator, PieChart, BarChart4, TrendingUp, Info, Rocket, Calendar } from 'lucide-react';
import { STATUS_VALUES } from '../constants';

interface Props {
  assessment: Assessment;
  provider: ThirdParty;
  aiEvaluations: Record<string, EvaluationAI>;
  humanEvaluations: Record<string, EvaluationHuman>;
  onBack: () => void;
}

const FinalReport: React.FC<Props> = ({ assessment, provider, aiEvaluations, humanEvaluations, onBack }) => {
  if (!assessment.scoring) return null;

  const handlePrint = () => {
    window.print();
  };

  const getStatusLabel = (status: ControlStatus) => {
    switch(status) {
      case ControlStatus.Compliant: return 'COMPLIANT';
      case ControlStatus.PartiallyCompliant: return 'PARTIALLY';
      case ControlStatus.NonCompliant: return 'NON-COMPLIANT';
      case ControlStatus.InsufficientEvidence: return 'INSUFFICIENT';
      default: return 'PENDING';
    }
  };

  const remediationPlan = assessment.remediationPlan || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <header className="flex justify-between items-center print:hidden">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-xs uppercase tracking-widest">
          <ChevronLeft size={16} /> Volver a Evaluación
        </button>
        <button onClick={handlePrint} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition">
          <Printer size={18} /> Imprimir / PDF
        </button>
      </header>

      <div className="bg-white p-12 rounded-3xl shadow-2xl border border-slate-100 print:shadow-none print:border-none print:p-0">
        <div className="border-b-4 border-slate-900 pb-12 mb-12 flex justify-between items-start">
           <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest mb-6">
                 TPRM-IA Final Audit Report
              </div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">Informe de Evaluación de Ciber-riesgo</h1>
              <p className="text-xl text-slate-500 font-medium">Proveedor: <span className="text-slate-900 font-bold">{provider.name}</span></p>
              <p className="text-sm text-slate-400 font-mono mt-1">ID Evaluación: {assessment.id}</p>
           </div>
           <div className="text-right">
              <div className="text-sm font-black text-slate-900 uppercase tracking-widest">Fecha Informe</div>
              <div className="text-lg font-bold text-slate-500">{new Date().toLocaleDateString()}</div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
           <section>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <ShieldCheck size={18} className="text-blue-600"/> Perfil de Riesgo Corporativo
              </h3>
              <div className="space-y-4">
                 <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-sm font-bold text-slate-500 uppercase">Industria</span>
                    <span className="text-sm font-black text-slate-900">{provider.industry}</span>
                 </div>
                 <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-sm font-bold text-slate-500 uppercase">Tipo Servicio</span>
                    <span className="text-sm font-black text-slate-900">{provider.providerType}</span>
                 </div>
                 <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-sm font-bold text-slate-500 uppercase">Criticidad</span>
                    <span className={`text-sm font-black ${provider.riskProfile.criticalService ? 'text-red-600' : 'text-slate-900'}`}>{provider.riskProfile.criticalService ? 'CRÍTICO' : 'NORMAL'}</span>
                 </div>
                 <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-sm font-bold text-slate-500 uppercase">Sensibilidad Datos</span>
                    <span className="text-sm font-black text-slate-900">{provider.riskProfile.sensitiveDataLevel}</span>
                 </div>
              </div>
           </section>

           <section className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl">
              <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <TrendingUp size={18}/> Resultado de Decisión IA-Híbrida
              </h3>
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <div className="text-[10px] font-black text-slate-500 uppercase mb-1">Score Global Final</div>
                    <div className="text-5xl font-black text-blue-400">{(assessment.scoring.globalScoreHuman * 100).toFixed(1)}%</div>
                 </div>
                 <div className="text-right">
                    <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase border-2 ${assessment.scoring.decision.decision === 'APPROVE' ? 'bg-green-500/10 border-green-500/40 text-green-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                       {assessment.scoring.decision.decision}
                    </div>
                 </div>
              </div>
              <p className="text-sm font-medium italic text-slate-300 leading-relaxed">"{assessment.scoring.decision.rationale}"</p>
           </section>
        </div>

        <div className="mb-16">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
              <PieChart size={18} className="text-blue-600"/> Métricas Estadísticas de Validación
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                 <div className="text-[9px] font-black text-slate-400 uppercase mb-2">Kappa (Cohen)</div>
                 <div className="text-2xl font-black text-slate-900">{assessment.scoring.kappa.toFixed(2)}</div>
                 <div className="text-[8px] font-bold text-blue-600 uppercase mt-1">{assessment.scoring.kappaInterpretation}</div>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                 <div className="text-[9px] font-black text-slate-400 uppercase mb-2">Consistencia Simple</div>
                 <div className="text-2xl font-black text-slate-900">{(assessment.scoring.averageAgreement * 100).toFixed(0)}%</div>
                 <div className="text-[8px] font-bold text-slate-500 uppercase mt-1">Concordancia Total</div>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                 <div className="text-[9px] font-black text-slate-400 uppercase mb-2">Acuerdo Esperado (Pe)</div>
                 <div className="text-2xl font-black text-slate-900">{assessment.scoring.pe.toFixed(2)}</div>
                 <div className="text-[8px] font-bold text-slate-500 uppercase mt-1">Azar Estadístico</div>
              </div>
              <div className="p-6 bg-indigo-600 rounded-2xl text-white shadow-lg text-center">
                 <div className="text-[9px] font-black text-indigo-200 uppercase mb-2">Reducción Tiempo</div>
                 <div className="text-2xl font-black">+{(assessment.scoring.efficiency.reductionPercentage * 100).toFixed(0)}%</div>
                 <div className="text-[8px] font-bold text-indigo-300 uppercase mt-1">Efficiency Boost</div>
              </div>
           </div>
        </div>

        {remediationPlan.length > 0 && (
          <div className="mb-16">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Rocket size={18} className="text-indigo-600"/> Mitigación Estratégica Sugerida
             </h3>
             <div className="space-y-4">
                {remediationPlan.map((plan, idx) => (
                   <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                         <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-black bg-slate-900 text-white px-2 py-0.5 rounded uppercase">{plan.controlId}</span>
                            <h4 className="text-sm font-bold text-slate-900">{plan.controlName}</h4>
                         </div>
                         <p className="text-xs text-slate-600 font-medium italic">"{plan.action}"</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                         <div className="text-right">
                            <div className="text-[8px] font-black text-slate-400 uppercase">Prioridad</div>
                            <div className="text-xs font-black text-indigo-600 uppercase">{plan.priority}</div>
                         </div>
                         <div className="text-right">
                            <div className="text-[8px] font-black text-slate-400 uppercase">Plazo</div>
                            <div className="text-xs font-black text-slate-800 uppercase">{plan.deadline}</div>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}

        <div className="mb-16">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Detalle de Controles por Dominio</h3>
           <div className="overflow-hidden border border-slate-200 rounded-2xl">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase">
                    <tr>
                       <th className="px-6 py-4">ID Control</th>
                       <th className="px-6 py-4">Status IA</th>
                       <th className="px-6 py-4">Status Humano</th>
                       <th className="px-6 py-4 text-center">Acuerdo</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 text-sm">
                    {assessment.scope.controls.map(ctrl => {
                       const ai = aiEvaluations[`${assessment.id}_${ctrl.id}`];
                       const hum = humanEvaluations[`${assessment.id}_${ctrl.id}`];
                       return (
                          <tr key={ctrl.id}>
                             <td className="px-6 py-4 font-bold text-slate-800">{ctrl.id} - {ctrl.name}</td>
                             <td className="px-6 py-4 text-[10px] font-bold text-blue-600 uppercase">{ai ? getStatusLabel(ai.status) : 'N/A'}</td>
                             <td className="px-6 py-4 text-[10px] font-bold text-indigo-600 uppercase">{hum ? getStatusLabel(hum.humanStatus) : 'IA ASISTIDO'}</td>
                             <td className="px-6 py-4 text-center font-mono text-xs">
                                {hum ? hum.agreementIndex.toFixed(2) : '1.00'}
                             </td>
                          </tr>
                       );
                    })}
                 </tbody>
              </table>
           </div>
        </div>

        <div className="p-12 bg-slate-50 rounded-3xl border border-slate-200">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Calculator size={18}/> Fundamento Matemático (Anexo B)
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[11px] font-mono text-slate-600">
              <div className="space-y-4">
                 <div className="p-4 bg-white rounded-xl border border-slate-100">
                    <div className="font-bold text-slate-900 mb-1">F1: Sc = Vc × Wc</div>
                    <p>Cálculo del cumplimiento individual por control ponderado por criticidad.</p>
                 </div>
                 <div className="p-4 bg-white rounded-xl border border-slate-100">
                    <div className="font-bold text-slate-900 mb-1">F2: Sd = ΣSc / ΣWc</div>
                    <p>Agregación de resultados a nivel de dominios de seguridad.</p>
                 </div>
              </div>
              <div className="space-y-4">
                 <div className="p-4 bg-white rounded-xl border border-slate-100">
                    <div className="font-bold text-slate-900 mb-1">F3: Sg = Σ(Sd × Wd) / ΣWd</div>
                    <p>Puntuación global normalizada de la evaluación del tercero.</p>
                 </div>
                 <div className="p-4 bg-white rounded-xl border border-slate-100">
                    <div className="font-bold text-slate-900 mb-1">K: (Po - Pe) / (1 - Pe)</div>
                    <p>Concordancia estadística corregida por azar entre IA y Humano.</p>
                 </div>
              </div>
           </div>
        </div>

        <footer className="mt-16 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">
           Fin del Informe Auditable • TPRM AI Assistant MVP
        </footer>
      </div>
    </div>
  );
};

export default FinalReport;
