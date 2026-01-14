"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon } from "@/icons";
import GradeHorariaViewer from "@/components/grade-horaria/GradeHorariaViewer";
import TurmaSidebar from "@/components/grade-horaria/TurmaSidebar";
import {
  getGradeHoraria,
  validarGradeHoraria,
  gerarGradeAutomaticamente,
  deleteGradeHoraria,
  type GradeHoraria,
  type Horario,
  type StatusGrade,
} from "@/lib/api/grades-horarias";

export default function DetalhesGradeHorariaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [grade, setGrade] = useState<GradeHoraria | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [horarioSelecionado, setHorarioSelecionado] = useState<Horario | null>(null);

  useEffect(() => {
    fetchGrade();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchGrade = async () => {
    setIsLoading(true);
    try {
      const response = await getGradeHoraria(id);
      const gradeData = response.data || response.payload;

      if (gradeData) {
        setGrade(gradeData);
      }
    } catch (error: any) {
      toast.error("Erro ao carregar grade", {
        description: error.response?.data?.message || "Não foi possível carregar a grade.",
      });
      router.push("/planejamento/grade-horaria");
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidar = async () => {
    if (!grade) return;

    if (!confirm(`Tem certeza que deseja validar a grade "${grade.nome}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await validarGradeHoraria(id);
      toast.success("Grade validada com sucesso!");
      fetchGrade();
    } catch (error: any) {
      toast.error("Erro ao validar grade", {
        description: error.response?.data?.message || "Não foi possível validar a grade.",
      });
    }
  };

  const handleGerarAutomaticamente = async () => {
    if (!grade) return;

    if (!confirm("Deseja gerar/regenerar a grade automaticamente? Isso pode sobrescrever horários existentes.")) {
      return;
    }

    setIsGenerating(true);
    try {
      const response = await gerarGradeAutomaticamente(id);

      if (response.success || response.data || response.payload) {
        toast.success(response.message || "Grade gerada com sucesso!", {
          description: response.estatisticas
            ? `${response.estatisticas.aulasAlocadas || 0} aulas alocadas`
            : undefined,
        });

        // Mostrar conflitos se houver
        if (response.conflitos && response.conflitos.length > 0) {
          console.warn("Conflitos encontrados:", response.conflitos);
          toast.warning(`${response.conflitos.length} conflito(s) encontrado(s)`, {
            description: "Verifique o console para detalhes.",
          });
        }

        fetchGrade();
      }
    } catch (error: any) {
      toast.error("Erro ao gerar grade", {
        description: error.response?.data?.message || "Não foi possível gerar a grade.",
      });

      if (error.response?.data?.conflitos) {
        console.error("Conflitos:", error.response.data.conflitos);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!grade) return;

    if (!confirm(`Tem certeza que deseja excluir a grade "${grade.nome}"?`)) {
      return;
    }

    try {
      await deleteGradeHoraria(id);
      toast.success("Grade excluída com sucesso!");
      router.push("/planejamento/grade-horaria");
    } catch (error: any) {
      toast.error("Erro ao excluir grade", {
        description: error.response?.data?.message || "Não foi possível excluir a grade.",
      });
    }
  };

  const getStatusBadge = (status: StatusGrade) => {
    const badges = {
      rascunho: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      ativa: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
      arquivada: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400",
    };

    const labels = {
      rascunho: "Rascunho",
      ativa: "Ativa",
      arquivada: "Arquivada",
    };

    return (
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const handleHorarioClick = (horario: Horario) => {
    setHorarioSelecionado(horario);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
      </div>
    );
  }

  if (!grade) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 dark:text-gray-400">Grade não encontrada</p>
      </div>
    );
  }

  const turmaInfo = typeof grade.turma === "object" ? grade.turma : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/planejamento/grade-horaria">
          <button className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800">
            <ChevronLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-400" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            {grade.nome}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {turmaInfo ? `${turmaInfo.nome} (${turmaInfo.codigo})` : "Turma não encontrada"}
          </p>
        </div>
        <div className="flex gap-2">
          {!grade.validada && (
            <>
              <Button
                variant="outline"
                onClick={handleGerarAutomaticamente}
                disabled={isGenerating}
              >
                {isGenerating ? "Gerando..." : "Gerar Automaticamente"}
              </Button>
              <Link href={`/planejamento/grade-horaria/${id}/editar`}>
                <Button variant="outline">Editar</Button>
              </Link>
              <Button onClick={handleValidar} disabled={!grade.horarios || grade.horarios.length === 0}>
                Validar Grade
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Informações da Grade */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
          <div className="mt-2">
            {getStatusBadge(grade.status)}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Ano Letivo</p>
          <p className="mt-2 text-xl font-semibold text-gray-800 dark:text-white/90">
            {grade.anoLetivo}/{grade.semestre}º semestre
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total de Aulas</p>
          <p className="mt-2 text-xl font-semibold text-gray-800 dark:text-white/90">
            {grade.horarios?.length || 0}
          </p>
        </div>
      </div>

      {/* Descrição */}
      {grade.descricao && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white/90 mb-2">Descrição</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">{grade.descricao}</p>
        </div>
      )}

      {/* Grade Horária e Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grade Horária - 70% */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-medium text-gray-800 dark:text-white/90 mb-4">
              Grade Horária
            </h2>

            {grade.horarios && grade.horarios.length > 0 ? (
              <GradeHorariaViewer
                horarios={grade.horarios}
                onHorarioClick={handleHorarioClick}
                selectedHorarioId={horarioSelecionado?._id}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhum horário alocado ainda.
                </p>
                {!grade.validada && (
                  <Button
                    onClick={handleGerarAutomaticamente}
                    disabled={isGenerating}
                    className="mt-4"
                  >
                    {isGenerating ? "Gerando..." : "Gerar Grade Automaticamente"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - 30% */}
        <div className="lg:col-span-1">
          <TurmaSidebar
            horarioSelecionado={horarioSelecionado}
            todosHorarios={grade.horarios || []}
          />
        </div>
      </div>

      {/* Ações de Perigo */}
      {!grade.validada && (
        <div className="rounded-xl border border-error-200 bg-error-50 p-6 dark:border-error-800 dark:bg-error-900/20">
          <h2 className="text-lg font-medium text-error-800 dark:text-error-400 mb-2">
            Zona de Perigo
          </h2>
          <p className="text-sm text-error-700 dark:text-error-300 mb-4">
            Ações irreversíveis. Tenha cuidado!
          </p>
          <Button variant="outline" onClick={handleDelete} className="border-error-500 text-error-500 hover:bg-error-50">
            Excluir Grade
          </Button>
        </div>
      )}
    </div>
  );
}
