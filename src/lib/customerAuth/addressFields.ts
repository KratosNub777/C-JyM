export const departments = [
  'Asunción',
  'Central',
  'Alto Paraná',
  'Itapúa',
  'Caaguazú',
  'San Pedro',
  'Cordillera',
  'Guairá',
  'Caazapá',
  'Misiones',
  'Paraguarí',
  'Ñeembucú',
  'Amambay',
  'Canindeyú',
  'Presidente Hayes',
  'Concepción',
  'Alto Paraguay',
  'Boquerón',
] as const

export type AddressInput = {
  fullName: string
  phone: string
  department: (typeof departments)[number]
  city: string
  addressLine: string
  isDefault: boolean
}

export type AddressResult = { success: true } | { success: false; error: string }

// Both HTML controls and the server enforce limits; never accept ownership from a form.
export function parseAddress(form: FormData): AddressInput | null {
  const text = (key: string, max: number) => {
    const value = form.get(key)
    return typeof value === 'string' && value.trim().length <= max ? value.trim() : ''
  }
  const fullName = text('fullName', 120)
  const phone = text('phone', 30)
  const department = text('department', 40) as AddressInput['department']
  const city = text('city', 100)
  const addressLine = text('addressLine', 500)
  if (
    !fullName ||
    !city ||
    !addressLine ||
    !departments.includes(department) ||
    !/^[+\d][\d\s().-]{5,29}$/.test(phone)
  )
    return null
  return {
    fullName,
    phone,
    department,
    city,
    addressLine,
    isDefault: form.get('isDefault') === 'on',
  }
}
