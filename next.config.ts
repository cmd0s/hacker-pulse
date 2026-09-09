import type { NextConfig } from 'next';

const nextConfig: NextConfig =
  process.env.HACKER_PULSE_TARGET === 'node' ? { output: 'standalone' } : {};

export default nextConfig;
