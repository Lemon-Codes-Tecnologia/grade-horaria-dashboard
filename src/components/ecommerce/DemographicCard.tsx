"use client";
import { useState } from "react";
import { MoreDotIcon } from "@/icons";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

export default function DemographicCard() {
  const [isOpen, setIsOpen] = useState(false);
  const disciplinasResumo = [
    { nome: "Matematica", carga: "120h", percentual: 78, cor: "bg-blue-500" },
    { nome: "Portugues", carga: "110h", percentual: 71, cor: "bg-emerald-500" },
    { nome: "Historia", carga: "96h", percentual: 62, cor: "bg-amber-500" },
    { nome: "Fisica", carga: "88h", percentual: 58, cor: "bg-violet-500" },
  ];

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Carga horaria por disciplina
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Top disciplinas com maior carga no semestre
          </p>
        </div>

        <div className="relative inline-block">
          <button onClick={toggleDropdown} className="dropdown-toggle">
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Ver detalhes
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Exportar
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
      <div className="my-6 rounded-2xl border border-gary-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="space-y-5">
          {disciplinasResumo.map((disciplina) => (
            <div key={disciplina.nome} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${disciplina.cor}`} />
                <div>
                  <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                    {disciplina.nome}
                  </p>
                  <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                    {disciplina.carga} no semestre
                  </span>
                </div>
              </div>

              <div className="flex w-full max-w-[140px] items-center gap-3">
                <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
                  <div
                    className={`absolute left-0 top-0 flex h-full items-center justify-center rounded-sm ${disciplina.cor}`}
                    style={{ width: `${disciplina.percentual}%` }}
                  />
                </div>
                <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                  {disciplina.percentual}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
