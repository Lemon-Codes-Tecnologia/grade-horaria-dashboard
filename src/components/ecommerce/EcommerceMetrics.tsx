"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Badge from "../ui/badge/Badge";
import { useSchool } from "@/context/SchoolContext";
import { listGradesHorarias, type GradeHoraria } from "@/lib/api/grades-horarias";

const getTurnoAtual = (date: Date) => {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) return "manha";
  if (hour >= 12 && hour < 18) return "tarde";
  return "noite";
};

const turnoLabel = {
  manha: "Manha",
  tarde: "Tarde",
  noite: "Noite",
} as const;

export const EcommerceMetrics = () => {
  const { selectedSchool } = useSchool();
  const [gradesAtivas, setGradesAtivas] = useState<GradeHoraria[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const turnoAtual = useMemo(() => getTurnoAtual(new Date()), []);

  useEffect(() => {
    const fetchGradesAtivas = async () => {
      if (!selectedSchool?._id) {
        setGradesAtivas([]);
        setErro(null);
        return;
      }

      setIsLoading(true);
      setErro(null);
      try {
        const response = await listGradesHorarias({
          idEscola: selectedSchool._id,
          status: "ativa",
          limit: 100,
        });
        const payload = response.data || response.payload;
        const docs = payload?.docs || [];
        const filtradas = docs.filter((grade: GradeHoraria) => {
          if (!grade.turma || typeof grade.turma !== "object") return false;
          return grade.turma.turno === turnoAtual;
        });
        setGradesAtivas(filtradas);
      } catch (error) {
        console.error("Erro ao buscar grades ativas:", error);
        setErro("Nao foi possivel carregar as grades ativas.");
        setGradesAtivas([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGradesAtivas();
  }, [selectedSchool, turnoAtual]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Grades ativas agora
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Turmas com aulas em andamento neste horario
          </p>
        </div>
        <Link
          href="/planejamento/grade-horaria"
          className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          Ver todas
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {isLoading ? (
          <div className="col-span-full rounded-lg border border-dashed border-gray-200 px-3 py-4 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
            Carregando grades...
          </div>
        ) : erro ? (
          <div className="col-span-full rounded-lg border border-dashed border-error-200 px-3 py-4 text-center text-sm text-error-600 dark:border-error-800 dark:text-error-400">
            {erro}
          </div>
        ) : gradesAtivas.length === 0 ? (
          <div className="col-span-full rounded-lg border border-dashed border-gray-200 px-3 py-4 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
            Nenhuma grade ativa no turno atual.
          </div>
        ) : (
          gradesAtivas.map((grade) => {
            const turma = typeof grade.turma === "object" ? grade.turma : null;
            const turno = turma?.turno ? turnoLabel[turma.turno] : "Turno";
            return (
              <Link
                key={grade._id}
                href={`/planejamento/grade-horaria/${grade._id}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 transition hover:border-brand-200 hover:bg-brand-50/40 dark:border-gray-800 dark:hover:bg-white/[0.03]"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-gray-800 dark:text-white/90">
                    {grade.nome}
                  </p>
                  <p className="mt-1 truncate text-[11px] text-gray-500 dark:text-gray-400">
                    {turma?.nome || "Turma"} • {turno}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Agora
                  </p>
                  <Badge color="success" size="sm">
                    Em andamento
                  </Badge>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};
