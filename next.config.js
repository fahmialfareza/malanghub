const withPWA = require('next-pwa');
const runtimeCaching = require('next-pwa/cache');
const withImages = require('next-images');

module.exports = withPWA(
  withImages({
    images: {
      disableStaticImages: true,
    },
    pwa: {
      dest: 'public',
      runtimeCaching,
      disable: process.env.NODE_ENV === 'development',
    },
  })
);
