import React from "react";
import Link from "next/link";

export default function SidebarWidget() {
  return (
    <div
      className={`
        mx-auto mb-10 w-full max-w-60 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 px-4 py-5 text-center shadow-lg`}
    >
      <div className="mb-3 flex justify-center">
        <svg
          className="h-12 w-12 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      </div>
      <h3 className="mb-2 font-semibold text-white">
        Desbloqueie mais recursos
      </h3>
      <p className="mb-4 text-white/90 text-theme-sm">
        A partir de R$ 499/ano. Geração automática, otimização inteligente e muito mais.
      </p>
      <Link
        href="/financeiro/assinaturas"
        className="flex items-center justify-center p-3 font-medium text-brand-600 bg-white rounded-lg text-theme-sm hover:bg-gray-50 transition-colors"
      >
        Fazer Upgrade
      </Link>
    </div>
  );
}
