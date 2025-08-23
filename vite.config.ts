import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import EnvironmentPlugin from 'vite-plugin-environment';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [basicSsl(), EnvironmentPlugin({
        VITE_BFF_URL: null, // Use null to make the variable optional
      })],
      server: {
        https: true,
        proxy: {
          '/api': {
            target: 'https://localhost:3001',
            changeOrigin: true,
            secure: false, // Allow self-signed certificates
            ws: true,
          }
        }
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
