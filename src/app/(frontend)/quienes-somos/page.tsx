import type { Metadata } from 'next'
import Link from 'next/link'

import { InfoPage } from '@/components/InfoPage'
import { BUSINESS_ADDRESS } from '@/lib/contact'
import { whatsappUrl } from '@/lib/whatsapp'

export const metadata: Metadata = {
  title: 'Quiénes somos',
  description:
    'Comercial José María: casa de electrodomésticos en San Lorenzo, Paraguay. Heladeras, cocinas, lavarropas, televisores, climatización y más.',
}

export default function AboutPage() {
  return (
    <InfoPage
      title="Quiénes somos"
      intro="Somos Comercial José María, una casa de electrodomésticos de San Lorenzo que acompaña a las familias paraguayas en el día a día de su hogar."
    >
      {/* TODO(owner): sumar la historia de la empresa (año de fundación, sucursales, logros). */}
      <h2>Qué ofrecemos</h2>
      <p>
        Trabajamos con un catálogo amplio de electrodomésticos para toda la casa, de marcas como
        Tokyo, Jam y Philco:
      </p>
      <ul>
        <li>Heladeras y freezers.</li>
        <li>Cocinas y hornos.</li>
        <li>Lavarropas.</li>
        <li>Televisores.</li>
        <li>Climatización: aires acondicionados, ventiladores y calefacción.</li>
        <li>Pequeños electrodomésticos para la cocina, la limpieza y el cuidado personal.</li>
      </ul>

      <h2>Cómo trabajamos</h2>
      <p>
        En este sitio podés ver el catálogo con precios en guaraníes y armar tu pedido. Cuando lo
        tengas listo, nos lo enviás por{' '}
        <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>{' '}
        y te confirmamos el stock, la forma de pago y el retiro. Todos nuestros productos cuentan
        con garantía de fábrica.
      </p>

      <h2>Dónde estamos</h2>
      <p>
        Nos encontrás en {BUSINESS_ADDRESS}. Todos los canales para comunicarte con nosotros están
        en <Link href="/contacto">Contacto</Link>.
      </p>
    </InfoPage>
  )
}
