/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production'

const nextConfig = {
  output: 'export',
  // Disable strict mode temporarily to help identify hydration issues
  reactStrictMode: false,
  ...(isProduction
    ? {}
    : {
      async rewrites() {
        return [
          {
            source: '/api/:path*',
            destination: 'http://localhost:8000/api/:path*',
          },
        ]
      },
    }),
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
