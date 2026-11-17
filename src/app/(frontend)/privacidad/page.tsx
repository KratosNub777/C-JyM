import type { Metadata } from 'next'

import { InfoPage } from '@/components/InfoPage'
import { BUSINESS_ADDRESS, BUSINESS_EMAIL } from '@/lib/contact'

export const metadata: Metadata = {
  title: 'Políticas de privacidad',
  description: 'Qué datos usa el sitio de Comercial José María y cómo los cuidamos.',
}

export default function PrivacyPage() {
  return (
    <InfoPage title="Políticas de privacidad" updated="noviembre de 2026">
      <p>
        En Comercial José María ({BUSINESS_ADDRESS}) cuidamos tus datos. Esta política explica qué
        información usa este sitio y para qué.
      </p>

      <h2>Qué datos usamos</h2>
      <ul>
        <li>
          <strong>Carrito:</strong> los productos que agregás se guardan solo en tu navegador. No
          los recibimos hasta que nos enviás el pedido.
        </li>
        <li>
          <strong>WhatsApp y email:</strong> cuando nos escribís, recibimos tu número o tu dirección
          de email, tu nombre de perfil y el contenido del mensaje. Los usamos solo para responder
          tu consulta, coordinar la venta y darte atención posventa. WhatsApp es un servicio de
          Meta y se rige también por sus propias políticas.
        </li>
        <li>
          <strong>Datos técnicos:</strong> como cualquier sitio web, nuestros proveedores de
          alojamiento registran datos como la dirección IP y el navegador para que el sitio funcione
          y para protegerlo de abusos.
        </li>
      </ul>

      <h2>Cookies</h2>
      <p>
        No usamos cookies de publicidad ni de seguimiento. El sitio solo usa el almacenamiento del
        navegador necesario para su funcionamiento, como el carrito.
      </p>

      <h2>Con quién compartimos tus datos</h2>
      <p>
        No vendemos ni cedemos tus datos. Solo los compartimos cuando es necesario para atenderte
        (por ejemplo, con el servicio técnico de una marca ante un reclamo de garantía) o cuando lo
        exige la ley.
      </p>

      <h2>Tus derechos</h2>
      <p>
        Podés pedirnos en cualquier momento que te informemos qué datos tenemos sobre vos, que los
        corrijamos o que los eliminemos, escribiendo a{' '}
        <a href={`mailto:${BUSINESS_EMAIL}`}>{BUSINESS_EMAIL}</a>.
      </p>

      <h2>Cambios en esta política</h2>
      <p>
        Si cambiamos esta política publicaremos la nueva versión en esta página, con su fecha de
        actualización.
      </p>
    </InfoPage>
  )
}
