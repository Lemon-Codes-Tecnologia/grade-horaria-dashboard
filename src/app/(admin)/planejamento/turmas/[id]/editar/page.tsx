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
  type DiaSemana,
  type Turno,
} from "@/lib/api/turmas";
import { listProfessores, type Professor } from "@/lib/api/professores";
import { listDisciplinas, type Disciplina as DisciplinaCadastrada } from "@/lib/api/disciplinas";
import { useSchool } from "@/context/SchoolContext";

// Interface para Disciplina da Turma
interface Disciplina {
  _id?: string;
  disciplina: string; // ID da disciplina
  cargaHorariaSemanal: number;
}

// Interface para Aluno
interface Aluno {
  nomeAluno: string;
  cpfAluno: string;
  emailAluno?: string;
  nomeResponsavel: string;
  cpfResponsavel: string;
  emailResponsavel?: string;
  telefoneResponsavel?: string;
}

// Validation schema
const turmaSchema = z.object({
  nome: z.string().min(1, "Nome da turma é obrigatório").optional(),
  codigo: z.string()
    .min(2, "Código deve ter no mínimo 2 caracteres")
    .max(20, "Código deve ter no máximo 20 caracteres")
    .regex(/^[A-Z0-9]+$/i, "Código deve conter apenas letras e números")
    .optional(),
  serie: z.string().min(1, "Série é obrigatória").optional(),
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
  // Configurações de Aula
  quantidadeAulasPorDia: z.string().optional(),
  maximoAulasConsecutivas: z.string().optional(),
  intervaloObrigatorio: z.string().optional(),
});

type TurmaFormData = z.infer<typeof turmaSchema>;

const serieOptions: { value: string; label: string }[] = [
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

const diasSemanaOptions: { value: DiaSemana; label: string }[] = [
  { value: "segunda", label: "Segunda" },
  { value: "terca", label: "Terça" },
  { value: "quarta", label: "Quarta" },
  { value: "quinta", label: "Quinta" },
  { value: "sexta", label: "Sexta" },
  { value: "sabado", label: "Sábado" },
  { value: "domingo", label: "Domingo" },
];

export default function EditarTurmaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { selectedSchool } = useSchool();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [selectedDias, setSelectedDias] = useState<DiaSemana[]>([]);

  // Estados para gerenciar disciplinas
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [disciplinasDisponiveis, setDisciplinasDisponiveis] = useState<DisciplinaCadastrada[]>([]);
  const [novaDisciplina, setNovaDisciplina] = useState("");

  // Estados para gerenciar alunos
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [novoAluno, setNovoAluno] = useState<Aluno>({
    nomeAluno: "",
    cpfAluno: "",
    emailAluno: "",
    nomeResponsavel: "",
    cpfResponsavel: "",
    emailResponsavel: "",
    telefoneResponsavel: "",
  });

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
      if (!selectedSchool) return;

      try {
        const response = await getTurma(id, selectedSchool._id);
        const turma = response.data || response.payload;

        if (turma) {
          reset({
            nome: turma.nome,
            codigo: turma.codigo,
            serie: turma.serie,
            turno: turma.turno,
            capacidadeMaxima: turma.capacidadeMaxima.toString(),
            quantidadeAlunos: turma.quantidadeAlunos?.toString() || "",
            sala: turma.sala || "",
            anoLetivo: turma.anoLetivo?.toString() || "",
            professorResponsavel: turma.professorResponsavel || "",
            quantidadeAulasPorDia: turma.configuracoes?.quantidadeAulasPorDia?.toString() || "",
            maximoAulasConsecutivas: turma.configuracoes?.maxAulasConsecutivas?.toString() || "",
            intervaloObrigatorio: turma.configuracoes?.intervaloObrigatorioAposAulas?.toString() || "",
          });
          setSelectedDias(turma.configuracoes?.diasLetivos || turma.diasLetivos || []);

          // Carregar disciplinas da turma
          if (turma.disciplinas && Array.isArray(turma.disciplinas)) {
            setDisciplinas(turma.disciplinas.map((d: any) => ({
              _id: d._id,
              disciplina: typeof d.disciplina === 'string' ? d.disciplina : d.disciplina?._id,
              cargaHorariaSemanal: d.cargaHorariaSemanal,
            })));
          }

          // Carregar alunos da turma
          if (turma.alunos && Array.isArray(turma.alunos)) {
            setAlunos(turma.alunos);
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
  }, [id, selectedSchool]);

  // Buscar professores disponíveis quando a escola for selecionada
  useEffect(() => {
    const fetchProfessores = async () => {
      if (!selectedSchool) return;

      try {
        const response = await listProfessores({
          idEscola: selectedSchool._id,
          ativo: true,
          limit: 100, // Buscar todos os professores ativos
        });

        const professoresData = response.data || response.payload;
        if (professoresData && professoresData.docs) {
          setProfessores(professoresData.docs);
        }
      } catch (error) {
        console.error("Erro ao carregar professores:", error);
        toast.error("Erro ao carregar professores disponíveis");
      }
    };

    fetchProfessores();
  }, [selectedSchool]);

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

  const toggleDia = (dia: DiaSemana) => {
    setSelectedDias((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  };

  const adicionarDisciplina = () => {
    if (!novaDisciplina) {
      toast.error("Selecione uma disciplina");
      return;
    }

    // Verificar se a disciplina já foi adicionada
    if (disciplinas.some(d => d.disciplina === novaDisciplina)) {
      toast.error("Esta disciplina já foi adicionada");
      return;
    }

    // Buscar a carga horária da disciplina selecionada
    const disciplinaSelecionada = disciplinasDisponiveis.find(d => d._id === novaDisciplina);
    if (!disciplinaSelecionada?.cargaHoraria || disciplinaSelecionada.cargaHoraria <= 0) {
      toast.error("A disciplina selecionada não possui carga horária definida");
      return;
    }

    setDisciplinas([
      ...disciplinas,
      {
        disciplina: novaDisciplina, // ID da disciplina
        cargaHorariaSemanal: disciplinaSelecionada.cargaHoraria,
      },
    ]);

    setNovaDisciplina("");
    toast.success("Disciplina adicionada!");
  };

  const adicionarTodasDisciplinas = () => {
    // Filtrar disciplinas que ainda não foram adicionadas
    const disciplinasParaAdicionar = disciplinasDisponiveis.filter(
      d => !disciplinas.some(disc => disc.disciplina === d._id) &&
           d.cargaHoraria && d.cargaHoraria > 0
    );

    if (disciplinasParaAdicionar.length === 0) {
      toast.error("Não há disciplinas disponíveis para adicionar");
      return;
    }

    // Adicionar todas as disciplinas disponíveis
    const novasDisciplinas = disciplinasParaAdicionar.map(d => ({
      disciplina: d._id,
      cargaHorariaSemanal: d.cargaHoraria,
    }));

    setDisciplinas([...disciplinas, ...novasDisciplinas]);
    toast.success(`${disciplinasParaAdicionar.length} disciplina(s) adicionada(s)!`);
  };

  const removerDisciplina = (index: number) => {
    setDisciplinas(disciplinas.filter((_, i) => i !== index));
  };

  const adicionarAluno = () => {
    // Validações
    if (!novoAluno.nomeAluno.trim()) {
      toast.error("Nome do aluno é obrigatório");
      return;
    }
    if (!novoAluno.cpfAluno.trim()) {
      toast.error("CPF do aluno é obrigatório");
      return;
    }
    if (novoAluno.cpfAluno.replace(/\D/g, "").length !== 11) {
      toast.error("CPF do aluno deve ter 11 dígitos");
      return;
    }
    if (!novoAluno.nomeResponsavel.trim()) {
      toast.error("Nome do responsável é obrigatório");
      return;
    }
    if (!novoAluno.cpfResponsavel.trim()) {
      toast.error("CPF do responsável é obrigatório");
      return;
    }
    if (novoAluno.cpfResponsavel.replace(/\D/g, "").length !== 11) {
      toast.error("CPF do responsável deve ter 11 dígitos");
      return;
    }

    // Validação de email (opcional)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (novoAluno.emailResponsavel && !emailRegex.test(novoAluno.emailResponsavel)) {
      toast.error("Email do responsável inválido");
      return;
    }
    if (novoAluno.emailAluno && !emailRegex.test(novoAluno.emailAluno)) {
      toast.error("Email do aluno inválido");
      return;
    }

    setAlunos([...alunos, novoAluno]);

    // Limpa o formulário
    setNovoAluno({
      nomeAluno: "",
      cpfAluno: "",
      emailAluno: "",
      nomeResponsavel: "",
      cpfResponsavel: "",
      emailResponsavel: "",
      telefoneResponsavel: "",
    });

    toast.success("Aluno adicionado!");
  };

  const removerAluno = (index: number) => {
    setAlunos(alunos.filter((_, i) => i !== index));
    toast.success("Aluno removido!");
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1-$2");
    }
    return value;
  };

  const onSubmit = async (data: TurmaFormData) => {
    if (!selectedSchool) {
      toast.error("Nenhuma escola selecionada", {
        description: "Por favor, selecione uma escola antes de atualizar a turma.",
      });
      return;
    }

    if (disciplinas.length === 0) {
      toast.error("Adicione ao menos uma disciplina", {
        description: "Disciplinas são obrigatórias para gerar a grade horária.",
      });
      return;
    }

    // Extrair o ano da série selecionada (se a série foi alterada)
    const extrairAnoDaSerie = (serie: string): number => {
      // Para séries infantis, retorna 1, 2 ou 3
      if (serie.includes("infantil")) {
        if (serie.startsWith("1")) return 1;
        if (serie.startsWith("2")) return 2;
        if (serie.startsWith("3")) return 3;
      }
      // Para séries fundamentais, retorna 1-9
      if (serie.includes("fundamental")) {
        const match = serie.match(/^(\d+)ano/);
        if (match) return parseInt(match[1]);
      }
      // Para séries médio, retorna 1-3
      if (serie.includes("medio")) {
        const match = serie.match(/^(\d+)ano/);
        if (match) return parseInt(match[1]);
      }
      // Para EJA, retorna 1
      if (serie.includes("eja")) return 1;

      return 1; // Valor padrão
    };

    setIsSubmitting(true);
    try {
      const updateData: any = {
        nome: data.nome,
        codigo: data.codigo ? data.codigo.toUpperCase() : undefined,
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
        diasLetivos: selectedDias.length > 0 ? selectedDias : undefined,
      };

      // Se a série foi alterada, atualiza série e ano
      if (data.serie) {
        updateData.serie = data.serie;
        updateData.ano = extrairAnoDaSerie(data.serie);
      }

      // Adicionar disciplinas
      if (disciplinas.length > 0) {
        updateData.disciplinas = disciplinas.map(d => ({
          disciplina: d.disciplina,
          cargaHorariaSemanal: d.cargaHorariaSemanal,
        }));
      }

      // Adicionar alunos
      if (alunos.length > 0) {
        updateData.alunos = alunos;
      }

      // Preparar configurações se algum campo foi preenchido
      if (data.quantidadeAulasPorDia || data.maximoAulasConsecutivas || data.intervaloObrigatorio) {
        updateData.configuracoes = {
          quantidadeAulasPorDia: data.quantidadeAulasPorDia ? parseInt(data.quantidadeAulasPorDia) : undefined,
          maxAulasConsecutivas: data.maximoAulasConsecutivas ? parseInt(data.maximoAulasConsecutivas) : undefined,
          intervaloObrigatorioAposAulas: data.intervaloObrigatorio ? parseInt(data.intervaloObrigatorio) : undefined,
        };
      }

      const response = await updateTurma(id, updateData, selectedSchool._id);

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
            </div>

            <div className="mt-6">
              <Label>Dias Letivos (selecione um ou mais)</Label>
              <p className="text-xs text-gray-500 mt-1">
                Selecionados: {selectedDias.join(", ") || "Nenhum"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {diasSemanaOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleDia(option.value)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                      selectedDias.includes(option.value)
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Disciplinas */}
          <div>
            <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
              Disciplinas (obrigatório para gerar grade)
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
              <div className="mt-2 flex gap-3">
                <select
                  value={novaDisciplina}
                  onChange={(e) => setNovaDisciplina(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                >
                  <option value="">Selecione uma disciplina</option>
                  {disciplinasDisponiveis
                    .filter(d => !disciplinas.some(disc => disc.disciplina === d._id))
                    .map((disciplina) => (
                      <option key={disciplina._id} value={disciplina._id}>
                        {disciplina.nome} ({disciplina.codigo}) - {disciplina.cargaHoraria}h/semana
                      </option>
                    ))}
                </select>
                <Button
                  type="button"
                  onClick={adicionarDisciplina}
                  size="sm"
                >
                  +
                </Button>
              </div>
              <div className="mt-3">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={adicionarTodasDisciplinas}
                    variant="outline"
                    size="sm"
                  >
                    Adicionar todas as disciplinas
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Professor Responsável */}
          <div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Professor Responsável (opcional)</Label>
                <Controller
                  name="professorResponsavel"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                    >
                      <option value="">Selecione um professor (opcional)</option>
                      {professores.map((professor) => (
                        <option key={professor._id} value={professor._id}>
                          {professor.nome} - {professor.matricula}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.professorResponsavel && (
                  <p className="mt-1 text-xs text-error-500">
                    {errors.professorResponsavel.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Configurações de Aula */}
          <div>
            <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
              Configurações de Aula
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <Label>Quantidade de Aulas por Dia</Label>
                <Input
                  type="number"
                  placeholder="Ex: 6"
                  min={1}
                  {...register("quantidadeAulasPorDia")}
                  error={errors.quantidadeAulasPorDia?.message}
                />
              </div>
              <div>
                <Label>Máximo de Aulas Consecutivas</Label>
                <Input
                  type="number"
                  placeholder="Ex: 3"
                  min={1}
                  {...register("maximoAulasConsecutivas")}
                  error={errors.maximoAulasConsecutivas?.message}
                />
              </div>
              <div>
                <Label>Intervalo Obrigatório (após X aulas)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 3"
                  min={1}
                  {...register("intervaloObrigatorio")}
                  error={errors.intervaloObrigatorio?.message}
                />
              </div>
            </div>
          </div>

          {/* Alunos */}
          <div>
            <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
              Alunos da Turma (opcional)
            </h2>

            {/* Lista de Alunos */}
            {alunos.length > 0 && (
              <div className="mb-4 space-y-2">
                {alunos.map((aluno, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {aluno.nomeAluno}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        CPF: {formatCPF(aluno.cpfAluno)}
                      </p>
                      {aluno.emailAluno && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Email: {aluno.emailAluno}
                        </p>
                      )}
                      <div className="mt-2 border-t border-gray-200 pt-2 dark:border-gray-700">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          Responsável: {aluno.nomeResponsavel}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          CPF: {formatCPF(aluno.cpfResponsavel)}
                        </p>
                        {aluno.emailResponsavel && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Email: {aluno.emailResponsavel}
                          </p>
                        )}
                        {aluno.telefoneResponsavel && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Telefone: {aluno.telefoneResponsavel}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removerAluno(index)}
                      className="ml-4 rounded-lg p-2 text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10"
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
                ))}
              </div>
            )}

            {/* Adicionar Aluno */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
              <Label className="mb-3">Adicionar Aluno</Label>

              {/* Dados do Aluno */}
              <div className="mb-4">
                <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                  Dados do Aluno
                </p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <Input
                      type="text"
                      placeholder="Nome do aluno *"
                      value={novoAluno.nomeAluno}
                      onChange={(e) =>
                        setNovoAluno({ ...novoAluno, nomeAluno: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Input
                      type="text"
                      placeholder="CPF do aluno *"
                      value={formatCPF(novoAluno.cpfAluno || "")}
                      onChange={(e) =>
                        setNovoAluno({
                          ...novoAluno,
                          cpfAluno: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      maxLength={14}
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Email do aluno"
                      value={novoAluno.emailAluno}
                      onChange={(e) =>
                        setNovoAluno({ ...novoAluno, emailAluno: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Dados do Responsável */}
              <div>
                <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                  Dados do Responsável
                </p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div>
                    <Input
                      type="text"
                      placeholder="Nome do responsável *"
                      value={novoAluno.nomeResponsavel}
                      onChange={(e) =>
                        setNovoAluno({ ...novoAluno, nomeResponsavel: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Input
                      type="text"
                      placeholder="CPF do responsável *"
                      value={formatCPF(novoAluno.cpfResponsavel || "")}
                      onChange={(e) =>
                        setNovoAluno({
                          ...novoAluno,
                          cpfResponsavel: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      maxLength={14}
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Email do responsável"
                      value={novoAluno.emailResponsavel}
                      onChange={(e) =>
                        setNovoAluno({ ...novoAluno, emailResponsavel: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Telefone"
                      value={novoAluno.telefoneResponsavel}
                      onChange={(e) =>
                        setNovoAluno({
                          ...novoAluno,
                          telefoneResponsavel: e.target.value,
                        })
                      }
                    />
                    <Button type="button" onClick={adicionarAluno} size="sm">
                      +
                    </Button>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                * Campos obrigatórios
              </p>
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
