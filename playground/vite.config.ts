import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // The playground always runs against the library source in this repo.
      'nz-bank-parser': resolve(__dirname, '../src/index.ts'),
    },
  },
});
