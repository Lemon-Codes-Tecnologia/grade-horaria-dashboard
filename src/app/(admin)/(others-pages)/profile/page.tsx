"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { getLoggedUser, deleteUser } from "@/lib/api/users";
import { toast } from "sonner";

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await getLoggedUser();
        const userData = response.data || response.payload;
        if (userData) {
          console.log("Dados do usuário recebidos:", userData);
          setUser(userData);
        }
      } catch (error: any) {
        toast.error("Erro ao carregar perfil", {
          description: error.response?.data?.message || "Não foi possível carregar os dados do perfil.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      await deleteUser(user._id);
      toast.success("Conta deletada com sucesso", {
        description: "Sua conta foi removida permanentemente.",
      });

      // Fazer logout e redirecionar
      await logout();
      router.push("/signin");
    } catch (error: any) {
      toast.error("Erro ao deletar conta", {
        description: error.response?.data?.message || "Não foi possível deletar sua conta.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

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

  const tipoLabels: Record<string, string> = {
    admin: "Administrador",
    administrador: "Administrador",
    suporte: "Suporte",
    diretor: "Diretor",
    coordenador: "Coordenador",
    secretario: "Secretário",
    professor: "Professor",
    pai: "Responsável",
    responsavel: "Responsável",
    aluno: "Aluno",
  };

  const roleLabels: Record<string, string> = {
    admin: "Administrador",
    premium: "Premium",
    "": "Padrão",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Meu Perfil
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gerencie suas informações pessoais
          </p>
        </div>
        <Link href="/profile/editar">
          <Button size="sm">Editar Perfil</Button>
        </Link>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-100 text-3xl font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            {user.nome.charAt(0).toUpperCase()}
          </div>

          {/* User Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              {user.nome}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {user.email}
            </p>
            {user.telefone && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {user.telefone}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                {tipoLabels[user.tipo] || user.tipo}
              </span>
              {user.ativo !== undefined && (
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                    user.ativo
                      ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  {user.ativo ? "Ativo" : "Inativo"}
                </span>
              )}
              {user.role && user.role !== "" && (
                <span className="inline-flex rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">
                  {roleLabels[user.role] || user.role}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
            Informações Pessoais
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Nome Completo</p>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {user.nome || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">E-mail</p>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {user.email || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Telefone</p>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {user.telefone || "Não informado"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tipo de Usuário</p>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {tipoLabels[user.tipo] || user.tipo || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Cargo</p>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {user.cargo || "Não informado"}
              </p>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
            Informações da Conta
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Status da Conta</p>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {user.ativo !== undefined ? (user.ativo ? "Ativa" : "Inativa") : "Não informado"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Primeiro Acesso</p>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {user.primeiroLogin !== undefined ? (user.primeiroLogin ? "Pendente" : "Realizado") : "Não informado"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sessão Persistente</p>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {user.sessionKeepAlive !== undefined ? (user.sessionKeepAlive ? "Ativa" : "Desativada") : "Não informado"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Plano</p>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {user.role ? (roleLabels[user.role] || user.role) : "Padrão"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Membro desde</p>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }) : "Não informado"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Última Atualização</p>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }) : "Não informado"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">ID do Usuário</p>
              <p className="mt-1 font-mono text-xs text-gray-600 dark:text-gray-400">
                {user._id || "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-error-200 bg-error-50 p-6 dark:border-error-500/20 dark:bg-error-500/5">
        <h3 className="mb-2 text-lg font-medium text-error-800 dark:text-error-400">
          Zona de Perigo
        </h3>
        <p className="mb-4 text-sm text-error-700 dark:text-error-400/80">
          Ao deletar sua conta, todas as suas informações serão permanentemente removidas.
          Esta ação não pode ser desfeita.
        </p>
        <Button
          variant="outline"
          onClick={() => setDeleteModalOpen(true)}
          className="border-error-300 text-error-700 hover:bg-error-100 dark:border-error-500/30 dark:text-error-400 dark:hover:bg-error-500/10"
        >
          Deletar Minha Conta
        </Button>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
              Confirmar Exclusão da Conta
            </h3>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              Tem certeza que deseja deletar permanentemente sua conta? Todas as suas informações,
              incluindo dados pessoais e histórico, serão removidas. Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-error-500 hover:bg-error-600"
              >
                {isDeleting ? "Deletando..." : "Sim, Deletar Conta"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
