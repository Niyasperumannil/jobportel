import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    base: './',         // <-- Use '/' or '/your-subpath/' if needed
    define: {
      'process.env': env
    }
  };
});
