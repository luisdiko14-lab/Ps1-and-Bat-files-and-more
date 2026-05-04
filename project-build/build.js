// build.js
import fs from "fs";
import path from "path";

const SRC_DIR = "./src";
const DIST_DIR = "./dist";

const allowedExtensions = [".html", ".css", ".js", ".xml"];

// Remove old dist folder
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}

// Create new dist folder
fs.mkdirSync(DIST_DIR, { recursive: true });

function copyFiles(src, dest) {
  const items = fs.readdirSync(src);

  items.forEach((item) => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyFiles(srcPath, destPath);
    } else {
      const ext = path.extname(item);

      if (allowedExtensions.includes(ext)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ Copied: ${srcPath}`);
      }
    }
  });
}

copyFiles(SRC_DIR, DIST_DIR);

console.log("\n🚀 Build completed successfully!");
