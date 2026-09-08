import type { NextConfig } from 'next';
const config: NextConfig = {
  output: 'export',
  turbopack: { root: process.cwd() },
  allowedDevOrigins: ['127.0.0.1'],
  devIndicators: false,
};
export default config;
