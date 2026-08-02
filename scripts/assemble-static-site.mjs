import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const clientDir = path.join(root, "dist/static/client");
const outDir = path.join(root, "dist/static-site");
const assetsSrc = path.join(clientDir, "assets");
const imagesSrc = path.join(clientDir, "images");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

if (!fs.existsSync(assetsSrc)) {
  console.error("Run npm run build:static first (missing dist/static/client/assets).");
  process.exit(1);
}

const assetFiles = fs.readdirSync(assetsSrc);
const jsEntry =
  assetFiles.find((f) => f.startsWith("index-") && f.endsWith(".js")) ??
  assetFiles.find((f) => f.endsWith(".js"));

const cssFile = assetFiles.find((f) => f.startsWith("styles-") && f.endsWith(".css"));

if (!jsEntry) {
  console.error("Could not find client JS entry in dist/static/client/assets.");
  process.exit(1);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
copyDir(assetsSrc, path.join(outDir, "assets"));
copyDir(imagesSrc, path.join(outDir, "images"));

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VK — Handcrafted Premium Jewelry</title>
    <meta name="description" content="Discover handcrafted premium beads and timeless jewelry." />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Reem+Kufi+Fun:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
    ${cssFile ? `<link rel="stylesheet" href="./assets/${cssFile}" />` : ""}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./assets/${jsEntry}"></script>
  </body>
</html>
`;

fs.writeFileSync(path.join(outDir, "index.html"), html);

console.log(`Static site ready: ${outDir}`);
console.log(`Entry: /assets/${jsEntry}`);
