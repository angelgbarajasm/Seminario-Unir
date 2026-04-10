
import React from 'react';
import { Assessment, EvaluationAI, EvaluationHuman } from '../types';
import { STATUS_VALUES } from '../constants';
import { ArrowLeft, Calculator, Table, Info, FileJson, Zap, UserCheck, MessageSquare, Database, FileText } from 'lucide-react';

interface Props {
  assessment: Assessment;
  aiEvaluations: Record<string, EvaluationAI>;
  humanEvaluations: Record<string, EvaluationHuman>;
  onBack: () => void;
  onViewReport?: () => void;
}

const ScoringBreakdown: React.FC<Props> = ({ assessment, aiEvaluations, humanEvaluations, onBack, onViewReport }) => {
  
  if (!assessment.scoring) return <div>No hay datos de scoring disponibles.</div>;

  const exportExperimentalDataset = (format: 'csv' | 'json') => {
    const data = assessment.scope.controls.map(ctrl => {
      const ai = aiEvaluations[`${assessment.id}_${ctrl.id}`];
      const hum = humanEvaluations[`${assessment.id}_${ctrl.id}`];
      const rem = assessment.remediationPlan?.find(r => r.controlId === ctrl.id);
      
      return {
        control_id: ctrl.id,
        domain: ctrl.domain,
        weight_wc: ctrl.weight,
        ai_status: ai?.status || 'N/A',
        ai_value_vc: STATUS_VALUES[ai?.status || 'pending'],
        ai_score_sc: ai?.score || 0,
        ai_confidence: ai?.confidence || 0,
        ai_time_ms: ai?.executionTimeMs || 0,
        human_status: hum?.humanStatus || 'N/A',
        human_value_vc: STATUS_VALUES[hum?.humanStatus || 'pending'],
        human_score_sc: hum?.score || 0,
        human_time_ms: hum?.reviewTimeMs || 0,
        consistency_f4: hum?.agreementIndex || 0,
        is_hybrid: !!hum,
        remediation_priority: rem?.priority || 'N/A',
        remediation_effort: rem?.estimatedEffort || 'N/A'
      };
    });

    const dataset = {
      assessment_id: assessment.id,
      timestamp: new Date().toISOString(),
      global_stats: {
        score_ia: assessment.scoring?.globalScoreIA,
        score_human: assessment.scoring?.globalScoreHuman,
        kappa: assessment.scoring?.kappa,
        kappa_interpretation: assessment.scoring?.kappaInterpretation,
        efficiency_reduction: assessment.scoring?.efficiency.reductionPercentage,
        total_time_ms: (assessment.scoring?.efficiency.totalAiTimeMs || 0) + (assessment.scoring?.efficiency.totalHumanTimeMs || 0)
      },
      remediation_summary: {
        total_actions: assessment.remediationPlan?.length || 0,
        high_priority: assessment.remediationPlan?.filter(p => p.priority === 'High').length || 0
      },
      raw_controls: data
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(dataset, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dataset-TPRM-S3-${assessment.id}.json`;
      a.click();
    } else {
      let csv = "control_id,domain,weight_wc,ai_status,ai_value_vc,ai_score_sc,ai_confidence,ai_time_ms,human_status,human_value_vc,human_score_sc,human_time_ms,consistency_f4,is_hybrid,rem_priority,rem_effort\n";
      data.forEach(d => {
        csv += `${d.control_id},${d.domain},${d.weight_wc},${d.ai_status},${d.ai_value_vc},${d.ai_score_sc},${d.ai_confidence},${d.ai_time_ms},${d.human_status},${d.human_value_vc},${d.human_score_sc},${d.human_time_ms},${d.consistency_f4},${d.is_hybrid},${d.remediation_priority},${d.remediation_effort}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dataset-TPRM-S3-${assessment.id}.csv`;
      a.click();
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      <header className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-full transition border border-slate-100">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
              <Calculator size={24} className="text-blue-600" />
              Trazabilidad Matemática Formal
            </h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-0.5">Sprint 3: Dataset Experimental & Kappa</p>
          </div>
        </div>
        <div className="flex gap-2">
           {onViewReport && (
             <button onClick={onViewReport} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-blue-700 transition shadow-lg active:scale-95 uppercase tracking-widest">
               <FileText size={16} /> Ver Reporte Final
             </button>
           )}
           <button onClick={() => exportExperimentalDataset('json')} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-black transition shadow-lg active:scale-95 uppercase tracking-widest">
             <Database size={16} /> JSON Full
           </button>
           <button onClick={() => exportExperimentalDataset('csv')} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-blue-700 transition shadow-lg active:scale-95 uppercase tracking-widest">
             <FileText size={16} /> CSV Dataset
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
               <div className="flex items-center gap-2">
                 <Table size={18} className="text-slate-400" />
                 <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Valores Capturados (Sc = Vc × Wc)</h3>
               </div>
               <div className="flex items-center gap-4">
                  <span className="text-[9px] font-black text-blue-600 flex items-center gap-1 uppercase"> <Zap size={10}/> Agente IA </span>
                  <span className="text-[9px] font-black text-indigo-600 flex items-center gap-1 uppercase"> <UserCheck size={10}/> Auditoria </span>
               </div>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead className="text-[9px] font-black text-slate-400 uppercase bg-slate-50/50">
                     <tr>
                        <th className="px-4 py-3">Control</th>
                        <th className="px-4 py-3 text-center">Peso</th>
                        <th className="px-4 py-3 text-center">IA (Vc)</th>
                        <th className="px-4 py-3 text-center">AUDIT (Vc)</th>
                        <th className="px-4 py-3 text-center">TIEMPO</th>
                        <th className="px-4 py-3 text-center font-bold">Sc FINAL</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[10px]">
                     {assessment.scope.controls.map(ctrl => {
                       const ai = aiEvaluations[`${assessment.id}_${ctrl.id}`];
                       const hum = humanEvaluations[`${assessment.id}_${ctrl.id}`];
                       const finalScore = hum ? hum.score : (ai ? ai.score : 0);
                       const timeMs = (ai?.executionTimeMs ?? 0) + (hum?.reviewTimeMs ?? 0);

                       return (
                         <tr key={ctrl.id} className={`hover:bg-slate-50/50 transition-colors ${hum ? 'bg-indigo-50/10' : ''}`}>
                           <td className="px-4 py-3">
                              <div className="font-bold text-slate-700">{ctrl.id}</div>
                              <div className="text-[8px] text-slate-400 uppercase truncate max-w-[120px]">{ctrl.name}</div>
                           </td>
                           <td className="px-4 py-3 text-center">{ctrl.weight.toFixed(1)}</td>
                           <td className="px-4 py-3 text-center text-blue-500 opacity-60"> {ai ? STATUS_VALUES[ai.status].toFixed(2) : '0.00'} </td>
                           <td className={`px-4 py-3 text-center font-bold ${hum ? 'text-indigo-600' : 'text-slate-300'}`}> {hum ? STATUS_VALUES[hum.humanStatus].toFixed(2) : 'N/A'} </td>
                           <td className="px-4 py-3 text-center text-slate-400">{(timeMs/1000).toFixed(1)}s</td>
                           <td className={`px-4 py-3 text-center font-black ${hum ? 'text-indigo-600 bg-indigo-50/30' : 'text-blue-600 bg-blue-50/30'}`}> {finalScore.toFixed(4)} </td>
                         </tr>
                       );
                     })}
                  </tbody>
               </table>
            </div>
         </div>

         <div className="space-y-6">
            <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform"> <Database size={100} /> </div>
               <h3 className="text-[10px] font-black text-blue-400 uppercase mb-8 tracking-[0.2em]">Resumen Estadístico S3</h3>
               <div className="space-y-6">
                  <div>
                     <div className="text-[9px] font-bold text-slate-500 uppercase mb-1">Kappa de Cohen Final</div>
                     <div className="text-4xl font-black text-white">{assessment.scoring.kappa.toFixed(3)}</div>
                     <div className="inline-block mt-2 px-3 py-1 bg-blue-600 text-[10px] font-black uppercase rounded-full">{assessment.scoring.kappaInterpretation}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                     <div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase mb-1">Observed Agreement (Po)</div>
                        <div className="text-xl font-black font-mono">{(assessment.scoring.po * 100).toFixed(1)}%</div>
                     </div>
                     <div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase mb-1">Expected Agreement (Pe)</div>
                        <div className="text-xl font-black font-mono">{(assessment.scoring.pe * 100).toFixed(1)}%</div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
               <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Score Final Normalizado</h3>
               <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                     <span className="text-[10px] font-bold text-slate-400 uppercase">Audit Result (Hybrid)</span>
                     <span className="font-mono text-2xl font-black text-indigo-600">{(assessment.scoring.globalScoreHuman * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-end">
                     <span className="text-[10px] font-bold text-slate-400 uppercase">IA Baseline Suggestion</span>
                     <span className="font-mono text-xl font-black text-blue-500">{(assessment.scoring.globalScoreIA * 100).toFixed(2)}%</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ScoringBreakdown;
