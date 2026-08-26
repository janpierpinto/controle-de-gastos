import { useQuery } from '@tanstack/react-query'
import type { CurrencyCode } from '../../lib/currency'
import { getTenantSettings } from './api'

/** Cached tenant-wide currency preference — every amount in the app reads from this instead of hardcoding BRL. */
export function useCurrency(): CurrencyCode {
  const { data } = useQuery({ queryKey: ['tenant-settings'], queryFn: getTenantSettings })
  return (data?.currency as CurrencyCode | undefined) ?? 'BRL'
}
