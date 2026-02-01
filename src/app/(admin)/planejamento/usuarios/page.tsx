"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import {
  MailIcon,
  PencilIcon,
  PlusIcon,
  TrashBinIcon,
  EyeIcon,
} from "@/icons";
import {
  deleteUser,
  listUsers,
  resendUserCredentials,
  type User,
} from "@/lib/api/users";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import {
  canManageUsers,
  formatUserType,
  isCoordinatorRestrictedTarget,
  isSupportRestrictedTarget,
} from "@/lib/utils/user";

export default function UsuariosPage() {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resendModalOpen, setResendModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isActing, setIsActing] = useState(false);

  const hasPermission = canManageUsers(authUser?.tipo);

  const fetchUsers = async () => {
    if (!hasPermission) {
      setUsers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await listUsers(currentPage, {
        limit: 10,
        search: search || undefined,
      });

      const data = response.data || response.payload;
      if (data?.docs) {
        setUsers(data.docs || []);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.totalDocs || data.docs?.length || 0);
      } else {
        setUsers([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error: any) {
      toast.error("Erro ao carregar usuários", {
        description:
          error.response?.data?.message ||
          "Ocorreu um erro ao buscar os usuários.",
      });
      setUsers([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, hasPermission]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setIsActing(true);
    try {
      const response = await deleteUser(selectedUser._id);
      toast.success("Usuário removido", {
        description:
          response.message || "Todas as informações da conta foram deletadas.",
      });
      setDeleteModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.message;
      if (statusCode === 403) {
        toast.error("Sem permissão", {
          description:
            errorMessage ||
            "Você não tem permissão para remover este usuário.",
        });
      } else {
        toast.error("Erro ao remover usuário", {
          description:
            errorMessage || "Ocorreu um erro ao remover o usuário.",
        });
      }
    } finally {
      setIsActing(false);
    }
  };

  const handleResend = async () => {
    if (!selectedUser) return;
    setIsActing(true);
    try {
      const response = await resendUserCredentials(selectedUser._id);
      toast.success("Credenciais reenviadas", {
        description:
          response.message ||
          "As credenciais foram reenviadas com sucesso.",
      });
      setResendModalOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast.error("Erro ao reenviar credenciais", {
        description:
          error.response?.data?.message ||
          "Ocorreu um erro ao reenviar as credenciais.",
      });
    } finally {
      setIsActing(false);
    }
  };

  const canDeleteUser = (target: User) => {
    if (!authUser) return false;
    if (authUser.id === target._id) return false;
    if (isSupportRestrictedTarget(authUser.tipo, target.tipo)) return false;
    if (isCoordinatorRestrictedTarget(authUser.tipo, target.tipo)) return false;
    return true;
  };

  const canResendCredentials = (target: User) => {
    if (!authUser) return false;
    if (isSupportRestrictedTarget(authUser.tipo, target.tipo)) return false;
    if (isCoordinatorRestrictedTarget(authUser.tipo, target.tipo)) return false;
    return true;
  };

  const canEditUser = (target: User) => {
    if (!authUser) return false;
    if (isSupportRestrictedTarget(authUser.tipo, target.tipo)) return false;
    if (isCoordinatorRestrictedTarget(authUser.tipo, target.tipo)) return false;
    return true;
  };

  const emptyStateDescription = useMemo(() => {
    if (!search) return "Comece adicionando o primeiro usuário.";
    return "Tente ajustar os filtros de busca.";
  }, [search]);

  if (!hasPermission && !isLoading) {
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
                d="M12 11c0-1.657 1.343-3 3-3s3 1.343 3 3v2a3 3 0 01-3 3h-1m-6 0a3 3 0 01-3-3v-2a3 3 0 013-3m0 8h6m-3 0v3m0-3h3"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-800 dark:text-white/90">
            Sem permissão para gestão de usuários
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Apenas administradores, suporte, diretores e coordenadores podem acessar esta área.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Usuários
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gerencie os usuários da plataforma
          </p>
        </div>
        <Link href="/planejamento/usuarios/criar">
          <Button size="sm" startIcon={<PlusIcon />}>
            Novo Usuário
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <form onSubmit={handleSearch} className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
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

      {isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
        </div>
      ) : users.length === 0 ? (
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-800 dark:text-white/90">
              Nenhum usuário encontrado
            </h3>
            <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
              {emptyStateDescription}
            </p>
            {!search && (
              <Link href="/planejamento/usuarios/criar">
                <Button size="sm" startIcon={<PlusIcon />}>
                  Novo Usuário
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <div className="min-w-[900px]">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Usuário
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        E-mail
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Tipo
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Escola
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Status
                      </TableCell>
                      <TableCell
                        isHeader
                        className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                      >
                        Ações
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {users.map((user) => {
                      const schoolName =
                        typeof user.escola === "object"
                          ? user.escola?.nome
                          : user.escolas?.[0]?.nome || user.escola || "-";
                      return (
                        <TableRow key={user._id}>
                          <TableCell className="px-5 py-4 text-sm">
                            <div className="font-medium text-gray-800 dark:text-white/90">
                              {user.nome}
                            </div>
                          </TableCell>
                          <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {user.email}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {formatUserType(user.tipo)}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {schoolName || "-"}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-sm">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                user.ativo !== false
                                  ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                              }`}
                            >
                              {user.ativo !== false ? "Ativo" : "Inativo"}
                            </span>
                          </TableCell>
                          <TableCell className="px-5 py-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/planejamento/usuarios/${user._id}`}
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                              >
                                <EyeIcon className="block h-5 w-5" />
                              </Link>
                              {canEditUser(user) ? (
                                <Link
                                  href={`/planejamento/usuarios/${user._id}/editar`}
                                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                                >
                                  <PencilIcon className="block h-5 w-5" />
                                </Link>
                              ) : (
                                <span className="rounded-lg p-2 text-gray-300 dark:text-gray-600">
                                  <PencilIcon className="block h-5 w-5" />
                                </span>
                              )}
                              <button
                                type="button"
                                disabled={!canResendCredentials(user)}
                                onClick={() => {
                                  setSelectedUser(user);
                                  setResendModalOpen(true);
                                }}
                                className={`rounded-lg p-2 ${
                                  canResendCredentials(user)
                                    ? "text-gray-500 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
                                    : "cursor-not-allowed text-gray-300 dark:text-gray-600"
                                }`}
                              >
                                <MailIcon className="block h-6 w-6 overflow-visible" />
                              </button>
                              <button
                                type="button"
                                disabled={!canDeleteUser(user)}
                                onClick={() => {
                                  setSelectedUser(user);
                                  setDeleteModalOpen(true);
                                }}
                                className={`rounded-lg p-2 ${
                                  canDeleteUser(user)
                                    ? "text-gray-500 hover:bg-error-50 hover:text-error-600 dark:text-gray-400 dark:hover:bg-error-500/10 dark:hover:text-error-400"
                                    : "cursor-not-allowed text-gray-300 dark:text-gray-600"
                                }`}
                              >
                                <TrashBinIcon className="block h-5 w-5" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Mostrando {(currentPage - 1) * 10 + 1} até{" "}
                {Math.min(currentPage * 10, totalItems)} de {totalItems} resultados
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

      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => {
          if (isActing) return;
          setDeleteModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDelete}
        title="Remover usuário"
        description={`Tem certeza que deseja remover ${selectedUser?.nome || "este usuário"}? Essa ação não pode ser desfeita.`}
        confirmText={isActing ? "Removendo..." : "Remover"}
        variant="danger"
      />

      <ConfirmDialog
        isOpen={resendModalOpen}
        onClose={() => {
          if (isActing) return;
          setResendModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={handleResend}
        title="Reenviar credenciais"
        description={`Deseja reenviar as credenciais para ${selectedUser?.nome || "este usuário"}?`}
        confirmText={isActing ? "Enviando..." : "Reenviar"}
        variant="info"
      />
    </div>
  );
}
