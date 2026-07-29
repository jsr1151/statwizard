import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import packageMetadata from "../../../package.json";
import viteConfig from "../../../vite.config";
import { PRODUCT } from "../product";

const indexTemplate = readFileSync(
  new URL("../../../index.html", import.meta.url),
  "utf8",
);
const metadataPlugin = viteConfig.plugins.find(
  (plugin) => plugin.name === "product-metadata",
);
const renderedIndex = metadataPlugin.transformIndexHtml(indexTemplate);

describe("product metadata", () => {
  it("uses package.json as the canonical product and version source", () => {
    expect(PRODUCT).toEqual({
      name: packageMetadata.displayName,
      tagline: packageMetadata.tagline,
      description: packageMetadata.description,
      version: packageMetadata.version,
      displayVersion: `v${packageMetadata.version}`,
      homepage: packageMetadata.homepage,
    });
  });

  it("renders complete document and social metadata without stale stage labels", () => {
    expect(renderedIndex).toContain(
      `<title>${PRODUCT.name} — ${PRODUCT.tagline}</title>`,
    );
    expect(renderedIndex).toContain(
      `name="description" content="${PRODUCT.description}"`,
    );
    expect(renderedIndex).toContain(
      `property="og:url" content="${PRODUCT.homepage}"`,
    );
    expect(renderedIndex).toContain(
      `rel="canonical" href="${PRODUCT.homepage}"`,
    );
    expect(renderedIndex).toContain("%BASE_URL%statwizard-mark.svg");
    expect(renderedIndex).not.toMatch(
      /StatWizard Alpha|BETA v9\.6|\/vite\.svg/,
    );
    expect(renderedIndex).not.toContain("{{APP_");
  });
});
