"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { registerUser, validateEmail } from "@/lib/api/users";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const signUpSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z
    .string()
    .min(1, "E-mail é obrigatório")
    .email("E-mail inválido"),
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres"),
  termsAccepted: z
    .boolean()
    .refine((val) => val === true, "Você deve aceitar os termos"),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpForm() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      termsAccepted: false,
    },
  });

  const emailValue = watch("email");

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  // Email validation in real-time (disabled - enable when API is ready)
  // useEffect(() => {
  //   if (!emailValue || errors.email) return;

  //   const timeoutId = setTimeout(async () => {
  //     setIsCheckingEmail(true);
  //     try {
  //       const response = await validateEmail({ email: emailValue });
  //       if (!response.payload?.available) {
  //         setError("email", {
  //           type: "manual",
  //           message: "Este e-mail já está cadastrado",
  //         });
  //       }
  //     } catch (error: any) {
  //       // Silently fail - validation is optional
  //     } finally {
  //       setIsCheckingEmail(false);
  //     }
  //   }, 800);

  //   return () => clearTimeout(timeoutId);
  // }, [emailValue, setError, errors.email]);

  const onSubmit = async (data: SignUpFormData) => {
    try {
      const response = await registerUser({
        nome: data.nome,
        email: data.email,
        password: data.password,
      });

      console.log("📦 Resposta completa da API:", response);
      console.log("👤 response.payload:", response.payload);

      if (response.payload) {
        console.log("🔐 Fazendo login automático...");

        // Login user automatically with returned data
        login({
          id: response.payload._id, // API uses _id instead of id
          nome: response.payload.nome,
          email: response.payload.email,
          tipo: response.payload.tipo,
          escola: response.payload.escolas?.[0], // API uses escolas array
        });

        console.log("✅ Login realizado!");

        // Show API message
        toast.success("Cadastro realizado com sucesso!", {
          description: response.message || `Bem-vindo, ${response.payload.nome}!`,
        });

        console.log("🔄 Redirecionando para home...");
        // Redirect to home/dashboard
        router.push("/");
      } else {
        console.log("⚠️ Cadastro não retornou payload");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Ocorreu um erro ao criar sua conta. Tente novamente.";

      // Check if error is related to duplicate email
      const isDuplicateEmail =
        errorMessage.toLowerCase().includes("email") &&
        (errorMessage.toLowerCase().includes("existe") ||
         errorMessage.toLowerCase().includes("cadastrado") ||
         errorMessage.toLowerCase().includes("já") ||
         errorMessage.toLowerCase().includes("duplicado") ||
         errorMessage.toLowerCase().includes("duplicate"));

      if (isDuplicateEmail) {
        // Show error directly in the email field
        setError("email", {
          type: "manual",
          message: errorMessage,
        });

        toast.error("E-mail já cadastrado", {
          description: "Este e-mail já está sendo usado. Tente fazer login ou use outro e-mail.",
        });
      } else {
        // Show generic error toast
        toast.error("Erro ao criar conta", {
          description: errorMessage,
        });
      }
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Criar conta
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Informe seus dados para começar a usar o Grade Horária.
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-5">
                <div>
                  <Label>
                    Nome completo<span className="text-error-500">*</span>
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
                    E-mail<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="Digite seu e-mail"
                    {...register("email")}
                    error={errors.email?.message}
                  />
                </div>

                <div>
                  <Label>
                    Senha<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Crie uma senha (mínimo 8 caracteres)"
                      type={showPassword ? "text" : "password"}
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

                <div className="flex items-start gap-3">
                  <Checkbox
                    className="w-5 h-5 mt-0.5"
                    {...register("termsAccepted")}
                  />
                  <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    Ao criar uma conta você concorda com nossos{" "}
                    <Link
                      href="/termos-de-uso"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-500 underline hover:text-brand-600 dark:text-brand-400"
                    >
                      Termos de Uso
                    </Link>{" "}
                    e{" "}
                    <Link
                      href="/politica-de-privacidade"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-500 underline hover:text-brand-600 dark:text-brand-400"
                    >
                      Política de Privacidade
                    </Link>
                  </p>
                </div>
                {errors.termsAccepted && (
                  <p className="text-sm text-error-500">
                    {errors.termsAccepted.message}
                  </p>
                )}

                <div>
                  <Button
                    className="w-full"
                    size="sm"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Criando conta..." : "Criar conta"}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Já possui uma conta?{" "}
                <Link
                  href="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Entrar
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
