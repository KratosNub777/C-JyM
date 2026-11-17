import type { Metadata } from 'next'
import {
  Clock,
  EnvelopeSimple,
  InstagramLogo,
  MapPin,
  WhatsappLogo,
} from '@phosphor-icons/react/dist/ssr'

import {
  BUSINESS_ADDRESS,
  BUSINESS_EMAIL,
  BUSINESS_HOURS,
  BUSINESS_PHONE,
  INSTAGRAM_URL,
  MAPS_URL,
} from '@/lib/contact'
import { whatsappUrl } from '@/lib/whatsapp'

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'WhatsApp, email, dirección y horario de Comercial José María en San Lorenzo.',
}

const channels = [
  {
    icon: WhatsappLogo,
    label: 'WhatsApp',
    value: BUSINESS_PHONE,
    note: 'Pedidos, precios, stock y consultas. Es la forma más rápida de comunicarte.',
    href: whatsappUrl('Hola, quiero hacer una consulta.'),
    external: true,
  },
  {
    icon: EnvelopeSimple,
    label: 'Email',
    value: BUSINESS_EMAIL,
    note: 'Para consultas que no son urgentes o si necesitás enviar documentos.',
    href: `mailto:${BUSINESS_EMAIL}`,
    external: false,
  },
  {
    icon: MapPin,
    label: 'Dirección',
    value: BUSINESS_ADDRESS,
    note: 'Abrir en Google Maps.',
    href: MAPS_URL,
    external: true,
  },
  {
    icon: InstagramLogo,
    label: 'Instagram',
    value: '@jmcomercialpy',
    note: 'Novedades, ofertas y lanzamientos.',
    href: INSTAGRAM_URL,
    external: true,
  },
]

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
        Contacto
      </h1>
      <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-300">
        Escribinos o visitanos en el local. Te ayudamos a elegir y coordinamos el pago y el retiro.
      </p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {channels.map(({ icon: Icon, label, value, note, href, external }) => (
          <li key={label}>
            <a
              href={href}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="flex h-full items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-5 transition-colors hover:border-brand-600 dark:border-neutral-800 dark:bg-neutral-900/40"
            >
              <Icon size={26} weight="regular" className="mt-0.5 shrink-0 text-brand-600" />
              <span className="min-w-0">
                <span className="block text-sm text-neutral-500 dark:text-neutral-400">{label}</span>
                <span className="block break-words font-semibold text-neutral-900 dark:text-neutral-100">
                  {value}
                </span>
                <span className="mt-1 block text-sm text-neutral-600 dark:text-neutral-300">
                  {note}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-start gap-4 rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800">
        <Clock size={26} weight="regular" className="mt-0.5 shrink-0 text-brand-600" />
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Horario de atención</p>
          <p className="font-semibold text-neutral-900 dark:text-neutral-100">{BUSINESS_HOURS}</p>
        </div>
      </div>
    </div>
  )
}
