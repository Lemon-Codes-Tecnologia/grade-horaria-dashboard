import BarChartOne from "@/components/charts/bar/BarChartOne";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Grade Horária | Gráfico de barras",
  description: "Demonstração de gráficos de barras do Grade Horária.",
};

export default function page() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Gráfico de barras" />
      <div className="space-y-6">
        <ComponentCard title="Gráfico de barras">
          <BarChartOne />
        </ComponentCard>
      </div>
    </div>
  );
}
