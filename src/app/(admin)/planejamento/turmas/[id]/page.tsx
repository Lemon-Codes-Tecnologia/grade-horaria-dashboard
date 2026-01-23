"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon } from "@/icons";
import { getTurma, type Turma, type Turno } from "@/lib/api/turmas";
import { toast } from "sonner";
import { useSchool } from "@/context/SchoolContext";

// Funções helper para formatar labels
const formatSerie = (serie: string) => {
  const labels: Record<string, string> = {
    "1ano_infantil": "1º Ano Infantil",
    "2ano_infantil": "2º Ano Infantil",
    "3ano_infantil": "3º Ano Infantil",
    "1ano_fundamental": "1º Ano Fundamental",
    "2ano_fundamental": "2º Ano Fundamental",
    "3ano_fundamental": "3º Ano Fundamental",
    "4ano_fundamental": "4º Ano Fundamental",
    "5ano_fundamental": "5º Ano Fundamental",
    "6ano_fundamental": "6º Ano Fundamental",
    "7ano_fundamental": "7º Ano Fundamental",
    "8ano_fundamental": "8º Ano Fundamental",
    "9ano_fundamental": "9º Ano Fundamental",
    "1ano_medio": "1º Ano Médio",
    "2ano_medio": "2º Ano Médio",
    "3ano_medio": "3º Ano Médio",
    "eja_fundamental": "EJA Fundamental",
    "eja_medio": "EJA Médio",
  };
  return labels[serie] || serie;
};

const formatTurno = (turno: Turno) => {
  const labels: Record<Turno, string> = {
    manha: "Manhã",
    tarde: "Tarde",
    noite: "Noite",
    integral: "Integral",
  };
  return labels[turno] || turno;
};

const formatDisciplinaLabel = (
  disciplina: string | { nome?: string; codigo?: string }
) => {
  if (typeof disciplina === "string") return disciplina;
  if (disciplina?.nome && disciplina?.codigo) {
    return `${disciplina.nome} (${disciplina.codigo})`;
  }
  return disciplina?.nome || disciplina?.codigo || "Disciplina";
};

export default function DetalhesTurmaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { selectedSchool } = useSchool();

  const [turma, setTurma] = useState<Turma | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTurma = async () => {
    if (!selectedSchool) return;

    setIsLoading(true);
    try {
      const response = await getTurma(id, selectedSchool._id);
      const turmaData = response.data || response.payload;

      if (turmaData) {
        setTurma(turmaData);
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


  useEffect(() => {
    fetchTurma();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, selectedSchool]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
      </div>
    );
  }

  if (!turma) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/planejamento/turmas">
          <button className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800">
            <ChevronLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-400" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            {turma.nome}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Detalhes da turma
          </p>
        </div>
        <Link href={`/planejamento/turmas/${id}/editar`}>
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
              {turma.nome}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Código</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {turma.codigo}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Série</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {formatSerie(turma.serie)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Turno</p>
            <p className="mt-1">
              <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                {formatTurno(turma.turno)}
              </span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ano Letivo</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {turma.anoLetivo}
            </p>
          </div>
          {turma.ano && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ano</p>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {turma.ano}
              </p>
            </div>
          )}
          {turma.sala && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sala</p>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {turma.sala}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
            <p className="mt-1">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  turma.ativa
                    ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {turma.ativa ? "Ativa" : "Inativa"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
          Estatísticas
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Alunos Matriculados</p>
            <p className="mt-1 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {turma.quantidadeAlunos || 0}
            </p>
          </div>
          {turma.capacidadeMaxima && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Capacidade Máxima</p>
              <p className="mt-1 text-2xl font-semibold text-gray-800 dark:text-white/90">
                {turma.capacidadeMaxima}
              </p>
            </div>
          )}
          {turma.capacidadeMaxima && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Vagas Disponíveis</p>
              <p className="mt-1 text-2xl font-semibold text-gray-800 dark:text-white/90">
                {turma.capacidadeMaxima - (turma.quantidadeAlunos || 0)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Configurações de Aula */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
          Configurações de Aula
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Quantidade de Aulas por Dia</p>
            <p className="mt-1 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {turma.configuracoes?.quantidadeAulasPorDia || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Máximo de Aulas Consecutivas</p>
            <p className="mt-1 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {turma.configuracoes?.maxAulasConsecutivas || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Intervalo Obrigatório (após X aulas)</p>
            <p className="mt-1 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {turma.configuracoes?.intervaloObrigatorioAposAulas || "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Disciplinas */}
      {turma.disciplinas && turma.disciplinas.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
            Disciplinas
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {turma.disciplinas.map((disc, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50"
              >
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {formatDisciplinaLabel(
                    disc.disciplina as unknown as string | { nome?: string; codigo?: string }
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {disc.cargaHorariaSemanal}h semanais
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
