import ForgotPasswordFlow from "@/components/auth/ForgotPasswordFlow";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Grade Horária | Recuperar Senha",
  description: "Página de recuperação de senha do sistema Grade Horária.",
};

export default function ForgotPassword() {
  return <ForgotPasswordFlow />;
}
