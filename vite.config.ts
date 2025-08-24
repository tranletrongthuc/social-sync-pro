import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import EnvironmentPlugin from 'vite-plugin-environment';
// Import 'react' plugin nếu bạn chưa có
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    
    return {
      // Đã xóa basicSsl() và thêm plugin 'react()'
      plugins: [react(), EnvironmentPlugin({
        
      })],
      // Đã xóa toàn bộ khối 'server'
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              utils: ['file-saver', 'uuid'],
            }
          }
        }
      },
      css: {
        devSourcemap: true,
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});