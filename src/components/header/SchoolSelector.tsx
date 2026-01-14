"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSchool } from "@/context/SchoolContext";
import { toast } from "sonner";
import Link from "next/link";

export default function SchoolSelector() {
  const router = useRouter();
  const { selectedSchool, schools, isLoadingSchools, setSelectedSchool } = useSchool();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Função para trocar de escola
  const handleSchoolChange = (school: typeof selectedSchool) => {
    if (school?._id === selectedSchool?._id) {
      // Se clicar na escola já selecionada, só fecha o dropdown
      setIsOpen(false);
      return;
    }

    setSelectedSchool(school);
    setIsOpen(false);

    if (school) {
      toast.success("Escola alterada", {
        description: `Agora gerenciando: ${school.nome}`,
      });

      // Redireciona para a home
      router.push("/");
    }
  };

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (isLoadingSchools) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-brand-500"></div>
        <span>Carregando...</span>
      </div>
    );
  }

  if (schools.length === 0) {
    return (
      <Link
        href="/planejamento/instituicoes/criar"
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
      >
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
            d="M12 4v16m8-8H4"
          />
        </svg>
        Criar Escola
      </Link>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <svg
          className="h-4 w-4 text-gray-500 dark:text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
        <span className="max-w-[150px] truncate lg:max-w-[200px]">
          {selectedSchool?.nome || "Selecione uma escola"}
        </span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Selecione uma escola
            </p>
          </div>

          <div className="max-h-[300px] overflow-y-auto py-2">
            {schools.map((school) => (
              <button
                key={school._id}
                onClick={() => handleSchoolChange(school)}
                className={`flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                  selectedSchool?._id === school._id
                    ? "bg-brand-50 dark:bg-brand-500/10"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <div className="flex-shrink-0">
                  {selectedSchool?._id === school._id ? (
                    <svg
                      className="h-5 w-5 text-brand-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      selectedSchool?._id === school._id
                        ? "text-brand-700 dark:text-brand-400"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {school.nome}
                  </p>
                  {school.endereco && (
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {school.endereco.cidade} - {school.endereco.uf}
                    </p>
                  )}
                  {!school.ativa && (
                    <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      Inativa
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-800">
            <Link
              href="/planejamento/instituicoes"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Gerenciar escolas
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
