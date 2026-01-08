import Link from "next/link";
import { ChevronLeftIcon } from "@/icons";

export default function TermosDeUsoPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl px-6 py-12 mx-auto">
        {/* Back button */}
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 mb-8 text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Voltar para cadastro
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Termos de Uso
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Última atualização: {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              1. Aceitação dos Termos
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Ao acessar e usar a plataforma Grade Horária, você concorda em
              cumprir e estar vinculado aos seguintes termos e condições de uso.
              Se você não concordar com qualquer parte destes termos, não deverá
              usar nossos serviços.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              2. Descrição do Serviço
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              O Grade Horária é uma plataforma online que oferece ferramentas
              para criação e gerenciamento de grades horárias escolares. Nosso
              objetivo é facilitar o planejamento e organização de horários de
              forma inteligente e eficiente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              3. Cadastro e Conta de Usuário
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Para utilizar determinadas funcionalidades da plataforma, você
              precisará criar uma conta. Você concorda em:
            </p>
            <ul className="pl-6 mb-4 space-y-2 text-gray-700 list-disc dark:text-gray-300">
              <li>
                Fornecer informações verdadeiras, precisas, atuais e completas
                sobre você
              </li>
              <li>
                Manter e atualizar prontamente suas informações de cadastro
              </li>
              <li>
                Manter a segurança de sua senha e identificação
              </li>
              <li>
                Notificar-nos imediatamente sobre qualquer uso não autorizado de
                sua conta
              </li>
              <li>
                Ser responsável por todas as atividades que ocorrem sob sua conta
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              4. Uso Aceitável
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Você concorda em usar a plataforma apenas para fins legais e de
              acordo com estes Termos. Você NÃO deve:
            </p>
            <ul className="pl-6 mb-4 space-y-2 text-gray-700 list-disc dark:text-gray-300">
              <li>
                Usar o serviço de forma que viole qualquer lei ou regulamento
                aplicável
              </li>
              <li>
                Tentar obter acesso não autorizado a qualquer parte da plataforma
              </li>
              <li>
                Interferir ou interromper a integridade ou desempenho da
                plataforma
              </li>
              <li>
                Transmitir qualquer material que contenha vírus ou códigos
                maliciosos
              </li>
              <li>
                Usar a plataforma para fins comerciais sem nossa autorização
                prévia
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              5. Propriedade Intelectual
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Todo o conteúdo, características e funcionalidades da plataforma
              Grade Horária são de propriedade exclusiva da empresa e são
              protegidos por leis de direitos autorais, marcas registradas e
              outras leis de propriedade intelectual.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              6. Limitação de Responsabilidade
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              A plataforma é fornecida "como está" e "conforme disponível". Não
              garantimos que o serviço será ininterrupto, livre de erros ou
              seguro. Em nenhuma circunstância seremos responsáveis por quaisquer
              danos diretos, indiretos, incidentais ou consequentes resultantes
              do uso ou incapacidade de usar nossos serviços.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              7. Modificações dos Termos
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Reservamos o direito de modificar estes termos a qualquer momento.
              Notificaremos os usuários sobre mudanças significativas. O uso
              continuado da plataforma após tais modificações constitui sua
              aceitação dos novos termos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              8. Rescisão
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Podemos encerrar ou suspender sua conta e acesso à plataforma
              imediatamente, sem aviso prévio ou responsabilidade, por qualquer
              motivo, incluindo, sem limitação, se você violar os Termos de Uso.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              9. Contato
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Se você tiver alguma dúvida sobre estes Termos de Uso, entre em
              contato conosco através do e-mail:{" "}
              <a
                href="mailto:contato@gradehoraria.com.br"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                contato@gradehoraria.com.br
              </a>
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-8 mt-12 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-center text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Grade Horária. Todos os direitos
            reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
