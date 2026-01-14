"use client";
import React, { useState } from "react";
import Button from "@/components/ui/button/Button";

type PlanType = "mensal" | "anual";

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxTurmas: string;
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
    maxTurmas: "até 10 turmas",
    color: "gray",
    features: [
      "Até 10 turmas",
      "Criação e edição de grades",
      "Cadastro de professores, alunos e responsáveis",
      "Avisos por turma",
      "Mural básico (texto e imagens)",
      "Notificações básicas",
      "App para professores, alunos e responsáveis",
      "Diário de classe (presença) – básico",
      "Suporte básico",
    ],
  },
  {
    id: "avancado",
    name: "Avançado",
    description: "Para escolas em crescimento",
    monthlyPrice: 99.90,
    yearlyPrice: 999,
    maxTurmas: "até 30 turmas",
    popular: true,
    color: "brand",
    features: [
      "Até 30 turmas",
      "Tudo do plano Essencial",
      "Troca de aulas completa (solicitação, aprovações e atualização automática)",
      "Mural avançado (documentos, PDFs, vídeos e notas)",
      "Biblioteca de arquivos",
      "Notificações personalizadas",
      "Exportação da grade em PDF",
      "Integração com Google e Apple Calendar",
      "Diário de classe (presença) – avançado",
      "Relatórios de presença, carga horária e trocas",
      "Suporte prioritário",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    description: "Solução completa para grandes escolas",
    monthlyPrice: 199.90,
    yearlyPrice: 1999,
    maxTurmas: "acima de 50 turmas (ilimitado)",
    color: "purple",
    features: [
      "Acima de 50 turmas (ilimitado)",
      "Tudo do plano Avançado",
      "Histórico completo e ilimitado",
      "Mais espaço para arquivos",
      "Módulos premium futuros incluídos",
      "Customizações leves por escola",
      "SLA e suporte dedicado",
    ],
  },
];

export default function AssinaturasPage() {
  const [billingPeriod, setBillingPeriod] = useState<PlanType>("anual");

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

  const getEconomyText = (plan: Plan) => {
    if (billingPeriod === "anual") {
      const monthlyTotal = plan.monthlyPrice * 12;
      const savings = monthlyTotal - plan.yearlyPrice;
      const percentage = Math.round((savings / monthlyTotal) * 100);
      return `Economize ${percentage}%`;
    }
    return null;
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

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900">
          <button
            onClick={() => setBillingPeriod("mensal")}
            className={`rounded-md px-6 py-2 text-sm font-medium transition-colors ${
              billingPeriod === "mensal"
                ? "bg-brand-500 text-white"
                : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingPeriod("anual")}
            className={`rounded-md px-6 py-2 text-sm font-medium transition-colors ${
              billingPeriod === "anual"
                ? "bg-brand-500 text-white"
                : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Anual
            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
              Economize até 17%
            </span>
          </button>
        </div>
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
              {billingPeriod === "anual" && getEconomyText(plan) && (
                <p className="mt-1 text-sm font-medium text-green-600 dark:text-green-400">
                  {getEconomyText(plan)}
                </p>
              )}
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
                  : "!bg-gray-100 !text-gray-700 hover:!bg-gray-200 dark:!bg-gray-800 dark:!text-gray-300 dark:hover:!bg-gray-700"
              }`}
              variant={plan.popular ? "default" : "outline"}
            >
              {plan.popular ? "Escolher Plano" : "Começar Agora"}
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
              Oferecemos 14 dias de teste grátis em todos os planos. Não é necessário cartão de crédito.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300">
              Quais formas de pagamento são aceitas?
            </h4>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Aceitamos cartão de crédito, boleto bancário e PIX.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Precisa de um plano personalizado?{" "}
          <a href="mailto:contato@gradehoraria.com" className="font-medium text-brand-500 hover:text-brand-600">
            Entre em contato
          </a>
        </p>
      </div>
    </div>
  );
}
