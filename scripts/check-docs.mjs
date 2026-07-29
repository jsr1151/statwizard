import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const failures = [];
const readRepositoryFile = (path) =>
  readFileSync(resolve(repositoryRoot, path), "utf8");

const requiredFiles = [
  "README.md",
  "AI_RULEBOOK.md",
  "docs/history/README.md",
  "docs/history/STATWIZARD_PLAN_OF_ACTION.md",
  "docs/history/POWER_ANALYSIS_CHANGES_2026_03_18.md",
  "src/power/fixtures/README.md",
];

requiredFiles.forEach((path) => {
  if (!existsSync(resolve(repositoryRoot, path)))
    failures.push(`Missing required documentation: ${path}`);
});

["build.log", "deploy_working.yml"].forEach((path) => {
  if (existsSync(resolve(repositoryRoot, path)))
    failures.push(`Stale root artifact must be removed: ${path}`);
});

if (existsSync(resolve(repositoryRoot, "README.md"))) {
  const readme = readRepositoryFile("README.md");
  [
    "## Requirements",
    "## Local Development",
    "## Commands",
    "## Architecture",
    "## Statistical Validation Policy",
    "## Accessibility",
    "## Deployment",
    "## Contributing",
  ].forEach((heading) => {
    if (!readme.includes(heading))
      failures.push(`README is missing required section: ${heading}`);
  });
}

["README.md", "docs/history/README.md"].forEach((documentPath) => {
  if (!existsSync(resolve(repositoryRoot, documentPath))) return;

  const document = readRepositoryFile(documentPath);
  const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;

  for (const match of document.matchAll(linkPattern)) {
    const link = match[1].trim();
    if (!link || link.startsWith("#") || /^[a-z]+:/i.test(link)) continue;

    const localPath = decodeURIComponent(link.split("#")[0]);
    const target = resolve(repositoryRoot, dirname(documentPath), localPath);
    if (!existsSync(target))
      failures.push(`Broken local link in ${documentPath}: ${link}`);
  }
});

requiredFiles
  .filter(
    (path) =>
      path.startsWith("docs/history/") && path !== "docs/history/README.md",
  )
  .forEach((path) => {
    if (
      existsSync(resolve(repositoryRoot, path)) &&
      !readRepositoryFile(path).includes("Historical record")
    ) {
      failures.push(
        `Historical document is missing its status banner: ${path}`,
      );
    }
  });

if (failures.length) {
  failures.forEach((failure) => process.stderr.write(`${failure}\n`));
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Documentation check passed for ${requiredFiles.length} required file(s).\n`,
  );
}
