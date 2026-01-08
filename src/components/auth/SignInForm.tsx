"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { login as apiLogin } from "@/lib/api/users";
import { clearAuthCookies } from "@/lib/api/client";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const signInSchema = z.object({
  email: z.string().min(1, "E-mail é obrigatório").email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
  rememberMe: z.boolean().optional(),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignInForm() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  const onSubmit = async (data: SignInFormData) => {
    try {
      // Clear any existing cookies before attempting login
      clearAuthCookies();

      const response = await apiLogin({
        email: data.email,
        password: data.password,
        permanecerLogado: data.rememberMe,
      });

      if (response.payload) {
        // Login user with returned data
        login({
          id: response.payload._id, // API uses _id
          nome: response.payload.nome,
          email: response.payload.email,
          tipo: response.payload.tipo,
          escola: response.payload.escolas?.[0], // API uses escolas array
        });

        // Show success message
        toast.success(response.message || "Login realizado com sucesso!", {
          description: `Bem-vindo de volta, ${response.payload.nome}!`,
        });

        // Redirect to home
        router.push("/");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message;

      // Check for invalid credentials message
      if (errorMessage?.toLowerCase().includes("credenciais") ||
          errorMessage?.toLowerCase().includes("informações") ||
          errorMessage?.toLowerCase().includes("senha") ||
          errorMessage?.toLowerCase().includes("email")) {
        // Mark fields as invalid
        setError("email", {
          type: "manual",
          message: " ",
        });
        setError("password", {
          type: "manual",
          message: errorMessage || "E-mail ou senha incorretos",
        });
        toast.error("Credenciais inválidas", {
          description: errorMessage || "E-mail ou senha incorretos. Verifique seus dados e tente novamente.",
        });
      } else {
        // Show generic error toast
        toast.error("Erro ao fazer login", {
          description: errorMessage || "Ocorreu um erro ao fazer login. Tente novamente.",
        });
      }
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Entrar
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Informe seu e-mail e senha para acessar o Grade Horária.
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-6">
                <div>
                  <Label>
                    E-mail <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    placeholder="seu@email.com"
                    type="email"
                    {...register("email")}
                    error={errors.email?.message}
                  />
                </div>
                <div>
                  <Label>
                    Senha <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite sua senha"
                      {...register("password")}
                      error={errors.password?.message}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox {...register("rememberMe")} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Manter sessão ativa
                    </span>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <div>
                  <Button
                    className="w-full"
                    size="sm"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Entrando..." : "Entrar"}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Ainda não tem uma conta?{" "}
                <Link
                  href="/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Cadastre-se
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
