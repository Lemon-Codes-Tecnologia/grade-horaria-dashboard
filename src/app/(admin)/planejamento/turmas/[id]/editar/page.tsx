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
  getTurma,
  updateTurma,
  type Turno,
  type Serie,
  type Disciplina,
} from "@/lib/api/turmas";
import { listDisciplinas, type Disciplina as DisciplinaCadastrada } from "@/lib/api/disciplinas";
import { useSchool } from "@/context/SchoolContext";

// Validation schema
const turmaSchema = z.object({
  nome: z.string().min(1, "Nome da turma é obrigatório").optional(),
  codigo: z.string()
    .min(2, "Código deve ter no mínimo 2 caracteres")
    .max(20, "Código deve ter no máximo 20 caracteres")
    .regex(/^[A-Z0-9]+$/i, "Código deve conter apenas letras e números")
    .optional(),
  serie: z.string().min(1, "Série é obrigatória").optional(),
  ano: z.string()
    .refine((val) => {
      if (!val) return true;
      const num = parseInt(val);
      return num >= 1 && num <= 12;
    }, "Ano deve ser entre 1 e 12")
    .optional(),
  turno: z.enum(["manha", "tarde", "noite", "integral"]).optional(),
  capacidadeMaxima: z.string()
    .refine((val) => !val || parseInt(val) > 0, "Capacidade deve ser maior que 0")
    .optional(),
  quantidadeAlunos: z.string().optional(),
  sala: z.string().optional(),
  anoLetivo: z.string()
    .refine((val) => {
      if (!val) return true;
      const num = parseInt(val);
      return num >= 2020 && num <= 2030;
    }, "Ano letivo deve ser entre 2020 e 2030")
    .optional(),
  professorResponsavel: z.string().optional(),
});

type TurmaFormData = z.infer<typeof turmaSchema>;

const serieOptions: { value: Serie; label: string }[] = [
  { value: "1ano_infantil", label: "1º Ano Infantil" },
  { value: "2ano_infantil", label: "2º Ano Infantil" },
  { value: "3ano_infantil", label: "3º Ano Infantil" },
  { value: "1ano_fundamental", label: "1º Ano Fundamental" },
  { value: "2ano_fundamental", label: "2º Ano Fundamental" },
  { value: "3ano_fundamental", label: "3º Ano Fundamental" },
  { value: "4ano_fundamental", label: "4º Ano Fundamental" },
  { value: "5ano_fundamental", label: "5º Ano Fundamental" },
  { value: "6ano_fundamental", label: "6º Ano Fundamental" },
  { value: "7ano_fundamental", label: "7º Ano Fundamental" },
  { value: "8ano_fundamental", label: "8º Ano Fundamental" },
  { value: "9ano_fundamental", label: "9º Ano Fundamental" },
  { value: "1ano_medio", label: "1º Ano Médio" },
  { value: "2ano_medio", label: "2º Ano Médio" },
  { value: "3ano_medio", label: "3º Ano Médio" },
  { value: "eja_fundamental", label: "EJA Fundamental" },
  { value: "eja_medio", label: "EJA Médio" },
];

const turnoOptions: { value: Turno; label: string }[] = [
  { value: "manha", label: "Manhã" },
  { value: "tarde", label: "Tarde" },
  { value: "noite", label: "Noite" },
  { value: "integral", label: "Integral" },
];

export default function EditarTurmaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { selectedSchool } = useSchool();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [disciplinasDisponiveis, setDisciplinasDisponiveis] = useState<DisciplinaCadastrada[]>([]);
  const [novaDisciplina, setNovaDisciplina] = useState("");
  const [novaCargaHoraria, setNovaCargaHoraria] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
  } = useForm<TurmaFormData>({
    resolver: zodResolver(turmaSchema),
  });

  useEffect(() => {
    const fetchTurma = async () => {
      try {
        const response = await getTurma(id);
        const turma = response.data || response.payload;

        if (turma) {
          reset({
            nome: turma.nome,
            codigo: turma.codigo,
            serie: turma.serie,
            ano: turma.ano.toString(),
            turno: turma.turno,
            capacidadeMaxima: turma.capacidadeMaxima.toString(),
            quantidadeAlunos: turma.quantidadeAlunos?.toString() || "",
            sala: turma.sala || "",
            anoLetivo: turma.anoLetivo.toString(),
            professorResponsavel: turma.professorResponsavel || "",
          });

          if (turma.disciplinas) {
            setDisciplinas(turma.disciplinas);
          }
        }
      } catch (error: any) {
        toast.error("Erro ao carregar turma", {
          description:
            error.response?.data?.message ||
            "Ocorreu um erro ao carregar os dados da turma.",
        });
        router.push("/planejamento/turmas");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTurma();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Buscar disciplinas disponíveis quando a escola for selecionada
  useEffect(() => {
    const fetchDisciplinas = async () => {
      if (!selectedSchool) return;

      try {
        const response = await listDisciplinas({
          idEscola: selectedSchool._id,
          ativa: true,
          limit: 100, // Buscar todas as disciplinas ativas
        });

        const disciplinasData = response.data || response.payload;
        if (disciplinasData && disciplinasData.docs) {
          setDisciplinasDisponiveis(disciplinasData.docs);
        }
      } catch (error) {
        console.error("Erro ao carregar disciplinas:", error);
        toast.error("Erro ao carregar disciplinas disponíveis");
      }
    };

    fetchDisciplinas();
  }, [selectedSchool]);

  const adicionarDisciplina = () => {
    if (!novaDisciplina) {
      toast.error("Selecione uma disciplina");
      return;
    }

    if (!novaCargaHoraria) {
      toast.error("Informe a carga horária");
      return;
    }

    const carga = parseInt(novaCargaHoraria);
    if (carga <= 0) {
      toast.error("Carga horária deve ser maior que zero");
      return;
    }

    // Verificar se a disciplina já foi adicionada
    if (disciplinas.some(d => d.disciplina === novaDisciplina)) {
      toast.error("Esta disciplina já foi adicionada");
      return;
    }

    setDisciplinas([
      ...disciplinas,
      {
        disciplina: novaDisciplina, // ID da disciplina
        cargaHorariaSemanal: carga,
      },
    ]);

    setNovaDisciplina("");
    setNovaCargaHoraria("");
    toast.success("Disciplina adicionada!");
  };

  const removerDisciplina = (index: number) => {
    setDisciplinas(disciplinas.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: TurmaFormData) => {
    if (!selectedSchool) {
      toast.error("Nenhuma escola selecionada", {
        description: "Por favor, selecione uma escola antes de atualizar a turma.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData = {
        idEscola: selectedSchool._id,
        nome: data.nome,
        codigo: data.codigo ? data.codigo.toUpperCase() : undefined,
        serie: data.serie as Serie | undefined,
        ano: data.ano ? parseInt(data.ano) : undefined,
        turno: data.turno,
        capacidadeMaxima: data.capacidadeMaxima
          ? parseInt(data.capacidadeMaxima)
          : undefined,
        quantidadeAlunos: data.quantidadeAlunos
          ? parseInt(data.quantidadeAlunos)
          : undefined,
        sala: data.sala || undefined,
        anoLetivo: data.anoLetivo ? parseInt(data.anoLetivo) : undefined,
        professorResponsavel: data.professorResponsavel || undefined,
        disciplinas: disciplinas.length > 0 ? disciplinas : undefined,
      };

      const response = await updateTurma(id, updateData);

      toast.success(response.message || "Turma atualizada com sucesso!", {
        description: response.data?.nome || response.payload?.nome
          ? `As informações de "${response.data?.nome || response.payload?.nome}" foram atualizadas.`
          : "A turma foi atualizada com sucesso.",
      });

      router.push("/planejamento/turmas");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.join(", ") ||
        "Ocorreu um erro ao atualizar a turma. Tente novamente.";

      toast.error("Erro ao atualizar turma", {
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
        <Link href="/planejamento/turmas">
          <button className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800">
            <ChevronLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-400" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Editar Turma
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Atualize os dados da turma
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
              <div>
                <Label>Nome da Turma</Label>
                <Input
                  type="text"
                  placeholder="Ex: Turma A"
                  {...register("nome")}
                  error={errors.nome?.message}
                />
              </div>

              <div>
                <Label>Código</Label>
                <Input
                  type="text"
                  placeholder="Ex: 1A-M"
                  {...register("codigo")}
                  error={errors.codigo?.message}
                />
              </div>

              <div>
                <Label>Série</Label>
                <Controller
                  name="serie"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                    >
                      <option value="">Selecione a série</option>
                      {serieOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.serie && (
                  <p className="mt-1 text-xs text-error-500">
                    {errors.serie.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Turno</Label>
                <Controller
                  name="turno"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                    >
                      <option value="">Selecione o turno</option>
                      {turnoOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.turno && (
                  <p className="mt-1 text-xs text-error-500">
                    {errors.turno.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Ano Letivo</Label>
                <Input
                  type="number"
                  placeholder="2026"
                  {...register("anoLetivo")}
                  error={errors.anoLetivo?.message}
                />
              </div>

              <div>
                <Label>Ano</Label>
                <Input
                  type="number"
                  placeholder="Ex: 1, 2, 3... (1-12)"
                  {...register("ano")}
                  error={errors.ano?.message}
                />
              </div>

              <div>
                <Label>Capacidade Máxima</Label>
                <Input
                  type="number"
                  placeholder="Ex: 30"
                  {...register("capacidadeMaxima")}
                  error={errors.capacidadeMaxima?.message}
                />
              </div>

              <div>
                <Label>Quantidade de Alunos</Label>
                <Input
                  type="number"
                  placeholder="Ex: 25"
                  {...register("quantidadeAlunos")}
                  error={errors.quantidadeAlunos?.message}
                />
              </div>

              <div>
                <Label>Sala</Label>
                <Input
                  type="text"
                  placeholder="Ex: Sala 101"
                  {...register("sala")}
                  error={errors.sala?.message}
                />
              </div>

              <div className="md:col-span-2">
                <Label>Professor Responsável (ID)</Label>
                <Input
                  type="text"
                  placeholder="ID do professor (opcional)"
                  {...register("professorResponsavel")}
                  error={errors.professorResponsavel?.message}
                />
              </div>
            </div>
          </div>

          {/* Disciplinas */}
          <div>
            <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
              Disciplinas (opcional)
            </h2>

            {/* Lista de Disciplinas */}
            {disciplinas.length > 0 && (
              <div className="mb-4 space-y-2">
                {disciplinas.map((disc, index) => {
                  const disciplinaInfo = disciplinasDisponiveis.find(d => d._id === disc.disciplina);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {disciplinaInfo?.nome || disc.disciplina}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {disc.cargaHorariaSemanal}h por semana
                          {disciplinaInfo?.codigo && ` • ${disciplinaInfo.codigo}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removerDisciplina(index)}
                        className="rounded-lg p-2 text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Adicionar Disciplina */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
              <Label>Adicionar Disciplina</Label>
              <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="md:col-span-2">
                  <select
                    value={novaDisciplina}
                    onChange={(e) => setNovaDisciplina(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                  >
                    <option value="">Selecione uma disciplina</option>
                    {disciplinasDisponiveis
                      .filter(d => !disciplinas.some(disc => disc.disciplina === d._id))
                      .map((disciplina) => (
                        <option key={disciplina._id} value={disciplina._id}>
                          {disciplina.nome} ({disciplina.codigo})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Carga horária"
                    value={novaCargaHoraria}
                    onChange={(e) => setNovaCargaHoraria(e.target.value)}
                    min={1}
                  />
                  <Button
                    type="button"
                    onClick={adicionarDisciplina}
                    size="sm"
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Link href="/planejamento/turmas">
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
    </div>
  );
}
