
import { ControlDefinition, ProviderType, RiskLevel, ControlStatus } from './types';

// Valores numéricos definidos en el Anexo B (Vc)
export const STATUS_VALUES: Record<ControlStatus, number> = {
  [ControlStatus.Compliant]: 1.0,
  [ControlStatus.PartiallyCompliant]: 0.5,
  [ControlStatus.NonCompliant]: 0.0,
  [ControlStatus.InsufficientEvidence]: 0.25,
  [ControlStatus.Pending]: 0.0
};

// Umbrales de Decisión (Parametrización Sprint 2)
export const SCORING_THRESHOLDS = {
  APPROVE: 0.85,
  CONDITIONAL: 0.70,
  REMEDIATION: 0.50,
  KAPPA_MIN_TRUST: 0.60
};

export const MASTER_CONTROLS: ControlDefinition[] = [
  { id: 'AC-01', domain: 'Control de Acceso', name: 'Gestión de Identidades', description: 'La organización gestiona las identidades y credenciales de todos los empleados y contratistas.', weight: 1.0 },
  { id: 'AC-02', domain: 'Control de Acceso', name: 'Implementación de MFA', description: 'Se exige autenticación de múltiples factores para todo acceso remoto y privilegiado.', weight: 1.5 },
  { id: 'DP-01', domain: 'Protección de Datos', name: 'Cifrado en Reposo', description: 'Los datos sensibles se cifran en reposo utilizando algoritmos estándar de la industria.', weight: 1.2 },
  { id: 'DP-02', domain: 'Protección de Datos', name: 'Cifrado en Tránsito', description: 'Los datos se protegen en tránsito utilizando TLS 1.2 o superior.', weight: 1.2 },
  { id: 'IM-01', domain: 'Gestión de Incidentes', name: 'Plan de Respuesta a Incidentes', description: 'Existe un plan documentado de respuesta a incidentes que se prueba anualmente.', weight: 1.0 },
  { id: 'SD-01', domain: 'Desarrollo Seguro', name: 'Política de SDLC', description: 'El software se desarrolla siguiendo una política de ciclo de vida de desarrollo seguro (SDLC) que incluye revisiones de código.', weight: 1.3 },
  { id: 'BC-01', domain: 'Continuidad del Negocio', name: 'Plan BCP/DR', description: 'Los planes de continuidad del negocio y recuperación ante desastres están documentados y probados.', weight: 1.5 },
  { id: 'GR-01', domain: 'Gobierno y Riesgo', name: 'Política de Seguridad', description: 'Las políticas integrales de seguridad de la información son aprobadas por la dirección.', weight: 0.8 }
];

/**
 * Motor de Alcance Dinámico (Deterministic Scope Engine)
 */
export function getDynamicScope(type: ProviderType, dataLevel: RiskLevel): string[] {
  const domains = ['Gobierno y Riesgo']; 

  if (type === ProviderType.SaaS || type === ProviderType.IaaS || type === ProviderType.MSSP) {
    domains.push('Control de Acceso', 'Protección de Datos', 'Gestión de Incidentes');
  }

  if (dataLevel === RiskLevel.High || dataLevel === RiskLevel.Medium) {
    if (!domains.includes('Protección de Datos')) domains.push('Protección de Datos');
  }
  
  if (dataLevel === RiskLevel.High) {
    domains.push('Continuidad del Negocio');
  }

  if (type === ProviderType.Dev || type === ProviderType.SaaS) {
    domains.push('Desarrollo Seguro');
  }

  if (type === ProviderType.BPO) {
    domains.push('Gestión de Incidentes');
  }

  return Array.from(new Set(domains));
}
