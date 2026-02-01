"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { PlusIcon } from "@/icons";
import {
  listDisciplinas,
  deleteDisciplina,
  toggleDisciplinaStatus,
  type Disciplina,
} from "@/lib/api/disciplinas";
import { useSchool } from "@/context/SchoolContext";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function DisciplinasPage() {
  const { selectedSchool } = useSchool();
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [disciplinaToDelete, setDisciplinaToDelete] = useState<Disciplina | null>(null);

  const fetchDisciplinas = async () => {
    if (!selectedSchool) {
      setDisciplinas([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await listDisciplinas({
        page: currentPage,
        limit: 10,
        search: search || undefined,
        idEscola: selectedSchool._id,
      });

      if (response.data) {
        const { docs, totalDocs, totalPages: total } = response.data;
        setDisciplinas(docs || []);
        setTotalPages(total || 1);
        setTotalItems(totalDocs || docs?.length || 0);
      } else if (response.payload) {
        if (response.payload.docs) {
          const { docs, totalDocs, totalPages: total } = response.payload;
          setDisciplinas(docs || []);
          setTotalPages(total || 1);
          setTotalItems(totalDocs || docs?.length || 0);
        } else {
          setDisciplinas([]);
        }
      } else {
        setDisciplinas([]);
      }
    } catch (error: any) {
      console.error("Erro ao carregar disciplinas:", error);
      toast.error("Erro ao carregar disciplinas", {
        description:
          error.response?.data?.message ||
          "Ocorreu um erro ao buscar as disciplinas.",
      });

      setDisciplinas([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDisciplinas();
  }, [currentPage, selectedSchool]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDisciplinas();
  };

  const handleDelete = async () => {
    if (!disciplinaToDelete) return;

    try {
      const response = await deleteDisciplina(disciplinaToDelete._id);
      toast.success(response.message || "Disciplina deletada com sucesso!");
      setDeleteModalOpen(false);
      setDisciplinaToDelete(null);
      fetchDisciplinas();
    } catch (error: any) {
      toast.error("Erro ao deletar disciplina", {
        description:
          error.response?.data?.message ||
          "Ocorreu um erro ao deletar a disciplina.",
      });
    }
  };

  const handleToggleStatus = async (disciplina: Disciplina) => {
    try {
      const response = await toggleDisciplinaStatus(disciplina._id);
      toast.success(
        response.message || "Status atualizado com sucesso!"
      );
      fetchDisciplinas();
    } catch (error: any) {
      toast.error("Erro ao atualizar status", {
        description:
          error.response?.data?.message ||
          "Ocorreu um erro ao atualizar o status.",
      });
    }
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
            Selecione uma escola no seletor acima para visualizar as disciplinas.
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
            Disciplinas
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gerencie as disciplinas da sua escola
          </p>
        </div>
        <Link href="/planejamento/disciplinas/criar">
          <Button size="sm" startIcon={<PlusIcon />}>
            Adicionar Disciplina
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <form onSubmit={handleSearch} className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por nome ou código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:placeholder-gray-500"
            />
          </div>
          <Button type="submit" size="sm">
            Buscar
          </Button>
        </form>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
        </div>
      ) : disciplinas.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
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
              Nenhuma disciplina encontrada
            </h3>
            <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
              {search
                ? "Tente ajustar os filtros de busca."
                : "Comece adicionando sua primeira disciplina."}
            </p>
            {!search && (
              <Link href="/planejamento/disciplinas/criar">
                <Button size="sm" startIcon={<PlusIcon />}>
                  Adicionar Disciplina
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <div className="min-w-[700px]">
                <Table>
                  {/* Table Header */}
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Disciplina
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Código
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Carga Horária
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Status
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400"
                      >
                        Ações
                      </TableCell>
                    </TableRow>
                  </TableHeader>

                  {/* Table Body */}
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {disciplinas.map((disciplina) => (
                      <TableRow key={disciplina._id}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-10 w-10 items-center justify-center rounded-lg"
                              style={{ backgroundColor: disciplina.cor || '#007bff' + '20' }}
                            >
                              <svg
                                className="h-5 w-5"
                                style={{ color: disciplina.cor || '#007bff' }}
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
                            <div>
                              <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                                {disciplina.nome}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-start">
                          <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                            {disciplina.codigo}
                          </span>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-start">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {disciplina.cargaHoraria}h
                          </span>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-start">
                          <button
                            onClick={() => handleToggleStatus(disciplina)}
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
                              disciplina.ativa
                                ? "bg-success-50 text-success-700 hover:bg-success-100 dark:bg-success-500/10 dark:text-success-400"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                          >
                            {disciplina.ativa ? "Ativa" : "Inativa"}
                          </button>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-end">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/planejamento/disciplinas/${disciplina._id}`}
                              title="Visualizar detalhes"
                            >
                              <button className="rounded-lg p-2 text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:text-gray-400 dark:hover:bg-brand-500/10 dark:hover:text-brand-400">
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
                            <Link
                              href={`/planejamento/disciplinas/${disciplina._id}/editar`}
                              title="Editar"
                            >
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
                                setDisciplinaToDelete(disciplina);
                                setDeleteModalOpen(true);
                              }}
                              title="Deletar"
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Mostrando {(currentPage - 1) * 10 + 1} até{" "}
                {Math.min(currentPage * 10, totalItems)} de {totalItems}{" "}
                resultados
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Anterior
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                    )
                    .map((page, index, array) => (
                      <React.Fragment key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-2 text-gray-400">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`rounded-lg px-4 py-2 text-sm font-medium ${
                            currentPage === page
                              ? "bg-brand-500 text-white"
                              : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && disciplinaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
              Confirmar exclusão
            </h3>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              Tem certeza que deseja deletar a disciplina "
              <span className="font-medium text-gray-800 dark:text-white/90">
                {disciplinaToDelete.nome}
              </span>
              "? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDisciplinaToDelete(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDelete}
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
