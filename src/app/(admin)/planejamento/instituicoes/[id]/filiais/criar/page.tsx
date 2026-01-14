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
import { createFilial, getEscola } from "@/lib/api/escolas";
import { listUFs, listCidadesByUF, type UF, type Cidade } from "@/lib/api/localizacao";

// Validation schema
const filialSchema = z.object({
  nome: z.string().min(1, "Nome da filial é obrigatório"),
  codigoFilial: z
    .string()
    .min(1, "Código da filial é obrigatório")
    .max(10, "Código deve ter no máximo 10 caracteres")
    .regex(/^[A-Z0-9]+$/, "Use apenas letras maiúsculas e números"),
  cnpj: z.string().regex(/^\d{14}$/, "CNPJ deve ter exatamente 14 dígitos").optional().or(z.literal("")),
  inep: z.string().regex(/^\d{8}$/, "INEP deve ter exatamente 8 dígitos").optional().or(z.literal("")),
  email: z
    .string()
    .optional()
    .refine((val) => !val || z.string().email().safeParse(val).success, "E-mail inválido"),
  telefone: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  uf: z.string().min(2, "UF é obrigatório").max(2, "Use a sigla do estado (ex: SP)"),
  cep: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d{5}-\d{3}$/.test(val),
      "CEP inválido (formato: 00000-000)"
    ),
});

type FilialFormData = z.infer<typeof filialSchema>;

export default function CriarFilialPage() {
  const router = useRouter();
  const params = useParams();
  const escolaMatrizId = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [escolaMatrizNome, setEscolaMatrizNome] = useState("");
  const [ufs, setUfs] = useState<UF[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [loadingUFs, setLoadingUFs] = useState(true);
  const [loadingCidades, setLoadingCidades] = useState(false);
  const [selectedUF, setSelectedUF] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
    watch,
  } = useForm<FilialFormData>({
    resolver: zodResolver(filialSchema),
  });

  // Watch UF field changes
  const ufValue = watch("uf");

  // Carregar dados da escola matriz
  useEffect(() => {
    const fetchEscolaMatriz = async () => {
      try {
        const response = await getEscola(escolaMatrizId);
        const escola = response.data || response.payload;

        if (escola) {
          setEscolaMatrizNome(escola.nome);

          // Se escolaMatriz está definida, significa que é uma filial, não matriz
          if (escola.escolaMatriz) {
            toast.error("Erro", {
              description: "Só é possível adicionar filiais a escolões matriz.",
            });
            router.push("/planejamento/instituicoes");
            return;
          }
        }
      } catch (error: any) {
        toast.error("Erro ao carregar escolão matriz", {
          description:
            error.response?.data?.message ||
            "Ocorreu um erro ao carregar os dados da escolão.",
        });
        router.push("/planejamento/instituicoes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEscolaMatriz();
  }, [escolaMatrizId, router]);

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
          setValue("cidade", ""); // Limpa a cidade quando troca UF

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
  }, [ufValue, selectedUF, setValue]);

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

  const onSubmit = async (data: FilialFormData) => {
    setIsSubmitting(true);
    try {
      const response = await createFilial(escolaMatrizId, {
        nome: data.nome,
        codigoFilial: data.codigoFilial,
        endereco: {
          cidade: data.cidade,
          uf: data.uf, // Já vem em maiúsculas do dropdown
          logradouro: data.logradouro,
          numero: data.numero,
          complemento: data.complemento,
          bairro: data.bairro,
          cep: data.cep,
        },
        cnpj: data.cnpj,
        inep: data.inep,
        contato: {
          email: data.email,
          telefone: data.telefone,
        },
      });

      // Mostra toast de sucesso
      const filialData = response.data || response.payload;
      toast.success(response.message || "Filial criada com sucesso!", {
        description: filialData?.nome
          ? `A filial "${filialData.nome}" foi cadastrada.`
          : "A filial foi cadastrada com sucesso.",
      });

      // SEMPRE redireciona após sucesso
      router.push(`/planejamento/instituicoes/${escolaMatrizId}`);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Ocorreu um erro ao cadastrar a filial. Tente novamente.";

      toast.error("Erro ao criar filial", {
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
        <Link href={`/planejamento/instituicoes/${escolaMatrizId}`}>
          <button className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800">
            <ChevronLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-400" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Adicionar Filial
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Nova filial para {escolaMatrizNome}
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
                  Nome da Filial <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Digite o nome da filial"
                  {...register("nome")}
                  error={errors.nome?.message}
                />
              </div>

              <div>
                <Label>
                  Código da Filial <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="FIL01"
                  {...register("codigoFilial")}
                  error={errors.codigoFilial?.message}
                  maxLength={10}
                  className="uppercase"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use letras maiúsculas e números (máx. 10 caracteres)
                </p>
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
                <Label>E-mail</Label>
                <Input
                  type="email"
                  placeholder="contato@filial.com"
                  {...register("email")}
                  error={errors.email?.message}
                />
              </div>

              <div className="md:col-span-2">
                <Label>Telefone</Label>
                <Input
                  type="text"
                  placeholder="(00) 00000-0000"
                  {...register("telefone")}
                  error={errors.telefone?.message}
                />
              </div>
            </div>
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
                  placeholder="Rua, Avenida..."
                  {...register("logradouro")}
                  error={errors.logradouro?.message}
                />
              </div>

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
                  placeholder="Apto, Bloco..."
                  {...register("complemento")}
                  error={errors.complemento?.message}
                />
              </div>

              <div>
                <Label>Bairro</Label>
                <Input
                  type="text"
                  placeholder="Nome do bairro"
                  {...register("bairro")}
                  error={errors.bairro?.message}
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

              <div>
                <Label>
                  CEP <span className="text-error-500">*</span>
                </Label>
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
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Link href={`/planejamento/instituicoes/${escolaMatrizId}`}>
              <Button variant="outline" type="button" disabled={isSubmitting}>
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Filial"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
