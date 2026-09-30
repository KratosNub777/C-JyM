import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    cookies: {
      // En producción la sesión del panel solo viaja por HTTPS; Lax evita enviarla en POST de otros sitios.
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    },
  },
  fields: [
    // Email added by default
    // Add more fields as needed
  ],
}
