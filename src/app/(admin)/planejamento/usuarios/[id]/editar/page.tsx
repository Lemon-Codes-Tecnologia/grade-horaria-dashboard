"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";
import Checkbox from "@/components/form/input/Checkbox";
import { ChevronLeftIcon } from "@/icons";
import { useAuth } from "@/context/AuthContext";
import {
  getUser,
  getProfiles,
  updateUser,
  type User,
  type UpdateUserData,
} from "@/lib/api/users";
import {
  canManageUsers,
  formatUserType,
  formatPermissionLabel,
  sortPermissions,
  isCoordinator,
  isCoordinatorAllowedType,
  isCoordinatorRestrictedTarget,
  isSupportRestrictedTarget,
  USER_TYPE_OPTIONS,
} from "@/lib/utils/user";

const userSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
});

type UserFormData = z.infer<typeof userSchema>;

export default function EditarUsuarioPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user: authUser } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userType, setUserType] = useState("");
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [availablePermissions, setAvailablePermissions] = useState<string[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const hasPermission = canManageUsers(authUser?.tipo);
  const isCoordenador = isCoordinator(authUser?.tipo);
  const isRestricted =
    isSupportRestrictedTarget(authUser?.tipo, user?.tipo) ||
    isCoordinatorRestrictedTarget(authUser?.tipo, user?.tipo);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      nome: "",
      email: "",
    },
  });

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
        setValue("nome", userData.nome || "");
        setValue("email", userData.email || "");
        setUserType(userData.tipo || "");
        setIsActive(userData.ativo !== false);
        setSelectedPermissions(userData.permissoes || []);
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

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!hasPermission) return;
      try {
        const profilesResponse = await getProfiles();
        const profiles = profilesResponse.data || profilesResponse.payload || [];
        const uniquePermissions = Array.from(
          new Set(
            profiles.flatMap((profile) => profile.permissoes || [])
          )
        );
        setAvailablePermissions(sortPermissions(uniquePermissions));
      } catch (error) {
        setAvailablePermissions([]);
      }
    };

    fetchPermissions();
  }, [hasPermission]);

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((item) => item !== permission)
        : [...prev, permission]
    );
  };

  const permissionGroups = useMemo(() => {
    const groups: Record<string, string[]> = {};
    const order: string[] = [];
    permissionsToRender.forEach((permission) => {
      const [resource = "outros"] = permission.split(":");
      if (!groups[resource]) {
        groups[resource] = [];
        order.push(resource);
      }
      groups[resource].push(permission);
    });
    return order.map((resource) => ({
      resource,
      permissions: groups[resource],
    }));
  }, [permissionsToRender]);

  const formatResourceLabel = (resource: string) =>
    resource
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const onSubmit = async (data: UserFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const payload: UpdateUserData = {
        nome: data.nome,
        email: data.email,
        tipo: userType || undefined,
        ativo: isActive ?? undefined,
        permissoes: selectedPermissions,
      };

      const response = await updateUser(user._id, payload);
      const updatedUser = response.data || response.payload;
      if (updatedUser) {
        setUser(updatedUser);
      }

      toast.success("Usuário atualizado", {
        description:
          response.message || "As informações foram atualizadas com sucesso.",
      });
      router.push(`/planejamento/usuarios/${user._id}`);
    } catch (error: any) {
      toast.error("Erro ao atualizar usuário", {
        description:
          error.response?.data?.message ||
          "Ocorreu um erro ao atualizar o usuário.",
      });
    } finally {
      setIsSubmitting(false);
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

  const typeOptions = isCoordenador
    ? USER_TYPE_OPTIONS.filter((option) => isCoordinatorAllowedType(option.value))
    : USER_TYPE_OPTIONS;
  const permissionsToRender = useMemo(
    () =>
      sortPermissions(
        Array.from(
          new Set([...availablePermissions, ...selectedPermissions])
        )
      ),
    [availablePermissions, selectedPermissions]
  );

  if (isRestricted) {
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
              {formatUserType(user.tipo)}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-2 text-lg font-medium text-gray-800 dark:text-white/90">
            Sem permissão para editar este usuário
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Usuários de suporte não podem alterar administradores.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/planejamento/usuarios/${user._id}`}>
          <button className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800">
            <ChevronLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-400" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Editar usuário
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Atualize os dados básicos do usuário
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label>
                Nome <span className="text-error-500">*</span>
              </Label>
              <Input
                placeholder="Nome completo"
                type="text"
                {...register("nome")}
                error={errors.nome?.message}
              />
            </div>
            <div>
              <Label>
                E-mail <span className="text-error-500">*</span>
              </Label>
              <Input
                placeholder="email@dominio.com"
                type="email"
                {...register("email")}
                error={errors.email?.message}
              />
            </div>
            <div>
              <Label>Tipo de usuário</Label>
              <Select
                options={typeOptions}
                placeholder="Selecione o tipo"
                value={userType}
                onChange={(value) => setUserType(value)}
              />
            </div>
            <div className="flex items-center">
              {isActive !== null && (
                <Switch
                  key={isActive ? "active" : "inactive"}
                  label="Conta ativa"
                  defaultChecked={isActive}
                  onChange={(checked) => setIsActive(checked)}
                />
              )}
            </div>
            {!!permissionsToRender.length && (
              <div className="md:col-span-2">
                <Label>Permissões</Label>
                <div className="mt-3 space-y-6">
                  {permissionGroups.map((group) => (
                    <div key={group.resource}>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {formatResourceLabel(group.resource)}
                      </p>
                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                        {group.permissions.map((permission) => (
                          <Checkbox
                            key={permission}
                            label={formatPermissionLabel(permission)}
                            checked={selectedPermissions.includes(permission)}
                            onChange={() => togglePermission(permission)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Selecione as permissões específicas para o usuário.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar alterações"}
          </Button>
          <Link href={`/planejamento/usuarios/${user._id}`}>
            <Button variant="outline" size="sm" type="button">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
