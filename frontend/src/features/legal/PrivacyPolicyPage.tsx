import { Link } from 'react-router-dom'

export function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      <Link to="/" className="text-sm underline">
        ← Voltar
      </Link>
      <h1 className="text-2xl font-semibold">Política de Privacidade</h1>
      <p className="text-sm text-slate-500">Versão 1.0</p>

      <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
        <p>
          Tratamos seus dados financeiros com a mesma seriedade que você trata suas finanças. Esta política resume o
          que coletamos, por quê, e quais direitos você tem sob a LGPD.
        </p>

        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">O que coletamos</h2>
        <p>
          Dados de cadastro (nome, e-mail, senha criptografada) e os dados financeiros que você registra
          manualmente — transações, categorias, orçamentos, cartões e contas a pagar. Quando a integração com Open
          Finance estiver disponível, também trataremos dados de transações bancárias, sempre mediante seu
          consentimento explícito antes de conectar qualquer conta.
        </p>

        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Por que coletamos</h2>
        <p>Para oferecer o controle de gastos em si: dashboards, alertas de orçamento e, futuramente, insights personalizados.</p>

        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Seus direitos</h2>
        <p>
          Você pode acessar todos os seus dados e solicitar a exclusão da sua conta a qualquer momento em{' '}
          <Link to="/meus-dados" className="underline">
            Meus dados
          </Link>
          . Dados de transações compartilhadas com outros membros da família podem ser mantidos de forma anonimizada
          quando a exclusão completa afetaria o histórico financeiro de outras pessoas da família.
        </p>

        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Segurança</h2>
        <p>
          Senhas são armazenadas com hash (BCrypt), a comunicação é sempre criptografada (TLS) e o isolamento entre
          famílias é reforçado no próprio banco de dados (Row-Level Security), não apenas na aplicação.
        </p>

        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Contato</h2>
        <p>Dúvidas sobre seus dados: contato@controledegastos.local.</p>
      </div>
    </div>
  )
}
