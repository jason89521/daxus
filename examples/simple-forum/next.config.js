const { FileListPlugin } = require('./plugin');
const { InjectManifest } = require('workbox-webpack-plugin');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.plugins.push(
      new InjectManifest({
        swSrc: './foo.ts',
      })
    );

    return config;
  },
};

module.exports = nextConfig;
