
import React, { useState } from 'react';
import { EvidenceChunk } from '../types';
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  assessmentId: string;
  providerId: string;
  existingCount: number;
  onUpload: (chunks: EvidenceChunk[]) => void;
}

const EvidenceUpload: React.FC<Props> = ({ assessmentId, providerId, onUpload, existingCount }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    
    setTimeout(() => {
      const simulatedText = `Evidencia para el documento ${file.name}. Este es un texto simulado que contiene varias políticas de seguridad cibernética. Implementamos MFA para todos los usuarios. Los datos sensibles se cifran mediante AES-256. La respuesta a incidentes se maneja en un plazo de 24 horas. El plan de continuidad del negocio se actualiza anualmente. El SDLC seguro incluye revisiones de código obligatorias para todos los cambios de producción. El control de acceso sigue el principio de privilegio mínimo.`;
      
      const chunks: EvidenceChunk[] = [
        {
          id: `chunk-${Date.now()}-1`,
          assessmentId,
          documentName: file.name,
          text: simulatedText.substring(0, 500),
          timestamp: new Date().toISOString()
        }
      ];

      onUpload(chunks);
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-400 transition cursor-pointer relative">
        <input 
          type="file" 
          className="absolute inset-0 opacity-0 cursor-pointer" 
          onChange={handleFileChange}
          accept=".pdf,.docx,.txt"
          disabled={isProcessing}
        />
        <Upload className={`mx-auto mb-2 text-slate-400 ${isProcessing ? 'animate-bounce' : ''}`} />
        <div className="text-sm font-semibold text-slate-700">
          {isProcessing ? 'Fragmentando e Indexando...' : 'Subir Evidencia de Auditoría'}
        </div>
        <p className="text-xs text-slate-400 mt-1">Archivos PDF, DOCX o TXT permitidos</p>
      </div>

      <div className="flex items-center justify-between text-xs font-medium text-slate-500 px-2">
        <div className="flex items-center gap-1">
          <CheckCircle2 size={14} className="text-green-500" />
          {existingCount} Documentos Indexados
        </div>
        {existingCount === 0 && (
          <div className="flex items-center gap-1 text-amber-600">
            <AlertCircle size={14} />
            No se encontró evidencia
          </div>
        )}
      </div>
    </div>
  );
};

export default EvidenceUpload;
