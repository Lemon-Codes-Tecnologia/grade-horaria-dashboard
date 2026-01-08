import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ResponsiveImage from "@/components/ui/images/ResponsiveImage";
import ThreeColumnImageGrid from "@/components/ui/images/ThreeColumnImageGrid";
import TwoColumnImageGrid from "@/components/ui/images/TwoColumnImageGrid";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Grade Horária | Componentes: Imagens",
  description: "Configurações de apresentação de imagens no Grade Horária.",
  // other metadata
};

export default function Images() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Imagens" />
      <div className="space-y-5 sm:space-y-6">
        <ComponentCard title="Imagem responsiva">
          <ResponsiveImage />
        </ComponentCard>
        <ComponentCard title="Imagens em 2 colunas">
          <TwoColumnImageGrid />
        </ComponentCard>
        <ComponentCard title="Imagens em 3 colunas">
          <ThreeColumnImageGrid />
        </ComponentCard>
      </div>
    </div>
  );
}
