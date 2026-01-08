import Link from "next/link";
import { ChevronLeftIcon } from "@/icons";

export default function PoliticaDePrivacidadePage() {
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
            Política de Privacidade
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Última atualização: {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              1. Introdução
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              A sua privacidade é importante para nós. Esta Política de
              Privacidade explica como o Grade Horária coleta, usa, compartilha
              e protege suas informações pessoais quando você usa nossa
              plataforma.
            </p>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Ao utilizar nossos serviços, você concorda com a coleta e uso de
              informações de acordo com esta política.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              2. Informações que Coletamos
            </h2>
            <h3 className="mb-3 text-xl font-semibold text-gray-800 dark:text-gray-200">
              2.1 Informações Fornecidas por Você
            </h3>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Coletamos informações que você nos fornece diretamente ao:
            </p>
            <ul className="pl-6 mb-4 space-y-2 text-gray-700 list-disc dark:text-gray-300">
              <li>Criar uma conta (nome, e-mail, senha)</li>
              <li>Preencher formulários na plataforma</li>
              <li>Entrar em contato com nosso suporte</li>
              <li>Participar de pesquisas ou avaliações</li>
            </ul>

            <h3 className="mb-3 text-xl font-semibold text-gray-800 dark:text-gray-200">
              2.2 Informações Coletadas Automaticamente
            </h3>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Quando você usa nossa plataforma, coletamos automaticamente:
            </p>
            <ul className="pl-6 mb-4 space-y-2 text-gray-700 list-disc dark:text-gray-300">
              <li>
                Informações de uso (páginas visitadas, tempo de uso, recursos
                utilizados)
              </li>
              <li>
                Dados do dispositivo (tipo de dispositivo, sistema operacional,
                navegador)
              </li>
              <li>Endereço IP e dados de localização aproximada</li>
              <li>Cookies e tecnologias semelhantes</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              3. Como Usamos Suas Informações
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Utilizamos as informações coletadas para:
            </p>
            <ul className="pl-6 mb-4 space-y-2 text-gray-700 list-disc dark:text-gray-300">
              <li>Fornecer, manter e melhorar nossos serviços</li>
              <li>Criar e gerenciar sua conta de usuário</li>
              <li>Processar suas solicitações e transações</li>
              <li>Enviar comunicações importantes sobre o serviço</li>
              <li>Responder às suas perguntas e fornecer suporte</li>
              <li>Personalizar sua experiência na plataforma</li>
              <li>Realizar análises e estudos sobre o uso da plataforma</li>
              <li>Detectar, prevenir e resolver problemas técnicos</li>
              <li>Proteger contra fraudes e atividades maliciosas</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              4. Compartilhamento de Informações
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Não vendemos suas informações pessoais. Podemos compartilhar suas
              informações apenas nas seguintes situações:
            </p>
            <ul className="pl-6 mb-4 space-y-2 text-gray-700 list-disc dark:text-gray-300">
              <li>
                <strong>Com seu consentimento:</strong> quando você autoriza
                expressamente o compartilhamento
              </li>
              <li>
                <strong>Prestadores de serviços:</strong> com empresas que nos
                ajudam a operar a plataforma (hospedagem, análise de dados, etc.)
              </li>
              <li>
                <strong>Requisitos legais:</strong> quando exigido por lei ou em
                resposta a processos legais
              </li>
              <li>
                <strong>Proteção de direitos:</strong> para proteger nossos
                direitos, privacidade, segurança ou propriedade
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              5. Armazenamento e Segurança de Dados
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Implementamos medidas de segurança técnicas e organizacionais
              apropriadas para proteger suas informações pessoais contra acesso
              não autorizado, alteração, divulgação ou destruição.
            </p>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Seus dados são armazenados em servidores seguros e criptografados.
              Mantemos suas informações pelo tempo necessário para fornecer
              nossos serviços e cumprir nossas obrigações legais.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              6. Seus Direitos e Controles
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os
              seguintes direitos:
            </p>
            <ul className="pl-6 mb-4 space-y-2 text-gray-700 list-disc dark:text-gray-300">
              <li>
                <strong>Acesso:</strong> solicitar acesso às suas informações
                pessoais
              </li>
              <li>
                <strong>Correção:</strong> solicitar a correção de dados
                incorretos ou incompletos
              </li>
              <li>
                <strong>Exclusão:</strong> solicitar a exclusão de suas
                informações pessoais
              </li>
              <li>
                <strong>Portabilidade:</strong> solicitar a transferência de seus
                dados para outro serviço
              </li>
              <li>
                <strong>Revogação:</strong> revogar seu consentimento a qualquer
                momento
              </li>
              <li>
                <strong>Oposição:</strong> opor-se ao processamento de seus dados
                em determinadas situações
              </li>
            </ul>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Para exercer qualquer um destes direitos, entre em contato conosco
              através do e-mail:{" "}
              <a
                href="mailto:privacidade@gradehoraria.com.br"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                privacidade@gradehoraria.com.br
              </a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              7. Cookies e Tecnologias Semelhantes
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Utilizamos cookies e tecnologias semelhantes para melhorar sua
              experiência, analisar o uso da plataforma e personalizar conteúdo.
              Você pode controlar o uso de cookies através das configurações do
              seu navegador.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              8. Privacidade de Menores
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Nossos serviços não são direcionados a menores de 18 anos. Não
              coletamos intencionalmente informações pessoais de menores. Se
              você acredita que coletamos informações de um menor, entre em
              contato conosco imediatamente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              9. Alterações nesta Política
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Podemos atualizar esta Política de Privacidade periodicamente.
              Notificaremos você sobre mudanças significativas através de um
              aviso em nossa plataforma ou por e-mail. Recomendamos que você
              revise esta política regularmente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              10. Contato
            </h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Se você tiver dúvidas sobre esta Política de Privacidade ou sobre
              como tratamos suas informações pessoais, entre em contato conosco:
            </p>
            <ul className="pl-6 mb-4 space-y-2 text-gray-700 list-disc dark:text-gray-300">
              <li>
                <strong>E-mail:</strong>{" "}
                <a
                  href="mailto:privacidade@gradehoraria.com.br"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  privacidade@gradehoraria.com.br
                </a>
              </li>
              <li>
                <strong>Encarregado de Dados (DPO):</strong>{" "}
                <a
                  href="mailto:dpo@gradehoraria.com.br"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  dpo@gradehoraria.com.br
                </a>
              </li>
            </ul>
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
