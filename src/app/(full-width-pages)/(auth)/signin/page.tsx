import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Grade Horária | Entrar",
  description: "Página de autenticação do sistema Grade Horária.",
};

export default function SignIn() {
  return <SignInForm />;
}
