"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { createStripePortalSession, syncStripeAssinatura } from "@/lib/api/pagamentos";
import { toast } from "sonner";

export default function AssinaturaSucessoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const hasSyncedRef = useRef(false);

  const sessionId = useMemo(
    () => searchParams.get("session_id") || "",
    [searchParams]
  );
  const isCanceled = useMemo(
    () => Boolean(searchParams.get("canceled")),
    [searchParams]
  );
  const isSuccess = useMemo(
    () => Boolean(searchParams.get("success")) || Boolean(sessionId),
    [searchParams, sessionId]
  );
  const assinaturaId = useMemo(
    () =>
      searchParams.get("assinatura_id") ||
      (typeof window !== "undefined"
        ? sessionStorage.getItem("stripe_assinatura_id")
        : ""),
    [searchParams]
  );

  useEffect(() => {
    if (!isSuccess && !isCanceled) {
      const redirect = window.setTimeout(() => {
        router.push("/financeiro/assinaturas");
      }, 4000);

      return () => window.clearTimeout(redirect);
    }
    return undefined;
  }, [isSuccess, isCanceled, router]);

  useEffect(() => {
    if (!isSuccess || isCanceled || !assinaturaId || hasSyncedRef.current) {
      return;
    }

    hasSyncedRef.current = true;
    syncStripeAssinatura(assinaturaId).catch((error: any) => {
      toast.error("Erro ao sincronizar pagamento", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Não foi possível sincronizar o pagamento.",
      });
    });
  }, [assinaturaId, isCanceled, isSuccess]);

  const handleOpenPortal = async () => {
    if (!sessionId) {
      toast.error("Sessão não encontrada", {
        description: "Não foi possível localizar a sessão do checkout.",
      });
      return;
    }

    setIsOpeningPortal(true);
    try {
      const response = await createStripePortalSession({ session_id: sessionId });
      const payload = response.data || response.payload || response;
      const portalUrl = payload?.portal_url;

      if (!portalUrl) {
        throw new Error("Link do portal não retornado.");
      }

      window.location.href = portalUrl;
    } catch (error: any) {
      toast.error("Erro ao abrir portal", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Não foi possível abrir o portal de cobrança.",
      });
    } finally {
      setIsOpeningPortal(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {isCanceled ? (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300">
              <svg
                className="h-7 w-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v4m0 4h.01M4.93 19h14.14a2 2 0 001.73-3l-7.07-12a2 2 0 00-3.46 0l-7.07 12a2 2 0 001.73 3z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Pagamento cancelado
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Seu checkout foi cancelado. Você pode tentar novamente quando quiser.
            </p>
            <div className="mt-6 flex justify-center">
              <Button onClick={() => router.push("/financeiro/assinaturas")}>
                Voltar para os planos
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300">
              <svg
                className="h-7 w-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Assinatura confirmada!
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Parabéns pela sua assinatura. Obrigado por confiar no Grade Horária!
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button onClick={() => router.push("/")}>Ir para a Home</Button>
              <Button
                onClick={handleOpenPortal}
                disabled={isOpeningPortal}
                className="!bg-gray-100 !text-gray-700 hover:!bg-brand-500 hover:!text-white dark:!bg-gray-800 dark:!text-gray-300 dark:hover:!bg-brand-500 dark:hover:!text-white"
              >
                {isOpeningPortal ? "Abrindo..." : "Gerenciar cobrança"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
