"use client";
import React from "react";
import Button from "@/components/ui/button/Button";

type PlanType = "anual";

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxTurmas?: string;
  features: string[];
  popular?: boolean;
  color: string;
}

const plans: Plan[] = [
  {
    id: "essencial",
    name: "Essencial",
    description: "Ideal para escolas pequenas",
    monthlyPrice: 49.90,
    yearlyPrice: 499,
    color: "gray",
    features: [
      "Até 10 turmas",
      "App para professor",
      "Criação e edição de grades",
      "Exportação da grade em PDF",
      "Cadastro de professores, alunos e responsáveis",
      "Avisos por turma",
      "Mural básico (apenas texto)",
      "2 GB incluídos para armazenamento de arquivos no mural (R$ 99,00/ano por pacote extra de 10 GB " +
      "ou R$ 299/ano por 50 GB, após atingir o limite)",
      "Suporte básico por e-mail com prazo de resposta de até 24h úteis",
    ],
  },
  {
    id: "avancado",
    name: "Avançado",
    description: "Para escolas em crescimento",
    monthlyPrice: 99.90,
    yearlyPrice: 999,
    popular: true,
    color: "brand",
    features: [
      "Até 30 turmas",
      "Tudo do plano Essencial",
      "Troca de aulas completa (solicitação, aprovações e atualização automática)",
      "Mural avançado (pode anexar imagens e PDFs)",
      "20 GB incluídos para armazenamento de arquivos no mural (R$ 99,00/ano por pacote extra de 10 GB" +
      " ou R$ 299/ano por 50 GB, após atingir o limite)",
      // "Diário de classe (presença) – avançado",
      // "Relatórios de presença, carga horária e trocas",
      "Suporte básico por e-mail com prazo de resposta de até 8h úteis",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    description: "Solução completa para grandes escolas",
    monthlyPrice: 199.90,
    yearlyPrice: 1999,
    color: "purple",
    features: [
      "Turmas ilimitadas",
      "App para professor, alunos e pais",
      "Tudo do plano Avançado",
      "100 GB incluídos para armazenamento de arquivos no mural (R$ 99,00/ano por pacote extra de 10 GB" +
      " ou R$ 299/ano por 50 GB, após atingir o limite)",
      "Módulos premium futuros incluídos",
      "Customizações de grades (escolha de tema, cores)",
      "SLA e suporte dedicado e especializado via chat",
    ],
  },
];

export default function AssinaturasPage() {
  const billingPeriod: PlanType = "anual";

  const getColorClasses = (color: string, variant: "bg" | "border" | "text" | "badge") => {
    const colorMap: Record<string, Record<string, string>> = {
      gray: {
        bg: "bg-gray-50 dark:bg-gray-800/50",
        border: "border-gray-200 dark:border-gray-800",
        text: "text-gray-700 dark:text-gray-300",
        badge: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      },
      brand: {
        bg: "bg-brand-50 dark:bg-brand-900/20",
        border: "border-brand-500",
        text: "text-brand-600 dark:text-brand-400",
        badge: "bg-brand-500 text-white",
      },
      purple: {
        bg: "bg-purple-50 dark:bg-purple-900/20",
        border: "border-purple-500 dark:border-purple-600",
        text: "text-purple-600 dark:text-purple-400",
        badge: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
      },
    };
    return colorMap[color]?.[variant] || colorMap.gray[variant];
  };

  const formatPrice = (plan: Plan) => {
    const price = billingPeriod === "anual" ? plan.yearlyPrice : plan.monthlyPrice;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white/90">
          Escolha seu plano
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Selecione o plano ideal para sua escola
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-xl border-2 bg-white p-6 transition-shadow hover:shadow-lg dark:bg-gray-900 ${
              plan.popular
                ? getColorClasses(plan.color, "border")
                : "border-gray-200 dark:border-gray-800"
            } ${plan.popular ? "shadow-md" : ""}`}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className={`rounded-full px-4 py-1 text-xs font-semibold ${getColorClasses(plan.color, "badge")}`}>
                  Mais Popular
                </span>
              </div>
            )}

            {/* Plan Header */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                {plan.name}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {plan.description}
              </p>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(plan)}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  /{billingPeriod === "anual" ? "ano" : "mês"}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {plan.maxTurmas}
              </p>
            </div>

            {/* Features */}
            <ul className="mb-6 space-y-3">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg
                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <Button
              className={`w-full ${
                plan.popular
                  ? ""
                  : "!bg-gray-100 !text-gray-700 hover:!bg-brand-500 hover:!text-white dark:!bg-gray-800 dark:!text-gray-300 dark:hover:!bg-brand-500 dark:hover:!text-white"
              }`}
            >
              {plan.popular ? "Escolher Plano" : "Escolher Plano"}
            </Button>
          </div>
        ))}
      </div>

      {/* Additional Info */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
          Dúvidas frequentes
        </h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300">
              Posso mudar de plano depois?
            </h4>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300">
              Como funciona o período de teste?
            </h4>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Oferecemos 7 dias de teste grátis com todos os recursos liberados com limite de utilização.
              No período de teste apenas uma grade poderá ser criada. Caso exclua a grade não poderá criar uma nova.
              Não é necessário informar cartão de crédito no período de teste.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300">
              Quais formas de pagamento são aceitas?
            </h4>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Aceitamos cartão de crédito e PIX.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      {/*<div className="text-center">*/}
      {/*  <p className="text-sm text-gray-600 dark:text-gray-400">*/}
      {/*    Precisa de um plano personalizado?{" "}*/}
      {/*    <a href="mailto:contato@gradehoraria.com" className="font-medium text-brand-500 hover:text-brand-600">*/}
      {/*      Entre em contato*/}
      {/*    </a>*/}
      {/*  </p>*/}
      {/*</div>*/}
    </div>
  );
}
