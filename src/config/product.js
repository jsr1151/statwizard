import packageMetadata from "../../package.json";

export const PRODUCT = Object.freeze({
  name: packageMetadata.displayName,
  tagline: packageMetadata.tagline,
  description: packageMetadata.description,
  version: packageMetadata.version,
  displayVersion: `v${packageMetadata.version}`,
  homepage: packageMetadata.homepage,
});
