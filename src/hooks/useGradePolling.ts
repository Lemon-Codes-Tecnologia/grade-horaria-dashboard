import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { getGradeStatus, type GradeHoraria, type StatusGeracao } from "@/lib/api/grades-horarias";

interface UseGradePollingOptions {
  onStatusChange?: (gradeId: string, status: StatusGeracao) => void;
  onComplete?: (gradeId: string) => void;
  onError?: (gradeId: string, errors: string[]) => void;
  interval?: number; // Em milissegundos
}

/**
 * Hook para monitorar o status de geração de grades horárias em tempo real
 *
 * @param grades - Lista de grades horárias para monitorar
 * @param options - Opções de configuração do polling
 */
export const useGradePolling = (
  grades: GradeHoraria[],
  options: UseGradePollingOptions = {}
) => {
  const {
    onStatusChange,
    onComplete,
    onError,
    interval = 30000, // 30 segundos por padrão
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousStatusRef = useRef<Record<string, StatusGeracao>>({});
  const notifiedRef = useRef<Set<string>>(new Set());

  const checkStatus = useCallback(async () => {
    // Filtra apenas grades que estão pendentes ou processando
    const gradesEmGeracao = grades.filter(
      (grade) =>
        grade.geracao?.status === "pendente" ||
        grade.geracao?.status === "processando"
    );

    if (gradesEmGeracao.length === 0) {
      // Não há grades sendo geradas, para o polling
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Verifica o status de cada grade
    for (const grade of gradesEmGeracao) {
      try {
        // Pega o idEscola da grade (pode ser objeto ou string)
        const idEscola = typeof grade.escola === 'object' ? grade.escola._id : grade.escola;
        const response = await getGradeStatus(grade._id, idEscola);
        const statusData = response.data || response.payload;

        if (!statusData) continue;

        const novoStatus = statusData.geracao.status;
        const statusAnterior = previousStatusRef.current[grade._id];

        // Detecta mudança de status
        if (statusAnterior && statusAnterior !== novoStatus) {
          console.log(`📊 Grade ${grade.nome}: ${statusAnterior} → ${novoStatus}`);
          onStatusChange?.(grade._id, novoStatus);
        }

        // Atualiza status anterior
        previousStatusRef.current[grade._id] = novoStatus;

        // Se foi concluída
        if (novoStatus === "concluida" && !notifiedRef.current.has(grade._id)) {
          notifiedRef.current.add(grade._id);
          toast.success("Grade horária gerada!", {
            description: `${grade.nome} foi gerada com sucesso.`,
          });
          onComplete?.(grade._id);
        }

        // Se falhou
        if (novoStatus === "falhou" && !notifiedRef.current.has(grade._id)) {
          notifiedRef.current.add(grade._id);
          const erros = statusData.geracao.erros || [];
          toast.error("Falha ao gerar grade", {
            description: erros[0] || `Não foi possível gerar ${grade.nome}.`,
          });
          onError?.(grade._id, erros);
        }
      } catch (error: any) {
        // Se a grade foi excluída (404), apenas limpa as referências
        if (error.response?.status === 404) {
          console.log(`🗑️ Grade ${grade._id} não encontrada (possivelmente excluída)`);
          delete previousStatusRef.current[grade._id];
          notifiedRef.current.delete(grade._id);
          continue;
        }

        // Para outros erros, apenas loga sem mostrar no console do usuário
        console.log(`⚠️ Erro ao verificar status da grade ${grade._id}:`, error.response?.status);
      }
    }
  }, [grades, onStatusChange, onComplete, onError]);

  useEffect(() => {
    // Inicializa status anterior para grades que já estão na lista
    grades.forEach((grade) => {
      if (grade.geracao?.status && !previousStatusRef.current[grade._id]) {
        previousStatusRef.current[grade._id] = grade.geracao.status;
      }
    });

    // Verifica se há grades em geração
    const temGradesEmGeracao = grades.some(
      (grade) =>
        grade.geracao?.status === "pendente" ||
        grade.geracao?.status === "processando"
    );

    if (temGradesEmGeracao && !intervalRef.current) {
      // Inicia polling
      console.log("🔄 Iniciando polling de status de grades...");
      checkStatus(); // Primeira verificação imediata
      intervalRef.current = setInterval(checkStatus, interval);
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [grades, interval, checkStatus]);

  // Função para forçar verificação manual
  const forceCheck = useCallback(() => {
    checkStatus();
  }, [checkStatus]);

  // Limpa notificações e status anteriores quando lista de grades muda
  useEffect(() => {
    const gradeIds = new Set(grades.map((g) => g._id));

    // Limpa notificações de grades que não existem mais
    notifiedRef.current.forEach((id) => {
      if (!gradeIds.has(id)) {
        notifiedRef.current.delete(id);
      }
    });

    // Limpa status anteriores de grades que não existem mais
    Object.keys(previousStatusRef.current).forEach((id) => {
      if (!gradeIds.has(id)) {
        delete previousStatusRef.current[id];
      }
    });
  }, [grades]);

  return { forceCheck };
};
