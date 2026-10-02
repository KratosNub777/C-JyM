import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'
import { securityHeaderRules } from './src/lib/security/headers'
import { r2ImagePattern } from './src/lib/storage/r2'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
      {
        pathname: '/logo.png',
      },
      {
        pathname: '/logo-dark.png',
      },
    ],
    remotePatterns: [
      {
        hostname: 'picsum.photos',
      },
      // Fotos de productos en el bucket público de R2.
      ...(r2ImagePattern() ? [r2ImagePattern()!] : []),
    ],
  },
  async headers() {
    return securityHeaderRules()
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
