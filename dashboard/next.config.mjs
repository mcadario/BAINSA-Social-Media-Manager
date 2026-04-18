/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Suppress harmless cache warnings about uninstalled platform-specific
    // optional SWC binaries (e.g. win32, linux builds on macOS)
    config.infrastructureLogging = { level: 'error' };
    return config;
  },
};
export default nextConfig;
