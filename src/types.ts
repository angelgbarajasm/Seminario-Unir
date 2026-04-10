
export enum ProviderType {
  SaaS = 'SaaS',
  IaaS = 'IaaS',
  MSSP = 'MSSP',
  Dev = 'Dev',
  BPO = 'BPO',
  Other = 'Other'
}

export enum RiskLevel {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High'
}

export enum ControlStatus {
  Compliant = 'compliant',
  PartiallyCompliant = 'partially_compliant',
  NonCompliant = 'non_compliant',
  InsufficientEvidence = 'insufficient_evidence',
  Pending = 'pending'
}

export interface ThirdParty {
  id: string;
  name: string;
  country: string;
  industry: string;
  contractType: string;
  assessmentDate: string;
  providerType: ProviderType;
  riskProfile: RiskProfile;
}

export interface RiskProfile {
  criticalService: boolean;
  sensitiveDataLevel: RiskLevel;
  personalDataProcessing: boolean;
  networkIntegration: boolean;
  operationalDependency: RiskLevel;
}

export interface RemediationAction {
  controlId: string;
  controlName: string;
  action: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedEffort: 'Small' | 'Medium' | 'Large';
  deadline: string;
}

export interface Assessment {
  id: string;
  providerId: string;
  startDate: string;
  status: 'active' | 'completed';
  scope: ScopeSnapshot;
  scoring?: GlobalScoringResult;
  remediationPlan?: RemediationAction[];
}

export interface ScopeSnapshot {
  id: string;
  domains: string[];
  controls: ControlDefinition[];
  version: string;
}

export interface ControlDefinition {
  id: string;
  domain: string;
  name: string;
  description: string;
  weight: number; 
}

export interface EvidenceChunk {
  id: string;
  assessmentId: string;
  documentName: string;
  text: string;
  timestamp: string;
}

export interface EvaluationAI {
  controlId: string;
  status: ControlStatus;
  value: number; 
  justification: string;
  citations: string[];
  confidence: number; 
  uncertaintyFlag: boolean;
  timestamp: string;
  executionTimeMs: number;
  score: number; 
  adjustedScore: number; 
}

export interface EvaluationHuman {
  controlId: string;
  aiStatus: ControlStatus;
  humanStatus: ControlStatus;
  humanValue: number; 
  justification: string; 
  humanJustification?: string; 
  comment: string;
  deltaFlag: boolean;
  agreementIndex: number; 
  timestamp: string;
  reviewTimeMs: number;
  score: number; 
}

export interface EfficiencyMetrics {
  totalAiTimeMs: number;
  totalHumanTimeMs: number;
  avgAiTimeMs: number;
  avgHumanTimeMs: number;
  reductionPercentage: number;
}

export interface DecisionOutcome {
  decision: 'APPROVE' | 'APPROVE_CONDITIONAL' | 'REMEDIATION' | 'REJECT';
  rationale: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface GlobalScoringResult {
  globalScoreIA: number;
  globalScoreHuman: number;
  averageAgreement: number;
  kappa: number;
  kappaInterpretation: string;
  po: number;
  pe: number;
  efficiency: EfficiencyMetrics;
  decision: DecisionOutcome;
  domainScores: DomainScoringResult[];
}

export interface DomainScoringResult {
  domain: string;
  scoreIA: number;
  scoreHuman: number;
  weight: number; 
}

export interface State {
  providers: ThirdParty[];
  assessments: Assessment[];
  evidences: EvidenceChunk[];
  aiEvaluations: Record<string, EvaluationAI>; 
  humanEvaluations: Record<string, EvaluationHuman>;
}
