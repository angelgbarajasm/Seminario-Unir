
import { ControlStatus, EvaluationAI, EvaluationHuman, ControlDefinition, DomainScoringResult, GlobalScoringResult, EfficiencyMetrics, DecisionOutcome } from '../types';
import { STATUS_VALUES, SCORING_THRESHOLDS } from '../constants';

// Baseline estimado: 15 minutos por control si se hiciera 100% manual (sin IA)
const ESTIMATED_MANUAL_TIME_MS = 15 * 60 * 1000;

export function calculateControlScore(status: ControlStatus, weight: number): number {
  const value = STATUS_VALUES[status] || 0;
  return value * weight;
}

export function calculateConsistencyIndex(aiStatus: ControlStatus, humanStatus: ControlStatus): number {
  const aiVal = STATUS_VALUES[aiStatus] || 0;
  const humVal = STATUS_VALUES[humanStatus] || 0;
  return 1 - Math.abs(aiVal - humVal);
}

export function calculateConfidenceAdjustedScore(baseScore: number, confidence: number): number {
  return baseScore * confidence;
}

/**
 * IMPLEMENTACIÓN KAPPA DE COHEN (S3)
 */
function calculateKappa(evaluations: {ai: ControlStatus, human: ControlStatus}[]): { kappa: number, po: number, pe: number, interpretation: string } {
  const categories = [ControlStatus.Compliant, ControlStatus.PartiallyCompliant, ControlStatus.NonCompliant, ControlStatus.InsufficientEvidence];
  const n = categories.length;
  const matrix = Array.from({length: n}, () => Array(n).fill(0));
  
  evaluations.forEach(e => {
    const i = categories.indexOf(e.ai);
    const j = categories.indexOf(e.human);
    if (i !== -1 && j !== -1) matrix[i][j]++;
  });

  const total = evaluations.length;
  if (total === 0) return { kappa: 0, po: 0, pe: 0, interpretation: 'N/A' };

  let po = 0;
  for (let i = 0; i < n; i++) po += matrix[i][i];
  po /= total;

  let pe = 0;
  for (let i = 0; i < n; i++) {
    let rowSum = 0;
    let colSum = 0;
    for (let j = 0; j < n; j++) {
      rowSum += matrix[i][j];
      colSum += matrix[j][i];
    }
    pe += (rowSum * colSum);
  }
  pe /= (total * total);

  const kappa = Math.abs(1 - pe) < 0.0001 ? 0 : (po - pe) / (1 - pe);
  
  let interpretation = '';
  if (kappa < 0.20) interpretation = 'Leve';
  else if (kappa < 0.40) interpretation = 'Bajo';
  else if (kappa < 0.60) interpretation = 'Moderado';
  else if (kappa < 0.80) interpretation = 'Sustancial';
  else interpretation = 'Casi Perfecto';

  return { kappa, po, pe, interpretation };
}

/**
 * MOTOR DE DECISIÓN (S3)
 */
function determineDecision(score: number, kappa: number, validatedCount: number): DecisionOutcome {
  if (validatedCount === 0) {
    if (score >= SCORING_THRESHOLDS.APPROVE) return { decision: 'APPROVE', rationale: 'Puntuación IA sobresaliente. Pendiente validación humana.', severity: 'low' };
    return { decision: 'REMEDIATION', rationale: 'Puntuación IA media/baja. Requiere revisión humana urgente.', severity: 'medium' };
  }

  if (score >= SCORING_THRESHOLDS.APPROVE && kappa >= SCORING_THRESHOLDS.KAPPA_MIN_TRUST) {
    return { decision: 'APPROVE', rationale: 'Cumplimiento robusto con alta concordancia estadística entre IA y Humano.', severity: 'low' };
  } else if (score >= SCORING_THRESHOLDS.CONDITIONAL) {
    return { decision: 'APPROVE_CONDITIONAL', rationale: 'Cumplimiento aceptable. Se requieren ajustes menores en áreas específicas.', severity: 'medium' };
  } else if (score >= SCORING_THRESHOLDS.REMEDIATION) {
    return { decision: 'REMEDIATION', rationale: 'Riesgo residual significativo. El proveedor debe presentar plan de acción.', severity: 'high' };
  } else {
    return { decision: 'REJECT', rationale: 'Nivel de riesgo inaceptable. El proveedor no cumple con los requisitos mínimos de seguridad.', severity: 'critical' };
  }
}

export function calculateFullScoring(
  controls: ControlDefinition[],
  aiEvals: Record<string, EvaluationAI>,
  humanEvals: Record<string, EvaluationHuman>
): GlobalScoringResult {
  
  const domains = Array.from(new Set(controls.map(c => c.domain)));
  const domainResults: DomainScoringResult[] = [];

  domains.forEach(domain => {
    const domainControls = controls.filter(c => c.domain === domain);
    let sumWc = 0;
    let sumScIA = 0;
    let sumScHuman = 0;

    domainControls.forEach(ctrl => {
      const ai = aiEvals[ctrl.id];
      const hum = humanEvals[ctrl.id];
      sumWc += ctrl.weight;
      if (ai) sumScIA += calculateControlScore(ai.status, ctrl.weight);
      if (hum) sumScHuman += calculateControlScore(hum.humanStatus, ctrl.weight);
      else if (ai) sumScHuman += calculateControlScore(ai.status, ctrl.weight);
    });

    domainResults.push({
      domain,
      scoreIA: sumWc > 0 ? sumScIA / sumWc : 0,
      scoreHuman: sumWc > 0 ? sumScHuman / sumWc : 0,
      weight: 1.0 
    });
  });

  const sumWd = domainResults.reduce((acc, dr) => acc + dr.weight, 0);
  const globalScoreIA = sumWd > 0 ? domainResults.reduce((acc, dr) => acc + (dr.scoreIA * dr.weight), 0) / sumWd : 0;
  const globalScoreHuman = sumWd > 0 ? domainResults.reduce((acc, dr) => acc + (dr.scoreHuman * dr.weight), 0) / sumWd : 0;

  const validationPairs = controls
    .filter(c => aiEvals[c.id] && humanEvals[c.id])
    .map(c => ({ ai: aiEvals[c.id].status, human: humanEvals[c.id].humanStatus }));
  
  const kappaData = calculateKappa(validationPairs);

  const aiTime = Object.values(aiEvals).reduce((acc, e) => acc + e.executionTimeMs, 0);
  const humTime = Object.values(humanEvals).reduce((acc, e) => acc + e.reviewTimeMs, 0);
  const totalEvaluated = Object.keys(aiEvals).length;
  const theoreticalManualTotal = totalEvaluated * ESTIMATED_MANUAL_TIME_MS;
  const actualTime = aiTime + humTime;
  const reduction = theoreticalManualTotal > 0 ? (theoreticalManualTotal - actualTime) / theoreticalManualTotal : 0;

  const efficiency: EfficiencyMetrics = {
    totalAiTimeMs: aiTime,
    totalHumanTimeMs: humTime,
    avgAiTimeMs: totalEvaluated > 0 ? aiTime / totalEvaluated : 0,
    avgHumanTimeMs: Object.keys(humanEvals).length > 0 ? humTime / Object.keys(humanEvals).length : 0,
    reductionPercentage: reduction
  };

  return {
    globalScoreIA,
    globalScoreHuman,
    averageAgreement: validationPairs.length > 0 ? 
      validationPairs.reduce((acc, pair) => acc + calculateConsistencyIndex(pair.ai, pair.human), 0) / validationPairs.length 
      : -1,
    kappa: kappaData.kappa,
    kappaInterpretation: kappaData.interpretation,
    po: kappaData.po,
    pe: kappaData.pe,
    efficiency,
    decision: determineDecision(globalScoreHuman, kappaData.kappa, validationPairs.length),
    domainScores: domainResults
  };
}
