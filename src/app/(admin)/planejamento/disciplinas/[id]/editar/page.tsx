"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon } from "@/icons";
import Link from "next/link";
import {
  getDisciplina,
  updateDisciplina,
  type TipoDisciplina,
} from "@/lib/api/disciplinas";
import { useSchool } from "@/context/SchoolContext";

// Validation schema matching backend UpdateDisciplinaData
const disciplinaSchema = z.object({
  nome: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .optional(),
  codigo: z
    .string()
    .min(2, "Código deve ter pelo menos 2 caracteres")
    .max(20, "Código deve ter no máximo 20 caracteres")
    .regex(/^[A-Z0-9]+$/, "Código deve conter apenas letras maiúsculas e números")
    .optional(),
  cargaHoraria: z
    .number()
    .min(1, "Carga horária deve ser maior que 0")
    .or(
      z
        .string()
        .transform((val) => parseInt(val, 10))
        .refine((val) => !isNaN(val) && val > 0, "Carga horária deve ser maior que 0")
    )
    .optional(),
  cor: z
    .string()
    .regex(/^#([0-9A-F]{3}|[0-9A-F]{6})$/i, "Cor deve estar no formato #RGB ou #RRGGBB")
    .optional()
    .or(z.literal("")),
  descricao: z
    .string()
    .max(500, "Descrição deve ter no máximo 500 caracteres")
    .optional()
    .or(z.literal("")),
  tipo: z.enum(["regular", "laboratorio", "educacao_fisica", "arte"], {
    message: "Tipo de disciplina é obrigatório",
  }).optional(),
  requerSequencia: z.boolean().optional(),
  salaEspecifica: z.string().optional().or(z.literal("")),
  ativa: z.boolean().optional(),
});

type DisciplinaFormData = z.infer<typeof disciplinaSchema>;

const tipoDisciplinaOptions: { value: TipoDisciplina; label: string }[] = [
  { value: "regular", label: "Regular" },
  { value: "laboratorio", label: "Laboratório" },
  { value: "educacao_fisica", label: "Educação Física" },
  { value: "arte", label: "Arte" },
];

export default function EditarDisciplinaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { selectedSchool } = useSchool();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
    watch,
  } = useForm<DisciplinaFormData>({
    resolver: zodResolver(disciplinaSchema),
    defaultValues: {
      nome: "",
      codigo: "",
      cargaHoraria: "" as any,
      tipo: "regular",
      cor: "#007bff",
      descricao: "",
      salaEspecifica: "",
      requerSequencia: false,
      ativa: true,
    },
  });

  // Load disciplina data
  useEffect(() => {
    const fetchDisciplina = async () => {
      try {
        const response = await getDisciplina(id);
        const disciplina = response.data || response.payload;

        if (disciplina) {
          console.log("Dados da disciplina carregados:", disciplina);

          // Populate form with existing data
          reset({
            nome: disciplina.nome,
            codigo: disciplina.codigo,
            cargaHoraria: disciplina.cargaHoraria,
            cor: disciplina.cor || "#007bff",
            descricao: disciplina.descricao || "",
            tipo: disciplina.tipo,
            requerSequencia: disciplina.requerSequencia || false,
            salaEspecifica: disciplina.salaEspecifica || "",
            ativa: disciplina.ativa,
          });
        }
      } catch (error: any) {
        toast.error("Erro ao carregar disciplina", {
          description:
            error.response?.data?.message ||
            "Ocorreu um erro ao carregar os dados da disciplina.",
        });
        router.push("/planejamento/disciplinas");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDisciplina();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onSubmit = async (data: DisciplinaFormData) => {
    if (!selectedSchool) {
      toast.error("Nenhuma escola selecionada", {
        description: "Por favor, selecione uma escola antes de atualizar a disciplina.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await updateDisciplina(id, {
        nome: data.nome,
        codigo: data.codigo?.toUpperCase(),
        cargaHoraria: typeof data.cargaHoraria === "string"
          ? parseInt(data.cargaHoraria, 10)
          : data.cargaHoraria,
        cor: data.cor || undefined,
        descricao: data.descricao || undefined,
        tipo: data.tipo,
        requerSequencia: data.requerSequencia,
        salaEspecifica: data.salaEspecifica || undefined,
        ativa: data.ativa,
        idEscola: selectedSchool._id,
      });

      const disciplinaData = response.data || response.payload;
      toast.success(response.message || "Disciplina atualizada com sucesso!", {
        description: disciplinaData?.nome
          ? `As informações de "${disciplinaData.nome}" foram atualizadas.`
          : "A disciplina foi atualizada com sucesso.",
      });

      router.push("/planejamento/disciplinas");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.join(", ") ||
        "Ocorreu um erro ao atualizar a disciplina. Tente novamente.";

      toast.error("Erro ao atualizar disciplina", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const corValue = watch("cor");
  const ativaValue = watch("ativa");

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
        <Link href="/planejamento/disciplinas">
          <button className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800">
            <ChevronLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-400" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Editar Disciplina
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Atualize os dados da disciplina
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
                <Label>Nome da Disciplina</Label>
                <Input
                  type="text"
                  placeholder="Digite o nome da disciplina"
                  {...register("nome")}
                  error={errors.nome?.message}
                />
              </div>

              <div>
                <Label>Código</Label>
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
                <Label>Carga Horária (horas/semana)</Label>
                <Input
                  type="number"
                  placeholder="40"
                  {...register("cargaHoraria")}
                  error={errors.cargaHoraria?.message}
                  min={1}
                />
              </div>

              <div>
                <Label>Tipo de Disciplina</Label>
                <Controller
                  name="tipo"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                    >
                      {tipoDisciplinaOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.tipo && (
                  <p className="mt-1 text-xs text-error-500">{errors.tipo.message}</p>
                )}
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

              <div className="md:col-span-2">
                <Label>Descrição</Label>
                <textarea
                  placeholder="Descrição da disciplina (opcional)"
                  {...register("descricao")}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:placeholder-gray-500"
                  rows={3}
                  maxLength={500}
                />
                {errors.descricao && (
                  <p className="mt-1 text-xs text-error-500">{errors.descricao.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Configurações Avançadas */}
          <div>
            <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
              Configurações Avançadas
            </h2>

            <div className="space-y-4">
              {/* Status Ativa/Inativa */}
              <div className="flex items-center gap-3">
                <Controller
                  name="ativa"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      {...field}
                      value={field.value ? "true" : "false"}
                      checked={field.value}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                  )}
                />
                <div>
                  <Label className="mb-0">Disciplina Ativa</Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Desmarque para desativar esta disciplina temporariamente
                  </p>
                </div>
              </div>

              {/* Permite Sequência */}
              <div className="flex items-center gap-3">
                <Controller
                  name="requerSequencia"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      {...field}
                      value={field.value ? "true" : "false"}
                      checked={field.value}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                  )}
                />
                <div>
                  <Label className="mb-0">Permite Sequência</Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Indica se a disciplina permite ser ministrada em sequência (ex: Matemática I, II, III)
                  </p>
                </div>
              </div>

              {/* Sala Específica */}
              <div>
                <Label>Sala Específica</Label>
                <Input
                  type="text"
                  placeholder="Ex: Laboratório de Química, Quadra Poliesportiva"
                  {...register("salaEspecifica")}
                  error={errors.salaEspecifica?.message}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Informe se a disciplina requer uma sala específica
                </p>
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
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
