import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  experimental: {
    // Product 3D models are up to 50MB (.glb). The default 1MB Server Actions
    // limit (and 10MB proxy buffer) would reject those uploads with a 413
    // "Body exceeded 1 MB limit" on POST */model. 60mb covers the 50MB file
    // plus multipart overhead. Model uploads now go browser -> Cloudinary
    // directly (see /api/admin/products/[id]/model), so the Next.js request
    // body is just a small JSON payload, but the raised limits keep the
    // legacy FormData path and other large uploads working.
    serverActions: {
      bodySizeLimit: '60mb',
    },
    proxyClientMaxBodySize: '60mb',
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'zhuafurniture.com' }],
        destination: 'https://www.zhuafurniture.com/:path*',
        permanent: true,
      },
      {
        // Curtain Calculator was merged into the Curtain Customizer.
        source: '/design-studio/calculator',
        destination: '/design-studio/curtain-customizer',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
