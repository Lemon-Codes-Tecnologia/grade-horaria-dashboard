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
  getGradeHoraria,
  updateGradeHoraria,
  type Semestre,
  type NivelOtimizacao,
} from "@/lib/api/grades-horarias";

// Validation schema
const gradeSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome deve ter no máximo 100 caracteres").optional(),
  descricao: z.string().max(500, "Descrição deve ter no máximo 500 caracteres").optional().or(z.literal("")),
  anoLetivo: z.string().optional(),
  semestre: z.enum(["1", "2"]).optional(),
});

type GradeFormData = z.infer<typeof gradeSchema>;

export default function EditarGradeHorariaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Configurações avançadas
  const [priorizarSemJanelas, setPriorizarSemJanelas] = useState(true);
  const [permitirAulasDuplas, setPermitirAulasDuplas] = useState(true);
  const [nivelOtimizacao, setNivelOtimizacao] = useState<NivelOtimizacao>("medio");
  const [permitirPequenasViolacoes, setPermitirPequenasViolacoes] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
  } = useForm<GradeFormData>({
    resolver: zodResolver(gradeSchema),
  });

  useEffect(() => {
    const fetchGrade = async () => {
      try {
        const response = await getGradeHoraria(id);
        const grade = response.data || response.payload;

        if (grade) {
          reset({
            nome: grade.nome,
            descricao: grade.descricao || "",
            anoLetivo: grade.anoLetivo.toString(),
            semestre: grade.semestre.toString() as "1" | "2",
          });

          // Carregar configurações avançadas se existirem
          if (grade.configuracoes?.algoritmo) {
            setPriorizarSemJanelas(grade.configuracoes.algoritmo.priorizarSemJanelas ?? true);
            setPermitirAulasDuplas(grade.configuracoes.algoritmo.permitirAulasDuplas ?? true);
            setNivelOtimizacao(grade.configuracoes.algoritmo.nivelOtimizacao ?? "medio");
            setPermitirPequenasViolacoes(grade.configuracoes.algoritmo.permitirPequenasViolacoes ?? false);
          }
        }
      } catch (error: any) {
        toast.error("Erro ao carregar grade", {
          description: error.response?.data?.message || "Não foi possível carregar a grade.",
        });
        router.push("/planejamento/grade-horaria");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGrade();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onSubmit = async (data: GradeFormData) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        nome: data.nome,
        descricao: data.descricao || undefined,
        anoLetivo: data.anoLetivo ? parseInt(data.anoLetivo) : undefined,
        semestre: data.semestre ? (parseInt(data.semestre) as Semestre) : undefined,
      };

      // Adicionar configurações avançadas se habilitadas
      if (showAdvanced) {
        payload.configuracoes = {
          algoritmo: {
            priorizarSemJanelas,
            permitirAulasDuplas,
            nivelOtimizacao,
            permitirPequenasViolacoes,
          },
        };
      }

      const response = await updateGradeHoraria(id, payload);

      toast.success(response.message || "Grade atualizada com sucesso!");
      router.push(`/planejamento/grade-horaria/${id}`);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.join(", ") ||
        "Ocorreu um erro ao atualizar a grade.";

      toast.error("Erro ao atualizar grade", {
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/planejamento/grade-horaria/${id}`}>
          <button className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800">
            <ChevronLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-400" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Editar Grade Horária
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Atualize as informações da grade horária
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações Básicas */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
            Informações Básicas
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Nome da Grade</Label>
              <Input
                type="text"
                placeholder="Nome da grade"
                {...register("nome")}
                error={errors.nome?.message}
              />
            </div>

            <div>
              <Label>Ano Letivo</Label>
              <Input
                type="number"
                placeholder="2025"
                {...register("anoLetivo")}
                error={errors.anoLetivo?.message}
                min={2020}
                max={2030}
              />
            </div>

            <div>
              <Label>Semestre</Label>
              <Controller
                name="semestre"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                  >
                    <option value="1">1º Semestre</option>
                    <option value="2">2º Semestre</option>
                  </select>
                )}
              />
              {errors.semestre && (
                <p className="mt-1 text-xs text-error-500">{errors.semestre.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label>Descrição</Label>
              <textarea
                placeholder="Descrição opcional da grade"
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
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-800 dark:text-white/90">
              Configurações Avançadas
            </h2>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-brand-500 hover:text-brand-600"
            >
              {showAdvanced ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          {showAdvanced && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="priorizarSemJanelas"
                  checked={priorizarSemJanelas}
                  onChange={(e) => setPriorizarSemJanelas(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <div>
                  <Label htmlFor="priorizarSemJanelas" className="mb-0">
                    Priorizar horários sem janelas
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Evita horários vagos entre aulas
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="permitirAulasDuplas"
                  checked={permitirAulasDuplas}
                  onChange={(e) => setPermitirAulasDuplas(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <div>
                  <Label htmlFor="permitirAulasDuplas" className="mb-0">
                    Permitir aulas duplas
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Permite agrupar aulas da mesma disciplina
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="permitirPequenasViolacoes"
                  checked={permitirPequenasViolacoes}
                  onChange={(e) => setPermitirPequenasViolacoes(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <div>
                  <Label htmlFor="permitirPequenasViolacoes" className="mb-0">
                    Permitir pequenas violações
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Permite pequenos conflitos para completar a grade
                  </p>
                </div>
              </div>

              <div>
                <Label>Nível de Otimização</Label>
                <select
                  value={nivelOtimizacao}
                  onChange={(e) => setNivelOtimizacao(e.target.value as NivelOtimizacao)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                >
                  <option value="basico">Básico (mais rápido)</option>
                  <option value="medio">Médio (balanceado)</option>
                  <option value="alto">Alto (melhor resultado)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <Link href={`/planejamento/grade-horaria/${id}`}>
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
  );
}
