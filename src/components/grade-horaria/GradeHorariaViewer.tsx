"use client";
import React, { useMemo, useState } from "react";
import { type Horario, type SlotIntervalo, type GradeThemeConfig } from "@/lib/api/grades-horarias";
import { getTextColorForBackground } from "@/lib/utils/colors";
import type { GradeThemeAssets } from "@/lib/api/grade-themes";

interface GradeHorariaViewerProps {
  horarios: Horario[];
  slotsIntervalo?: SlotIntervalo[];
  onHorarioClick?: (horario: Horario) => void;
  selectedHorarioId?: string;
  editMode?: boolean; // Habilita modo de edição com drag & drop
  onHorarioSwap?: (horario1: Horario, horario2: Horario) => void; // Callback quando horários são trocados
  onAddHorario?: (dia: string, horaInicio: string, horaFim: string) => void; // Callback para adicionar horário
  onRemoveHorario?: (horario: Horario) => void; // Callback para remover horário
  diasLetivos?: string[]; // Dias letivos configurados na escola
  temaConfig?: GradeThemeConfig;
  temaAssets?: GradeThemeAssets;
}

interface TimeSlot {
  inicio: string;
  fim: string;
}

const GradeHorariaViewer: React.FC<GradeHorariaViewerProps> = ({
  horarios,
  slotsIntervalo,
  onHorarioClick,
  selectedHorarioId,
  editMode = false,
  onHorarioSwap,
  onAddHorario,
  onRemoveHorario,
  diasLetivos,
  temaConfig,
  temaAssets,
}) => {
  const [draggedHorario, setDraggedHorario] = useState<Horario | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);

  // Usa dias letivos configurados ou fallback padrão
  const diasSemana = diasLetivos || ["segunda", "terca", "quarta", "quinta", "sexta"];
  const diasSemanaLabels: Record<string, string> = {
    segunda: "Seg",
    terca: "Ter",
    quarta: "Qua",
    quinta: "Qui",
    sexta: "Sex",
    sabado: "Sáb",
    domingo: "Dom",
  };

  // Gera todos os slots de horário únicos e organiza os horários por dia e slot
  const { timeSlots, gradeMatrix, intervalMatrix } = useMemo(() => {
    // Extrair todos os horários únicos (início-fim)
    const slotsSet = new Set<string>();
    horarios.forEach((horario) => {
      slotsSet.add(`${horario.horaInicio}-${horario.horaFim}`);
    });
    (slotsIntervalo || []).forEach((slot) => {
      slotsSet.add(`${slot.horaInicio}-${slot.horaFim}`);
    });

    // Converter para array e ordenar
    const slots: TimeSlot[] = Array.from(slotsSet)
      .map((slot) => {
        const [inicio, fim] = slot.split("-");
        return { inicio, fim };
      })
      .sort((a, b) => a.inicio.localeCompare(b.inicio));

    // Criar matriz: dia -> slot -> horários
    const matrix: Record<string, Record<string, Horario[]>> = {};
    const intervalos: Record<string, Record<string, SlotIntervalo | null>> = {};

    diasSemana.forEach((dia) => {
      matrix[dia] = {};
      intervalos[dia] = {};
      slots.forEach((slot) => {
        matrix[dia][`${slot.inicio}-${slot.fim}`] = [];
        intervalos[dia][`${slot.inicio}-${slot.fim}`] = null;
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

    // Preencher matriz com intervalos
    (slotsIntervalo || []).forEach((slot) => {
      const dia = slot.diaSemana;
      const slotKey = `${slot.horaInicio}-${slot.horaFim}`;

      if (intervalos[dia] && slotKey in intervalos[dia]) {
        intervalos[dia][slotKey] = slot;
      }
    });

    return { timeSlots: slots, gradeMatrix: matrix, intervalMatrix: intervalos };
  }, [horarios, slotsIntervalo]);

  const handleHorarioClick = (horario: Horario) => {
    if (onHorarioClick) {
      onHorarioClick(horario);
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (horario: Horario, e: React.DragEvent) => {
    if (!editMode) return;
    setDraggedHorario(horario);
    e.dataTransfer.effectAllowed = "move";
    // Adiciona um estilo visual ao elemento sendo arrastado
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDraggedHorario(null);
    setDragOverCell(null);
  };

  const handleDragOver = (dia: string, slotKey: string, e: React.DragEvent) => {
    if (!editMode || !draggedHorario) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCell(`${dia}-${slotKey}`);
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (dia: string, slotKey: string, targetHorario: Horario | null, e: React.DragEvent) => {
    e.preventDefault();
    if (!editMode || !draggedHorario) return;

    setDragOverCell(null);

    // Se soltou na mesma célula, não faz nada
    if (
      draggedHorario.diaSemana === dia &&
      `${draggedHorario.horaInicio}-${draggedHorario.horaFim}` === slotKey
    ) {
      setDraggedHorario(null);
      return;
    }

    // Se há um horário na célula de destino, trocar de posição
    if (targetHorario && onHorarioSwap) {
      onHorarioSwap(draggedHorario, targetHorario);
    } else if (onHorarioSwap) {
      // Se a célula está vazia, criar um horário "fantasma" para representar a nova posição
      const [horaInicio, horaFim] = slotKey.split("-");
      const novasPosicao: Horario = {
        ...draggedHorario,
        _id: draggedHorario._id,
        diaSemana: dia as any,
        horaInicio,
        horaFim,
      };
      onHorarioSwap(draggedHorario, novasPosicao);
    }

    setDraggedHorario(null);
  };

  const primaryColor = temaConfig?.primaryColor;
  const accentColor = temaConfig?.accentColor || primaryColor;
  const backgroundColor = temaConfig?.background;
  const headerTextColor = primaryColor ? getTextColorForBackground(primaryColor) : undefined;
  const accentTextColor = accentColor ? getTextColorForBackground(accentColor) : undefined;

  const buildPatternImage = (pattern?: string, color?: string) => {
    if (!pattern || !color) return undefined;
    const patternColor = color;

    switch (pattern) {
      case "dots":
        return `radial-gradient(${patternColor} 1px, transparent 1px)`;
      case "snow":
        return `radial-gradient(${patternColor} 1.5px, transparent 1.5px)`;
      case "hearts":
        return `radial-gradient(${patternColor} 1px, transparent 2px)`;
      default:
        return undefined;
    }
  };

  const patternImage = temaAssets?.patternUrl
    ? `url(${temaAssets.patternUrl})`
    : buildPatternImage(temaConfig?.pattern, accentColor || primaryColor);
  const backgroundImageLayers = [
    temaAssets?.bgImageUrl ? `url(${temaAssets.bgImageUrl})` : null,
    patternImage || null,
  ].filter(Boolean) as string[];
  const backgroundImage = backgroundImageLayers.length > 0 ? backgroundImageLayers.join(", ") : undefined;
  const backgroundSize = [
    temaAssets?.bgImageUrl ? "cover" : null,
    patternImage ? "140px 140px" : null,
  ].filter(Boolean).join(", ");

  if ((!horarios || horarios.length === 0) && (!slotsIntervalo || slotsIntervalo.length === 0)) {
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
    <div
      className="overflow-x-auto rounded-lg"
      style={{
        backgroundColor: backgroundColor,
        backgroundImage,
        backgroundSize: backgroundSize || undefined,
        backgroundPosition: backgroundImage ? "center" : undefined,
      }}
    >
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th
              className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 text-center w-24"
              style={primaryColor ? { backgroundColor: primaryColor, color: headerTextColor } : undefined}
            >
              Horário
            </th>
            {diasSemana.map((dia) => (
              <th
                key={dia}
                className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300 text-center min-w-[140px]"
                style={primaryColor ? { backgroundColor: primaryColor, color: headerTextColor } : undefined}
              >
                {diasSemanaLabels[dia]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((slot) => {
            const slotKey = `${slot.inicio}-${slot.fim}`;
            return (
              <tr key={slotKey}>
                <td
                  className="sticky left-0 z-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 text-center whitespace-nowrap"
                  style={primaryColor ? { backgroundColor: primaryColor, color: headerTextColor } : undefined}
                >
                  <div className="flex flex-col">
                    <span>{slot.inicio}</span>
                    <span className="text-gray-400 dark:text-gray-500">|</span>
                    <span>{slot.fim}</span>
                  </div>
                </td>
                {diasSemana.map((dia) => {
                  const horariosNaCelula = gradeMatrix[dia]?.[slotKey] || [];
                  const intervaloNaCelula = intervalMatrix[dia]?.[slotKey] || null;
                  const cellKey = `${dia}-${slotKey}`;
                  const isDragOver = editMode && dragOverCell === cellKey;

                  const isIntervalo = Boolean(intervaloNaCelula);

                  return (
                    <td
                      key={cellKey}
                      className={`border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1 transition-colors ${
                        isDragOver ? "bg-brand-50 dark:bg-brand-900/20 border-brand-500" : ""
                      }`}
                      onDragOver={(e) => !isIntervalo && handleDragOver(dia, slotKey, e)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => !isIntervalo && handleDrop(dia, slotKey, horariosNaCelula[0] || null, e)}
                    >
                      {intervaloNaCelula ? (
                        <div
                          className="rounded px-2 py-2 text-left text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                          style={accentColor ? { backgroundColor: accentColor, color: accentTextColor } : undefined}
                        >
                          Intervalo
                        </div>
                      ) : horariosNaCelula.length > 0 ? (
                        <div className="space-y-1">
                          {horariosNaCelula.map((horario) => {
                            const disciplina = typeof horario.disciplina === "object" ? horario.disciplina : null;
                            const professor = typeof horario.professor === "object" ? horario.professor : null;
                            const isSelected = selectedHorarioId === horario._id;
                            const isDragging = editMode && draggedHorario?._id === horario._id;
                            const corDisciplina = disciplina?.cor || "#6366f1";

                            return (
                              <div
                                key={horario._id}
                                draggable={editMode}
                                onDragStart={(e) => handleDragStart(horario, e)}
                                onDragEnd={handleDragEnd}
                                className={`relative group ${editMode ? "cursor-move" : "cursor-pointer"} ${
                                  isDragging ? "opacity-50" : ""
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleHorarioClick(horario)}
                                  className={`w-full rounded px-2 py-2 text-left transition-all hover:opacity-90 hover:shadow-md ${
                                    isSelected
                                      ? "ring-2 ring-brand-500 ring-offset-1"
                                      : ""
                                  }`}
                                  style={{
                                    backgroundColor: corDisciplina,
                                    color: getTextColorForBackground(corDisciplina),
                                  }}
                                >
                                  {editMode && (
                                    <div className="absolute top-1 right-1 opacity-60">
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                      </svg>
                                    </div>
                                  )}
                                  <div className="space-y-0.5">
                                    <p className="text-xs font-semibold leading-tight truncate">
                                      {disciplina?.nome || "Sem disciplina"}
                                    </p>
                                    {professor && (
                                      <p className="text-[10px] opacity-90 leading-tight truncate">
                                        {professor.nome}
                                      </p>
                                    )}
                                    {horario.observacoes && (
                                      <p className="text-[10px] opacity-80 leading-tight truncate">
                                        {horario.observacoes}
                                      </p>
                                    )}
                                  </div>
                                </button>

                                {/* Botão de Remover - Aparece no hover */}
                                {editMode && onRemoveHorario && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      onRemoveHorario(horario);
                                    }}
                                    className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity bg-error-500 hover:bg-error-600 rounded-full p-0.5"
                                  >
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path
                                        fillRule="evenodd"
                                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className={`h-full min-h-[60px] flex items-center justify-center ${
                          editMode && isDragOver ? "border-2 border-dashed border-brand-500 rounded" : ""
                        }`}>
                          {editMode && onAddHorario ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onAddHorario(dia, slot.inicio, slot.fim);
                              }}
                              className="w-full h-full min-h-[60px] flex flex-col items-center justify-center rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                            >
                              <svg
                                className="w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-brand-500 transition-colors"
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
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 group-hover:text-brand-500 transition-colors mt-1">
                                Adicionar
                              </span>
                            </button>
                          ) : (
                            <span className="text-xs text-gray-300 dark:text-gray-700">
                              {editMode && isDragOver ? "Solte aqui" : "-"}
                            </span>
                          )}
                        </div>
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

export default GradeHorariaViewer;
