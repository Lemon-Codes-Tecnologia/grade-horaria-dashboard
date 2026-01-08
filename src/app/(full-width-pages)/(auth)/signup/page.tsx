import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Grade Horária | Criar conta",
  description: "Página de cadastro de novos usuários do Grade Horária.",
  // other metadata
};

export default function SignUp() {
  return <SignUpForm />;
}
