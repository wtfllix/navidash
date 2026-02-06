/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_APP_VERSION: require('./package.json').version,
  },
};

const withNextIntl = require('next-intl/plugin')();

module.exports = withNextIntl(nextConfig);
