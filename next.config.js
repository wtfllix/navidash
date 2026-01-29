/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
};

const withNextIntl = require('next-intl/plugin')();
 
module.exports = withNextIntl(nextConfig);
