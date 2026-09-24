import { CreditCard, Headset, ShieldCheck, Truck } from '@phosphor-icons/react/dist/ssr'

const items = [
  {
    icon: Truck,
    title: 'Envío a domicilio',
    body: 'Te lo llevamos hasta tu casa.',
  },
  {
    icon: ShieldCheck,
    title: 'Garantía de fábrica',
    body: 'En todos nuestros electrodomésticos.',
  },
  {
    icon: CreditCard,
    title: 'Precios claros',
    body: 'En guaraníes, sin sorpresas.',
  },
  {
    icon: Headset,
    title: 'Atención de confianza',
    body: 'La misma de siempre, ahora también online.',
  },
]

export function ValuePropStrip() {
  return (
    <div className="grid grid-cols-1 divide-y divide-neutral-200 rounded-2xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800 lg:grid-cols-4 lg:divide-y-0 lg:divide-x">
      {items.map(({ icon: Icon, title, body }) => (
        <div key={title} className="flex items-start gap-3 px-6 py-6">
          <Icon size={22} weight="regular" className="mt-0.5 shrink-0 text-brand-600" />
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{title}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{body}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
