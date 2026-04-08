module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['.'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@features': './src/features',
          '@services': './src/services',
          '@hooks': './src/hooks',
          '@navigation': './src/navigation',
          '@store': './src/store',
          '@utils': './src/utils',
          '@assets': './src/assets',
          '@config': './src/config',
          '@types': './src/types',
        },
      },
    ],
  ],
};
