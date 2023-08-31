const { FileListPlugin } = require('./plugin');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, { isServer }) {
    if (!isServer) config.plugins.push(new FileListPlugin());

    return config;
  },
};

module.exports = nextConfig;
