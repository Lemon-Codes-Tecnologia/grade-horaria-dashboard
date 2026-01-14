"use client";
import React from "react";
import { type Horario } from "@/lib/api/grades-horarias";

interface TurmaSidebarProps {
  horarioSelecionado: Horario | null;
  todosHorarios: Horario[];
}

const TurmaSidebar: React.FC<TurmaSidebarProps> = ({
  horarioSelecionado,
  todosHorarios,
}) => {
  const diasSemanaLabels: Record<string, string> = {
    segunda: "Segunda-feira",
    terca: "Terça-feira",
    quarta: "Quarta-feira",
    quinta: "Quinta-feira",
    sexta: "Sexta-feira",
    sabado: "Sábado",
    domingo: "Domingo",
  };

  // Estado vazio - nenhum horário selecionado
  if (!horarioSelecionado) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white/90 mb-2">
              Selecione um horário
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Clique em um horário da grade para ver os detalhes da aula e informações da turma
            </p>
          </div>
        </div>

        {/* Estatísticas Gerais */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white/90 mb-4">
            Resumo Geral
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total de Aulas</span>
              <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                {todosHorarios.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Disciplinas</span>
              <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                {new Set(todosHorarios.map(h => typeof h.disciplina === 'object' ? h.disciplina._id : h.disciplina)).size}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Professores</span>
              <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                {new Set(todosHorarios.map(h => typeof h.professor === 'object' ? h.professor._id : h.professor)).size}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const disciplina = typeof horarioSelecionado.disciplina === "object" ? horarioSelecionado.disciplina : null;
  const professor = typeof horarioSelecionado.professor === "object" ? horarioSelecionado.professor : null;
  const turma = typeof horarioSelecionado.turma === "object" ? horarioSelecionado.turma : null;

  // Calcular estatísticas da turma
  const horariosDaTurma = todosHorarios.filter(h => {
    const turmaId = typeof h.turma === "object" ? h.turma._id : h.turma;
    const turmaAtualId = typeof horarioSelecionado.turma === "object" ? horarioSelecionado.turma._id : horarioSelecionado.turma;
    return turmaId === turmaAtualId;
  });

  const disciplinasDaTurma = new Set(
    horariosDaTurma.map(h => typeof h.disciplina === 'object' ? h.disciplina._id : h.disciplina)
  );

  const professoresDaTurma = new Set(
    horariosDaTurma.map(h => typeof h.professor === 'object' ? h.professor._id : h.professor)
  );

  return (
    <div className="space-y-6">
      {/* Detalhes da Aula Selecionada */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        {disciplina?.cor && (
          <div className="h-2" style={{ backgroundColor: disciplina.cor }} />
        )}
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white/90 mb-4">
            Detalhes da Aula
          </h3>

          <div className="space-y-4">
            {/* Horário */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Horário
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {diasSemanaLabels[horarioSelecionado.diaSemana]}, {horarioSelecionado.horaInicio} - {horarioSelecionado.horaFim}
              </p>
            </div>

            {/* Disciplina */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Disciplina
              </p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {disciplina?.nome || "Não definida"}
                </p>
                {disciplina?.codigo && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                    {disciplina.codigo}
                  </span>
                )}
              </div>
              {disciplina?.cargaHorariaSemanal && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {disciplina.cargaHorariaSemanal}h semanais
                </p>
              )}
            </div>

            {/* Professor */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Professor
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {professor?.nome || "Não definido"}
              </p>
              {professor?.email && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {professor.email}
                </p>
              )}
            </div>

            {/* Sala */}
            {horarioSelecionado.sala && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Sala
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {horarioSelecionado.sala}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Informações da Turma */}
      {turma && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white/90 mb-4">
            Informações da Turma
          </h3>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Nome
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {turma.nome}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                Código
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {turma.codigo}
              </p>
            </div>

            {turma.serie && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Série
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {turma.serie}
                </p>
              </div>
            )}

            {turma.turno && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Turno
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 capitalize">
                  {turma.turno}
                </p>
              </div>
            )}

            {turma.quantidadeAlunos !== undefined && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Alunos
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {turma.quantidadeAlunos} aluno(s)
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Estatísticas da Turma */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white/90 mb-4">
          Estatísticas da Turma
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total de Aulas</span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90">
              {horariosDaTurma.length}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Disciplinas</span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90">
              {disciplinasDaTurma.size}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Professores</span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90">
              {professoresDaTurma.size}
            </span>
          </div>
        </div>
      </div>

      {/* Mural da Turma (placeholder para futura implementação) */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white/90 mb-4">
          Mural da Turma
        </h3>
        <div className="text-center py-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nenhum aviso ou observação cadastrada
          </p>
        </div>
      </div>
    </div>
  );
};

export default TurmaSidebar;
