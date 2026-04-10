
import React, { useState, useEffect, useCallback } from 'react';
import { loadState, saveState, clearState } from './services/store';
import { State, ThirdParty, Assessment, ProviderType, RiskLevel, ControlStatus, EvaluationAI, EvaluationHuman, EvidenceChunk, GlobalScoringResult, ControlDefinition, RemediationAction } from './types';
import { getDynamicScope, MASTER_CONTROLS, STATUS_VALUES } from './constants';
import { evaluateControlWithRAG, suggestControlsFromProfile, generateRemediationPlan } from './services/gemini';
import { calculateControlScore, calculateConsistencyIndex, calculateConfidenceAdjustedScore, calculateFullScoring } from './services/scoring';
import ProviderForm from './components/ProviderForm';
import ProviderList from './components/ProviderList';
import EvidenceUpload from './components/EvidenceUpload';
import AssessmentDashboard from './components/AssessmentDashboard';
import ControlReview from './components/ControlReview';
import ScoringBreakdown from './components/ScoringBreakdown';
import IAScopeSuggestions from './components/IAScopeSuggestions';
import FinalReport from './components/FinalReport';
import RemediationPlan from './components/RemediationPlan';
import { LayoutDashboard, Users, ShieldAlert, ShieldCheck, FileText, ClipboardCheck, History, Loader2, Brain, BarChart3, UserCheck, Zap, Sparkles, Calculator, Settings2, FileBarChart, Rocket, AlertTriangle, Clock, Cpu, RefreshCcw, Terminal, Copy, Check, Scale } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<State>(loadState());
  const [view, setView] = useState<'dashboard' | 'providers' | 'onboarding' | 'assessment' | 'review' | 'scoring' | 'ia-scoping' | 'report' | 'remediation'>('dashboard');
  const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(null);
  const [activeControlId, setActiveControlId] = useState<string | null>(null);
  const [pendingProvider, setPendingProvider] = useState<ThirdParty | null>(null);
  const [iaSuggestions, setIaSuggestions] = useState<any[]>([]);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [isGeneratingScope, setIsGeneratingScope] = useState(false);
  const [isGeneratingRemediation, setIsGeneratingRemediation] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const handleRunAllAI = async (assessment: Assessment) => {
    const chunks = state.evidences.filter(e => e.assessmentId === assessment.id);
    if (chunks.length === 0) {
      alert("No hay evidencia subida. Por favor, cargue documentos primero.");
      return;
    }

    setIsAnalyzingAll(true);
    setGlobalError(null);
    
    for (const control of assessment.scope.controls) {
      try {
        const result = await evaluateControlWithRAG(control, chunks);
        const score = calculateControlScore(result.status as ControlStatus, control.weight);
        const enrichedAI: EvaluationAI = {
          ...result,
          value: STATUS_VALUES[result.status as ControlStatus],
          score,
          adjustedScore: calculateConfidenceAdjustedScore(score, result.confidence)
        } as EvaluationAI;

        setState(prev => {
          const newState = {
            ...prev,
            aiEvaluations: { ...prev.aiEvaluations, [`${assessment.id}_${control.id}`]: enrichedAI }
          };
          return updateAssessmentScoring(assessment.id, newState);
        });
      } catch (e) {
        console.error("Error en flujo de análisis:", e);
      }
    }
    setIsAnalyzingAll(false);
  };

  const handleGenerateRemediation = async () => {
    const asmt = state.assessments.find(a => a.id === activeAssessmentId);
    const provider = asmt ? state.providers.find(p => p.id === asmt.providerId) : null;
    if (!asmt || !provider) return;

    setIsGeneratingRemediation(true);
    setGlobalError(null);
    
    const failedControls = asmt.scope.controls
      .map(c => {
        const hum = state.humanEvaluations[`${asmt.id}_${c.id}`];
        const ai = state.aiEvaluations[`${asmt.id}_${c.id}`];
        const status = hum ? hum.humanStatus : (ai ? ai.status : ControlStatus.Pending);
        const justification = hum 
          ? (hum.humanJustification || hum.comment || hum.justification) 
          : (ai ? ai.justification : 'Sin evaluación disponible');
        
        return { control: c, status, justification };
      })
      .filter(f => f.status !== ControlStatus.Compliant && f.status !== ControlStatus.Pending);

    if (failedControls.length === 0) {
      alert("No se han detectado brechas que requieran remediación.");
      setIsGeneratingRemediation(false);
      return;
    }

    try {
      const plan = await generateRemediationPlan(provider, failedControls as any);
      setState(prev => ({
        ...prev,
        assessments: prev.assessments.map(a => a.id === asmt.id ? { ...a, remediationPlan: plan } : a)
      }));
    } catch (e: any) {
      setGlobalError("Fallo al conectar con Gemini.");
    }
    
    setIsGeneratingRemediation(false);
  };

  const updateAssessmentScoring = (asmtId: string, newState: State): State => {
    const asmt = newState.assessments.find(a => a.id === asmtId);
    if (!asmt) return newState;
    const aiEvals: Record<string, EvaluationAI> = {};
    const humEvals: Record<string, EvaluationHuman> = {};
    asmt.scope.controls.forEach(c => {
      const aiKey = `${asmtId}_${c.id}`;
      if (newState.aiEvaluations[aiKey]) aiEvals[c.id] = newState.aiEvaluations[aiKey];
      if (newState.humanEvaluations[aiKey]) humEvals[c.id] = newState.humanEvaluations[aiKey];
    });
    const scoring = calculateFullScoring(asmt.scope.controls, aiEvals, humEvals);
    return { ...newState, assessments: newState.assessments.map(a => a.id === asmtId ? { ...a, scoring } : a) };
  };

  const handleSaveAIEvaluation = (asmtId: string, controlId: string, evalAI: EvaluationAI) => {
    setState(prev => {
      const newState = {
        ...prev,
        aiEvaluations: { ...prev.aiEvaluations, [`${asmtId}_${controlId}`]: evalAI }
      };
      return updateAssessmentScoring(asmtId, newState);
    });
  };

  const handleSaveHumanEvaluation = (asmtId: string, controlId: string, evalHuman: EvaluationHuman) => {
    setState(prev => {
      const newState = {
        ...prev,
        humanEvaluations: { ...prev.humanEvaluations, [`${asmtId}_${controlId}`]: evalHuman }
      };
      return updateAssessmentScoring(asmtId, newState);
    });
  };

  // Cálculo de Kappa Promedio para el Dashboard
  const activeKappas = state.assessments
    .map(a => a.scoring?.kappa ?? 0)
    .filter(k => k !== 0);
  const avgKappa = activeKappas.length > 0 
    ? activeKappas.reduce((a, b) => a + b, 0) / activeKappas.length 
    : 0;

  const activeAssessment = state.assessments.find(a => a.id === activeAssessmentId);
  const activeProvider = activeAssessment ? state.providers.find(p => p.id === activeAssessment.providerId) : null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 relative">
        <div className="p-6 border-b border-slate-800 flex items-center gap-2">
          <ShieldAlert className="text-blue-400" />
          <h1 className="text-xl font-bold tracking-tight">Asistente TPRM</h1>
        </div>
        <nav className="mt-4 px-4 space-y-1">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition ${view === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <LayoutDashboard size={20} /> Panel
          </button>
          <button onClick={() => setView('providers')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition ${view === 'providers' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Users size={20} /> Proveedores
          </button>
          <button onClick={() => setView('onboarding')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition ${view === 'onboarding' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <ClipboardCheck size={20} /> Nueva Evaluación
          </button>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto p-4 md:p-8">
        {view === 'dashboard' && (
           <div className="animate-in fade-in duration-500">
              <header className="mb-10">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Panel de Operaciones</h2>
                <p className="text-slate-500 font-medium uppercase tracking-widest text-xs">TPRM Intelligence Engine • Gemini 3.1 Cloud</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Proveedores</div>
                  <div className="text-4xl font-black text-slate-900">{state.providers.length}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Evaluaciones</div>
                  <div className="text-4xl font-black text-slate-900">{state.assessments.length}</div>
                </div>
                <div className="bg-blue-600 p-6 rounded-2xl shadow-lg text-white">
                  <div className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-1">Eficiencia Operativa</div>
                  <div className="text-4xl font-black">+42%</div>
                </div>
                <div className="bg-slate-900 p-6 rounded-2xl shadow-lg text-white">
                  <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Confianza (Kappa Promedio)</div>
                  <div className="text-4xl font-black text-blue-400">{avgKappa.toFixed(3)}</div>
                </div>
              </div>

              <div className="mt-12">
                 <h3 className="text-lg font-black mb-6 text-slate-800 uppercase tracking-tight flex items-center gap-2"> <History className="text-blue-600" /> Historial de Auditorías </h3>
                 <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                       <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                          <tr>
                             <th className="px-8 py-5">Proveedor</th>
                             <th className="px-8 py-5">Score (Human)</th>
                             <th className="px-8 py-5">Kappa Index</th>
                             <th className="px-8 py-5 text-right">Acción</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {state.assessments.map(asmt => {
                             const p = state.providers.find(pr => pr.id === asmt.providerId);
                             return (
                                <tr key={asmt.id} className="hover:bg-slate-50/50 transition">
                                   <td className="px-8 py-5 font-bold text-slate-900">{p?.name}</td>
                                   <td className="px-8 py-5 font-mono text-blue-600 font-black">{((asmt.scoring?.globalScoreHuman ?? 0) * 100).toFixed(1)}%</td>
                                   <td className="px-8 py-5 font-mono text-slate-500">{asmt.scoring?.kappa.toFixed(3) ?? 'N/A'}</td>
                                   <td className="px-8 py-5 text-right">
                                      <button onClick={() => { setActiveAssessmentId(asmt.id); setView('assessment'); }} className="text-blue-600 font-black text-xs uppercase hover:underline">Abrir</button>
                                   </td>
                                </tr>
                             );
                          })}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        )}

        {view === 'assessment' && activeAssessment && activeProvider && (
           <div className="animate-in fade-in duration-500">
              <header className="mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                 <div>
                    <button onClick={() => setView('dashboard')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"> &larr; Volver al Panel</button>
                    <h2 className="text-5xl font-black text-slate-900 tracking-tighter">{activeProvider.name}</h2>
                    <p className="text-slate-500 font-medium uppercase text-xs tracking-widest mt-1">
                       {activeProvider.industry} • {activeProvider.providerType}
                    </p>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    <button onClick={() => setView('scoring')} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black flex items-center gap-2 hover:bg-slate-50 transition active:scale-95 shadow-sm"> 
                      <Calculator size={18} className="text-blue-600" /> Trazabilidad Scoring 
                    </button>
                    <button onClick={() => setView('remediation')} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-700 transition active:scale-95 shadow-lg shadow-indigo-500/20"> 
                      <Rocket size={18} /> Plan Remediación 
                    </button>
                    <button onClick={() => setView('report')} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black flex items-center gap-2 hover:bg-slate-800 transition active:scale-95 shadow-lg"> 
                      <FileBarChart size={18} /> Generar Reporte 
                    </button>
                    <button onClick={() => handleRunAllAI(activeAssessment)} 
                      disabled={isAnalyzingAll}
                      className={`px-8 py-3 rounded-2xl font-black flex items-center gap-2 shadow-xl transition active:scale-95 bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20`}>
                       {isAnalyzingAll ? <Loader2 size={18} className="animate-spin" /> : <Brain size={18} />}
                       {isAnalyzingAll ? 'Procesando...' : 'Analizar con Gemini'}
                    </button>
                 </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 space-y-8">
                    <AssessmentDashboard assessment={activeAssessment} aiEvaluations={state.aiEvaluations} humanEvaluations={state.humanEvaluations} onReviewControl={(id) => { setActiveControlId(id); setView('review'); }} />
                 </div>
                 <div className="space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"> <FileText className="text-blue-600" /> Documentación </h3>
                       <EvidenceUpload assessmentId={activeAssessment.id} providerId={activeProvider.id} onUpload={(chunks) => setState(prev => ({...prev, evidences: [...prev.evidences, ...chunks]}))} existingCount={state.evidences.filter(e => e.assessmentId === activeAssessment.id).length} />
                    </div>
                 </div>
              </div>
           </div>
        )}

        {view === 'remediation' && activeAssessment && activeProvider && (
           <RemediationPlan assessment={activeAssessment} provider={activeProvider} plan={activeAssessment.remediationPlan} isGenerating={isGeneratingRemediation} onGenerate={handleGenerateRemediation} onBack={() => setView('assessment')} onViewReport={() => setView('report')} />
        )}

        {view === 'scoring' && activeAssessment && (
           <ScoringBreakdown assessment={activeAssessment} aiEvaluations={state.aiEvaluations} humanEvaluations={state.humanEvaluations} onBack={() => setView('assessment')} onViewReport={() => setView('report')} />
        )}

        {view === 'review' && activeAssessment && activeControlId && <ControlReview control={activeAssessment.scope.controls.find(c => c.id === activeControlId)!} assessment={activeAssessment} chunks={state.evidences.filter(e => e.assessmentId === activeAssessment.id)} aiEvaluation={state.aiEvaluations[`${activeAssessment.id}_${activeControlId}`]} humanEvaluation={state.humanEvaluations[`${activeAssessment.id}_${activeControlId}`]} onBack={() => setView('assessment')} onSaveAI={(evalAI) => handleSaveAIEvaluation(activeAssessment.id, activeControlId, evalAI)} onSaveHuman={(evalHuman) => handleSaveHumanEvaluation(activeAssessment.id, activeControlId, evalHuman)} />}
        {view === 'report' && activeAssessment && activeProvider && <FinalReport assessment={activeAssessment} provider={activeProvider} aiEvaluations={state.aiEvaluations} humanEvaluations={state.humanEvaluations} onBack={() => setView('assessment')} />}
        {view === 'providers' && <ProviderList providers={state.providers} assessments={state.assessments} onSelectProvider={(id) => { const a = state.assessments.find(as => as.providerId === id); if(a) { setActiveAssessmentId(a.id); setView('assessment'); } }} onNewAssessment={() => setView('onboarding')} />}
        {view === 'onboarding' && <ProviderForm onSubmit={(tp) => { setPendingProvider(tp); setIsGeneratingScope(true); setView('ia-scoping'); suggestControlsFromProfile(tp).then(s => { setIaSuggestions(s); setIsGeneratingScope(false); }); }} />}
        {view === 'ia-scoping' && pendingProvider && <IAScopeSuggestions provider={pendingProvider} suggestions={iaSuggestions} isLoading={isGeneratingScope} baseControlCount={MASTER_CONTROLS.length} onFinalize={(sel) => {
          const id = `asmt-${Date.now()}`;
          const domains = getDynamicScope(pendingProvider.providerType, pendingProvider.riskProfile.sensitiveDataLevel);
          const controls = [...MASTER_CONTROLS.filter(c => domains.includes(c.domain)), ...sel];
          const asmt: Assessment = { id, providerId: pendingProvider.id, startDate: new Date().toISOString(), status: 'active', scope: { id: `scope-${Date.now()}`, domains, controls, version: '1.0' } };
          setState(prev => ({ ...prev, providers: [...prev.providers, pendingProvider], assessments: [...prev.assessments, asmt] }));
          setActiveAssessmentId(id);
          setView('assessment');
        }} onBack={() => setView('onboarding')} />}
      </main>
    </div>
  );
};

export default App;
