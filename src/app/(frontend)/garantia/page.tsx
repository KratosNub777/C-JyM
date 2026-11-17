import type { Metadata } from 'next'

import { InfoPage } from '@/components/InfoPage'
import { BUSINESS_ADDRESS, BUSINESS_EMAIL } from '@/lib/contact'
import { whatsappUrl } from '@/lib/whatsapp'

export const metadata: Metadata = {
  title: 'Garantía y devoluciones',
  description: 'Cómo funciona la garantía de fábrica y cómo pedir un cambio en Comercial José María.',
}

export default function WarrantyPage() {
  return (
    <InfoPage
      title="Garantía y devoluciones"
      intro="Todos los productos que vendemos son nuevos y tienen garantía de fábrica."
      updated="noviembre de 2026"
    >
      {/* TODO(owner): confirmar con la empresa plazos y condiciones propias de cambio. */}
      <h2>Garantía de fábrica</h2>
      <p>
        Cada producto tiene la garantía que otorga su fabricante o representante. El plazo y las
        condiciones figuran en el certificado o el manual que acompaña al producto, y empiezan a
        contar desde la fecha de la factura de compra.
      </p>
      <p>La garantía cubre fallas de fabricación. Por lo general no cubre:</p>
      <ul>
        <li>Golpes, caídas, humedad o daños causados por un uso distinto al indicado en el manual.</li>
        <li>Problemas de la instalación eléctrica, como subidas o cortes de tensión.</li>
        <li>Reparaciones o modificaciones hechas por personas no autorizadas.</li>
        <li>El desgaste normal de las piezas por el uso.</li>
      </ul>

      <h2>Cómo hacer un reclamo</h2>
      <ul>
        <li>Guardá la factura de compra y, si podés, la caja y el certificado de garantía.</li>
        <li>
          Escribinos por{' '}
          <a href={whatsappUrl('Hola, necesito hacer un reclamo de garantía.')} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>{' '}
          o a <a href={`mailto:${BUSINESS_EMAIL}`}>{BUSINESS_EMAIL}</a> con el número de factura,
          el producto y una descripción de la falla (una foto o un video ayudan).
        </li>
        <li>
          Te indicamos si corresponde llevarlo al local ({BUSINESS_ADDRESS}) o al servicio técnico
          autorizado de la marca.
        </li>
      </ul>

      <h2>Cambios y devoluciones</h2>
      <p>
        Si un producto presenta una falla de fábrica al recibirlo, lo cambiamos o gestionamos su
        reparación según corresponda. Para cambios que no sean por falla, consultanos antes de la
        compra: dependen del producto y de que esté sin uso, completo y en su embalaje original.
      </p>
      <p>
        Estas condiciones no limitan los derechos que te reconoce la Ley N.º 1334/98 de Defensa del
        Consumidor y del Usuario.
      </p>
    </InfoPage>
  )
}
