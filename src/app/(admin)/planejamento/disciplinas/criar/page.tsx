"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, type Resolver, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon } from "@/icons";
import Link from "next/link";
import { createDisciplina } from "@/lib/api/disciplinas";
import { useSchool } from "@/context/SchoolContext";

// Validation schema matching backend CreateDisciplinaData
const disciplinaSchema = z.object({
  nome: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  codigo: z
    .string()
    .min(2, "Código deve ter pelo menos 2 caracteres")
    .max(20, "Código deve ter no máximo 20 caracteres")
    .regex(/^[A-Z0-9]+$/, "Código deve conter apenas letras maiúsculas e números"),
  cor: z
    .string()
    .regex(/^#([0-9A-F]{3}|[0-9A-F]{6})$/i, "Cor deve estar no formato #RGB ou #RRGGBB")
    .optional()
    .or(z.literal("")),
});

type DisciplinaFormData = z.infer<typeof disciplinaSchema>;
const disciplinaResolver = zodResolver(disciplinaSchema) as Resolver<DisciplinaFormData>;


export default function CriarDisciplinaPage() {
  const router = useRouter();
  const { selectedSchool } = useSchool();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
  } = useForm<DisciplinaFormData>({
    resolver: disciplinaResolver,
    defaultValues: {
      nome: "",
      codigo: "",
      cor: "#007bff",
    },
  });

  const onSubmit: SubmitHandler<DisciplinaFormData> = async (data) => {
    // Validação: verifica se há escola selecionada
    if (!selectedSchool) {
      toast.error("Nenhuma escola selecionada", {
        description: "Por favor, selecione uma escola no cabeçalho antes de cadastrar uma disciplina.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createDisciplina(
        {
          nome: data.nome,
          codigo: data.codigo.toUpperCase(), // Garante que o código está em maiúsculas
          cor: data.cor || undefined,
        },
        selectedSchool._id // ID da escola selecionada
      );

      toast.success(response.message || "Disciplina criada com sucesso!", {
        description: response.payload?.nome
          ? `A disciplina "${response.payload.nome}" foi cadastrada.`
          : "A disciplina foi cadastrada com sucesso.",
      });

      router.push("/planejamento/disciplinas");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.join(", ") ||
        "Ocorreu um erro ao cadastrar a disciplina. Tente novamente.";

      toast.error("Erro ao criar disciplina", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const corValue = watch("cor");

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Link href="/planejamento/disciplinas">
          <button className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800">
            <ChevronLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-400" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Adicionar Disciplina
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Preencha os dados da nova disciplina
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Informações Básicas */}
          <div>
            <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
              Informações Básicas
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>
                  Nome da Disciplina <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Digite o nome da disciplina"
                  {...register("nome")}
                  error={errors.nome?.message}
                />
              </div>

              <div>
                <Label>
                  Código <span className="text-error-500">*</span>
                </Label>
                <Controller
                  name="codigo"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="text"
                      placeholder="MAT101"
                      {...field}
                      onChange={(e) => {
                        // Converte para maiúsculas automaticamente
                        field.onChange(e.target.value.toUpperCase());
                      }}
                      error={errors.codigo?.message}
                      maxLength={20}
                    />
                  )}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Apenas letras maiúsculas e números
                </p>
              </div>



              <div>
                <Label>Cor da Disciplina</Label>
                <div className="flex items-center gap-3">
                  <Controller
                    name="cor"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="color"
                        {...field}
                        className="h-11 w-20 cursor-pointer rounded-lg border border-gray-300 bg-transparent dark:border-gray-700"
                      />
                    )}
                  />
                  <Controller
                    name="cor"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="text"
                        {...field}
                        placeholder="#007bff"
                        className="flex-1"
                        error={errors.cor?.message}
                      />
                    )}
                  />
                </div>
                {corValue && (
                  <div
                    className="mt-2 h-8 rounded-lg border border-gray-200 dark:border-gray-800"
                    style={{ backgroundColor: corValue }}
                  />
                )}
              </div>

            </div>
          </div>


          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button
              variant="outline"
              type="button"
              disabled={isSubmitting}
              onClick={() => router.push("/planejamento/disciplinas")}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Disciplina"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
