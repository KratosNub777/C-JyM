import type { Metadata } from 'next'
import Link from 'next/link'

import { InfoPage } from '@/components/InfoPage'
import { BUSINESS_EMAIL } from '@/lib/contact'

export const metadata: Metadata = {
  title: 'Términos y condiciones',
  description: 'Condiciones de uso del catálogo en línea de Comercial José María.',
}

export default function TermsPage() {
  return (
    <InfoPage title="Términos y condiciones" updated="noviembre de 2026">
      <p>
        Estos términos regulan el uso de este sitio, el catálogo en línea de Comercial José María.
        Al usarlo aceptás estas condiciones.
      </p>

      <h2>El sitio es un catálogo</h2>
      <p>
        En este sitio no se realizan compras ni pagos. Podés ver los productos y armar un carrito,
        que se guarda solo en tu navegador. Al enviarlo por WhatsApp nos llega tu consulta: la venta
        se concreta recién cuando la confirmamos, con la factura correspondiente.
      </p>

      <h2>Precios y disponibilidad</h2>
      <ul>
        <li>Los precios están expresados en guaraníes (Gs.).</li>
        <li>
          Los precios, las ofertas y el stock pueden cambiar sin aviso previo. El precio válido es
          el que te confirmamos al momento de la venta.
        </li>
        <li>
          Las opciones de cuotas que se muestran son referenciales y se confirman al momento de la
          compra.
        </li>
        <li>Agregar un producto al carrito no lo reserva.</li>
      </ul>

      <h2>Imágenes y descripciones</h2>
      <p>
        Las fotos son ilustrativas. Las características pueden variar según el modelo o el lote del
        fabricante; ante cualquier duda, consultanos antes de comprar.
      </p>

      <h2>Garantía</h2>
      <p>
        Las condiciones de garantía, cambios y devoluciones están en{' '}
        <Link href="/garantia">Garantía y devoluciones</Link>.
      </p>

      <h2>Propiedad intelectual</h2>
      <p>
        Los textos, el logo y el diseño de este sitio pertenecen a Comercial José María. Las marcas
        de los productos pertenecen a sus respectivos fabricantes.
      </p>

      <h2>Cambios en estos términos</h2>
      <p>
        Podemos actualizar estos términos; la versión vigente es la publicada en esta página. Se
        rigen por las leyes de la República del Paraguay.
      </p>

      <h2>Contacto</h2>
      <p>
        Por cualquier consulta sobre estos términos escribinos a{' '}
        <a href={`mailto:${BUSINESS_EMAIL}`}>{BUSINESS_EMAIL}</a>.
      </p>
    </InfoPage>
  )
}
