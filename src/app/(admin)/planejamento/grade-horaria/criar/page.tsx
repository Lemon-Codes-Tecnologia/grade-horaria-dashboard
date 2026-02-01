"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon } from "@/icons";
import Link from "next/link";
import {
  createGradeHoraria,
  type NivelOtimizacao,
  type Horario,
  type DiaSemana,
  type Periodo,
} from "@/lib/api/grades-horarias";
import { listTurmas, type Turma } from "@/lib/api/turmas";
import { listProfessores, type Professor } from "@/lib/api/professores";
import { listDisciplinas, type Disciplina } from "@/lib/api/disciplinas";
import { useSchool } from "@/context/SchoolContext";
import GradeHorariaEditor from "@/components/grade-horaria/GradeHorariaEditor";
import AddHorarioModal from "@/components/grade-horaria/AddHorarioModal";
import { useModal } from "@/hooks/useModal";

// Validation schema
const gradeSchema = z.object({
  modo: z.enum(["turma", "turno"]),
  turma: z.string().optional(),
  turno: z.enum(["manha", "tarde", "noite"]).optional(),
  nome: z.string().optional(),
  descricao: z.string().optional(),
});

type GradeFormData = z.infer<typeof gradeSchema>;

export default function CriarGradeHorariaPage() {
  const router = useRouter();
  const { selectedSchool } = useSchool();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loadingTurmas, setLoadingTurmas] = useState(true);

  // Horários manuais
  const [horariosManuais, setHorariosManuais] = useState<Horario[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [horarioSelecionadoCelula, setHorarioSelecionadoCelula] = useState<{
    dia: DiaSemana;
    horaInicio: string;
    horaFim: string;
  } | null>(null);

  const addHorarioModal = useModal();

  // Estatísticas de validação
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
    watch,
    setValue,
    setError,
    clearErrors,
  } = useForm<GradeFormData>({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      modo: "turma",
      turma: "",
      turno: "",
      nome: "",
      descricao: "",
    },
  });

  const turmaSelecionada = watch("turma");
  const modoSelecionado = watch("modo");
  const turnoSelecionado = watch("turno");

  useEffect(() => {
    if (modoSelecionado === "turno") {
      setValue("turma", "");
      setValue("nome", "");
      setValue("descricao", "");
      clearErrors(["turma", "nome", "descricao"]);
    } else {
      setValue("turno", "");
      clearErrors(["turno"]);
    }
  }, [modoSelecionado, setValue, clearErrors]);

  // Busca automática de nome baseado na turma
  useEffect(() => {
    if (modoSelecionado !== "turma") return;
    if (turmaSelecionada) {
      const turma = turmas.find(t => t._id === turmaSelecionada);
      if (turma) {
        const anoAtual = new Date().getFullYear();
        setValue("nome", `Grade ${turma.nome} - ${anoAtual}`);
      }
    }
  }, [turmaSelecionada, turmas, setValue, modoSelecionado]);

  // Carregar professores e disciplinas quando turma for selecionada
  useEffect(() => {
    const fetchProfessoresEDisciplinas = async () => {
      if (!selectedSchool || !turmaSelecionada || modoSelecionado !== "turma") return;

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
  }, [selectedSchool, turmaSelecionada, modoSelecionado]);

  // Carregar turmas
  useEffect(() => {
    const fetchTurmas = async () => {
      if (!selectedSchool) return;

      setLoadingTurmas(true);
      try {
        const response = await listTurmas({
          idEscola: selectedSchool._id,
          ativa: true,
          limit: 1000,
        });

        const turmasData = response.data || response.payload;
        if (turmasData && turmasData.docs) {
          setTurmas(turmasData.docs);
        }
      } catch (error) {
        console.error("Erro ao carregar turmas:", error);
        toast.error("Erro ao carregar turmas disponíveis");
      } finally {
        setLoadingTurmas(false);
      }
    };

    fetchTurmas();
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
        const horariosConfigurados = (() => {
          const horarios = selectedSchool.configuracoes?.horariosDisponiveis as Record<string, any> | undefined;
          if (!horarios) return false;
          const keys = Object.keys(horarios);
          if (keys.length === 0) return false;
          const legacyTurnos = keys.filter((key) => ["manha", "tarde", "noite"].includes(key));
          if (legacyTurnos.length > 0) return true;
          return Object.values(horarios).some((turnos) => Object.keys(turnos || {}).length > 0);
        })();

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

  // Funções para manipular horários manuais
  const handleAddHorario = (dia: DiaSemana, horaInicio: string, horaFim: string) => {
    setHorarioSelecionadoCelula({ dia, horaInicio, horaFim });
    addHorarioModal.openModal();
  };

  const handleConfirmAddHorario = (disciplinaId: string, professorId: string, periodo: Periodo, observacoes?: string) => {
    if (!horarioSelecionadoCelula) return;

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

    setHorariosManuais([...horariosManuais, novoHorario]);
    setHorarioSelecionadoCelula(null);
    toast.success("Horário adicionado!");
  };

  const handleRemoveHorario = (horario: Horario) => {
    setHorariosManuais(horariosManuais.filter(h => h._id !== horario._id));
    toast.success("Horário removido!");
  };

  const onSubmit = async (data: GradeFormData) => {
    if (!selectedSchool) {
      toast.error("Nenhuma escola selecionada");
      return;
    }

    if (data.modo === "turma") {
      if (!data.turma) {
        setError("turma", { message: "Selecione uma turma" });
        return;
      }
      if (!data.nome?.trim()) {
        setError("nome", { message: "Nome da grade é obrigatório" });
        return;
      }
    } else {
      if (!data.turno) {
        setError("turno", { message: "Selecione um turno" });
        return;
      }
    }

    // Validações básicas
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
        modo: data.modo,
      };

      if (data.modo === "turma") {
        payload.turma = data.turma;
        payload.nome = data.nome;
        payload.descricao = data.descricao || undefined;
      } else {
        payload.turno = data.turno;
      }

      // Adicionar horários criados manualmente
      if (data.modo === "turma" && horariosManuais.length > 0) {
        payload.horarios = horariosManuais.map(h => ({
          diaSemana: h.diaSemana,
          horaInicio: h.horaInicio,
          horaFim: h.horaFim,
          periodo: h.periodo,
          disciplina: typeof h.disciplina === 'object' ? h.disciplina._id : h.disciplina,
          professor: typeof h.professor === 'object' ? h.professor._id : h.professor,
          observacoes: h.observacoes,
        }));
      }

      // Adicionar configurações avançadas se habilitadas
      if (data.modo === "turma" && showAdvanced) {
        payload.configuracoes = {
          algoritmo: {
            priorizarSemJanelas,
            permitirAulasDuplas,
            nivelOtimizacao,
            permitirPequenasViolacoes,
          },
        };
      }

      const response = await createGradeHoraria(payload, selectedSchool._id);

      // Verificar se houve sucesso
      if (response.success || response.data || response.payload) {
        toast.success(response.message || "Grade horária gerada com sucesso!", {
          description: response.estatisticas
            ? `${response.estatisticas.aulasAlocadas || 0} aulas alocadas`
            : "Grade criada com sucesso",
        });

        // Mostrar conflitos se houver
        if (response.conflitos && response.conflitos.length > 0) {
          console.warn("Conflitos encontrados:", response.conflitos);
          toast.warning(`${response.conflitos.length} conflito(s) encontrado(s)`);
        }

        // Redirecionar para listagem
        router.push("/planejamento/grade-horaria");
      } else {
        throw new Error(response.message || "Erro ao criar grade");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.join(", ") ||
        error.message ||
        "Ocorreu um erro ao gerar a grade horária.";

      toast.error("Erro ao gerar grade", {
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

  const turmaInfo = modoSelecionado === "turma"
    ? turmas.find(t => t._id === turmaSelecionada)
    : undefined;

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
            Gerar Grade Horária
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gere automaticamente a grade horária por turma ou por turno
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações Básicas */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
            Informações Básicas
          </h2>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <Label>Modo de geração</Label>
              <div className="mt-2 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    value="turma"
                    {...register("modo")}
                    checked={modoSelecionado === "turma"}
                    className="h-4 w-4 text-brand-500 focus:ring-brand-500"
                  />
                  Gerar por turma
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    value="turno"
                    {...register("modo")}
                    checked={modoSelecionado === "turno"}
                    className="h-4 w-4 text-brand-500 focus:ring-brand-500"
                  />
                  Gerar todas do turno
                </label>
              </div>
            </div>

            {modoSelecionado === "turno" && (
              <div>
                <Label>
                  Turno <span className="text-error-500">*</span>
                </Label>
                <select
                  {...register("turno")}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                >
                  <option value="">Selecione o turno</option>
                  <option value="manha">Manhã</option>
                  <option value="tarde">Tarde</option>
                  <option value="noite">Noite</option>
                </select>
                {errors.turno && (
                  <p className="mt-1 text-xs text-error-500">{errors.turno.message}</p>
                )}
              </div>
            )}

            {modoSelecionado === "turma" && (
              <>
                <div>
                  <Label>
                    Turma <span className="text-error-500">*</span>
                  </Label>
                  <select
                    {...register("turma")}
                    disabled={loadingTurmas}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 disabled:opacity-50"
                  >
                    <option value="">
                      {loadingTurmas ? "Carregando turmas..." : "Selecione uma turma"}
                    </option>
                    {turmas.map((turma) => (
                      <option key={turma._id} value={turma._id}>
                        {turma.nome} - {turma.codigo} ({turma.serie})
                      </option>
                    ))}
                  </select>
                  {errors.turma && (
                    <p className="mt-1 text-xs text-error-500">{errors.turma.message}</p>
                  )}
                  {turmaInfo && (
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        <strong>Série:</strong> {turmaInfo.serie} •
                        <strong> Turno:</strong> {turmaInfo.turno.charAt(0).toUpperCase() + turmaInfo.turno.slice(1)} •
                        <strong> Alunos:</strong> {turmaInfo.quantidadeAlunos || 0}/{turmaInfo.capacidadeMaxima}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label>
                    Nome da Grade <span className="text-error-500">*</span>
                  </Label>
                  <input
                    type="text"
                    {...register("nome")}
                    placeholder="Ex: Grade Turma A - 2026"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                  />
                  {errors.nome && (
                    <p className="mt-1 text-xs text-error-500">{errors.nome.message}</p>
                  )}
                </div>

                <div>
                  <Label>Descrição (opcional)</Label>
                  <textarea
                    {...register("descricao")}
                    placeholder="Descrição da grade horária"
                    rows={3}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                  />
                </div>
              </>
            )}
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
              {turmaSelecionada ? (
                <span className="text-green-500">✓</span>
              ) : (
                <span className="text-error-500">✗</span>
              )}
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {turmaSelecionada ? "Turma selecionada" : "Selecione uma turma"}
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

        {/* Grade Horária - Preenchimento Manual (Opcional) */}
        {modoSelecionado === "turma" && turmaSelecionada && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-medium text-gray-800 dark:text-white/90">
                  Grade Horária (Opcional)
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Preencha manualmente alguns horários ou deixe vazio para gerar tudo automaticamente
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {horariosManuais.length} horário(s) adicionado(s)
                  </p>
                </div>
              </div>
            </div>

            {/* Informativo */}
            <div className="mb-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    <strong>Criação Híbrida:</strong>
                  </p>
                  <ul className="mt-1 space-y-0.5 text-xs text-blue-600 dark:text-blue-400">
                    <li>• Clique em uma célula vazia para adicionar um horário manualmente</li>
                    <li>• Clique em um horário já adicionado para removê-lo</li>
                    <li>• Ao criar, você pode gerar automaticamente os horários restantes</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Tabela da Grade Editável */}
            <GradeHorariaEditor
              horarios={horariosManuais}
              onAddHorario={handleAddHorario}
              onRemoveHorario={handleRemoveHorario}
              diasLetivos={selectedSchool?.configuracoes?.diasLetivos}
            />
          </div>
        )}

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
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              (modoSelecionado === "turma" ? !turmaSelecionada : !turnoSelecionado)
            }
          >
            {isSubmitting
              ? "Gerando..."
              : modoSelecionado === "turno"
                ? "Gerar grades"
                : "Gerar grade"}
          </Button>
        </div>
      </form>

      {/* Modal de Adicionar Horário - Fora do form */}
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
