import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginTypeCheck } from '@rsbuild/plugin-type-check';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginLess(),
    pluginTypeCheck(),
  ],
  html: {
    template: './public/index.html',
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
  source: {
    entry: {
      index: './src/index.tsx',
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  output: {
    distPath: {
      root: 'dist',
    },
  },
});
