const { FileListPlugin } = require('./plugin');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.plugins.push(new FileListPlugin());

    return config;
  },
};

module.exports = nextConfig;
