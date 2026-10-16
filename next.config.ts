import type { NextConfig } from 'next';
const config: NextConfig = {
  poweredByHeader: false,
  webpack(config) {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};
export default config;
