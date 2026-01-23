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
import { getEscola, updateEscola, type TipoEscola, type NivelEnsino, type DiaSemana, type Turno } from "@/lib/api/escolas";
import { listUFs, listCidadesByUF, type UF, type Cidade } from "@/lib/api/localizacao";

// Validation schema for updating - CNPJ and INEP can't be changed
const instituicaoSchema = z.object({
  nome: z.string().min(1, "Nome da escola é obrigatório").optional(),
  tipoEscola: z.enum(["publica", "privada", "tecnica", "superior"]).optional(),
  nivelEnsino: z.array(z.enum(["infantil", "fundamental1", "fundamental2", "medio", "eja", "superior"])).optional(),
  // Endereço
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().min(1, "Cidade é obrigatória").optional(),
  uf: z.string().min(2, "UF é obrigatória").max(2, "Use a sigla do estado (ex: SP)").optional(),
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

export default function EditarInstituicaoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [cnpj, setCnpj] = useState("");
  const [inep, setInep] = useState("");
  const [selectedNiveis, setSelectedNiveis] = useState<NivelEnsino[]>([]);
  const [selectedDias, setSelectedDias] = useState<DiaSemana[]>([]);
  const [selectedTurnos, setSelectedTurnos] = useState<Turno[]>([]);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<any>(null);
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
    reset,
    watch,
    setValue,
  } = useForm<InstituicaoFormData>({
    resolver: zodResolver(instituicaoSchema),
  });

  // Watch UF field changes
  const ufValue = watch("uf");

  useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [logoFile]);

  // Load escola data
  useEffect(() => {
    const fetchEscola = async () => {
      try {
        // A API valida automaticamente se o usuário tem acesso à escola
        const response = await getEscola(id);
        const escola = response.data || response.payload;

        if (escola) {
          console.log("Dados da escola carregados:", escola);
          console.log("Nível de Ensino:", escola.nivelEnsino);
          console.log("Dias Letivos:", escola.diasLetivos);
          console.log("Turnos Disponíveis:", escola.turnosDisponiveis);

          // Populate form with existing data
          reset({
            nome: escola.nome,
            tipoEscola: escola.tipoEscola,
            logradouro: escola.endereco?.logradouro || "",
            numero: escola.endereco?.numero || "",
            complemento: escola.endereco?.complemento || "",
            bairro: escola.endereco?.bairro || "",
            cidade: escola.endereco.cidade,
            uf: escola.endereco.uf,
            cep: escola.endereco?.cep || "",
            telefone: escola.contato?.telefone || "",
            celular: escola.contato?.celular || "",
            email: escola.contato?.email || "",
            site: escola.contato?.site || "",
          });

          setCnpj(escola.cnpj || "");
          setInep(escola.inep || "");
          setSelectedNiveis(escola.nivelEnsino || []);

          // Dias letivos vem de configuracoes.diasLetivos
          setSelectedDias(escola.configuracoes?.diasLetivos || []);

          // Armazena todos os horariosDisponiveis
          setHorariosDisponiveis(escola.configuracoes?.horariosDisponiveis || null);

          // Turnos vem das chaves de configuracoes.horariosDisponiveis
          const turnosDisponiveis = escola.configuracoes?.horariosDisponiveis
            ? Object.keys(escola.configuracoes.horariosDisponiveis) as Turno[]
            : [];
          setSelectedTurnos(turnosDisponiveis);

          if (escola.logoPath) {
            const resolvedLogoUrl = escola.logoPath.startsWith("http")
              ? (() => {
                  try {
                    return new URL(escola.logoPath as string).pathname;
                  } catch {
                    return escola.logoPath as string;
                  }
                })()
              : escola.logoPath;
            setLogoUrl(resolvedLogoUrl);
          }

          console.log("Estados setados:");
          console.log("- selectedNiveis:", escola.nivelEnsino || []);
          console.log("- selectedDias:", escola.configuracoes?.diasLetivos || []);
          console.log("- selectedTurnos:", turnosDisponiveis);
          console.log("- horariosDisponiveis:", escola.configuracoes?.horariosDisponiveis);
        }
      } catch (error: any) {
        toast.error("Erro ao carregar escola", {
          description:
            error.response?.data?.message ||
            "Ocorreu um erro ao carregar os dados da escola.",
        });
        router.push("/planejamento/instituicoes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEscola();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Carregar UFs quando o componente montar
  useEffect(() => {
    const fetchUFs = async () => {
      try {
        setLoadingUFs(true);
        const response = await listUFs();
        const ufsData = response.data || response.payload;
        if (ufsData) {
          setUfs(ufsData);
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

          const response = await listCidadesByUF(ufValue);
          const cidadesData = response.data || response.payload;
          if (cidadesData) {
            setCidades(cidadesData);
          }
        } catch (error) {
          toast.error("Erro ao carregar cidades", {
            description: "Não foi possível carregar as cidades desta UF.",
          });
        } finally {
          setLoadingCidades(false);
        }
      };

      fetchCidades();
    }
  }, [ufValue, selectedUF]);

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
          manha: { inicio: "07:00", fim: "12:00", duracaoAula: 50, intervalo: 15 },
          tarde: { inicio: "13:00", fim: "18:00", duracaoAula: 50, intervalo: 15 },
          noite: { inicio: "19:00", fim: "23:00", duracaoAula: 45, intervalo: 15 },
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
      const horariosFiltered = horariosDisponiveis && selectedTurnos.length > 0
        ? Object.fromEntries(
            Object.entries(horariosDisponiveis).filter(([turno]) =>
              selectedTurnos.includes(turno as Turno)
            )
          )
        : undefined;

      const updateData = {
        nome: data.nome,
        tipoEscola: data.tipoEscola,
        nivelEnsino: selectedNiveis.length > 0 ? selectedNiveis : undefined,
        configuracoes: {
          diasLetivos: selectedDias.length > 0 ? selectedDias : undefined,
          horariosDisponiveis: horariosFiltered,
        },
        endereco: {
          cidade: data.cidade,
          uf: data.uf?.toUpperCase(),
          logradouro: data.logradouro || undefined,
          numero: data.numero || undefined,
          complemento: data.complemento || undefined,
          bairro: data.bairro || undefined,
          cep: data.cep || undefined,
        },
        contato: {
          telefone: data.telefone || undefined,
          celular: data.celular || undefined,
          email: data.email || undefined,
          site: data.site || undefined,
        },
      };

      // A API valida automaticamente se o usuário tem permissão para editar
      const formData = new FormData();
      if (logoFile) {
        formData.append("logoPath", logoFile);
      }

      if (updateData.nome) {
        formData.append("nome", updateData.nome);
      }
      if (updateData.tipoEscola) {
        formData.append("tipoEscola", updateData.tipoEscola);
      }

      if (updateData.endereco) {
        formData.append("endereco", JSON.stringify(updateData.endereco));
      }
      if (updateData.nivelEnsino?.length) {
        formData.append("nivelEnsino", JSON.stringify(updateData.nivelEnsino));
      }
      if (updateData.configuracoes) {
        formData.append("configuracoes", JSON.stringify(updateData.configuracoes));
      }

      const contatoHasValue = Object.values(updateData.contato || {}).some(Boolean);
      if (contatoHasValue) {
        formData.append("contato", JSON.stringify(updateData.contato));
      }

      const response = await updateEscola(id, formData);

      // Mostra toast de sucesso
      const escolaData = response.data || response.payload;
      toast.success(response.message || "Escola atualizada com sucesso!", {
        description: escolaData?.nome
          ? `As informações de "${escolaData.nome}" foram atualizadas.`
          : "A escola foi atualizada com sucesso.",
      });

      // SEMPRE redireciona após sucesso
      router.push("/planejamento/instituicoes");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.join(", ") ||
        "Ocorreu um erro ao atualizar a escola. Tente novamente.";

      toast.error("Erro ao atualizar escola", {
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
        <Link href="/planejamento/instituicoes">
          <button className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800">
            <ChevronLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-400" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Editar Escola
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Atualize os dados da escola
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
                <Label>Nome da Escola</Label>
                <Input
                  type="text"
                  placeholder="Digite o nome da escola"
                  {...register("nome")}
                  error={errors.nome?.message}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="logoPath">Logo da Escola</Label>
                <input
                  id="logoPath"
                  name="logoPath"
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setLogoFile(file);
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:file:bg-gray-800 dark:file:text-gray-200"
                />
                {logoPreviewUrl ? (
                  <div className="mt-3 flex items-center gap-3">
                    <img
                      src={logoPreviewUrl}
                      alt="Prévia do novo logo"
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                    <span className="text-xs text-gray-500">
                      Prévia do novo logo
                    </span>
                  </div>
                ) : logoUrl ? (
                  <div className="mt-3 flex items-center gap-3">
                    <img
                      src={logoUrl}
                      alt="Logo atual da escola"
                      className="h-[108px] w-[108px] rounded-lg object-contain"
                    />
                    <span className="text-xs text-gray-500">Logo atual</span>
                  </div>
                ) : null}
              </div>

              <div>
                <Label>Tipo de Escola</Label>
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
              </div>

              {cnpj && (
                <div>
                  <Label>CNPJ (não pode ser alterado)</Label>
                  <Input
                    type="text"
                    value={formatCNPJ(cnpj)}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                  />
                </div>
              )}

              {inep && (
                <div>
                  <Label>INEP (não pode ser alterado)</Label>
                  <Input
                    type="text"
                    value={inep}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                  />
                </div>
              )}
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
              <p className="text-xs text-gray-500 mt-1">Selecionados: {selectedDias.join(", ") || "Nenhum"}</p>
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
              <p className="text-xs text-gray-500 mt-1">Selecionados: {selectedTurnos.join(", ") || "Nenhum"}</p>
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
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
                <Label>UF</Label>
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
                <Label>Cidade</Label>
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
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
