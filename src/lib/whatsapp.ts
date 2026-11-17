import { formatGs } from '@/lib/format'

// Número de ventas de Comercial José María (+595 981 339654), formato internacional sin «+».
export const WHATSAPP_NUMBER = '595981339654'

export function whatsappUrl(text?: string) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}

export type WhatsappOrderLine = { name: string; quantity: number; price: number }

// Mensaje del carrito: la venta se cierra por WhatsApp (sin venta en línea).
export function cartOrderText(lines: WhatsappOrderLine[]) {
  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0)
  return [
    'Hola, quiero hacer este pedido:',
    ...lines.map((line) => `- ${line.quantity} × ${line.name}: ${formatGs(line.price * line.quantity)}`),
    `Total: ${formatGs(total)}`,
  ].join('\n')
}

export function productInquiryText(name: string, sku: string | null | undefined, url: string) {
  return `Hola, quiero consultar por ${name}${sku ? ` (COD: ${sku})` : ''}.\n${url}`
}
