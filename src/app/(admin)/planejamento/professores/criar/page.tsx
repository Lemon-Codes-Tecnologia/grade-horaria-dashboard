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
import { createProfessor, listProfessores } from "@/lib/api/professores";
import { listDisciplinas, type Disciplina } from "@/lib/api/disciplinas";
import { type NivelEnsino } from "@/lib/api/escolas";
import { useSchool } from "@/context/SchoolContext";

// Validation schema
const professorSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string().email("E-mail inválido"),
  matricula: z
    .string()
    .min(2, "Matrícula deve ter pelo menos 2 caracteres")
    .max(20, "Matrícula deve ter no máximo 20 caracteres")
    .regex(/^[A-Z0-9]+$/, "Matrícula deve conter apenas letras maiúsculas e números"),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve ter exatamente 11 dígitos").optional().or(z.literal("")),
  telefone: z.string().max(20, "Telefone deve ter no máximo 20 caracteres").optional().or(z.literal("")),
  cargaHorariaSemanal: z
    .number()
    .min(1, "Carga horária deve ser pelo menos 1")
    .max(60, "Carga horária deve ser no máximo 60")
    .optional()
    .or(
      z
        .string()
        .transform((val) => (val ? parseInt(val, 10) : undefined))
        .refine((val) => val === undefined || (val >= 1 && val <= 60), "Carga horária deve ser entre 1 e 60")
    ),
});

type ProfessorFormData = z.infer<typeof professorSchema>;

export default function CriarProfessorPage() {
  const router = useRouter();
  const { selectedSchool } = useSchool();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [selectedDisciplinas, setSelectedDisciplinas] = useState<string[]>([]);
  const [disciplinasComProfessor, setDisciplinasComProfessor] = useState<Set<string>>(new Set()); // IDs das disciplinas que já têm professor
  const [isLoadingDisciplinas, setIsLoadingDisciplinas] = useState(true);
  const [selectedNiveisEnsino, setSelectedNiveisEnsino] = useState<NivelEnsino[]>([]);

  // Configuração da grade de horários
  const [quantidadeAulasPorDia, setQuantidadeAulasPorDia] = useState<number | "">("");
  const [diasComAula, setDiasComAula] = useState<string[]>(['segunda', 'terca', 'quarta', 'quinta', 'sexta']);
  const [quantidadeMinimaAulasPorDia, setQuantidadeMinimaAulasPorDia] = useState<number | "">("");

  const aulasPorDia = quantidadeAulasPorDia ? Number(quantidadeAulasPorDia) : 6;

  // Grade de disponibilidade por nível de ensino
  // Estrutura: { nivelEnsino: { dia: [aula1, aula2, aula3...] } }
  const [disponibilidadePorNivel, setDisponibilidadePorNivel] = useState<
    Record<NivelEnsino, Record<string, boolean[]>>
  >({} as Record<NivelEnsino, Record<string, boolean[]>>);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<ProfessorFormData>({
    resolver: zodResolver(professorSchema),
    defaultValues: {
      nome: "",
      email: "",
      matricula: "",
      cpf: "",
      telefone: "",
      cargaHorariaSemanal: undefined,
    },
  });

  // Carregar disciplinas e professores da escola
  useEffect(() => {
    const fetchDisciplinasEProfessores = async () => {
      if (!selectedSchool) {
        setIsLoadingDisciplinas(false);
        return;
      }

      setIsLoadingDisciplinas(true);
      try {
        // Carregar disciplinas
        const disciplinasResponse = await listDisciplinas({
          idEscola: selectedSchool._id,
          limit: 100,
        });

        const disciplinasData = disciplinasResponse.data || disciplinasResponse.payload;
        if (disciplinasData) {
          setDisciplinas(disciplinasData.docs || []);
        }

        // Carregar professores para identificar quais disciplinas já estão atribuídas
        const professoresResponse = await listProfessores({
          idEscola: selectedSchool._id,
          limit: 1000, // Carregar todos os professores
        });

        const professoresData = professoresResponse.data || professoresResponse.payload;
        if (professoresData && professoresData.docs) {
          // Criar um Set com os IDs das disciplinas que já têm professores
          const disciplinasIds = new Set<string>();
          professoresData.docs.forEach((professor: any) => {
            if (professor.disciplinas && Array.isArray(professor.disciplinas)) {
              professor.disciplinas.forEach((disc: any) => {
                const discId = typeof disc === "string" ? disc : disc._id;
                if (discId) {
                  disciplinasIds.add(discId);
                }
              });
            }
          });
          setDisciplinasComProfessor(disciplinasIds);
        }
      } catch (error: any) {
        toast.error("Erro ao carregar dados", {
          description: error.response?.data?.message || "Não foi possível carregar as disciplinas.",
        });
      } finally {
        setIsLoadingDisciplinas(false);
      }
    };

    fetchDisciplinasEProfessores();
  }, [selectedSchool]);

  const toggleDisciplina = (id: string) => {
    setSelectedDisciplinas((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const toggleNivelEnsino = (nivel: NivelEnsino) => {
    setSelectedNiveisEnsino((prev) => {
      if (prev.includes(nivel)) {
        // Remove o nível e limpa a disponibilidade dele
        const newDisp = { ...disponibilidadePorNivel };
        delete newDisp[nivel];
        setDisponibilidadePorNivel(newDisp);
        return prev.filter((n) => n !== nivel);
      } else {
        // Adiciona o nível com grade vazia
        const gradeVazia: Record<string, boolean[]> = {};
        diasComAula.forEach((dia) => {
          gradeVazia[dia] = Array(aulasPorDia).fill(false);
        });
        setDisponibilidadePorNivel((prevDisp) => ({
          ...prevDisp,
          [nivel]: gradeVazia,
        }));
        return [...prev, nivel];
      }
    });
  };

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
  const niveisEnsinoOptions = todosNiveisEnsino.filter(nivel =>
    selectedSchool?.nivelEnsino?.includes(nivel.value)
  );

  const diasSemana: { key: string; label: string }[] = [
    { key: "segunda", label: "Segunda" },
    { key: "terca", label: "Terça" },
    { key: "quarta", label: "Quarta" },
    { key: "quinta", label: "Quinta" },
    { key: "sexta", label: "Sexta" },
    { key: "sabado", label: "Sábado" },
    { key: "domingo", label: "Domingo" },
  ];

  const toggleDiaComAula = (dia: string) => {
    setDiasComAula((prev) => {
      if (prev.includes(dia)) {
        // Remove o dia de todas as grades
        const newDisp = { ...disponibilidadePorNivel };
        Object.keys(newDisp).forEach((nivel) => {
          delete newDisp[nivel as NivelEnsino][dia];
        });
        setDisponibilidadePorNivel(newDisp);
        return prev.filter((d) => d !== dia);
      } else {
        // Adiciona o dia em todas as grades com horários desmarcados
        const newDisp = { ...disponibilidadePorNivel };
        Object.keys(newDisp).forEach((nivel) => {
          newDisp[nivel as NivelEnsino][dia] = Array(aulasPorDia).fill(false);
        });
        setDisponibilidadePorNivel(newDisp);
        return [...prev, dia];
      }
    });
  };

  const toggleHorario = (nivel: NivelEnsino, dia: string, aulaIndex: number) => {
    setDisponibilidadePorNivel((prev) => {
      const novaDisponibilidade = { ...prev };

      // Verifica se o horário está sendo marcado ou desmarcado
      const estaAtivando = !novaDisponibilidade[nivel]?.[dia]?.[aulaIndex];

      if (estaAtivando) {
        // Se está ativando, desativa esse horário em todos os outros níveis
        Object.keys(novaDisponibilidade).forEach((n) => {
          const nivelKey = n as NivelEnsino;
          if (novaDisponibilidade[nivelKey]?.[dia]) {
            const novoDiaHorarios = [...novaDisponibilidade[nivelKey][dia]];
            if (nivelKey === nivel) {
              // Ativa no nível atual
              novoDiaHorarios[aulaIndex] = true;
            } else {
              // Desativa nos outros níveis
              novoDiaHorarios[aulaIndex] = false;
            }
            novaDisponibilidade[nivelKey] = {
              ...novaDisponibilidade[nivelKey],
              [dia]: novoDiaHorarios,
            };
          }
        });
      } else {
        // Se está desativando, apenas desativa no nível atual
        const novoDiaHorarios = [...(novaDisponibilidade[nivel]?.[dia] || [])];
        novoDiaHorarios[aulaIndex] = false;
        novaDisponibilidade[nivel] = {
          ...novaDisponibilidade[nivel],
          [dia]: novoDiaHorarios,
        };
      }

      return novaDisponibilidade;
    });
  };

  const handleSelecionarTudo = (nivel: NivelEnsino) => {
    setDisponibilidadePorNivel((prev) => {
      const novaDisponibilidade = { ...prev };

      diasComAula.forEach((dia) => {
        Object.keys(novaDisponibilidade).forEach((nivelKey) => {
          const nivelAtual = nivelKey as NivelEnsino;
          const horariosAtuais = [
            ...(novaDisponibilidade[nivelAtual]?.[dia] || []),
          ];
          if (horariosAtuais.length < aulasPorDia) {
            horariosAtuais.push(
              ...Array(aulasPorDia - horariosAtuais.length).fill(false)
            );
          }
          for (let i = 0; i < aulasPorDia; i += 1) {
            horariosAtuais[i] = nivelAtual === nivel;
          }

          novaDisponibilidade[nivelAtual] = {
            ...novaDisponibilidade[nivelAtual],
            [dia]: horariosAtuais,
          };
        });
      });

      return novaDisponibilidade;
    });
  };

  // Verifica se um horário está ocupado em outro nível
  const isHorarioOcupado = (nivelAtual: NivelEnsino, dia: string, aulaIndex: number): boolean => {
    return Object.keys(disponibilidadePorNivel).some((nivel) => {
      const nivelKey = nivel as NivelEnsino;
      return nivelKey !== nivelAtual && disponibilidadePorNivel[nivelKey]?.[dia]?.[aulaIndex];
    });
  };

  // Inicializar disponibilidade quando mudar a quantidade de aulas
  useEffect(() => {
    const newDisp: Record<NivelEnsino, Record<string, boolean[]>> = { ...disponibilidadePorNivel };

    Object.keys(newDisp).forEach((nivel) => {
      const nivelKey = nivel as NivelEnsino;
      diasComAula.forEach((dia) => {
        const horariosAtuais = newDisp[nivelKey]?.[dia] || [];
        // Ajusta o array para o novo tamanho
        if (horariosAtuais.length < aulasPorDia) {
          // Adiciona false para as novas aulas
          newDisp[nivelKey] = {
            ...newDisp[nivelKey],
            [dia]: [...horariosAtuais, ...Array(aulasPorDia - horariosAtuais.length).fill(false)],
          };
        } else {
          // Trunca se diminuiu
          newDisp[nivelKey] = {
            ...newDisp[nivelKey],
            [dia]: horariosAtuais.slice(0, aulasPorDia),
          };
        }
      });
    });

    setDisponibilidadePorNivel(newDisp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantidadeAulasPorDia, aulasPorDia]);

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

  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      if (numbers.length <= 10) {
        // Formato: (XX) XXXX-XXXX
        return numbers
          .replace(/^(\d{2})(\d)/, "($1) $2")
          .replace(/(\d{4})(\d)/, "$1-$2");
      } else {
        // Formato: (XX) 9XXXX-XXXX
        return numbers
          .replace(/^(\d{2})(\d)/, "($1) $2")
          .replace(/(\d{5})(\d)/, "$1-$2");
      }
    }
    return value;
  };

  const onSubmit = async (data: ProfessorFormData) => {
    // Validação: verifica se há escola selecionada
    if (!selectedSchool) {
      toast.error("Nenhuma escola selecionada", {
        description: "Por favor, selecione uma escola no cabeçalho antes de cadastrar um professor.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const maxAulasPorDia =
        typeof quantidadeAulasPorDia === "number" ? quantidadeAulasPorDia : undefined;
      const minAulasPorDia =
        typeof quantidadeMinimaAulasPorDia === "number" ? quantidadeMinimaAulasPorDia : undefined;
      const preferenciasPayload = {
        maxAulasPorDia,
        minAulasPorDia,
        diasSemanaAula: diasComAula.length > 0 ? diasComAula : undefined,
      };
      const hasPreferencias = Object.values(preferenciasPayload).some(
        (value) => value !== undefined
      );
      const payload = {
        idEscola: selectedSchool._id,
        nome: data.nome,
        email: data.email,
        matricula: data.matricula.toUpperCase(),
        cpf: data.cpf || undefined,
        telefone: data.telefone || undefined,
        cargaHorariaSemanal:
          typeof data.cargaHorariaSemanal === "string"
            ? parseInt(data.cargaHorariaSemanal, 10) || undefined
            : data.cargaHorariaSemanal,
        nivelEnsino: selectedNiveisEnsino.length > 0 ? selectedNiveisEnsino : undefined,
        disciplinas: selectedDisciplinas.length > 0 ? selectedDisciplinas : undefined,
        disponibilidade: Object.keys(disponibilidadePorNivel).length > 0 ? disponibilidadePorNivel : undefined,
        preferencias: hasPreferencias ? preferenciasPayload : undefined,
      };

      console.log("📤 Enviando payload para criar professor:", payload);
      const response = await createProfessor(payload);

      toast.success(response.message || "Professor criado com sucesso!", {
        description: response.data?.nome
          ? `O professor "${response.data.nome}" foi cadastrado.`
          : "O professor foi cadastrado com sucesso.",
      });

      router.push("/planejamento/professores");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.join(", ") ||
        "Ocorreu um erro ao cadastrar o professor. Tente novamente.";

      toast.error("Erro ao criar professor", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedSchool) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">
          Selecione uma escola no cabeçalho para cadastrar um professor.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Link href="/planejamento/professores">
          <button className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800">
            <ChevronLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-400" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Adicionar Professor
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Preencha os dados do novo professor
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
                  Nome Completo <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Digite o nome completo do professor"
                  {...register("nome")}
                  error={errors.nome?.message}
                />
              </div>

              <div>
                <Label>
                  E-mail <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="professor@email.com"
                  {...register("email")}
                  error={errors.email?.message}
                />
              </div>

              <div>
                <Label>
                  Matrícula <span className="text-error-500">*</span>
                </Label>
                <Controller
                  name="matricula"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="text"
                      placeholder="PROF001"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value.toUpperCase());
                      }}
                      error={errors.matricula?.message}
                      maxLength={20}
                    />
                  )}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Apenas letras maiúsculas e números
                </p>
              </div>

              <div>
                <Label>CPF</Label>
                <Controller
                  name="cpf"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="text"
                      placeholder="000.000.000-00"
                      value={formatCPF(field.value || "")}
                      onChange={(e) => {
                        const numbers = e.target.value.replace(/\D/g, "");
                        field.onChange(numbers);
                      }}
                      error={errors.cpf?.message}
                      maxLength={14}
                    />
                  )}
                />
              </div>

              <div>
                <Label>Telefone</Label>
                <Controller
                  name="telefone"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="text"
                      placeholder="(11) 91234-5678"
                      value={formatTelefone(field.value || "")}
                      onChange={(e) => {
                        const numbers = e.target.value.replace(/\D/g, "");
                        field.onChange(numbers);
                      }}
                      error={errors.telefone?.message}
                      maxLength={15}
                    />
                  )}
                />
              </div>

              <div>
                <Label>Carga Horária Semanal (horas)</Label>
                <Input
                  type="number"
                  placeholder="40"
                  {...register("cargaHorariaSemanal")}
                  error={errors.cargaHorariaSemanal?.message}
                  min={1}
                  max={60}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Entre 1 e 60 horas por semana
                </p>
              </div>
            </div>
          </div>

          {/* Níveis de Ensino */}
          <div>
            <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
              Níveis de Ensino
            </h2>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Selecione os níveis de ensino em que o professor pode lecionar
            </p>
            <div className="flex flex-wrap gap-2">
              {niveisEnsinoOptions.map((nivel) => (
                <button
                  key={nivel.value}
                  type="button"
                  onClick={() => toggleNivelEnsino(nivel.value)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    selectedNiveisEnsino.includes(nivel.value)
                      ? "bg-brand-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {nivel.label}
                </button>
              ))}
            </div>
          </div>

          {/* Disciplinas */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-800 dark:text-white/90">
                Disciplinas que Leciona
              </h2>
              {disciplinasComProfessor.size > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <svg
                    className="w-3 h-3 text-success-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  = já tem professor(es)
                </span>
              )}
            </div>

            {isLoadingDisciplinas ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Carregando disciplinas...
              </p>
            ) : disciplinas.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nenhuma disciplina cadastrada. Cadastre disciplinas primeiro.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {disciplinas.map((disciplina) => {
                  const isSelected = selectedDisciplinas.includes(disciplina._id);
                  const temProfessor = disciplinasComProfessor.has(disciplina._id);

                  return (
                    <button
                      key={disciplina._id}
                      type="button"
                      onClick={() => toggleDisciplina(disciplina._id)}
                      className={`relative rounded-lg px-4 py-2 text-sm font-medium transition ${
                        isSelected
                          ? "bg-brand-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {disciplina.nome}
                        {temProfessor && (
                          <svg
                            className={`w-4 h-4 ${
                              isSelected
                                ? "text-white"
                                : "text-success-500 dark:text-success-400"
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            title="Esta disciplina já tem professor(es)"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Disponibilidade de Horários */}
          <div>
            <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
              Disponibilidade de Horários
            </h2>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Configure a grade de horários e selecione quando o professor está disponível
            </p>

            {/* Configurações da Grade */}
            <div className="mb-6 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label>Quantidade de Aulas por Dia</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={quantidadeAulasPorDia}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!value) {
                        setQuantidadeAulasPorDia("");
                        return;
                      }
                      const parsed = parseInt(value, 10);
                      setQuantidadeAulasPorDia(Number.isNaN(parsed) ? "" : parsed);
                    }}
                    placeholder="6"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Número de aulas por dia (1-12)
                  </p>
                </div>

                <div>
                  <Label>Quantidade Mínima de Aulas por Dia</Label>
                  <Input
                    type="number"
                    min={1}
                    max={aulasPorDia}
                    value={quantidadeMinimaAulasPorDia}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!value) {
                        setQuantidadeMinimaAulasPorDia("");
                        return;
                      }
                      const parsed = parseInt(value, 10);
                      setQuantidadeMinimaAulasPorDia(Number.isNaN(parsed) ? "" : parsed);
                    }}
                    placeholder="2"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Mínimo de aulas consecutivas
                  </p>
                </div>
              </div>

              <div>
                <Label>Dias da Semana com Aula</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {diasSemana.map((dia) => (
                    <button
                      key={dia.key}
                      type="button"
                      onClick={() => toggleDiaComAula(dia.key)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                        diasComAula.includes(dia.key)
                          ? "bg-brand-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      {dia.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Grades de Horários por Nível de Ensino */}
            {selectedNiveisEnsino.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800 dark:bg-gray-800/50">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Selecione pelo menos um nível de ensino acima para configurar a disponibilidade
                </p>
              </div>
            ) : diasComAula.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800 dark:bg-gray-800/50">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Selecione os dias da semana acima para configurar a disponibilidade
                </p>
              </div>
            ) : (
              <>
                {/* Legenda */}
                <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Legenda:</span>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded border-2 border-success-500 bg-success-500 flex items-center justify-center">
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Disponível</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded border-2 border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900 flex items-center justify-center">
                      <span className="text-xs text-gray-400">-</span>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Indisponível</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded border-2 border-error-300 bg-error-50 dark:border-error-800 dark:bg-error-900/30 flex items-center justify-center">
                      <svg className="h-3 w-3 text-error-500 dark:text-error-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Ocupado (outro nível)</span>
                  </div>
                </div>
              <div className="space-y-6">
                {selectedNiveisEnsino.map((nivel) => {
                  const nivelLabel = niveisEnsinoOptions.find((n) => n.value === nivel)?.label || nivel;

                  return (
                    <div key={nivel} className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
                          {nivelLabel}
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleSelecionarTudo(nivel)}
                          className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900"
                        >
                          Selecionar tudo
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-800">
                              <th className="sticky left-0 bg-white py-2 px-3 text-left text-xs font-medium text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                                Horário
                              </th>
                              {diasSemana
                                .filter((dia) => diasComAula.includes(dia.key))
                                .map((dia) => (
                                  <th
                                    key={dia.key}
                                    className="py-2 px-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300"
                                  >
                                    {dia.label}
                                  </th>
                                ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {Array.from({ length: aulasPorDia }, (_, index) => (
                              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="sticky left-0 bg-white py-2 px-3 text-xs font-medium text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                                  {index + 1}º
                                </td>
                                {diasSemana
                                  .filter((dia) => diasComAula.includes(dia.key))
                                  .map((dia) => {
                                    const isOcupado = isHorarioOcupado(nivel, dia.key, index);
                                    const isDisponivel = disponibilidadePorNivel[nivel]?.[dia.key]?.[index];

                                    return (
                                      <td key={dia.key} className="py-2 px-3 text-center">
                                        <button
                                          type="button"
                                          onClick={() => !isOcupado && toggleHorario(nivel, dia.key, index)}
                                          disabled={isOcupado}
                                          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 text-xs transition-all ${
                                            isDisponivel
                                              ? "border-success-500 bg-success-500 text-white hover:bg-success-600"
                                              : isOcupado
                                              ? "border-error-300 bg-error-50 text-error-500 cursor-not-allowed dark:border-error-800 dark:bg-error-900/30 dark:text-error-400"
                                              : "border-gray-300 bg-white text-gray-400 hover:border-brand-300 hover:text-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-700"
                                          }`}
                                          title={
                                            isOcupado
                                              ? `${dia.label} - ${index + 1}º Aula (Ocupado em outro nível)`
                                              : `${dia.label} - ${index + 1}º Aula`
                                          }
                                        >
                                          {isDisponivel ? (
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
                                                d="M5 13l4 4L19 7"
                                              />
                                            </svg>
                                          ) : isOcupado ? (
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
                                                d="M6 18L18 6M6 6l12 12"
                                              />
                                            </svg>
                                          ) : (
                                            <span>-</span>
                                          )}
                                        </button>
                                      </td>
                                    );
                                  })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
              </>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button
              variant="outline"
              type="button"
              disabled={isSubmitting}
              onClick={() => router.push("/planejamento/professores")}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Professor"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
