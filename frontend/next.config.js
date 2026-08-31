/** @type {import('next').NextConfig} */
const backendTarget = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:8000'
).trim().replace(/\/+$/, '').replace(/\/api\/v1$/, '');

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendTarget}/api/v1/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
