import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Grade Horária | Página em branco",
  description: "Estrutura básica para novas páginas do Grade Horária.",
};

export default function BlankPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Página em branco" />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full max-w-[630px] text-center">
          <h3 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
            Título do cartão
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
            Utilize este espaço para montar novos conteúdos, combinando grids ou
            painéis conforme necessário dentro do Grade Horária.
          </p>
        </div>
      </div>
    </div>
  );
}
