"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { PlusIcon, ChevronLeftIcon } from "@/icons";
import {
  getEscola,
  deleteFilial,
  type Escola,
} from "@/lib/api/escolas";
import { toast } from "sonner";

export default function DetalhesInstituicaoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [escola, setEscola] = useState<Escola | null>(null);
  const [filiais, setFiliais] = useState<Escola[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [filialToDelete, setFilialToDelete] = useState<Escola | null>(null);

  const fetchEscola = async () => {
    setIsLoading(true);
    try {
      // A API valida automaticamente se o usuário tem acesso à escola
      const response = await getEscola(id);
      const escolaData = response.data || response.payload;

      if (escolaData) {
        setEscola(escolaData);

        // Se for matriz (não tem escolaMatriz), exibir filiais do array
        if (!escolaData.escolaMatriz && escolaData.filiais) {
          // Filiais já vem populadas na resposta de getEscola
          setFiliais(Array.isArray(escolaData.filiais) && typeof escolaData.filiais[0] === 'object'
            ? escolaData.filiais as Escola[]
            : []);
        }
      }
    } catch (error: any) {
      toast.error("Erro ao carregar instituição", {
        description:
          error.response?.data?.message ||
          "Ocorreu um erro ao carregar os dados da instituição.",
      });
      router.push("/planejamento/instituicoes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEscola();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDeleteFilial = async () => {
    if (!filialToDelete || !escola) return;

    try {
      const response = await deleteFilial(escola._id, filialToDelete._id);
      toast.success(response.message || "Filial deletada com sucesso!");
      setDeleteModalOpen(false);
      setFilialToDelete(null);
      fetchEscola(); // Recarregar lista
    } catch (error: any) {
      toast.error("Erro ao deletar filial", {
        description:
          error.response?.data?.message || "Ocorreu um erro ao deletar a filial.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
      </div>
    );
  }

  if (!escola) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/planejamento/instituicoes">
          <button className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800">
            <ChevronLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-400" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            {escola.nome}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Detalhes da instituição
          </p>
        </div>
        <Link href={`/planejamento/instituicoes/${id}/editar`}>
          <Button variant="outline" size="sm">
            Editar
          </Button>
        </Link>
      </div>

      {/* Informações da Instituição */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
          Informações Gerais
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Nome</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {escola.nome}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">CNPJ</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {escola.cnpj}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">E-mail</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {escola.contato?.email || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Telefone</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {escola.contato?.telefone || escola.contato?.celular || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Endereço</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {escola.endereco.logradouro && escola.endereco.numero
                ? `${escola.endereco.logradouro}, ${escola.endereco.numero}`
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Cidade/Estado</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {escola.endereco.cidade}/{escola.endereco.uf}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">CEP</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {escola.endereco.cep || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tipo</p>
            <p className="mt-1">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  !escola.escolaMatriz
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {!escola.escolaMatriz ? "Matriz" : "Filial"}
              </span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
            <p className="mt-1">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  escola.ativa
                    ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {escola.ativa ? "Ativo" : "Inativo"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Filiais (apenas se for matriz) */}
      {!escola.escolaMatriz && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-800 dark:text-white/90">
                Filiais
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {filiais.length}{" "}
                {filiais.length === 1 ? "filial cadastrada" : "filiais cadastradas"}
              </p>
            </div>
            <Link href={`/planejamento/instituicoes/${id}/filiais/criar`}>
              <Button size="sm" startIcon={<PlusIcon />}>
                Adicionar Filial
              </Button>
            </Link>
          </div>

          {filiais.length === 0 ? (
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
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-medium text-gray-800 dark:text-white/90">
                  Nenhuma filial cadastrada
                </h3>
                <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  Adicione filiais para expandir sua rede de ensino.
                </p>
                <Link href={`/planejamento/instituicoes/${id}/filiais/criar`}>
                  <Button size="sm" startIcon={<PlusIcon />}>
                    Adicionar Filial
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        CNPJ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Cidade/Estado
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
                    {filiais.map((filial) => (
                      <tr
                        key={filial._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                              <svg
                                className="h-5 w-5 text-gray-500 dark:text-gray-400"
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
                            <div>
                              <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                                {filial.nome}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {filial.contato?.email || "-"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {filial.cnpj || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {filial.endereco.cidade}/{filial.endereco.uf}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              filial.ativa
                                ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                          >
                            {filial.ativa ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/planejamento/instituicoes/${filial._id}/editar`}>
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
                                setFilialToDelete(filial);
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
            </div>
          )}
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && filialToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
              Confirmar exclusão
            </h3>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              Tem certeza que deseja deletar a filial "
              <span className="font-medium text-gray-800 dark:text-white/90">
                {filialToDelete.nome}
              </span>
              "? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setFilialToDelete(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDeleteFilial}
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
