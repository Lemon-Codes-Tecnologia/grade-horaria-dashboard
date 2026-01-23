"use client";
import React, { useEffect, useState } from "react";
import { type Professor } from "@/lib/api/professores";
import { type Disciplina } from "@/lib/api/disciplinas";
import { type Periodo } from "@/lib/api/grades-horarias";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";

interface AddHorarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (disciplinaId: string, professorId: string, periodo: Periodo, observacoes?: string) => void;
  professores: Professor[];
  disciplinas: Disciplina[];
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
}

const diasSemanaLabels: Record<string, string> = {
  segunda: "Segunda-feira",
  terca: "Terça-feira",
  quarta: "Quarta-feira",
  quinta: "Quinta-feira",
  sexta: "Sexta-feira",
  sabado: "Sábado",
  domingo: "Domingo",
};

const AddHorarioModal: React.FC<AddHorarioModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  professores,
  disciplinas,
  diaSemana,
  horaInicio,
  horaFim,
}) => {
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState("");
  const [professorSelecionado, setProfessorSelecionado] = useState("");
  const [periodoSelecionado, setPeriodoSelecionado] = useState<Periodo>("manha");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    setProfessorSelecionado("");
  }, [disciplinaSelecionada]);

  const professoresFiltrados = disciplinaSelecionada
    ? professores.filter((professor) => {
        const disciplinasProfessor = (professor.disciplinas || [])
          .map((disciplina) =>
            typeof disciplina === "string" ? disciplina : disciplina?._id
          )
          .filter(Boolean);
        return disciplinasProfessor.includes(disciplinaSelecionada);
      })
    : [];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!disciplinaSelecionada || !professorSelecionado) {
      return;
    }

    onAdd(
      disciplinaSelecionada,
      professorSelecionado,
      periodoSelecionado,
      observacoes || undefined
    );

    // Limpar form
    setDisciplinaSelecionada("");
    setProfessorSelecionado("");
    setPeriodoSelecionado("manha");
    setObservacoes("");
    onClose();
  };

  const handleClose = () => {
    setDisciplinaSelecionada("");
    setProfessorSelecionado("");
    setPeriodoSelecionado("manha");
    setObservacoes("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md mx-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
          Adicionar Horário
        </h2>

        {/* Informação do slot */}
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>{diasSemanaLabels[diaSemana]}</strong> • {horaInicio} - {horaFim}
          </p>
        </div>

        <div className="space-y-4">
          {/* Disciplina */}
          <div>
            <Label>
              Disciplina <span className="text-error-500">*</span>
            </Label>
            <select
              value={disciplinaSelecionada}
              onChange={(e) => setDisciplinaSelecionada(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
            >
              <option value="">Selecione uma disciplina</option>
              {disciplinas.map((disciplina) => (
                <option key={disciplina._id} value={disciplina._id}>
                  {disciplina.nome} ({disciplina.codigo})
                </option>
              ))}
            </select>
          </div>

          {/* Professor */}
          <div>
            <Label>
              Professor <span className="text-error-500">*</span>
            </Label>
            <select
              value={professorSelecionado}
              onChange={(e) => setProfessorSelecionado(e.target.value)}
              disabled={!disciplinaSelecionada}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
            >
              <option value="">
                {disciplinaSelecionada
                  ? professoresFiltrados.length > 0
                    ? "Selecione um professor"
                    : "Nenhum professor para esta disciplina"
                  : "Selecione uma disciplina primeiro"}
              </option>
              {professoresFiltrados.map((professor) => (
                <option key={professor._id} value={professor._id}>
                  {professor.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Período */}
          <div>
            <Label>
              Período <span className="text-error-500">*</span>
            </Label>
            <select
              value={periodoSelecionado}
              onChange={(e) => setPeriodoSelecionado(e.target.value as Periodo)}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
            >
              <option value="manha">Manhã</option>
              <option value="tarde">Tarde</option>
              <option value="noite">Noite</option>
            </select>
          </div>

          {/* Observações */}
          <div>
            <Label>Observações (opcional)</Label>
            <input
              type="text"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Sala 101, Laboratório, etc."
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => handleSubmit()}
            disabled={!disciplinaSelecionada || !professorSelecionado}
          >
            Adicionar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddHorarioModal;
