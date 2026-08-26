import { ApiError, redirectToLogin } from '../../lib/apiClient'
import { useAuthStore } from '../../stores/authStore'

async function downloadPdf(path: string, filename: string) {
  const token = useAuthStore.getState().accessToken
  const response = await fetch(`/api/v1${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!response.ok) {
    if (response.status === 401) redirectToLogin()
    throw new ApiError(response.status, response.statusText)
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function downloadMonthlyReport(month: string) {
  return downloadPdf(`/reports/monthly?month=${month}`, `relatorio-${month.slice(0, 7)}.pdf`)
}

export function downloadAnnualReport(year: number) {
  return downloadPdf(`/reports/annual?year=${year}`, `relatorio-${year}.pdf`)
}
