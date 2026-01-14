"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { PlusIcon } from "@/icons";
import {
  listGradesHorarias,
  deleteGradeHoraria,
  validarGradeHoraria,
  type GradeHoraria,
  type StatusGrade,
} from "@/lib/api/grades-horarias";
import { listTurmas, type Turma } from "@/lib/api/turmas";
import { useSchool } from "@/context/SchoolContext";

export default function GradesHorariasPage() {
  const router = useRouter();
  const { selectedSchool } = useSchool();
  const [grades, setGrades] = useState<GradeHoraria[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusGrade | "">("");
  const [turmaFilter, setTurmaFilter] = useState("");
  const [anoLetivoFilter, setAnoLetivoFilter] = useState("");

  // Carregar turmas para o filtro
  useEffect(() => {
    const fetchTurmas = async () => {
      if (!selectedSchool) return;

      try {
        const response = await listTurmas({
          idEscola: selectedSchool._id,
          limit: 100,
        });

        const turmasData = response.data || response.payload;
        if (turmasData && turmasData.docs) {
          setTurmas(turmasData.docs);
        }
      } catch (error) {
        console.error("Erro ao carregar turmas:", error);
      }
    };

    fetchTurmas();
  }, [selectedSchool]);

  // Carregar grades
  useEffect(() => {
    fetchGrades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, search, statusFilter, turmaFilter, anoLetivoFilter, selectedSchool]);

  const fetchGrades = async () => {
    if (!selectedSchool) {
      setGrades([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const params: any = {
        idEscola: selectedSchool._id,
        page: currentPage,
        limit: 10,
      };

      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (turmaFilter) params.turma = turmaFilter;
      if (anoLetivoFilter) params.anoLetivo = parseInt(anoLetivoFilter);

      const response = await listGradesHorarias(params);
      const gradesData = response.data || response.payload;

      if (gradesData && gradesData.docs) {
        setGrades(gradesData.docs);
        setTotalPages(gradesData.totalPages);
      }
    } catch (error: any) {
      toast.error("Erro ao carregar grades horárias", {
        description: error.response?.data?.message || "Ocorreu um erro ao buscar as grades.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir a grade "${nome}"?`)) {
      return;
    }

    try {
      await deleteGradeHoraria(id);
      toast.success("Grade excluída com sucesso!");
      fetchGrades();
    } catch (error: any) {
      toast.error("Erro ao excluir grade", {
        description: error.response?.data?.message || "Não foi possível excluir a grade.",
      });
    }
  };

  const handleValidar = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja validar a grade "${nome}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await validarGradeHoraria(id);
      toast.success("Grade validada com sucesso!");
      fetchGrades();
    } catch (error: any) {
      toast.error("Erro ao validar grade", {
        description: error.response?.data?.message || "Não foi possível validar a grade.",
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
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getTurmaInfo = (grade: GradeHoraria) => {
    if (typeof grade.turma === "object" && grade.turma.nome) {
      return `${grade.turma.nome} (${grade.turma.codigo})`;
    }
    return "-";
  };

  if (!selectedSchool) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-gray-500 dark:text-gray-400">
          Selecione uma escola para visualizar as grades horárias
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Grades Horárias
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gerencie as grades horárias da escola
          </p>
        </div>
        <Link href="/planejamento/grade-horaria/criar">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Nova Grade
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div>
            <Label>Buscar</Label>
            <Input
              type="text"
              placeholder="Nome ou descrição"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <Label>Status</Label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusGrade | "")}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
            >
              <option value="">Todos</option>
              <option value="rascunho">Rascunho</option>
              <option value="ativa">Ativa</option>
              <option value="arquivada">Arquivada</option>
            </select>
          </div>
          <div>
            <Label>Turma</Label>
            <select
              value={turmaFilter}
              onChange={(e) => setTurmaFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
            >
              <option value="">Todas</option>
              {turmas.map((turma) => (
                <option key={turma._id} value={turma._id}>
                  {turma.nome} ({turma.codigo})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Ano Letivo</Label>
            <Input
              type="number"
              placeholder="Ex: 2025"
              value={anoLetivoFilter}
              onChange={(e) => setAnoLetivoFilter(e.target.value)}
              min={2020}
              max={2030}
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setTurmaFilter("");
                setAnoLetivoFilter("");
                setCurrentPage(1);
              }}
              className="w-full"
            >
              Limpar
            </Button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Turma
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Ano Letivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Horários
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
                  </td>
                </tr>
              ) : grades.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      Nenhuma grade horária encontrada
                    </p>
                  </td>
                </tr>
              ) : (
                grades.map((grade) => (
                  <tr
                    key={grade._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {grade.nome}
                        </p>
                        {grade.descricao && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {grade.descricao}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {getTurmaInfo(grade)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {grade.anoLetivo}/{grade.semestre}º sem
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(grade.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {grade.horarios?.length || 0} aulas
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/planejamento/grade-horaria/${grade._id}`}>
                          <button className="rounded-lg p-2 text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10">
                            Ver
                          </button>
                        </Link>
                        {!grade.validada && (
                          <>
                            <Link href={`/planejamento/grade-horaria/${grade._id}/editar`}>
                              <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                                Editar
                              </button>
                            </Link>
                            <button
                              onClick={() => handleValidar(grade._id, grade.nome)}
                              className="rounded-lg p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10"
                              disabled={!grade.horarios || grade.horarios.length === 0}
                            >
                              Validar
                            </button>
                            <button
                              onClick={() => handleDelete(grade._id, grade.nome)}
                              className="rounded-lg p-2 text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10"
                            >
                              Excluir
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3 dark:border-gray-800">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
