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
  updateGradeTema,
  deleteGradeHoraria,
  gerarGradeAutomaticamente,
  type Semestre,
  type NivelOtimizacao,
  type GradeHoraria,
  type Horario,
  type Periodo,
  type DiaSemana,
  type GradeThemeConfig,
} from "@/lib/api/grades-horarias";
import { listGradeThemes, type GradeThemePreset } from "@/lib/api/grade-themes";
import { listProfessores, type Professor } from "@/lib/api/professores";
import { listDisciplinas, type Disciplina } from "@/lib/api/disciplinas";
import { useSchool } from "@/context/SchoolContext";
import { useModal } from "@/hooks/useModal";
import { ConfirmDialog } from "@/components/ui/modal/ConfirmDialog";
import GradeHorariaViewer from "@/components/grade-horaria/GradeHorariaViewer";
import TurmaSidebar from "@/components/grade-horaria/TurmaSidebar";
import AddHorarioModal from "@/components/grade-horaria/AddHorarioModal";
import { resolveGradeTheme } from "@/lib/utils/gradeTheme";

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
  const { selectedSchool } = useSchool();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [grade, setGrade] = useState<GradeHoraria | null>(null);
  const [gradeThemes, setGradeThemes] = useState<GradeThemePreset[]>([]);
  const [temaTipo, setTemaTipo] = useState<"preset" | "custom">("preset");
  const [temaPresetId, setTemaPresetId] = useState<string | null>(null);
  const [temaCustom, setTemaCustom] = useState<GradeThemeConfig>({
    primaryColor: "#6366f1",
    accentColor: "#22c55e",
    background: "#ffffff",
    pattern: "",
  });
  const [isRegeneratingGrade, setIsRegeneratingGrade] = useState(false);
  const [horarioSelecionado, setHorarioSelecionado] = useState<Horario | null>(null);

  // Estados para adicionar horários
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [horarioSelecionadoCelula, setHorarioSelecionadoCelula] = useState<{
    dia: DiaSemana;
    horaInicio: string;
    horaFim: string;
  } | null>(null);

  // Modais de confirmação
  const deleteModal = useModal();
  const regenerateModal = useModal();
  const addHorarioModal = useModal();

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

  const fetchGrade = async () => {
    try {
      // Usa o selectedSchool se disponível
      const idEscola = selectedSchool?._id;
      const response = await getGradeHoraria(id, idEscola);
      const gradeData = response.data || response.payload;

      if (gradeData) {
        setGrade(gradeData);
        reset({
          nome: gradeData.nome,
          descricao: gradeData.descricao || "",
          anoLetivo: gradeData.anoLetivo.toString(),
          semestre: gradeData.semestre.toString() as "1" | "2",
        });

        // Carregar configurações avançadas se existirem
        if (gradeData.configuracoes?.algoritmo) {
          setPriorizarSemJanelas(gradeData.configuracoes.algoritmo.priorizarSemJanelas ?? true);
          setPermitirAulasDuplas(gradeData.configuracoes.algoritmo.permitirAulasDuplas ?? true);
          setNivelOtimizacao(gradeData.configuracoes.algoritmo.nivelOtimizacao ?? "medio");
          setPermitirPequenasViolacoes(gradeData.configuracoes.algoritmo.permitirPequenasViolacoes ?? false);
        }

        if (gradeData.tema?.tipo === "preset") {
          setTemaTipo("preset");
          setTemaPresetId(gradeData.tema.id || null);
          if (gradeData.tema.config) {
            setTemaCustom(gradeData.tema.config);
          }
        } else if (gradeData.tema?.tipo === "custom") {
          setTemaTipo("custom");
          setTemaPresetId(null);
          if (gradeData.tema.config) {
            setTemaCustom(gradeData.tema.config);
          }
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

  useEffect(() => {
    fetchGrade();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, selectedSchool]);

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const response = await listGradeThemes();
        const themesData = response.data || response.payload;
        if (themesData) {
          setGradeThemes(themesData);
        }
      } catch (error) {
        console.error("Erro ao carregar temas de grade:", error);
      }
    };

    fetchThemes();
  }, []);

  // Carregar professores e disciplinas
  useEffect(() => {
    const fetchProfessoresEDisciplinas = async () => {
      if (!selectedSchool) return;

      try {
        // Carregar professores
        const professoresResponse = await listProfessores({
          idEscola: selectedSchool._id,
          ativo: true,
          limit: 1000,
        });
        const professoresData = professoresResponse.data || professoresResponse.payload;
        if (professoresData && professoresData.docs) {
          setProfessores(professoresData.docs);
        }

        // Carregar disciplinas
        const disciplinasResponse = await listDisciplinas({
          idEscola: selectedSchool._id,
          ativa: true,
          limit: 1000,
        });
        const disciplinasData = disciplinasResponse.data || disciplinasResponse.payload;
        if (disciplinasData && disciplinasData.docs) {
          setDisciplinas(disciplinasData.docs);
        }
      } catch (error) {
        console.error("Erro ao carregar professores e disciplinas:", error);
      }
    };

    fetchProfessoresEDisciplinas();
  }, [selectedSchool]);

  const onSubmit = async (data: GradeFormData) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        turma: grade && typeof grade.turma === 'object' ? grade.turma._id : grade?.turma,
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

      // ENVIAR HORÁRIOS - Obrigatório conforme especificação da API
      if (grade && grade.horarios && grade.horarios.length > 0) {
        payload.horarios = grade.horarios.map(h => {
          const horarioPayload: any = {
            disciplina: typeof h.disciplina === 'object' ? h.disciplina._id : h.disciplina,
            professor: typeof h.professor === 'object' ? h.professor._id : h.professor,
            diaSemana: h.diaSemana,
            horaInicio: h.horaInicio,
            horaFim: h.horaFim,
            periodo: h.periodo,
            observacoes: h.observacoes,
          };

          // Só envia _id se não for temporário (criados localmente começam com "temp-")
          if (!h._id.startsWith('temp-')) {
            horarioPayload._id = h._id;
          }

          return horarioPayload;
        });
      }

      // Pega o idEscola da grade ou do selectedSchool
      const idEscola = selectedSchool?._id || (grade && typeof grade.escola === 'object' ? grade.escola._id : grade?.escola);

      const selectedPreset = gradeThemes.find((item) => item.id === temaPresetId);
      if (temaTipo === "custom" || selectedPreset) {
        const temaPayload = temaTipo === "preset" && selectedPreset
          ? {
              tipo: "preset" as const,
              id: selectedPreset.id,
              config: selectedPreset.config,
            }
          : {
              tipo: "custom" as const,
              config: {
                ...temaCustom,
                pattern: temaCustom.pattern || undefined,
              },
            };
        const temaResponse = await updateGradeTema(id, temaPayload, idEscola);
        const temaData = temaResponse.data || temaResponse.payload;
        if (temaData) {
          setGrade((prev) => (prev ? { ...prev, tema: temaData.tema } : prev));
        }
      }

      const response = await updateGradeHoraria(id, payload, idEscola);

      toast.success(response.message || "Grade atualizada com sucesso!", {
        description: "Todas as alterações foram salvas.",
      });
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

  const handleDelete = async () => {
    if (!grade) return;

    try {
      // Pega o idEscola da grade ou do selectedSchool
      const idEscola = selectedSchool?._id || (grade && typeof grade.escola === 'object' ? grade.escola._id : grade?.escola);
      await deleteGradeHoraria(id, idEscola);
      toast.success("Grade excluída com sucesso!");
      router.push("/planejamento/grade-horaria");
    } catch (error: any) {
      toast.error("Erro ao excluir grade", {
        description: error.response?.data?.message || "Não foi possível excluir a grade.",
      });
    }
  };

  const handleRegenerarGrade = async () => {
    if (!grade) return;

    setIsRegeneratingGrade(true);
    try {
      // Pega o idEscola da grade (pode ser objeto ou string)
      const idEscola = typeof grade.escola === 'object' ? grade.escola._id : grade.escola;
      const response = await gerarGradeAutomaticamente(id, idEscola);

      if (response.success || response.data || response.payload) {
        toast.success(response.message || "Grade sendo gerada novamente!", {
          description: "Aguarde alguns instantes enquanto a grade é processada.",
        });
        router.push("/planejamento/grade-horaria");
      }
    } catch (error: any) {
      toast.error("Erro ao regenerar grade", {
        description: error.response?.data?.message || "Não foi possível gerar a grade novamente.",
      });

      if (error.response?.data?.conflitos) {
        console.error("Conflitos:", error.response.data.conflitos);
      }
    } finally {
      setIsRegeneratingGrade(false);
      regenerateModal.closeModal();
    }
  };

  const handleHorarioClick = (horario: Horario) => {
    setHorarioSelecionado(horario);
  };

  const handleHorarioSwap = (horario1: Horario, horario2: Horario) => {
    if (!grade) return;

    // Atualiza localmente os horários trocados
    const novosHorarios = grade.horarios.map((h) => {
      if (h._id === horario1._id) {
        // Trocar posição do horario1 para posição do horario2
        return {
          ...h,
          diaSemana: horario2.diaSemana,
          horaInicio: horario2.horaInicio,
          horaFim: horario2.horaFim,
        };
      }
      if (h._id === horario2._id) {
        // Trocar posição do horario2 para posição do horario1
        return {
          ...h,
          diaSemana: horario1.diaSemana,
          horaInicio: horario1.horaInicio,
          horaFim: horario1.horaFim,
        };
      }
      return h;
    });

    // Atualiza o estado local
    setGrade({
      ...grade,
      horarios: novosHorarios,
    });

    toast.success("Horários trocados!", {
      description: "As alterações ainda não foram salvas. Clique em 'Salvar Alterações' para persistir.",
    });
  };

  const handleAddHorario = (dia: DiaSemana, horaInicio: string, horaFim: string) => {
    setHorarioSelecionadoCelula({ dia, horaInicio, horaFim });
    addHorarioModal.openModal();
  };

  const handleConfirmAddHorario = (disciplinaId: string, professorId: string, periodo: Periodo, observacoes?: string) => {
    if (!horarioSelecionadoCelula || !grade) return;

    const disciplina = disciplinas.find(d => d._id === disciplinaId);
    const professor = professores.find(p => p._id === professorId);

    const novoHorario: Horario = {
      _id: `temp-${Date.now()}`, // ID temporário
      diaSemana: horarioSelecionadoCelula.dia,
      horaInicio: horarioSelecionadoCelula.horaInicio,
      horaFim: horarioSelecionadoCelula.horaFim,
      periodo,
      disciplina: disciplina || disciplinaId,
      professor: professor || professorId,
      observacoes,
    };

    setGrade({
      ...grade,
      horarios: [...grade.horarios, novoHorario],
    });

    setHorarioSelecionadoCelula(null);
    toast.success("Horário adicionado!", {
      description: "Clique em 'Salvar Alterações' para persistir.",
    });
  };

  const handleRemoveHorario = (horario: Horario) => {
    if (!grade) return;

    const novosHorarios = grade.horarios.filter(h => h._id !== horario._id);

    setGrade({
      ...grade,
      horarios: novosHorarios,
    });

    toast.success("Horário removido!", {
      description: "Clique em 'Salvar Alterações' para persistir.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
      </div>
    );
  }

  const selectedPreset = gradeThemes.find((item) => item.id === temaPresetId);
  const { config: temaConfig, assets: temaAssets } = resolveGradeTheme(
    temaTipo === "custom"
      ? { tipo: "custom", config: temaCustom }
      : { tipo: "preset", id: temaPresetId || undefined, config: selectedPreset?.config },
    gradeThemes
  );

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

        {/* Tema da Grade */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
            Tema da Grade
          </h2>
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              type="button"
              onClick={() => setTemaTipo("preset")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                temaTipo === "preset"
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              Presets
            </button>
            <button
              type="button"
              onClick={() => setTemaTipo("custom")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                temaTipo === "custom"
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              Custom
            </button>
          </div>

          {temaTipo === "preset" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {gradeThemes.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  Nenhum tema preset disponível no momento.
                </div>
              )}
              {gradeThemes.map((theme) => {
                const previewBg = theme.config?.background || "#ffffff";
                const previewPrimary = theme.config?.primaryColor || "#6366f1";
                const isSelected = temaPresetId === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setTemaPresetId(theme.id)}
                    className={`rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-brand-500 ring-2 ring-brand-200"
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
                    }`}
                  >
                    <div
                      className="h-16 w-full rounded-lg border border-gray-200 dark:border-gray-800"
                      style={{
                        background: previewBg,
                        backgroundImage: `linear-gradient(135deg, ${previewPrimary}33 0%, transparent 55%)`,
                      }}
                    />
                    <p className="mt-3 text-sm font-medium text-gray-800 dark:text-white/90">
                      {theme.nome}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="customPrimary">Cor primária</Label>
                <input
                  id="customPrimary"
                  type="color"
                  value={temaCustom.primaryColor || "#6366f1"}
                  onChange={(e) => setTemaCustom((prev) => ({ ...prev, primaryColor: e.target.value }))}
                  className="h-12 w-full cursor-pointer rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900"
                />
              </div>
              <div>
                <Label htmlFor="customAccent">Cor de destaque</Label>
                <input
                  id="customAccent"
                  type="color"
                  value={temaCustom.accentColor || "#22c55e"}
                  onChange={(e) => setTemaCustom((prev) => ({ ...prev, accentColor: e.target.value }))}
                  className="h-12 w-full cursor-pointer rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900"
                />
              </div>
              <div>
                <Label htmlFor="customBackground">Cor de fundo</Label>
                <input
                  id="customBackground"
                  type="color"
                  value={temaCustom.background || "#ffffff"}
                  onChange={(e) => setTemaCustom((prev) => ({ ...prev, background: e.target.value }))}
                  className="h-12 w-full cursor-pointer rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900"
                />
              </div>
              <div>
                <Label htmlFor="customPattern">Padrão</Label>
                <select
                  id="customPattern"
                  value={temaCustom.pattern || ""}
                  onChange={(e) => setTemaCustom((prev) => ({ ...prev, pattern: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                >
                  <option value="">Sem padrão</option>
                  <option value="dots">Pontilhado</option>
                  <option value="snow">Neve</option>
                  <option value="hearts">Corações</option>
                </select>
              </div>
            </div>
          )}
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

      </form>

      {/* Grade Horária - Visualização e Edição */}
      {grade && (
        <div className="space-y-6">
          {/* Header da Grade com Botão de Regerar */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-medium text-gray-800 dark:text-white/90">
                  Grade Horária
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Visualize e edite os horários manualmente ou regenere automaticamente
                </p>
              </div>
              {!grade.validada && (
                <Button
                  variant="outline"
                  onClick={regenerateModal.openModal}
                  disabled={isRegeneratingGrade}
                  className="border-brand-500 text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20"
                >
                  {isRegeneratingGrade ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Regenerando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Regerar Grade Automaticamente
                    </>
                  )}
                </Button>
              )}
            </div>

            {(grade.horarios && grade.horarios.length > 0) ||
            (grade.slotsIntervalo && grade.slotsIntervalo.length > 0) ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Grade Horária - 70% */}
                <div className="lg:col-span-2">
                  <div className="mb-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                          <strong>Modo de Edição Ativo</strong>
                        </p>
                        <ul className="space-y-0.5 text-xs text-blue-600 dark:text-blue-400">
                          <li>• Arraste e solte horários para reorganizar</li>
                          <li>• Clique no <strong>+</strong> para adicionar novos horários</li>
                          <li>• Passe o mouse e clique no <strong>X</strong> para remover</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  {(grade.horarios && grade.horarios.length > 0) ||
                  (grade.slotsIntervalo && grade.slotsIntervalo.length > 0) ? (
                    <GradeHorariaViewer
                      horarios={grade.horarios}
                      slotsIntervalo={grade.slotsIntervalo}
                      onHorarioClick={handleHorarioClick}
                      selectedHorarioId={horarioSelecionado?._id}
                      editMode={!grade.validada}
                      onHorarioSwap={handleHorarioSwap}
                      onAddHorario={!grade.validada ? handleAddHorario : undefined}
                      onRemoveHorario={!grade.validada ? handleRemoveHorario : undefined}
                      diasLetivos={selectedSchool?.configuracoes?.diasLetivos}
                      temaConfig={temaConfig}
                      temaAssets={temaAssets}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500 dark:text-gray-400">
                        Nenhum horário alocado ainda. A grade será gerada automaticamente pela API.
                      </p>
                    </div>
                  )}
                </div>

                {/* Sidebar - 30% */}
                <div className="lg:col-span-1">
                  <TurmaSidebar
                    horarioSelecionado={horarioSelecionado}
                    todosHorarios={grade.horarios || []}
                  />

                  {/* Informações de Edição */}
                  {!grade.validada && (
                    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                      <h3 className="text-sm font-semibold text-green-800 dark:text-green-400 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Edição Ativa
                      </h3>
                      <p className="text-xs text-green-700 dark:text-green-300 mb-3">
                        Funcionalidades disponíveis:
                      </p>
                      <ul className="space-y-1.5 text-xs text-green-700 dark:text-green-300">
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span><strong>Arrastar e soltar</strong> para trocar horários de posição</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span><strong>Clique no +</strong> em células vazias para adicionar horário</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span><strong>Clique no X</strong> (ao passar o mouse) para remover horário</span>
                        </li>
                      </ul>
                      <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                        <p className="text-xs text-green-600 dark:text-green-400">
                          💡 As alterações são salvas localmente. Clique em <strong>"Salvar Alterações"</strong> para persistir no banco de dados.
                        </p>
                      </div>
                    </div>
                  )}

                  {horarioSelecionado && (
                    <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                      <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-400 mb-2">
                        Horário Selecionado
                      </h3>
                      <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                        <p>
                          <strong>Disciplina:</strong>{" "}
                          {typeof horarioSelecionado.disciplina === "object"
                            ? horarioSelecionado.disciplina.nome
                            : "Não definida"}
                        </p>
                        <p>
                          <strong>Professor:</strong>{" "}
                          {typeof horarioSelecionado.professor === "object"
                            ? horarioSelecionado.professor.nome
                            : "Não definido"}
                        </p>
                        <p>
                          <strong>Horário:</strong> {horarioSelecionado.horaInicio} - {horarioSelecionado.horaFim}
                        </p>
                        {horarioSelecionado.observacoes && (
                          <p>
                            <strong>Observações:</strong> {horarioSelecionado.observacoes}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-3 text-gray-500 dark:text-gray-400">
                  Nenhum horário alocado ainda.
                </p>
                <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                  Clique em "Regerar Grade Automaticamente" para gerar os horários.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <Link href={`/planejamento/grade-horaria/${id}`}>
          <Button variant="outline" type="button" disabled={isSubmitting}>
            Cancelar
          </Button>
        </Link>
        <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      {/* Zona de Perigo */}
      {grade && !grade.validada && (
        <div className="rounded-xl border border-error-200 bg-error-50 p-6 dark:border-error-800 dark:bg-error-900/20">
          <h2 className="text-lg font-medium text-error-800 dark:text-error-400 mb-2">
            Zona de Perigo
          </h2>
          <p className="text-sm text-error-700 dark:text-error-300 mb-4">
            Ações irreversíveis. Tenha cuidado!
          </p>
          <Button variant="outline" onClick={deleteModal.openModal} className="border-error-500 text-error-500 hover:bg-error-50 dark:hover:bg-error-900/40">
            Excluir Grade
          </Button>
        </div>
      )}

      {/* Modais de Confirmação */}
      {grade && (
        <>
          <ConfirmDialog
            isOpen={deleteModal.isOpen}
            onClose={deleteModal.closeModal}
            onConfirm={handleDelete}
            title="Excluir Grade"
            description={`Tem certeza que deseja excluir a grade "${grade.nome}"? Esta ação não pode ser desfeita.`}
            confirmText="Excluir"
            cancelText="Cancelar"
            variant="danger"
          />

          <ConfirmDialog
            isOpen={regenerateModal.isOpen}
            onClose={regenerateModal.closeModal}
            onConfirm={handleRegenerarGrade}
            title="Regerar Grade Automaticamente"
            description="Tem certeza que deseja regerar a grade automaticamente? Isso irá sobrescrever todos os horários atuais com base nas disciplinas e configurações da turma."
            confirmText="Regerar"
            cancelText="Cancelar"
            variant="warning"
          />
        </>
      )}

      {/* Modal de Adicionar Horário */}
      {horarioSelecionadoCelula && (
        <AddHorarioModal
          isOpen={addHorarioModal.isOpen}
          onClose={addHorarioModal.closeModal}
          onAdd={handleConfirmAddHorario}
          professores={professores}
          disciplinas={disciplinas}
          diaSemana={horarioSelecionadoCelula.dia}
          horaInicio={horarioSelecionadoCelula.horaInicio}
          horaFim={horarioSelecionadoCelula.horaFim}
        />
      )}
    </div>
  );
}
