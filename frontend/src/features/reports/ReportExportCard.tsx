import { useMutation } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { DownloadIcon, FileTextIcon } from '../../components/icons'
import { currentMonthStart } from '../../lib/date'
import { downloadMonthlyReport } from './api'

const monthLabelFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })

export function ReportExportCard() {
  const month = currentMonthStart()
  const monthLabel = monthLabelFormatter.format(new Date(`${month}T00:00:00`))

  const mutation = useMutation({ mutationFn: () => downloadMonthlyReport(month) })

  return (
    <Card>
      <CardHeader
        icon={<FileTextIcon />}
        title="Relatório mensal"
        description="Resumo, gastos por categoria e todas as transações do mês em PDF"
      />
      <CardBody className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Baixar relatório de <span className="font-medium text-slate-700 dark:text-slate-300">{monthLabel}</span>
        </p>
        <Button type="button" variant="secondary" loading={mutation.isPending} onClick={() => mutation.mutate()}>
          <DownloadIcon className="h-4 w-4" /> Baixar PDF
        </Button>
        {mutation.isError && (
          <p className="w-full text-sm text-red-600 dark:text-red-400">Não foi possível gerar o relatório. Tente novamente.</p>
        )}
      </CardBody>
    </Card>
  )
}
