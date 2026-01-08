import LineChartOne from "@/components/charts/line/LineChartOne";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Grade Horária | Gráfico de linhas",
  description: "Demonstração de gráficos de linha utilizados no Grade Horária.",
};
export default function LineChart() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Gráfico de linhas" />
      <div className="space-y-6">
        <ComponentCard title="Gráfico de linhas">
          <LineChartOne />
        </ComponentCard>
      </div>
    </div>
  );
}
