import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

// Custom plugin: writes version.json into dist/ after every build.
// The useAutoReload hook polls this file to detect new deployments.
function versionFile() {
    return {
        name: 'version-file',
        writeBundle(options) {
            const outDir = options.dir || 'dist';
            const data = JSON.stringify({ buildTime: new Date().toISOString() });
            writeFileSync(resolve(outDir, 'version.json'), data);
        },
    };
}

// https://vite.dev/config/
export default defineConfig({
    base: '/statwizard/',
    plugins: [
        react(),
        tailwindcss(),
        versionFile(),
    ],
    server: {
        port: 5174,
        strictPort: true,
        host: '0.0.0.0',
    },
})
