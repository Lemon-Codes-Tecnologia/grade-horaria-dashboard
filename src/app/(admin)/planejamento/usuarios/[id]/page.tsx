"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, MailIcon, TrashBinIcon } from "@/icons";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  deleteUser,
  getUser,
  resendUserCredentials,
  type User,
} from "@/lib/api/users";
import {
  canManageUsers,
  formatUserType,
  isCoordinatorRestrictedTarget,
  isSupportRestrictedTarget,
} from "@/lib/utils/user";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";

export default function UsuarioDetalhesPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user: authUser } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resendModalOpen, setResendModalOpen] = useState(false);
  const [isActing, setIsActing] = useState(false);

  const hasPermission = canManageUsers(authUser?.tipo);
  const isRestricted =
    isSupportRestrictedTarget(authUser?.tipo, user?.tipo) ||
    isCoordinatorRestrictedTarget(authUser?.tipo, user?.tipo);

  const fetchUser = async () => {
    if (!hasPermission) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await getUser(id);
      const userData = response.data || response.payload;

      if (userData) {
        setUser(userData);
      }
    } catch (error: any) {
      toast.error("Erro ao carregar usuário", {
        description:
          error.response?.data?.message ||
          "Ocorreu um erro ao carregar os dados do usuário.",
      });
      router.push("/planejamento/usuarios");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, hasPermission]);

  const handleResend = async () => {
    if (!user) return;
    setIsActing(true);
    try {
      const response = await resendUserCredentials(user._id);
      toast.success("Credenciais reenviadas", {
        description:
          response.message ||
          "As credenciais foram reenviadas com sucesso.",
      });
      setResendModalOpen(false);
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

  const handleDelete = async () => {
    if (!user) return;
    setIsActing(true);
    try {
      const response = await deleteUser(user._id);
      toast.success("Usuário removido", {
        description:
          response.message || "Todas as informações da conta foram deletadas.",
      });
      router.push("/planejamento/usuarios");
    } catch (error: any) {
      toast.error("Erro ao remover usuário", {
        description:
          error.response?.data?.message ||
          "Ocorreu um erro ao remover o usuário.",
      });
    } finally {
      setIsActing(false);
    }
  };

  if (!hasPermission && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-gray-500 dark:text-gray-400">
          Você não tem permissão para acessar esta área.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const escolaNome =
    typeof user.escola === "object"
      ? user.escola?.nome
      : user.escolas?.[0]?.nome || user.escola || "-";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/planejamento/usuarios">
          <button className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800">
            <ChevronLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-400" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            {user.nome}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Detalhes do usuário
          </p>
        </div>
        <Link href={`/planejamento/usuarios/${user._id}/editar`}>
          <Button variant="outline" size="sm" disabled={isRestricted}>
            Editar
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setResendModalOpen(true)}
          disabled={isRestricted}
          startIcon={<MailIcon />}
        >
          Reenviar credenciais
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDeleteModalOpen(true)}
          disabled={isRestricted || authUser?.id === user._id}
          startIcon={<TrashBinIcon />}
        >
          Remover
        </Button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
          Informações gerais
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Nome</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {user.nome}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">E-mail</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {user.email}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tipo</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {formatUserType(user.tipo)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Escola</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {escolaNome || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
            <p className="mt-1">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  user.ativo !== false
                    ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {user.ativo !== false ? "Ativo" : "Inativo"}
              </span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Primeiro acesso
            </p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {user.primeiroLogin !== undefined
                ? user.primeiroLogin
                  ? "Pendente"
                  : "Realizado"
                : "Não informado"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Criado em</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "Não informado"}
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => {
          if (isActing) return;
          setDeleteModalOpen(false);
        }}
        onConfirm={handleDelete}
        title="Remover usuário"
        description={`Tem certeza que deseja remover ${user.nome}? Essa ação não pode ser desfeita.`}
        confirmText={isActing ? "Removendo..." : "Remover"}
        variant="danger"
      />

      <ConfirmDialog
        isOpen={resendModalOpen}
        onClose={() => {
          if (isActing) return;
          setResendModalOpen(false);
        }}
        onConfirm={handleResend}
        title="Reenviar credenciais"
        description={`Deseja reenviar as credenciais para ${user.nome}?`}
        confirmText={isActing ? "Enviando..." : "Reenviar"}
        variant="info"
      />
    </div>
  );
}
