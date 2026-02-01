"use client";
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import { listPlanos, type Plano } from "@/lib/api/planos";
import { createStripeCheckoutSession } from "@/lib/api/pagamentos";
import { useAuth } from "@/context/AuthContext";
import { useSchool } from "@/context/SchoolContext";
import { toast } from "sonner";

type PlanType = "anual";

export default function AssinaturasPage() {
  const billingPeriod: PlanType = "anual";
  const [plans, setPlans] = useState<Plano[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittingPlanId, setSubmittingPlanId] = useState<string | null>(null);
  const { user } = useAuth();
  const { selectedSchool } = useSchool();

  const fetchPlans = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await listPlanos();
      const payload = response.payload || response.data || [];
      const activePlans = payload.filter((plan) => plan.isActive);
      setPlans(activePlans);
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message ||
          "Não foi possível carregar os planos no momento."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);


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

  const normalizePriceToNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "").replace(/[^\d,.-]/g, "");
    if (!cleaned) return null;
    const normalized = cleaned.includes(",") && cleaned.includes(".")
      ? cleaned.replace(/\./g, "").replace(",", ".")
      : cleaned.replace(",", ".");
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const formatPriceValue = (value?: string, currency?: string) => {
    if (!value) return "-";
    const numeric = normalizePriceToNumber(value);
    if (numeric === null) return value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency && currency.length === 3 ? currency : "BRL",
    }).format(numeric);
  };

  const getPlanColor = (plan: Plano) => {
    if (plan.type === "premium") return "purple";
    if (plan.type === "avancado") return "brand";
    return "gray";
  };

  const isPopularPlan = (plan: Plano) => {
    return plan.type === "avancado";
  };

  const getYearlyPricing = (plan: Plano) => {
    const promo = plan.promotionalPriceYear?.trim();
    const hasPromo = Boolean(promo);
    return {
      main: hasPromo ? promo : plan.yearlyPrice,
      original: hasPromo ? plan.yearlyPrice : undefined,
      promoText: hasPromo ? plan.promotionalTextYear : undefined,
    };
  };

  const parsePriceValue = (value?: string) => {
    if (!value) return Number.POSITIVE_INFINITY;
    const cleaned = value.replace(/\s/g, "").replace(/[^\d,.-]/g, "");
    if (!cleaned) return Number.POSITIVE_INFINITY;
    const normalized = cleaned.includes(",") && cleaned.includes(".")
      ? cleaned.replace(/\./g, "").replace(",", ".")
      : cleaned.replace(",", ".");
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
  };

  const getSortValue = (plan: Plano) => {
    const promo = plan.promotionalPriceYear?.trim();
    return promo ? parsePriceValue(promo) : parsePriceValue(plan.yearlyPrice);
  };

  const displayPlans = [...plans].sort((a, b) => getSortValue(a) - getSortValue(b));

  const getPlanoId = (plan: Plano) => {
    if (typeof plan._id === "string") return plan._id;
    return plan._id?.$oid || "";
  };

  const resolveStripePriceId = (plan: Plano) => {
    return plan.srtipePriceId || "";
  };

  const handleSubscribe = async (plan: Plano) => {
    if (!user?.email) {
      toast.error("Usuário sem e-mail", {
        description: "Não foi possível identificar o e-mail do pagador.",
      });
      return;
    }

    if (!selectedSchool) {
      toast.error("Nenhuma escola selecionada", {
        description: "Selecione uma escola para continuar.",
      });
      return;
    }

    const stripePriceId = resolveStripePriceId(plan);
    if (!stripePriceId) {
      toast.error("Plano sem preço Stripe", {
        description:
          "Não foi possível identificar o srtipe_price_id para este checkout.",
      });
      return;
    }

    const { endereco } = selectedSchool;
    const missingFields: string[] = [];

    if (!selectedSchool.cnpj) missingFields.push("CNPJ");
    if (!endereco?.cidade) missingFields.push("Cidade");
    if (!endereco?.uf) missingFields.push("UF");

    if (missingFields.length > 0) {
      toast.error("Dados da escola incompletos", {
        description: `Preencha: ${missingFields.join(", ")}.`,
      });
      return;
    }

    const planoId = getPlanoId(plan);
    setSubmittingPlanId(planoId);
    try {
      const response = await createStripeCheckoutSession({
        srtipe_price_id: stripePriceId,
        plan_id: planoId,
        payer_email: user.email,
        dados_escola: {
          email: selectedSchool.contato?.email || user.email,
          cnpj: selectedSchool.cnpj,
          endereco: {
            cep: endereco?.cep,
            logradouro: endereco?.logradouro,
            numero: endereco?.numero,
            bairro: endereco?.bairro,
            cidade: endereco?.cidade,
            uf: endereco?.uf,
          },
        },
        escola_id: selectedSchool._id,
        success_url: `${window.location.origin}/financeiro/assinaturas/sucesso?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/financeiro/assinaturas/sucesso?canceled=true`,
      });

      const payload = response.data || response.payload || response;
      const checkoutUrl =
        payload?.session?.url ||
        payload?.url ||
        payload?.data?.session?.url ||
        payload?.data?.url ||
        payload?.payload?.session?.url ||
        payload?.payload?.url ||
        (payload?.data as any)?.data?.session?.url ||
        (payload?.data as any)?.data?.url;
      const assinaturaId =
        payload?.assinatura_id ||
        payload?.session?.metadata?.assinatura_id ||
        payload?.metadata?.assinatura_id ||
        payload?.data?.assinatura_id ||
        payload?.data?.session?.metadata?.assinatura_id ||
        payload?.payload?.assinatura_id ||
        (payload?.payload as any)?.session?.metadata?.assinatura_id;
      if (!checkoutUrl) {
        console.error("Checkout URL ausente. Payload recebido:", payload);
        throw new Error("Link de checkout não retornado.");
      }

      if (assinaturaId) {
        sessionStorage.setItem("stripe_assinatura_id", assinaturaId);
      }

      window.location.href = checkoutUrl;
    } catch (error: any) {
      toast.error("Erro ao iniciar assinatura", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Não foi possível iniciar a assinatura.",
      });
    } finally {
      setSubmittingPlanId(null);
    }
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
        {isLoading && (
          <div className="col-span-full text-center text-sm text-gray-500 dark:text-gray-400">
            Carregando planos...
          </div>
        )}
        {!isLoading && errorMessage && (
          <div className="col-span-full text-center text-sm text-red-600 dark:text-red-400">
            {errorMessage}
          </div>
        )}
        {!isLoading && !errorMessage && displayPlans.length === 0 && (
          <div className="col-span-full text-center text-sm text-gray-500 dark:text-gray-400">
            Nenhum plano ativo encontrado.
          </div>
        )}
        {!isLoading && !errorMessage && displayPlans.map((plan) => {
          const color = getPlanColor(plan);
          const popular = isPopularPlan(plan);
          const pricing = getYearlyPricing(plan);
          const planoId = getPlanoId(plan);

          return (
            <div
              key={planoId}
              className={`relative flex h-full flex-col rounded-xl border-2 bg-white p-6 transition-shadow hover:shadow-lg dark:bg-gray-900 ${
                popular
                  ? getColorClasses(color, "border")
                  : "border-gray-200 dark:border-gray-800"
              } ${popular ? "shadow-md" : ""}`}
            >
              {/* Popular Badge */}
              {popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className={`rounded-full px-4 py-1 text-xs font-semibold ${getColorClasses(color, "badge")}`}>
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
                    {formatPriceValue(pricing.main, plan.currency)}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    /{billingPeriod === "anual" ? "ano" : "mês"}
                  </span>
                </div>
                {pricing.original && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    De{" "}
                    <span className="line-through">
                      {formatPriceValue(pricing.original, plan.currency)}
                    </span>
                  </p>
                )}
                {pricing.promoText && (
                  <p className="mt-1 text-sm font-medium text-brand-600 dark:text-brand-400">
                    {pricing.promoText}
                  </p>
                )}
                <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {plan.subcardText}
                </p>
              </div>

              {/* Features */}
              <ul className="mb-6 flex-1 space-y-3">
                {plan.features?.map((feature, index) => (
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
                onClick={() => handleSubscribe(plan)}
                disabled={submittingPlanId === planoId}
                className={`w-full ${
                  popular
                    ? ""
                    : "!bg-gray-100 !text-gray-700 hover:!bg-brand-500 hover:!text-white dark:!bg-gray-800 dark:!text-gray-300 dark:hover:!bg-brand-500 dark:hover:!text-white"
                }`}
              >
                {submittingPlanId === planoId ? "Processando..." : `Assinar Plano ${plan.name}`}
              </Button>
            </div>
          );
        })}
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
