"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { PlusIcon } from "@/icons";
import {
  listTurmas,
  deleteTurma,
  toggleTurmaStatus,
  type Turma,
  type Turno,
  type Serie,
} from "@/lib/api/turmas";
import { useSchool } from "@/context/SchoolContext";
import { toast } from "sonner";

export default function TurmasPage() {
  const router = useRouter();
  const { selectedSchool } = useSchool();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTurno, setFilterTurno] = useState<Turno | "">("");
  const [filterAnoLetivo, setFilterAnoLetivo] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [turmaToDelete, setTurmaToDelete] = useState<Turma | null>(null);

  const fetchTurmas = async (page = 1) => {
    if (!selectedSchool) {
      setTurmas([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const params: any = {
        page,
        limit: 10,
        idEscola: selectedSchool._id,
      };

      if (searchTerm) params.search = searchTerm;
      if (filterTurno) params.turno = filterTurno;
      if (filterAnoLetivo) params.anoLetivo = parseInt(filterAnoLetivo);

      const response = await listTurmas(params);
      const paginationData = response.data || response.payload;

      if (paginationData) {
        setTurmas(paginationData.docs);
        setTotalPages(paginationData.totalPages);
        setCurrentPage(paginationData.page);
      }
    } catch (error: any) {
      toast.error("Erro ao carregar turmas", {
        description:
          error.response?.data?.message ||
          "Ocorreu um erro ao carregar a lista de turmas.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTurmas(1); // Sempre voltar para página 1 ao mudar filtros
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTurno, filterAnoLetivo, selectedSchool]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTurmas(1);
  };

  const handleToggleStatus = async (turma: Turma) => {
    try {
      const response = await toggleTurmaStatus(turma._id);
      toast.success(
        response.message ||
          `Turma ${turma.ativa ? "desativada" : "ativada"} com sucesso!`
      );
      fetchTurmas(currentPage);
    } catch (error: any) {
      toast.error("Erro ao alterar status", {
        description:
          error.response?.data?.message ||
          "Ocorreu um erro ao alterar o status da turma.",
      });
    }
  };

  const handleDeleteTurma = async () => {
    if (!turmaToDelete) return;

    try {
      const response = await deleteTurma(turmaToDelete._id);
      toast.success(response.message || "Turma deletada com sucesso!");
      setDeleteModalOpen(false);
      setTurmaToDelete(null);
      fetchTurmas(currentPage);
    } catch (error: any) {
      toast.error("Erro ao deletar turma", {
        description:
          error.response?.data?.message ||
          "Ocorreu um erro ao deletar a turma.",
      });
    }
  };

  const formatSerie = (serie: Serie) => {
    const labels: Record<Serie, string> = {
      "1ano_infantil": "1º Ano Infantil",
      "2ano_infantil": "2º Ano Infantil",
      "3ano_infantil": "3º Ano Infantil",
      "1ano_fundamental": "1º Ano Fundamental",
      "2ano_fundamental": "2º Ano Fundamental",
      "3ano_fundamental": "3º Ano Fundamental",
      "4ano_fundamental": "4º Ano Fundamental",
      "5ano_fundamental": "5º Ano Fundamental",
      "6ano_fundamental": "6º Ano Fundamental",
      "7ano_fundamental": "7º Ano Fundamental",
      "8ano_fundamental": "8º Ano Fundamental",
      "9ano_fundamental": "9º Ano Fundamental",
      "1ano_medio": "1º Ano Médio",
      "2ano_medio": "2º Ano Médio",
      "3ano_medio": "3º Ano Médio",
      "eja_fundamental": "EJA Fundamental",
      "eja_medio": "EJA Médio",
    };
    return labels[serie] || serie;
  };

  const formatTurno = (turno: Turno) => {
    const labels: Record<Turno, string> = {
      manha: "Manhã",
      tarde: "Tarde",
      noite: "Noite",
      integral: "Integral",
    };
    return labels[turno] || turno;
  };

  // Mensagem quando não há escola selecionada
  if (!selectedSchool && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-800 dark:text-white/90">
            Nenhuma escola selecionada
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Selecione uma escola no seletor acima para visualizar as turmas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Turmas
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gerencie as turmas da sua escola
          </p>
        </div>
        <Link href="/planejamento/turmas/criar">
          <Button size="sm" startIcon={<PlusIcon />}>
            Nova Turma
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <form onSubmit={handleSearch} className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Buscar por nome ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
              />
            </div>
          </div>
          <select
            value={filterTurno}
            onChange={(e) => setFilterTurno(e.target.value as Turno | "")}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="">Todos os Turnos</option>
            <option value="manha">Manhã</option>
            <option value="tarde">Tarde</option>
            <option value="noite">Noite</option>
            <option value="integral">Integral</option>
          </select>
          <input
            type="number"
            placeholder="Ano Letivo"
            value={filterAnoLetivo}
            onChange={(e) => setFilterAnoLetivo(e.target.value)}
            className="w-32 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
          />
          <Button type="submit" size="sm">
            Buscar
          </Button>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
          </div>
        ) : turmas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <svg
                className="h-8 w-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-800 dark:text-white/90">
              Nenhuma turma encontrada
            </h3>
            <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Comece criando a primeira turma da sua escola.
            </p>
            <Link href="/planejamento/turmas/criar">
              <Button size="sm" startIcon={<PlusIcon />}>
                Nova Turma
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Turma
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Série
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Turno
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Ano Letivo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Alunos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {turmas.map((turma) => (
                    <tr
                      key={turma._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {turma.nome}
                        </div>
                        {turma.sala && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Sala: {turma.sala}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {turma.codigo}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {formatSerie(turma.serie)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                          {formatTurno(turma.turno)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {turma.anoLetivo}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {turma.quantidadeAlunos || 0}
                        {turma.capacidadeMaxima && `/${turma.capacidadeMaxima}`}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(turma)}
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                            turma.ativa
                              ? "bg-success-50 text-success-700 hover:bg-success-100 dark:bg-success-500/10 dark:text-success-400 dark:hover:bg-success-500/20"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                          }`}
                        >
                          {turma.ativa ? "Ativa" : "Inativa"}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/planejamento/turmas/${turma._id}`}>
                            <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300">
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </button>
                          </Link>
                          <Link href={`/planejamento/turmas/${turma._id}/editar`}>
                            <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300">
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                          </Link>
                          <button
                            onClick={() => {
                              setTurmaToDelete(turma);
                              setDeleteModalOpen(true);
                            }}
                            className="rounded-lg p-2 text-gray-500 hover:bg-error-50 hover:text-error-600 dark:text-gray-400 dark:hover:bg-error-500/10 dark:hover:text-error-400"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-800">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTurmas(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTurmas(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModalOpen && turmaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
              Confirmar exclusão
            </h3>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              Tem certeza que deseja deletar a turma "
              <span className="font-medium text-gray-800 dark:text-white/90">
                {turmaToDelete.nome}
              </span>
              "? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setTurmaToDelete(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDeleteTurma}
                className="bg-error-500 hover:bg-error-600"
              >
                Deletar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
