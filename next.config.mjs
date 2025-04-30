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
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `async_hooks` module for client builds
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        async_hooks: false, // Provide an empty module fallback for the browser
      };
    }

    // Important: return the modified config
    return config;
  },
}

export default nextConfig
