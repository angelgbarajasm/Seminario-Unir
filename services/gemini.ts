
import { GoogleGenAI, Type } from "@google/genai";
import { ControlDefinition, EvidenceChunk, ControlStatus, EvaluationAI, ThirdParty, RemediationAction } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Utilidad para reintentos con backoff exponencial.
 * Maneja errores de cuota (429) y errores temporales de red.
 */
async function executeWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isQuotaError = error?.message?.includes('429') || error?.message?.includes('quota');
    if (retries > 0 && isQuotaError) {
      console.warn(`Cuota excedida. Reintentando en ${delay}ms... (Intentos restantes: ${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return executeWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Sugiere controles suplementarios basados en el perfil del proveedor.
 */
export async function suggestControlsFromProfile(provider: ThirdParty): Promise<any[]> {
  const prompt = `Actúa como un experto consultor de TPRM. Analiza este proveedor: 
  Nombre: ${provider.name}
  Industria: ${provider.industry}
  Tipo: ${provider.providerType}
  Criticidad: ${provider.riskProfile.criticalService ? 'Crítico' : 'Estándar'}
  Sensibilidad Datos: ${provider.riskProfile.sensitiveDataLevel}

  Sugiere 3 controles suplementarios críticos basados en ISO 27001 y NIST SP 800-53 en formato JSON.`;

  return executeWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "Eres un consultor experto en ciberseguridad. Responde únicamente en JSON y en ESPAÑOL.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              domain: { type: Type.STRING },
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              reason: { type: Type.STRING },
              standard: { type: Type.STRING }
            },
            required: ["id", "domain", "name", "description", "reason", "standard"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  });
}

/**
 * Genera un plan de remediación técnica.
 * El motor asume el rol de experto en ISO 27001 y NIST SP 800-53.
 */
export async function generateRemediationPlan(
  provider: ThirdParty,
  failedControls: { control: ControlDefinition, status: string, justification: string }[]
): Promise<RemediationAction[]> {
  const context = failedControls.map(f => 
    `CONTROL: ${f.control.id} (${f.control.name})
     ESTADO: ${f.status}
     JUSTIFICACIÓN AUDITORÍA: ${f.justification}`
  ).join("\n---\n");
  
  const prompt = `Actúa como un CISO experto en cumplimiento normativo (ISO 27001:2022 y NIST SP 800-53). 
  El proveedor ${provider.name} ha fallado en los siguientes controles de seguridad. 
  Genera obligatoriamente un plan de acciones de remediación técnica y concreta para CADA uno de los hallazgos presentados abajo.
  
  HALLAZGOS DE AUDITORÍA:
  ${context}`;

  return executeWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: "Eres un CISO experto en marcos de cumplimiento ISO 27001 y NIST. Tu misión es transformar hallazgos de auditoría en acciones técnicas realistas y urgentes. Responde estrictamente en JSON y en ESPAÑOL.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              controlId: { type: Type.STRING },
              controlName: { type: Type.STRING },
              action: { type: Type.STRING, description: "Acción técnica correctiva específica alineada a ISO/NIST." },
              priority: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
              estimatedEffort: { type: Type.STRING, enum: ["Small", "Medium", "Large"] },
              deadline: { type: Type.STRING, description: "Plazo máximo sugerido (ej: 30 días, 90 días)." }
            },
            required: ["controlId", "controlName", "action", "priority", "estimatedEffort", "deadline"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  });
}

/**
 * Motor RAG de Evaluación de Cumplimiento.
 */
export async function evaluateControlWithRAG(
  control: ControlDefinition,
  chunks: EvidenceChunk[]
): Promise<Omit<EvaluationAI, 'value' | 'score' | 'adjustedScore'>> {
  const startTime = Date.now();

  if (chunks.length === 0) {
    return {
      controlId: control.id,
      status: ControlStatus.InsufficientEvidence,
      justification: "No se ha proporcionado ninguna evidencia documental para validar este control.",
      citations: [],
      confidence: 0,
      uncertaintyFlag: true,
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime
    };
  }

  const context = chunks.map(c => `[DOCUMENTO: ${c.documentName}] CONTENIDO: ${c.text}`).join("\n\n");
  const prompt = `Evalúa el cumplimiento del control ${control.id} (${control.name}) basándote exclusivamente en la evidencia proporcionada.
  
  CONTROL A EVALUAR: ${control.description}
  
  EVIDENCIA DISPONIBLE:
  ${context}`;

  try {
    return await executeWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "Eres un auditor senior de ciberseguridad (ISO 27001 / NIST). Sé crítico y busca evidencia directa. Si la evidencia es vaga, marca como 'insufficient_evidence' o 'partially_compliant'. Responde en JSON y ESPAÑOL.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING, enum: ["compliant", "partially_compliant", "non_compliant", "insufficient_evidence"] },
              justification: { type: Type.STRING },
              citations: { type: Type.ARRAY, items: { type: Type.STRING } },
              confidence: { type: Type.NUMBER },
              uncertaintyFlag: { type: Type.BOOLEAN }
            },
            required: ["status", "justification", "citations", "confidence", "uncertaintyFlag"]
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      
      return {
        controlId: control.id,
        status: result.status as ControlStatus,
        justification: result.justification,
        citations: result.citations || [],
        confidence: result.confidence || 0.5,
        uncertaintyFlag: result.uncertaintyFlag || false,
        timestamp: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime
      };
    });
  } catch (error: any) {
    console.error("Error crítico en RAG Gemini:", error);
    return {
      controlId: control.id,
      status: ControlStatus.InsufficientEvidence,
      justification: `Error de motor de IA: ${error?.message?.includes('429') ? 'Cuota excedida. Por favor, espere un momento antes de reintentar.' : 'Fallo técnico inesperado.'}`,
      citations: [],
      confidence: 0,
      uncertaintyFlag: true,
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime
    };
  }
}
