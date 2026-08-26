export type CurrencyCode = 'BRL' | 'USD' | 'EUR' | 'GBP'

export const SUPPORTED_CURRENCIES: CurrencyCode[] = ['BRL', 'USD', 'EUR', 'GBP']

const CURRENCY_LOCALES: Record<CurrencyCode, string> = {
  BRL: 'pt-BR',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
}

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  BRL: 'Real brasileiro',
  USD: 'Dólar americano',
  EUR: 'Euro',
  GBP: 'Libra esterlina',
}

function localeFor(currency: CurrencyCode) {
  return CURRENCY_LOCALES[currency] ?? CURRENCY_LOCALES.BRL
}

export function formatCurrency(value: number, currency: CurrencyCode = 'BRL'): string {
  return new Intl.NumberFormat(localeFor(currency), { style: 'currency', currency }).format(value)
}

export function currencySymbol(currency: CurrencyCode = 'BRL'): string {
  const parts = new Intl.NumberFormat(localeFor(currency), { style: 'currency', currency }).formatToParts(0)
  return parts.find((part) => part.type === 'currency')?.value ?? currency
}

/** Formats a digit-only string (cents) as a locale-appropriate decimal, no currency symbol. */
export function formatCentsAsDecimal(digits: string, currency: CurrencyCode = 'BRL'): string {
  const cents = digits === '' ? 0 : parseInt(digits, 10)
  return (cents / 100).toLocaleString(localeFor(currency), { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
