import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    base: '/statwizard/',
    plugins: [
        react(),
        tailwindcss(),
    ],
    server: {
        port: 5174,
        strictPort: true,
        host: '0.0.0.0',
    },
})
