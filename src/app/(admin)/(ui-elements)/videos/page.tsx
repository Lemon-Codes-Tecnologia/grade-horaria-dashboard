import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import VideosExample from "@/components/ui/video/VideosExample";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Grade Horária | Componentes: Vídeos",
  description: "Demonstrações de incorporação de vídeos no Grade Horária.",
};

export default function VideoPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Vídeos" />

      <VideosExample />
    </div>
  );
}
