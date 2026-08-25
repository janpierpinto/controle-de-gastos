const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatBRL(value: number): string {
  return formatter.format(value)
}

/** Formats a digit-only string (cents) as "1.234,56", no "R$" prefix. */
export function formatCentsAsDecimal(digits: string): string {
  const cents = digits === '' ? 0 : parseInt(digits, 10)
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
