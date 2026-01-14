"use client";
import React from "react";
import { type Horario } from "@/lib/api/grades-horarias";
import { getTextColorForBackground } from "@/lib/utils/colors";

interface GradeHorariaViewerProps {
  horarios: Horario[];
  onHorarioClick?: (horario: Horario) => void;
  selectedHorarioId?: string;
}

const GradeHorariaViewer: React.FC<GradeHorariaViewerProps> = ({
  horarios,
  onHorarioClick,
  selectedHorarioId,
}) => {
  const diasSemana = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const diasSemanaLabels: Record<string, string> = {
    segunda: "Segunda",
    terca: "Terça",
    quarta: "Quarta",
    quinta: "Quinta",
    sexta: "Sexta",
    sabado: "Sábado",
    domingo: "Domingo",
  };

  // Agrupar horários por dia da semana
  const horariosPorDia: Record<string, Horario[]> = {};
  horarios.forEach((horario) => {
    const dia = horario.diaSemana;
    if (!horariosPorDia[dia]) {
      horariosPorDia[dia] = [];
    }
    horariosPorDia[dia].push(horario);
  });

  // Ordenar horários dentro de cada dia
  Object.keys(horariosPorDia).forEach((dia) => {
    horariosPorDia[dia].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  });

  const handleHorarioClick = (horario: Horario) => {
    if (onHorarioClick) {
      onHorarioClick(horario);
    }
  };

  if (!horarios || horarios.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Nenhum horário alocado ainda.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {diasSemana.map((dia) => {
        const horariosdia = horariosPorDia[dia] || [];
        if (horariosdia.length === 0) return null;

        return (
          <div key={dia}>
            <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
              {diasSemanaLabels[dia]}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {horariosdia.map((horario) => {
                const disciplina = typeof horario.disciplina === "object" ? horario.disciplina : null;
                const professor = typeof horario.professor === "object" ? horario.professor : null;
                const isSelected = selectedHorarioId === horario._id;

                return (
                  <button
                    key={horario._id}
                    onClick={() => handleHorarioClick(horario)}
                    className={`rounded-lg border p-4 text-left transition-all hover:shadow-md ${
                      isSelected
                        ? "border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-500/10 ring-2 ring-brand-500"
                        : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 hover:border-brand-300"
                    }`}
                    style={
                      disciplina?.cor && !isSelected
                        ? { borderLeftWidth: "4px", borderLeftColor: disciplina.cor }
                        : isSelected && disciplina?.cor
                        ? { borderLeftWidth: "4px", borderLeftColor: disciplina.cor }
                        : undefined
                    }
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {horario.horaInicio} - {horario.horaFim}
                      </span>
                      {disciplina?.codigo && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                          {disciplina.codigo}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90 mb-1">
                      {disciplina?.nome || "Disciplina não definida"}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {professor?.nome || "Professor não definido"}
                    </p>
                    {horario.sala && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Sala: {horario.sala}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GradeHorariaViewer;
