export function formatGs(value: number) {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    maximumFractionDigits: 0,
  }).format(value)
}

const paraguayDateTime = new Intl.DateTimeFormat('es-PY', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Asuncion',
})

// Fecha y hora en horario de Paraguay, sin depender de la zona horaria del servidor.
export function formatDateTimePy(value: string | Date) {
  return paraguayDateTime.format(new Date(value))
}
