import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: '/',
    server: {
        // Respect the PORT env var set by the preview framework (falls back to 5173)
        port: parseInt(process.env.PORT) || 5173,
        proxy: {
            // Forward /api/* to PHP built-in server on port 8080
            // Start with: php -S localhost:8080 -t api  (from project root)
            '/api': {
                target:       'http://localhost:8080',
                changeOrigin: true,
                rewrite:      (path) => path.replace(/^\/api/, ''),
            },
        },
    },
});
