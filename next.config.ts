/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['react-player'],
  
  images: {
    unoptimized: false, 
    remotePatterns: [
      { protocol: 'https', hostname: 'images.weserv.nl' },
      { protocol: 'https', hostname: 'wsrv.nl' },
      { protocol: 'https', hostname: 'api.sansekai.my.id' },
      { protocol: 'https', hostname: 'hwztchapter.dramaboxdb.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.fizzopic.org' },
      { protocol: 'https', hostname: '**.ibyteimg.com' },
      { protocol: 'https', hostname: '**.byteimg.com' },
    ],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;