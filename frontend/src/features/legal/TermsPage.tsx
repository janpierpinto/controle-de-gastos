import { Link } from 'react-router-dom'

export function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      <Link to="/" className="text-sm underline">
        ← Voltar
      </Link>
      <h1 className="text-2xl font-semibold">Termos de Uso</h1>
      <p className="text-sm text-slate-500">Versão 1.0</p>

      <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
        <p>Ao criar uma conta, você concorda com estes termos e com a nossa Política de Privacidade.</p>

        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">O serviço</h2>
        <p>
          O Controle de Gastos é uma ferramenta de organização financeira pessoal e familiar. Não somos uma
          instituição financeira e não realizamos transações bancárias em seu nome.
        </p>

        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Sua conta</h2>
        <p>
          Você é responsável por manter sua senha em sigilo e pelas informações que registra. Quem cria a conta é o
          responsável (OWNER) da família e pode convidar outros membros com papéis distintos.
        </p>

        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Uso adequado</h2>
        <p>O serviço deve ser usado apenas para fins lícitos de gestão financeira pessoal ou familiar.</p>

        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Alterações</h2>
        <p>
          Podemos atualizar estes termos. Mudanças relevantes exigirão um novo aceite antes de continuar usando
          funcionalidades sensíveis.
        </p>
      </div>
    </div>
  )
}
