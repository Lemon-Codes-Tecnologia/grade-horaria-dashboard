"use client";
import React, { useMemo } from "react";
import { type Horario, type DiaSemana } from "@/lib/api/grades-horarias";
import { getTextColorForBackground } from "@/lib/utils/colors";

interface TimeSlot {
  inicio: string;
  fim: string;
}

interface GradeHorariaEditorProps {
  horarios: Horario[];
  onAddHorario: (dia: DiaSemana, horaInicio: string, horaFim: string) => void;
  onRemoveHorario: (horario: Horario) => void;
  diasLetivos?: DiaSemana[];
  horariosEscola?: TimeSlot[];
}

const GradeHorariaEditor: React.FC<GradeHorariaEditorProps> = ({
  horarios,
  onAddHorario,
  onRemoveHorario,
  diasLetivos = ["segunda", "terca", "quarta", "quinta", "sexta"],
  horariosEscola = [
    { inicio: "07:00", fim: "07:50" },
    { inicio: "07:50", fim: "08:40" },
    { inicio: "08:40", fim: "09:30" },
    { inicio: "09:50", fim: "10:40" },
    { inicio: "10:40", fim: "11:30" },
    { inicio: "11:30", fim: "12:20" },
  ],
}) => {
  const diasSemanaLabels: Record<string, string> = {
    segunda: "Seg",
    terca: "Ter",
    quarta: "Qua",
    quinta: "Qui",
    sexta: "Sex",
    sabado: "Sáb",
    domingo: "Dom",
  };

  // Organiza horários por dia e slot
  const gradeMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, Horario[]>> = {};

    diasLetivos.forEach((dia) => {
      matrix[dia] = {};
      horariosEscola.forEach((slot) => {
        matrix[dia][`${slot.inicio}-${slot.fim}`] = [];
      });
    });

    // Preencher matriz com horários
    horarios.forEach((horario) => {
      const dia = horario.diaSemana;
      const slotKey = `${horario.horaInicio}-${horario.horaFim}`;

      if (matrix[dia] && matrix[dia][slotKey]) {
        matrix[dia][slotKey].push(horario);
      }
    });

    return matrix;
  }, [horarios, diasLetivos, horariosEscola]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 text-center w-24">
              Horário
            </th>
            {diasLetivos.map((dia) => (
              <th
                key={dia}
                className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 text-center min-w-[140px]"
              >
                {diasSemanaLabels[dia]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {horariosEscola.map((slot) => {
            const slotKey = `${slot.inicio}-${slot.fim}`;
            return (
              <tr key={slotKey}>
                <td className="sticky left-0 z-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 text-center whitespace-nowrap">
                  <div className="flex flex-col">
                    <span>{slot.inicio}</span>
                    <span className="text-gray-400 dark:text-gray-500">|</span>
                    <span>{slot.fim}</span>
                  </div>
                </td>
                {diasLetivos.map((dia) => {
                  const horariosNaCelula = gradeMatrix[dia]?.[slotKey] || [];
                  const horario = horariosNaCelula[0]; // Assumindo 1 horário por célula

                  return (
                    <td
                      key={`${dia}-${slotKey}`}
                      className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1"
                    >
                      {horario ? (
                        // Célula com horário
                        <div className="group relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onRemoveHorario(horario);
                            }}
                            className="w-full rounded px-2 py-2 text-left transition-all hover:opacity-80"
                            style={{
                              backgroundColor:
                                typeof horario.disciplina === "object"
                                  ? horario.disciplina.cor || "#6366f1"
                                  : "#6366f1",
                              color: getTextColorForBackground(
                                typeof horario.disciplina === "object"
                                  ? horario.disciplina.cor || "#6366f1"
                                  : "#6366f1"
                              ),
                            }}
                          >
                            {/* Botão de remover */}
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-error-500 rounded-full p-0.5">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>

                            <div className="space-y-0.5">
                              <p className="text-xs font-semibold leading-tight truncate">
                                {typeof horario.disciplina === "object"
                                  ? horario.disciplina.nome
                                  : "Disciplina"}
                              </p>
                              {horario.professor && (
                                <p className="text-[10px] opacity-90 leading-tight truncate">
                                  {typeof horario.professor === "object"
                                    ? horario.professor.nome
                                    : "Professor"}
                                </p>
                              )}
                              {horario.observacoes && (
                                <p className="text-[10px] opacity-80 leading-tight truncate">
                                  {horario.observacoes}
                                </p>
                              )}
                            </div>
                          </button>
                        </div>
                      ) : (
                        // Célula vazia - botão de adicionar
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onAddHorario(dia, slot.inicio, slot.fim);
                          }}
                          className="w-full h-full min-h-[60px] flex items-center justify-center rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                        >
                          <div className="flex flex-col items-center gap-1 opacity-30 group-hover:opacity-70 transition-opacity">
                            <svg
                              className="w-6 h-6 text-gray-400 dark:text-gray-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">
                              Adicionar
                            </span>
                          </div>
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default GradeHorariaEditor;
