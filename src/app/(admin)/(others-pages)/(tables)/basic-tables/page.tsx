import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import BasicTableOne from "@/components/tables/BasicTableOne";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Grade Horária | Tabelas básicas",
  description: "Exemplos de tabelas utilizadas no Grade Horária.",
  // other metadata
};

export default function BasicTables() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Tabelas básicas" />
      <div className="space-y-6">
        <ComponentCard title="Tabela simples">
          <BasicTableOne />
        </ComponentCard>
      </div>
    </div>
  );
}
