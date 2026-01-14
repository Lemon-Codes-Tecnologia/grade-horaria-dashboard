"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  createGradeHoraria,
  type Semestre,
  type NivelOtimizacao,
} from "@/lib/api/grades-horarias";
import { listTurmas } from "@/lib/api/turmas";
import { listProfessores } from "@/lib/api/professores";
import { listDisciplinas } from "@/lib/api/disciplinas";
import { type NivelEnsino } from "@/lib/api/escolas";
import { useSchool } from "@/context/SchoolContext";

// Validation schema
const gradeSchema = z.object({
  nivelEnsino: z.string().min(1, "Selecione um nível de ensino"),
  anoLetivo: z.string().min(4, "Ano letivo é obrigatório"),
  semestre: z.enum(["1", "2"], { message: "Selecione o semestre" }),
});

type GradeFormData = z.infer<typeof gradeSchema>;

export default function CriarGradeHorariaPage() {
  const router = useRouter();
  const { selectedSchool } = useSchool();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Estatísticas de validação por nível de ensino
  const [turmasPorNivel, setTurmasPorNivel] = useState<Record<string, number>>({});
  const [stats, setStats] = useState({
    professores: 0,
    disciplinas: 0,
    horariosConfigurados: false,
  });

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
    watch,
  } = useForm<GradeFormData>({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      anoLetivo: new Date().getFullYear().toString(),
      semestre: "1",
      nivelEnsino: "",
    },
  });

  const nivelEnsinoSelecionado = watch("nivelEnsino");

  // Todos os níveis de ensino possíveis
  const todosNiveisEnsino: { value: NivelEnsino; label: string }[] = [
    { value: "infantil", label: "Infantil" },
    { value: "fundamental1", label: "Fundamental I" },
    { value: "fundamental2", label: "Fundamental II" },
    { value: "medio", label: "Médio" },
    { value: "eja", label: "EJA" },
    { value: "superior", label: "Superior" },
  ];

  // Filtra os níveis de ensino baseado na escola selecionada
  const niveisEnsinoDisponiveis = todosNiveisEnsino.filter(nivel =>
    selectedSchool?.nivelEnsino?.includes(nivel.value)
  );

  // Carregar turmas por nível de ensino
  useEffect(() => {
    const fetchTurmasPorNivel = async () => {
      if (!selectedSchool) return;

      try {
        const response = await listTurmas({
          idEscola: selectedSchool._id,
          limit: 1000,
        });

        const turmasData = response.data || response.payload;
        if (turmasData && turmasData.docs) {
          // Agrupar turmas por nível de ensino (baseado na série)
          const contagem: Record<string, number> = {};

          turmasData.docs.forEach((turma: any) => {
            // Mapear série para nível de ensino
            const serie = turma.serie as string;
            let nivel: string = "";

            if (serie.includes("infantil")) nivel = "infantil";
            else if (serie.includes("1ano_fundamental") || serie.includes("2ano_fundamental") ||
                     serie.includes("3ano_fundamental") || serie.includes("4ano_fundamental") ||
                     serie.includes("5ano_fundamental")) nivel = "fundamental1";
            else if (serie.includes("6ano_fundamental") || serie.includes("7ano_fundamental") ||
                     serie.includes("8ano_fundamental") || serie.includes("9ano_fundamental")) nivel = "fundamental2";
            else if (serie.includes("medio")) nivel = "medio";
            else if (serie.includes("eja")) nivel = "eja";
            else if (serie.includes("superior")) nivel = "superior";

            if (nivel) {
              contagem[nivel] = (contagem[nivel] || 0) + 1;
            }
          });

          setTurmasPorNivel(contagem);
        }
      } catch (error) {
        console.error("Erro ao carregar turmas:", error);
      }
    };

    fetchTurmasPorNivel();
  }, [selectedSchool]);

  // Carregar estatísticas gerais
  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedSchool) return;

      try {
        // Carregar professores
        const professoresResponse = await listProfessores({
          idEscola: selectedSchool._id,
          limit: 1,
        });
        const professoresData = professoresResponse.data || professoresResponse.payload;

        // Carregar disciplinas
        const disciplinasResponse = await listDisciplinas({
          idEscola: selectedSchool._id,
          limit: 1,
        });
        const disciplinasData = disciplinasResponse.data || disciplinasResponse.payload;

        // Verificar se escola tem horários configurados
        const horariosConfigurados = !!(
          selectedSchool.configuracoes?.horariosDisponiveis &&
          Object.keys(selectedSchool.configuracoes.horariosDisponiveis).length > 0
        );

        setStats({
          professores: professoresData?.totalDocs || 0,
          disciplinas: disciplinasData?.totalDocs || 0,
          horariosConfigurados,
        });
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      }
    };

    fetchStats();
  }, [selectedSchool]);

  const onSubmit = async (data: GradeFormData) => {
    if (!selectedSchool) {
      toast.error("Nenhuma escola selecionada");
      return;
    }

    const turmasDoNivel = turmasPorNivel[data.nivelEnsino] || 0;

    // Validações básicas
    if (turmasDoNivel === 0) {
      toast.error("Não há turmas cadastradas neste nível de ensino", {
        description: "Cadastre turmas antes de gerar a grade horária.",
      });
      return;
    }

    if (stats.professores === 0) {
      toast.error("Não há professores cadastrados", {
        description: "Cadastre professores antes de gerar a grade horária.",
      });
      return;
    }

    if (stats.disciplinas === 0) {
      toast.error("Não há disciplinas cadastradas", {
        description: "Cadastre disciplinas antes de gerar a grade horária.",
      });
      return;
    }

    if (!stats.horariosConfigurados) {
      toast.error("Horários da escola não configurados", {
        description: "Configure os horários disponíveis na escola antes de gerar a grade.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        idEscola: selectedSchool._id,
        nivelEnsino: data.nivelEnsino,
        anoLetivo: parseInt(data.anoLetivo),
        semestre: parseInt(data.semestre) as Semestre,
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

      const response = await createGradeHoraria(payload);

      // Verificar se houve sucesso
      if (response.success || response.data || response.payload) {
        toast.success(response.message || "Grades horárias geradas com sucesso!", {
          description: response.estatisticas
            ? `${response.estatisticas.aulasAlocadas || 0} aulas alocadas em ${turmasDoNivel} turma(s)`
            : `Grades criadas para ${turmasDoNivel} turma(s)`,
        });

        // Mostrar conflitos se houver
        if (response.conflitos && response.conflitos.length > 0) {
          console.warn("Conflitos encontrados:", response.conflitos);
          toast.warning(`${response.conflitos.length} conflito(s) encontrado(s)`);
        }

        // Redirecionar para listagem
        router.push("/planejamento/grade-horaria");
      } else {
        throw new Error(response.message || "Erro ao criar grades");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.join(", ") ||
        error.message ||
        "Ocorreu um erro ao gerar as grades horárias.";

      toast.error("Erro ao gerar grades", {
        description: errorMessage,
      });

      // Mostrar conflitos se houver
      if (error.response?.data?.conflitos) {
        console.error("Conflitos:", error.response.data.conflitos);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedSchool) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-gray-500 dark:text-gray-400">
          Selecione uma escola para gerar grades horárias
        </p>
      </div>
    );
  }

  const turmasDoNivel = nivelEnsinoSelecionado ? turmasPorNivel[nivelEnsinoSelecionado] || 0 : 0;

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Link href="/planejamento/grade-horaria">
          <button className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800">
            <ChevronLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-400" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Gerar Grades Horárias
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gere automaticamente grades para todas as turmas de um nível de ensino
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Parâmetros de Geração */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
            Parâmetros de Geração
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <Label>
                Nível de Ensino <span className="text-error-500">*</span>
              </Label>
              <Controller
                name="nivelEnsino"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                  >
                    <option value="">Selecione o nível de ensino</option>
                    {niveisEnsinoDisponiveis.map((nivel) => (
                      <option key={nivel.value} value={nivel.value}>
                        {nivel.label}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.nivelEnsino && (
                <p className="mt-1 text-xs text-error-500">{errors.nivelEnsino.message}</p>
              )}
              {nivelEnsinoSelecionado && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {turmasDoNivel} turma(s) encontrada(s) neste nível
                </p>
              )}
            </div>

            <div>
              <Label>
                Ano Letivo <span className="text-error-500">*</span>
              </Label>
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
              <Label>
                Semestre <span className="text-error-500">*</span>
              </Label>
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
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Níveis mais altos podem levar mais tempo para processar
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Validação */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
            Validação
          </h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {turmasDoNivel > 0 ? (
                <span className="text-green-500">✓</span>
              ) : (
                <span className="text-error-500">✗</span>
              )}
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {nivelEnsinoSelecionado
                  ? `${turmasDoNivel} turma(s) no nível selecionado`
                  : "Selecione um nível de ensino"
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              {stats.professores > 0 ? (
                <span className="text-green-500">✓</span>
              ) : (
                <span className="text-error-500">✗</span>
              )}
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {stats.professores} professor(es) disponível(is)
              </p>
            </div>
            <div className="flex items-center gap-2">
              {stats.disciplinas > 0 ? (
                <span className="text-green-500">✓</span>
              ) : (
                <span className="text-error-500">✗</span>
              )}
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {stats.disciplinas} disciplina(s) configurada(s)
              </p>
            </div>
            <div className="flex items-center gap-2">
              {stats.horariosConfigurados ? (
                <span className="text-green-500">✓</span>
              ) : (
                <span className="text-error-500">✗</span>
              )}
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Horários da escola configurados
              </p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <Button
            variant="outline"
            type="button"
            disabled={isSubmitting}
            onClick={() => router.push("/planejamento/grade-horaria")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Gerando Grades..." : "Gerar Grades Horárias"}
          </Button>
        </div>
      </form>
    </div>
  );
}
