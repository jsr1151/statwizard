import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const packageMetadata = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
);

// Custom plugin: writes version.json into dist/ after every build.
// The useAutoReload hook polls this file to detect new deployments.
function versionFile() {
  return {
    name: "version-file",
    writeBundle(options) {
      const outDir = options.dir || "dist";
      const data = JSON.stringify({
        version: packageMetadata.version,
        buildTime: new Date().toISOString(),
      });
      writeFileSync(resolve(outDir, "version.json"), data);
    },
  };
}

function productMetadata() {
  const replacements = {
    "{{APP_NAME}}": packageMetadata.displayName,
    "{{APP_DESCRIPTION}}": packageMetadata.description,
    "{{APP_TITLE}}": `${packageMetadata.displayName} — ${packageMetadata.tagline}`,
    "{{APP_URL}}": packageMetadata.homepage,
  };

  return {
    name: "product-metadata",
    enforce: "pre",
    transformIndexHtml(html) {
      return Object.entries(replacements).reduce(
        (result, [token, value]) => result.replaceAll(token, value),
        html,
      );
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: "/statwizard/",
  plugins: [productMetadata(), react(), tailwindcss(), versionFile()],
  server: {
    port: 5174,
    strictPort: true,
    host: "127.0.0.1",
  },
});
