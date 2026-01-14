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
import { createEscola, type TipoEscola, type NivelEnsino, type DiaSemana, type Turno } from "@/lib/api/escolas";
import { listUFs, listCidadesByUF, type UF, type Cidade } from "@/lib/api/localizacao";

// Validation schema matching backend CreateEscolaData
const instituicaoSchema = z.object({
  nome: z.string().min(1, "Nome da escola é obrigatório"),
  tipoEscola: z.enum(["publica", "privada", "tecnica", "superior"], {
    message: "Tipo de escola é obrigatório",
  }),
  nivelEnsino: z.array(z.enum(["infantil", "fundamental1", "fundamental2", "medio", "eja", "superior"])).optional(),
  inep: z.string().regex(/^\d{8}$/, "INEP deve ter exatamente 8 dígitos").optional().or(z.literal("")),
  cnpj: z.string().regex(/^\d{14}$/, "CNPJ deve ter exatamente 14 dígitos").optional().or(z.literal("")),
  // Endereço
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  uf: z.string().min(2, "UF é obrigatória").max(2, "Use a sigla do estado (ex: SP)"),
  cep: z.string().optional(),
  // Contato
  telefone: z.string().optional(),
  celular: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  site: z.string().optional(),
});

type InstituicaoFormData = z.infer<typeof instituicaoSchema>;

const tipoEscolaOptions: { value: TipoEscola; label: string }[] = [
  { value: "publica", label: "Pública" },
  { value: "privada", label: "Privada" },
  { value: "tecnica", label: "Técnica" },
  { value: "superior", label: "Superior" },
];

const nivelEnsinoOptions: { value: NivelEnsino; label: string }[] = [
  { value: "infantil", label: "Infantil" },
  { value: "fundamental1", label: "Fundamental I" },
  { value: "fundamental2", label: "Fundamental II" },
  { value: "medio", label: "Médio" },
  { value: "eja", label: "EJA" },
  { value: "superior", label: "Superior" },
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

const turnoOptions: { value: Turno; label: string }[] = [
  { value: "manha", label: "Manhã" },
  { value: "tarde", label: "Tarde" },
  { value: "noite", label: "Noite" },
];

export default function CriarInstituicaoPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedNiveis, setSelectedNiveis] = useState<NivelEnsino[]>([]);
  const [selectedDias, setSelectedDias] = useState<DiaSemana[]>([]);
  const [selectedTurnos, setSelectedTurnos] = useState<Turno[]>([]);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<any>({});
  const [ufs, setUfs] = useState<UF[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [loadingUFs, setLoadingUFs] = useState(true);
  const [loadingCidades, setLoadingCidades] = useState(false);
  const [selectedUF, setSelectedUF] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
  } = useForm<InstituicaoFormData>({
    resolver: zodResolver(instituicaoSchema),
  });

  // Watch UF field changes
  const ufValue = watch("uf");

  // Carregar UFs quando o componente montar
  useEffect(() => {
    const fetchUFs = async () => {
      try {
        setLoadingUFs(true);
        const response = await listUFs();
        if (response.payload) {
          setUfs(response.payload);
        }
      } catch (error) {
        toast.error("Erro ao carregar UFs", {
          description: "Não foi possível carregar a lista de estados.",
        });
      } finally {
        setLoadingUFs(false);
      }
    };

    fetchUFs();
  }, []);

  // Carregar cidades quando UF for selecionada
  useEffect(() => {
    if (ufValue && ufValue !== selectedUF) {
      setSelectedUF(ufValue);
      const fetchCidades = async () => {
        try {
          setLoadingCidades(true);
          setCidades([]);
          setValue("cidade", ""); // Limpa a cidade quando troca UF

          const response = await listCidadesByUF(ufValue);
          if (response.payload) {
            setCidades(response.payload);
          }
        } catch (error: any) {
          toast.error("Erro ao carregar cidades", {
            description: error.response?.data?.message || "Não foi possível carregar as cidades desta UF.",
          });
        } finally {
          setLoadingCidades(false);
        }
      };

      fetchCidades();
    }
  }, [ufValue, selectedUF, setValue]);

  const toggleNivel = (nivel: NivelEnsino) => {
    setSelectedNiveis((prev) =>
      prev.includes(nivel) ? prev.filter((n) => n !== nivel) : [...prev, nivel]
    );
  };

  const toggleDia = (dia: DiaSemana) => {
    setSelectedDias((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  };

  const toggleTurno = (turno: Turno) => {
    setSelectedTurnos((prev) => {
      const isSelected = prev.includes(turno);
      if (isSelected) {
        // Remove o turno e seus horários
        const newHorarios = { ...horariosDisponiveis };
        delete newHorarios[turno];
        setHorariosDisponiveis(newHorarios);
        return prev.filter((t) => t !== turno);
      } else {
        // Adiciona o turno com horários padrão
        const horariosDefault = {
          manha: { inicio: "07:00", fim: "12:00", duracaoAula: 50, intervalo: 15, inicioIntervalo: "09:30" },
          tarde: { inicio: "13:00", fim: "18:00", duracaoAula: 50, intervalo: 15, inicioIntervalo: "15:30" },
          noite: { inicio: "19:00", fim: "23:00", duracaoAula: 45, intervalo: 15, inicioIntervalo: "21:00" },
        };
        setHorariosDisponiveis({
          ...horariosDisponiveis,
          [turno]: horariosDefault[turno],
        });
        return [...prev, turno];
      }
    });
  };

  const updateHorario = (turno: Turno, field: string, value: string | number) => {
    setHorariosDisponiveis((prev: any) => ({
      ...prev,
      [turno]: {
        ...prev[turno],
        [field]: value,
      },
    }));
  };

  // Função para formatar CNPJ: XX.XXX.XXX/XXXX-XX
  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 14) {
      return numbers
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return value;
  };

  // Função para formatar CEP: XXXXX-XXX
  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/^(\d{5})(\d)/, '$1-$2');
    }
    return value;
  };

  const onSubmit = async (data: InstituicaoFormData) => {
    setIsSubmitting(true);
    try {
      // Filtra horariosDisponiveis para incluir apenas os turnos selecionados
      const horariosFiltered = horariosDisponiveis && Object.keys(horariosDisponiveis).length > 0
        ? horariosDisponiveis
        : undefined;

      const payload = {
        nome: data.nome,
        tipoEscola: data.tipoEscola,
        endereco: {
          cidade: data.cidade,
          uf: data.uf, // Já vem em maiúsculas do dropdown
          logradouro: data.logradouro || undefined,
          numero: data.numero || undefined,
          complemento: data.complemento || undefined,
          bairro: data.bairro || undefined,
          cep: data.cep || undefined,
        },
        nivelEnsino: selectedNiveis.length > 0 ? selectedNiveis : undefined,
        diasLetivos: selectedDias.length > 0 ? selectedDias : undefined,
        turnosDisponiveis: selectedTurnos.length > 0 ? selectedTurnos : undefined,
        horariosDisponiveis: horariosFiltered,
        inep: data.inep || undefined,
        cnpj: data.cnpj || undefined,
        contato: {
          telefone: data.telefone || undefined,
          celular: data.celular || undefined,
          email: data.email || undefined,
          site: data.site || undefined,
        },
        configuracoes: {
          maxTurmas: 20,
          maxProfessores: 50,
          maxDisciplinas: 40,
          maxGradesHorarias: 10,
        },
      };

      const response = await createEscola(payload);

      // Mostra toast de sucesso
      toast.success(response.message || "Escola criada com sucesso!", {
        description: response.payload?.nome
          ? `A escola "${response.payload.nome}" foi cadastrada.`
          : "A escola foi cadastrada com sucesso.",
      });

      // SEMPRE redireciona após sucesso
      router.push("/planejamento/instituicoes");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.join(", ") ||
        "Ocorreu um erro ao cadastrar a escola. Tente novamente.";

      toast.error("Erro ao criar escola", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Link href="/planejamento/instituicoes">
          <button className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800">
            <ChevronLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-400" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Adicionar Escola
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Preencha os dados da nova escola
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
                  Nome da Escola <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Digite o nome da escola"
                  {...register("nome")}
                  error={errors.nome?.message}
                />
              </div>

              <div>
                <Label>
                  Tipo de Escola <span className="text-error-500">*</span>
                </Label>
                <Controller
                  name="tipoEscola"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                    >
                      <option value="">Selecione o tipo</option>
                      {tipoEscolaOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.tipoEscola && (
                  <p className="mt-1 text-xs text-error-500">{errors.tipoEscola.message}</p>
                )}
              </div>

              <div>
                <Label>CNPJ</Label>
                <Controller
                  name="cnpj"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="text"
                      placeholder="00.000.000/0000-00"
                      value={formatCNPJ(field.value || '')}
                      onChange={(e) => {
                        const numbers = e.target.value.replace(/\D/g, '');
                        field.onChange(numbers);
                      }}
                      error={errors.cnpj?.message}
                      maxLength={18}
                    />
                  )}
                />
              </div>

              <div>
                <Label>INEP (8 dígitos)</Label>
                <Controller
                  name="inep"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="text"
                      placeholder="12345678"
                      value={field.value || ''}
                      onChange={(e) => {
                        const numbers = e.target.value.replace(/\D/g, '').slice(0, 8);
                        field.onChange(numbers);
                      }}
                      error={errors.inep?.message}
                      maxLength={8}
                    />
                  )}
                />
              </div>
            </div>

            {/* Nível de Ensino */}
            <div className="mt-6">
              <Label>Nível de Ensino (selecione um ou mais)</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {nivelEnsinoOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleNivel(option.value)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                      selectedNiveis.includes(option.value)
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dias Letivos */}
            <div className="mt-6">
              <Label>Dias Letivos (selecione um ou mais)</Label>
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

            {/* Turnos Disponíveis */}
            <div className="mt-6">
              <Label>Turnos Disponíveis (selecione um ou mais)</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {turnoOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleTurno(option.value)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                      selectedTurnos.includes(option.value)
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Configuração de Horários por Turno */}
            {selectedTurnos.length > 0 && (
              <div className="mt-6 space-y-4">
                <Label>Configuração de Horários</Label>
                {selectedTurnos.map((turno) => (
                  <div
                    key={turno}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50"
                  >
                    <h3 className="mb-3 text-sm font-medium text-gray-800 dark:text-white/90">
                      {turnoOptions.find((t) => t.value === turno)?.label}
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                      <div>
                        <Label>Início</Label>
                        <Input
                          type="time"
                          value={horariosDisponiveis?.[turno]?.inicio || ""}
                          onChange={(e) => updateHorario(turno, "inicio", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Fim</Label>
                        <Input
                          type="time"
                          value={horariosDisponiveis?.[turno]?.fim || ""}
                          onChange={(e) => updateHorario(turno, "fim", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Duração da Aula (min)</Label>
                        <Input
                          type="number"
                          placeholder="50"
                          value={horariosDisponiveis?.[turno]?.duracaoAula || ""}
                          onChange={(e) =>
                            updateHorario(turno, "duracaoAula", parseInt(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div>
                        <Label>Intervalo (min)</Label>
                        <Input
                          type="number"
                          placeholder="15"
                          value={horariosDisponiveis?.[turno]?.intervalo || ""}
                          onChange={(e) =>
                            updateHorario(turno, "intervalo", parseInt(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div>
                        <Label>Início do Intervalo</Label>
                        <Input
                          type="time"
                          value={horariosDisponiveis?.[turno]?.inicioIntervalo || ""}
                          onChange={(e) => updateHorario(turno, "inicioIntervalo", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Endereço */}
          <div>
            <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
              Endereço
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <Label>Logradouro</Label>
                <Input
                  type="text"
                  placeholder="Rua, Avenida, etc"
                  {...register("logradouro")}
                  error={errors.logradouro?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Número</Label>
                  <Input
                    type="text"
                    placeholder="123"
                    {...register("numero")}
                    error={errors.numero?.message}
                  />
                </div>
                <div>
                  <Label>Complemento</Label>
                  <Input
                    type="text"
                    placeholder="Apto 45"
                    {...register("complemento")}
                    error={errors.complemento?.message}
                  />
                </div>
              </div>

              <div>
                <Label>Bairro</Label>
                <Input
                  type="text"
                  placeholder="Digite o bairro"
                  {...register("bairro")}
                  error={errors.bairro?.message}
                />
              </div>

              <div>
                <Label>CEP</Label>
                <Controller
                  name="cep"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="text"
                      placeholder="00000-000"
                      value={formatCEP(field.value || '')}
                      onChange={(e) => {
                        const numbers = e.target.value.replace(/\D/g, '');
                        field.onChange(numbers);
                      }}
                      error={errors.cep?.message}
                      maxLength={9}
                    />
                  )}
                />
              </div>

              <div>
                <Label>
                  UF <span className="text-error-500">*</span>
                </Label>
                <Controller
                  name="uf"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      disabled={loadingUFs}
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                    >
                      <option value="">
                        {loadingUFs ? "Carregando..." : "Selecione o estado"}
                      </option>
                      {ufs.map((uf) => (
                        <option key={uf._id} value={uf.uf}>
                          {uf.nome} ({uf.uf})
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.uf && (
                  <p className="mt-1 text-xs text-error-500">{errors.uf.message}</p>
                )}
              </div>

              <div>
                <Label>
                  Cidade <span className="text-error-500">*</span>
                </Label>
                <Controller
                  name="cidade"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      disabled={!ufValue || loadingCidades}
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                    >
                      <option value="">
                        {!ufValue
                          ? "Selecione primeiro a UF"
                          : loadingCidades
                          ? "Carregando cidades..."
                          : "Selecione a cidade"}
                      </option>
                      {cidades.map((cidade) => (
                        <option key={cidade._id} value={cidade.nome}>
                          {cidade.nome}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.cidade && (
                  <p className="mt-1 text-xs text-error-500">{errors.cidade.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contato */}
          <div>
            <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
              Contato
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <Label>Telefone</Label>
                <Input
                  type="text"
                  placeholder="(11) 1234-5678"
                  {...register("telefone")}
                  error={errors.telefone?.message}
                />
              </div>

              <div>
                <Label>Celular</Label>
                <Input
                  type="text"
                  placeholder="(11) 91234-5678"
                  {...register("celular")}
                  error={errors.celular?.message}
                />
              </div>

              <div>
                <Label>E-mail</Label>
                <Input
                  type="email"
                  placeholder="contato@instituicao.com"
                  {...register("email")}
                  error={errors.email?.message}
                />
              </div>

              <div>
                <Label>Site</Label>
                <Input
                  type="text"
                  placeholder="https://www.instituicao.com"
                  {...register("site")}
                  error={errors.site?.message}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Link href="/planejamento/instituicoes">
              <Button variant="outline" type="button" disabled={isSubmitting}>
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Escola"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
