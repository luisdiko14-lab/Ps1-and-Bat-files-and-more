const fs = require("fs");
const path = require("path");

console.log("🔨 Starting custom build...");

const distDir = path.join(__dirname, "dist");

// 1. Clean and Create dist folder
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir);
console.log("📁 Cleaned and created dist/ folder");

// 2. Define what to exclude from the build
const excludeList = ["dist", "node_modules", ".git", ".github", "package.json", "package-lock.json", "build.js"];

// 3. Copy all files and folders from root to dist
const files = fs.readdirSync(__dirname);

files.forEach(file => {
  if (!excludeList.includes(file)) {
    const srcPath = path.join(__dirname, file);
    const destPath = path.join(distDir, file);

    // Use cpSync (available in Node 16.7+) to copy files or entire folders
    fs.cpSync(srcPath, destPath, { recursive: true });
    console.log(`✅ Copied: ${file}`);
  }
});

console.log("🎉 Build finished successfully! All assets are in /dist");