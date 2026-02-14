/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Redirect www to non-www for canonical domain
  // NOTE: .es → .com redirects should be handled in Vercel Dashboard > Domains
  // to avoid redirect loops. Only handle www → non-www here.
  async redirects() {
    return [
      // www.miralunavalencia.com → miralunavalencia.com
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.miralunavalencia.com' }],
        destination: 'https://miralunavalencia.com/:path*',
        permanent: true,
      },
    ];
  },
}

module.exports = nextConfig
