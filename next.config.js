/** @type {import('next').NextConfig} */
const nextConfig = {
  // Moved from experimental.serverComponentsExternalPackages in Next.js 16
  serverExternalPackages: [
    'openai',
    '@xenova/transformers',
    'onnxruntime-node',
    'sharp',
    'pdf-parse'
  ],
  
  // Turbopack config (required in Next.js 16)
  turbopack: {},
  
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // HTTP headers for better caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
