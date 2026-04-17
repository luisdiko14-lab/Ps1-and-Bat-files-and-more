const fs = require('fs');
const path = require('path');

// 1. Setup paths
const targetDir = path.join(__dirname, 'dist');
const filesToCopy = ['index.html', 'script.js', 'style.css', 'styles.css', 'files'];

// 2. Ensure 'dist' exists
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log('✔ Created "dist" directory.');
} else {
    console.log('- "dist" directory already exists.');
}

// 3. Copy files and folders
filesToCopy.forEach(fileName => {
    const src = path.join(__dirname, fileName);
    const dest = path.join(targetDir, fileName);

    if (fs.existsSync(src)) {
        // recursive: true handles the 'files' directory automatically
        fs.cpSync(src, dest, { recursive: true, force: true });
        console.log(`✔ Successfully copied: ${fileName}`);
    } else {
        console.warn(`⚠ Skipping: ${fileName} (not found in source)`);
    }
});

console.log('\n✨ Build finished successfully.');
