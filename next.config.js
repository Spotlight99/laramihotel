/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol:"https",
        hostname:"laramihotel.onrender.com",
      },
      {
        protocol: 'https',
        hostname: 'zhydylqphtuuxdppdjyd.supabase.co',
      },
    ],
  },
};

module.exports = nextConfig;
