"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import {
  resetPassword,
  sendRecoveryCode,
  validateRecoveryCode,
} from "@/lib/api/users";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// Step 1: Request Code
const emailSchema = z.object({
  email: z.string().min(1, "E-mail é obrigatório").email("E-mail inválido"),
});

type EmailFormData = z.infer<typeof emailSchema>;

export function ForgotPasswordEmailStep({
  onNext,
}: {
  onNext: (email: string) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const onSubmit = async (data: EmailFormData) => {
    try {
      const response = await sendRecoveryCode({ email: data.email });

      // Check if response is successful (has message or no error)
      if (response) {
        // Show API message
        toast.success(response.message || "Código enviado!", {
          description: response.message || "Verifique seu e-mail para obter o código de recuperação.",
        });
        onNext(data.email);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Erro ao enviar código. Tente novamente.";
      // Show API error message
      toast.error("Erro", {
        description: errorMessage,
      });
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Esqueceu sua senha?
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Digite seu e-mail para receber um código de recuperação.
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-6">
                <div>
                  <Label>
                    E-mail <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    placeholder="seu@email.com"
                    type="email"
                    {...register("email")}
                    error={errors.email?.message}
                  />
                </div>

                <div>
                  <Button
                    className="w-full"
                    size="sm"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Enviando..." : "Enviar código"}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Lembrou sua senha?{" "}
                <Link
                  href="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Voltar para login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 2: Validate Code
const codeSchema = z.object({
  code: z
    .string()
    .min(6, "O código deve ter 6 dígitos")
    .max(6, "O código deve ter 6 dígitos")
    .regex(/^\d+$/, "O código deve conter apenas números"),
});

type CodeFormData = z.infer<typeof codeSchema>;

export function ForgotPasswordCodeStep({
  email,
  onNext,
  onBack,
}: {
  email: string;
  onNext: (code: string) => void;
  onBack: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
  });

  const onSubmit = async (data: CodeFormData) => {
    try {
      const response = await validateRecoveryCode({ code: data.code });

      if (response) {
        // Show API message
        toast.success(response.message || "Código validado!", {
          description: response.message || "Agora você pode definir uma nova senha.",
        });
        onNext(data.code);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message;

      // Show API error message
      if (errorMessage?.toLowerCase().includes("código") && errorMessage?.toLowerCase().includes("inválido")) {
        toast.error("Código inválido", {
          description: errorMessage,
        });
      } else {
        toast.error("Erro", {
          description: errorMessage || "Erro ao validar código. Tente novamente.",
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
              Digite o código
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enviamos um código de 6 dígitos para <strong>{email}</strong>
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Código de verificação <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    placeholder="000000"
                    type="text"
                    maxLength={6}
                    {...register("code")}
                    error={errors.code?.message}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Digite os 6 dígitos enviados para seu e-mail
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    className="w-full"
                    size="sm"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Validando..." : "Validar código"}
                  </Button>
                  <Button
                    className="w-full"
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={onBack}
                  >
                    Voltar
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 3: Reset Password
const resetSchema = z
  .object({
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirme sua senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type ResetFormData = z.infer<typeof resetSchema>;

export function ForgotPasswordResetStep({ email }: { email: string }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetFormData) => {
    try {
      const response = await resetPassword({
        email,
        pass: data.password,
      });

      if (response) {
        // Show API message
        toast.success(response.message || "Senha redefinida!", {
          description: response.message || "Sua senha foi atualizada com sucesso. Faça login novamente.",
        });
        router.push("/signin");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Erro ao redefinir senha. Tente novamente.";
      // Show API error message
      toast.error("Erro", {
        description: errorMessage,
      });
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Definir nova senha
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Crie uma senha forte com pelo menos 8 caracteres.
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Nova senha <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite sua nova senha"
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

                <div>
                  <Label>
                    Confirmar senha <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirme sua nova senha"
                      {...register("confirmPassword")}
                      error={errors.confirmPassword?.message}
                    />
                    <span
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showConfirmPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <Button
                    className="w-full"
                    size="sm"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Salvando..." : "Redefinir senha"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component that manages the flow
export default function ForgotPasswordFlow() {
  const [step, setStep] = useState<"email" | "code" | "reset">("email");
  const [email, setEmail] = useState("");

  const handleEmailNext = (emailValue: string) => {
    setEmail(emailValue);
    setStep("code");
  };

  const handleCodeNext = (codeValue: string) => {
    setStep("reset");
  };

  const handleCodeBack = () => {
    setStep("email");
  };

  if (step === "email") {
    return <ForgotPasswordEmailStep onNext={handleEmailNext} />;
  }

  if (step === "code") {
    return (
      <ForgotPasswordCodeStep
        email={email}
        onNext={handleCodeNext}
        onBack={handleCodeBack}
      />
    );
  }

  return <ForgotPasswordResetStep email={email} />;
}
