"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon } from "@/icons";
import {
  getDisciplina,
  type Disciplina,
} from "@/lib/api/disciplinas";
import { toast } from "sonner";

export default function DetalhesDisciplinaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [disciplina, setDisciplina] = useState<Disciplina | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDisciplina = async () => {
    setIsLoading(true);
    try {
      const response = await getDisciplina(id);
      const disciplinaData = response.data || response.payload;

      if (disciplinaData) {
        setDisciplina(disciplinaData);
      }
    } catch (error: any) {
      toast.error("Erro ao carregar disciplina", {
        description:
          error.response?.data?.message ||
          "Ocorreu um erro ao carregar os dados da disciplina.",
      });
      router.push("/planejamento/disciplinas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDisciplina();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
      </div>
    );
  }

  if (!disciplina) {
    return null;
  }

  const escolaNome =
    typeof disciplina.escola === "object"
      ? disciplina.escola.nome
      : "Não definida";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/planejamento/disciplinas">
          <button className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800">
            <ChevronLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-400" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            {disciplina.nome}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Detalhes da disciplina
          </p>
        </div>
        <Link href={`/planejamento/disciplinas/${id}/editar`}>
          <Button variant="outline" size="sm">
            Editar
          </Button>
        </Link>
      </div>

      {/* Informações Básicas */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
          Informações Básicas
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Nome</p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {disciplina.nome}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Código</p>
            <p className="mt-1 text-sm font-mono font-medium text-gray-800 dark:text-white/90">
              {disciplina.codigo}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Cor</p>
            <div className="mt-1 flex items-center gap-2">
              <div
                className="h-8 w-8 rounded-lg border border-gray-200 dark:border-gray-700"
                style={{ backgroundColor: disciplina.cor || "#007bff" }}
              />
              <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                {disciplina.cor || "#007bff"}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
            <p className="mt-1">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  disciplina.ativa
                    ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {disciplina.ativa ? "Ativa" : "Inativa"}
              </span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Escola
            </p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {escolaNome}
            </p>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
          Status da Disciplina
        </h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
            <p className="mt-1">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  disciplina.ativa
                    ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {disciplina.ativa ? "Ativa" : "Inativa"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Metadados */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
          Informações do Sistema
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {disciplina.createdAt && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Data de Criação
              </p>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {new Date(disciplina.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}
          {disciplina.updatedAt && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Última Atualização
              </p>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {new Date(disciplina.updatedAt).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
