const { FileListPlugin } = require('./plugin');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    (async () => {
      const e = await config.entry();
      console.log(e);
    })();
    config.plugins.push(new FileListPlugin());

    return config;
  },
};

module.exports = nextConfig;
