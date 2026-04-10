
import { ControlDefinition, EvidenceChunk, ControlStatus, EvaluationAI, ThirdParty, RemediationAction } from '../types';

const OLLAMA_URL = "http://127.0.0.1:11434/api/generate";
const DEFAULT_MODEL = "llama3"; 

/**
 * Utilidad para invocar a Ollama en el MacBook Pro del usuario.
 */
async function callOllama(prompt: string, systemInstruction: string): Promise<any> {
  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      mode: 'cors', // Crucial para permitir peticiones desde el dominio de Firebase a localhost
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        prompt: prompt,
        system: systemInstruction,
        format: "json",
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 2048,
          num_ctx: 4096
        }
      })
    });

    if (!response.ok) {
      if (response.status === 404) throw new Error(`Modelo ${DEFAULT_MODEL} no encontrado. Ejecuta 'ollama pull ${DEFAULT_MODEL}'`);
      throw new Error(`Ollama Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    let text = data.response.trim();
    
    // Limpieza de JSON por si el modelo añade ruido
    const jsonMatch = text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/);
    if (jsonMatch) text = jsonMatch[0];
    
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Fallo de conexión con Ollama Local:", error);
    throw error;
  }
}

export async function suggestControlsFromProfile(provider: ThirdParty): Promise<any[]> {
  const prompt = `Analiza: ${provider.name}, Industria: ${provider.industry}. Sugiere 3 controles suplementarios. JSON: [{id, domain, name, description, reason, standard}]`;
  const system = "Eres un consultor senior de TPRM. Responde SOLO JSON en ESPAÑOL.";
  try {
    const result = await callOllama(prompt, system);
    return Array.isArray(result) ? result : (result.controls || []);
  } catch {
    return [];
  }
}

export async function generateRemediationPlan(
  provider: ThirdParty,
  failedControls: { control: ControlDefinition, status: string, justification: string }[]
): Promise<RemediationAction[]> {
  const context = failedControls.map(f => `ID: ${f.control.id} | HALLAZGO: ${f.justification}`).join("\n");
  const prompt = `Plan remediación para ${provider.name}:\n${context}\nJSON: [{controlId, controlName, action, priority, estimatedEffort, deadline}]`;
  const system = "CISO experto. Responde SOLO JSON en ESPAÑOL.";
  try {
    const result = await callOllama(prompt, system);
    return Array.isArray(result) ? result : (result.remediations || []);
  } catch {
    return [];
  }
}

export async function evaluateControlWithRAG(
  control: ControlDefinition,
  chunks: EvidenceChunk[]
): Promise<Omit<EvaluationAI, 'value' | 'score' | 'adjustedScore'>> {
  const startTime = Date.now();

  if (chunks.length === 0) {
    return {
      controlId: control.id,
      status: ControlStatus.InsufficientEvidence,
      justification: "Sin evidencia documental.",
      citations: [],
      confidence: 0,
      uncertaintyFlag: true,
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime
    };
  }

  const context = chunks.map(c => c.text).join("\n\n");
  const prompt = `Evalúa: ${control.name}. EVIDENCIA: ${context}. JSON: {status: "compliant"|"non_compliant", justification: string, confidence: number, citations: string[]}`;
  const system = "Auditor senior. Responde SOLO JSON en ESPAÑOL.";

  try {
    const result = await callOllama(prompt, system);
    let finalStatus = ControlStatus.InsufficientEvidence;
    const s = result.status?.toLowerCase();
    if (s?.includes('compliant') || s?.includes('cumple')) finalStatus = ControlStatus.Compliant;
    else if (s?.includes('non') || s?.includes('no')) finalStatus = ControlStatus.NonCompliant;

    return {
      controlId: control.id,
      status: finalStatus,
      justification: result.justification,
      citations: result.citations || [],
      confidence: result.confidence || 0.5,
      uncertaintyFlag: (result.confidence || 0.5) < 0.6,
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime
    };
  } catch (error: any) {
    return {
      controlId: control.id,
      status: ControlStatus.InsufficientEvidence,
      justification: `Error de Nodo Local: ${error.message}. Verifique que Ollama esté activo con OLLAMA_ORIGINS="*".`,
      citations: [],
      confidence: 0,
      uncertaintyFlag: true,
      timestamp: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime
    };
  }
}
