/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['mysql2'],
  },
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}

export default nextConfig
