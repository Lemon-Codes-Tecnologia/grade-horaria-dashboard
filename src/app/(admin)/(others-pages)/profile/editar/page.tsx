"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon } from "@/icons";
import Link from "next/link";
import { getLoggedUser, updateUser } from "@/lib/api/users";
import { useAuth } from "@/context/AuthContext";

// Validation schema
const profileSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  cargo: z.string().optional(),
  telefone: z.string().optional(),
  passwordAtual: z.string().optional(),
  password: z.string().optional(),
  passwordConfirmacao: z.string().optional(),
}).refine((data) => {
  // Se preencheu algum campo de senha, todos os campos de senha devem ser preenchidos
  const hasAnyPassword = data.passwordAtual || data.password || data.passwordConfirmacao;
  if (hasAnyPassword) {
    return data.passwordAtual && data.password && data.passwordConfirmacao;
  }
  return true;
}, {
  message: "Para alterar a senha, preencha todos os campos de senha",
  path: ["password"],
}).refine((data) => {
  // Se preencheu senha nova, deve ter pelo menos 6 caracteres
  if (data.password) {
    return data.password.length >= 6;
  }
  return true;
}, {
  message: "A senha deve ter pelo menos 6 caracteres",
  path: ["password"],
}).refine((data) => {
  // Se preencheu senha, confirmação deve ser igual
  if (data.password && data.passwordConfirmacao) {
    return data.password === data.passwordConfirmacao;
  }
  return true;
}, {
  message: "As senhas não coincidem",
  path: ["passwordConfirmacao"],
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function EditarPerfilPage() {
  const router = useRouter();
  const { user: authUser, setUser: setAuthUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  // Load user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getLoggedUser();
        const user = response.data || response.payload;

        if (user) {
          setUserId(user._id);
          reset({
            nome: user.nome,
            email: user.email,
            cargo: user.cargo || "",
            telefone: user.telefone || "",
            passwordAtual: "",
            password: "",
            passwordConfirmacao: "",
          });
        }
      } catch (error: any) {
        toast.error("Erro ao carregar perfil", {
          description:
            error.response?.data?.message ||
            "Ocorreu um erro ao carregar os dados do perfil.",
        });
        router.push("/profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [reset, router]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      const updateData: any = {
        nome: data.nome,
        email: data.email,
        cargo: data.cargo || undefined,
        telefone: data.telefone || undefined,
      };

      // Se preencheu os campos de senha, incluir no update
      if (data.password && data.passwordAtual) {
        updateData.passwordAtual = data.passwordAtual;
        updateData.password = data.password;
      }

      const response = await updateUser(userId, updateData);

      const userData = response.data || response.payload;

      // Atualizar contexto de autenticação
      if (userData && authUser) {
        setAuthUser({
          ...authUser,
          nome: userData.nome,
          email: userData.email,
          cargo: userData.cargo,
          telefone: userData.telefone,
        });
      }

      const successMessage = data.password
        ? "Perfil e senha atualizados com sucesso!"
        : "Perfil atualizado com sucesso!";

      toast.success(successMessage, {
        description: "Suas informações foram atualizadas.",
      });

      router.push("/profile");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Ocorreu um erro ao atualizar o perfil. Tente novamente.";

      toast.error("Erro ao atualizar perfil", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Link href="/profile">
          <button className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800">
            <ChevronLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-400" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Editar Perfil
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Atualize suas informações pessoais
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
              Informações Básicas
            </h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <Label>
                  Nome Completo <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Digite seu nome completo"
                  {...register("nome")}
                  error={errors.nome?.message}
                />
              </div>

              <div>
                <Label>
                  E-mail <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  {...register("email")}
                  error={errors.email?.message}
                />
              </div>

              <div>
                <Label>Telefone</Label>
                <Input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  {...register("telefone")}
                  error={errors.telefone?.message}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Opcional: Seu número de telefone para contato
                </p>
              </div>

              <div>
                <Label>Cargo</Label>
                <Input
                  type="text"
                  placeholder="Seu cargo ou função"
                  {...register("cargo")}
                  error={errors.cargo?.message}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Opcional: Informe seu cargo ou função na escola
                </p>
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div>
            <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
              Alterar Senha
            </h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <Label>Senha Atual</Label>
                <Input
                  type="password"
                  placeholder="Digite sua senha atual"
                  {...register("passwordAtual")}
                  error={errors.passwordAtual?.message}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Deixe em branco se não deseja alterar a senha
                </p>
              </div>

              <div>
                <Label>Nova Senha</Label>
                <Input
                  type="password"
                  placeholder="Digite a nova senha"
                  {...register("password")}
                  error={errors.password?.message}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Mínimo de 6 caracteres
                </p>
              </div>

              <div>
                <Label>Confirmar Nova Senha</Label>
                <Input
                  type="password"
                  placeholder="Confirme a nova senha"
                  {...register("passwordConfirmacao")}
                  error={errors.passwordConfirmacao?.message}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Digite a mesma senha para confirmar
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Link href="/profile">
              <Button variant="outline" type="button" disabled={isSubmitting}>
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </div>

      {/* Info Notice */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/5">
        <div className="flex gap-3">
          <svg
            className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-400">
              Informação
            </h4>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-400/80">
              Algumas informações como tipo de usuário e escola vinculada não podem ser
              alteradas por você. Entre em contato com o administrador se precisar modificá-las.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
