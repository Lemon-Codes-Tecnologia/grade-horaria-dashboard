"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon } from "@/icons";
import { getProfessor, type Professor } from "@/lib/api/professores";
import { type NivelEnsino } from "@/lib/api/escolas";
import { toast } from "sonner";
import { useSchool } from "@/context/SchoolContext";
import { getTextColorForBackground } from "@/lib/utils/colors";

const formatNivelEnsino = (nivel: NivelEnsino) => {
  const labels: Record<NivelEnsino, string> = {
    infantil: "Infantil",
    fundamental1: "Fundamental I",
    fundamental2: "Fundamental II",
    medio: "Médio",
    eja: "EJA",
    superior: "Superior",
  };
  return labels[nivel] || nivel;
};

const diasSemana = [
  { key: "segunda", label: "Segunda" },
  { key: "terca", label: "Terça" },
  { key: "quarta", label: "Quarta" },
  { key: "quinta", label: "Quinta" },
  { key: "sexta", label: "Sexta" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];

export default function DetalhesProfessorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { selectedSchool } = useSchool();

  const [professor, setProfessor] = useState<Professor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfessor = async () => {
    if (!selectedSchool) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await getProfessor(id, selectedSchool._id);
      const professorData = response.data || response.payload;

      if (professorData) {
        setProfessor(professorData);
      }
    } catch (error: any) {
      toast.error("Erro ao carregar professor", {
        description:
          error.response?.data?.message ||
          "Ocorreu um erro ao carregar os dados do professor.",
      });
      router.push("/planejamento/professores");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, selectedSchool]);

  if (!selectedSchool && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-gray-500 dark:text-gray-400">
          Selecione uma escola para visualizar os detalhes do professor
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
      </div>
    );
  }

  if (!professor) {
    return null;
  }

  const disponibilidade = professor.disponibilidade || {};
  const niveisDisponibilidade = Object.keys(disponibilidade) as NivelEnsino[];
  const diasComAula = Array.from(
    new Set(
      niveisDisponibilidade.flatMap((nivel) =>
        Object.keys(disponibilidade[nivel] || {})
      )
    )
  );
  const quantidadeAulasPorDia = Math.max(
    0,
    ...niveisDisponibilidade.flatMap((nivel) =>
      Object.values(disponibilidade[nivel] || {}).map((aulas) => aulas.length)
    )
  );
  const hasDisponibilidade =
    professor.disponibilidade &&
    Object.keys(professor.disponibilidade).length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/planejamento/professores">
          <button className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800">
            <ChevronLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-400" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            {professor.nome}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Detalhes do professor
          </p>
        </div>
        <Link href={`/planejamento/professores/${id}/editar`}>
          <Button variant="outline" size="sm">
            Editar
          </Button>
        </Link>
      </div>

      {/* Informações Gerais */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
          Informações Gerais
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Nome</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {professor.nome}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">E-mail</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {professor.email}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Matrícula</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {professor.matricula}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">CPF</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {professor.cpf || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Telefone</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {professor.telefone || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Carga Horária Semanal
            </p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {professor.cargaHorariaSemanal
                ? `${professor.cargaHorariaSemanal}h/semana`
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
            <p className="mt-1">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  professor.ativo
                    ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {professor.ativo ? "Ativo" : "Inativo"}
              </span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Disponibilidade
            </p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {hasDisponibilidade ? "Configurada" : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Níveis de Ensino */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
          Níveis de Ensino
        </h2>
        {professor.nivelEnsino && professor.nivelEnsino.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {professor.nivelEnsino.map((nivel) => (
              <span
                key={nivel}
                className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
              >
                {formatNivelEnsino(nivel)}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">-</p>
        )}
      </div>

      {/* Disciplinas */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
          Disciplinas
        </h2>
        {professor.disciplinas && professor.disciplinas.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {professor.disciplinas.map((disciplina: any, index: number) => {
              const disc = typeof disciplina === "string" ? null : disciplina;
              const nomeDisciplina = disc?.nome || disciplina;
              const corDisciplina = disc?.cor || "#6B7280";
              const corTexto = getTextColorForBackground(corDisciplina);

              return (
                <span
                  key={disc?._id || index}
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: corDisciplina,
                    color: corTexto,
                  }}
                  title={nomeDisciplina}
                >
                  {nomeDisciplina}
                </span>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">-</p>
        )}
      </div>

      {/* Disponibilidade de Horários */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
          Disponibilidade de Horários
        </h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Visualização da disponibilidade cadastrada
        </p>

        <>
          <div className="mb-6 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Quantidade de Aulas por Dia
                </p>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {professor.preferencias?.maxAulasPorDia ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Quantidade Mínima de Aulas por Dia
                </p>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {professor.preferencias?.minAulasPorDia ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Dias da Semana com Aula
                </p>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {diasComAula.length > 0
                    ? diasComAula
                        .map(
                          (dia) =>
                            diasSemana.find((d) => d.key === dia)?.label || dia
                        )
                        .join(", ")
                    : "-"}
                </p>
              </div>
            </div>
          </div>

          {!hasDisponibilidade ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">-</p>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Legenda:
                </span>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded border-2 border-success-500 bg-success-500 flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Disponível
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded border-2 border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900 flex items-center justify-center">
                    <span className="text-xs text-gray-400">-</span>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Indisponível
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                {(professor.nivelEnsino?.length
                  ? professor.nivelEnsino
                  : niveisDisponibilidade
                ).map((nivel) => (
                  <div
                    key={nivel}
                    className="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
                  >
                    <h3 className="mb-4 text-base font-medium text-gray-800 dark:text-white/90">
                      {formatNivelEnsino(nivel)}
                    </h3>
                    {diasComAula.length === 0 || quantidadeAulasPorDia === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">-</p>
                    ) : (
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
                            {Array.from(
                              { length: quantidadeAulasPorDia },
                              (_, index) => (
                                <tr
                                  key={index}
                                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                >
                                  <td className="sticky left-0 bg-white py-2 px-3 text-xs font-medium text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                                    {index + 1}º
                                  </td>
                                  {diasSemana
                                    .filter((dia) => diasComAula.includes(dia.key))
                                    .map((dia) => {
                                      const isDisponivel =
                                        disponibilidade[nivel]?.[dia.key]?.[index] ||
                                        false;

                                      return (
                                        <td key={dia.key} className="py-2 px-3 text-center">
                                          <div
                                            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 text-xs ${
                                              isDisponivel
                                                ? "border-success-500 bg-success-500 text-white"
                                                : "border-gray-300 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-900"
                                            }`}
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
                                            ) : (
                                              <span>-</span>
                                            )}
                                          </div>
                                        </td>
                                      );
                                    })}
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      </div>
    </div>
  );
}
