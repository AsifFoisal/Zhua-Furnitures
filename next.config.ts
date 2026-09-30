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
