import { ApiError } from '../../lib/apiClient'
import { useAuthStore } from '../../stores/authStore'

export async function downloadMonthlyReport(month: string) {
  const token = useAuthStore.getState().accessToken
  const response = await fetch(`/api/v1/reports/monthly?month=${month}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText)
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `relatorio-${month.slice(0, 7)}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
