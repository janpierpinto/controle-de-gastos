import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { labelClass } from '../../components/ui/formStyles'
import { DownloadIcon, FileTextIcon } from '../../components/icons'
import { currentMonthStart } from '../../lib/date'
import { downloadAnnualReport, downloadMonthlyReport } from './api'
import { MonthPicker } from './MonthPicker'
import { YearPicker } from './YearPicker'

const currentMonthValue = currentMonthStart().slice(0, 7)
const currentYear = new Date().getFullYear()

export function ReportExportCard() {
  const [month, setMonth] = useState(currentMonthValue)
  const [year, setYear] = useState(currentYear)

  const monthlyMutation = useMutation({ mutationFn: () => downloadMonthlyReport(`${month}-01`) })
  const annualMutation = useMutation({ mutationFn: () => downloadAnnualReport(year) })

  return (
    <Card>
      <CardHeader
        icon={<FileTextIcon />}
        title="Relatórios"
        description="Resumo, comparação com o mês anterior, orçamentos, categorias e transações — baixe de qualquer mês ou ano"
      />
      <CardBody className="space-y-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-48">
            <label htmlFor="report-month" className={labelClass}>
              Relatório mensal
            </label>
            <div className="mt-1.5">
              <MonthPicker id="report-month" value={month} onChange={setMonth} maxMonth={currentMonthValue} />
            </div>
          </div>
          <Button type="button" variant="secondary" loading={monthlyMutation.isPending} onClick={() => monthlyMutation.mutate()}>
            <DownloadIcon className="h-4 w-4" /> Baixar mês
          </Button>
        </div>

        <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-32">
              <label htmlFor="report-year" className={labelClass}>
                Relatório anual
              </label>
              <div className="mt-1.5">
                <YearPicker id="report-year" value={year} onChange={setYear} maxYear={currentYear} />
              </div>
            </div>
            <Button type="button" variant="secondary" loading={annualMutation.isPending} onClick={() => annualMutation.mutate()}>
              <DownloadIcon className="h-4 w-4" /> Baixar ano
            </Button>
          </div>
        </div>

        {(monthlyMutation.isError || annualMutation.isError) && (
          <p className="text-sm text-red-600 dark:text-red-400">Não foi possível gerar o relatório. Tente novamente.</p>
        )}
      </CardBody>
    </Card>
  )
}
