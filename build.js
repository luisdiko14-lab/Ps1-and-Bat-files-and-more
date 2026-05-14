const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const targetDir = path.join(__dirname, 'dist');
const filesToCopy = ['index.html', 'script.js', 'style.css', 'styles.css', 'files'];
const defaultDelayMs = 5000;
const slowDelayMs = 8000;
const verySlowDelayMs = 12000;
const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / 1024 ** index).toFixed(2)} ${units[index]}`;
}

async function getEntrySize(entryPath) {
    const stats = await fsp.stat(entryPath);
    if (stats.isFile()) return stats.size;

    if (stats.isDirectory()) {
        const dirents = await fsp.readdir(entryPath, { withFileTypes: true });
        const sizes = await Promise.all(
            dirents.map(dirent => getEntrySize(path.join(entryPath, dirent.name)))
        );
        return sizes.reduce((total, value) => total + value, 0);
    }

    return 0;
}

function buildBar(progress, width) {
    const filled = Math.round(progress * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}

async function waitWithProgress(message, ms, fileSize) {
    const start = Date.now();
    let frame = 0;
    const totalSeconds = Math.max(ms / 1000, 1);
    const fileSizeMB = fileSize / 1024 / 1024;
    const speed = fileSizeMB / totalSeconds;
    const sizeLabel = formatBytes(fileSize);

    while (Date.now() - start < ms) {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / ms, 1);
        const bar = buildBar(progress, 28);
        const speedLabel = `${speed.toFixed(2)} MB/s`;
        process.stdout.write(
            `${message} ${spinnerFrames[frame]} [${bar}] ${speedLabel} / ${sizeLabel}\r`
        );
        frame = (frame + 1) % spinnerFrames.length;
        await new Promise(resolve => setTimeout(resolve, 80));
    }
    process.stdout.write(' '.repeat(140) + '\r');
}

async function ensureCleanDist() {
    if (fs.existsSync(targetDir)) {
        await fsp.rm(targetDir, { recursive: true, force: true });
        console.log('🧹 Cleaned previous "dist" directory.');
    }
    await fsp.mkdir(targetDir, { recursive: true });
    console.log('📁 Created fresh "dist" directory.');
}

async function saveBuildInfo(records, totalSize, elapsedMs, mode) {
    const buildInfo = {
        builtAt: new Date().toISOString(),
        mode,
        durationMs: elapsedMs,
        totalSize: formatBytes(totalSize),
        copiedItems: records,
        notes: 'Build copies are paced according to the selected mode for a cooler experience.'
    };
    await fsp.writeFile(path.join(targetDir, 'build-info.json'), JSON.stringify(buildInfo, null, 2), 'utf8');
    return buildInfo;
}

async function runBuild() {
    console.log('╔════════════════════════════════════════╗');
    console.log('║      🚀 Super Cool Build Launcher       ║');
    console.log('╚════════════════════════════════════════╝\n');

    const fastMode = process.argv.includes('--fast') || process.argv.includes('-f');
    const slowMode = process.argv.includes('--slow');
    const verySlowMode = process.argv.includes('--very-slow');
    const delayMode = verySlowMode ? verySlowDelayMs : slowMode ? slowDelayMs : defaultDelayMs;
    const modeName = fastMode ? 'fast' : verySlowMode ? 'very slow' : slowMode ? 'slow' : 'normal';

    console.log(`🔧 Build mode: ${modeName}`);
    if (fastMode) {
        console.log('⚡ Fast mode enabled: skipping the delay.');
    } else if (slowMode) {
        console.log('🐎 Slow mode enabled: taking a more relaxed copy pace.');
    }
    if (verySlowMode) {
        console.log('🐢 Very slow mode enabled: copying at extra chilled pace.');
    }

    await ensureCleanDist();

    const copyRecords = [];
    let totalSize = 0;
    const buildStart = Date.now();

    for (const fileName of filesToCopy) {
        const src = path.join(__dirname, fileName);
        const dest = path.join(targetDir, fileName);

        if (!fs.existsSync(src)) {
            console.warn(`⚠ Skipping missing source: ${fileName}`);
            continue;
        }

        const size = await getEntrySize(src);
        totalSize += size;

        const fileDelay = fastMode ? 0 : delayMode;
        const delayMessage = verySlowMode ? '🐢 Very slow loading' : slowMode ? '🐎 Slow loading' : '⏳ Copying in progress';

        process.stdout.write(`📦 Copying ${fileName} (${formatBytes(size)}) ... `);
        if (!fastMode) await waitWithProgress(delayMessage, fileDelay, size);
        await fsp.cp(src, dest, { recursive: true, force: true });
        process.stdout.write('\r');
        console.log(`✔ Completed: ${fileName}`);

        copyRecords.push({
            name: fileName,
            size: formatBytes(size),
            destination: dest
        });
    }

    const elapsedMs = Date.now() - buildStart;
    const buildInfo = await saveBuildInfo(copyRecords, totalSize, elapsedMs, modeName);

    console.log('✨ Build finished successfully.');
    console.log(`  • Copied items: ${copyRecords.length}`);
    console.log(`  • Total size: ${buildInfo.totalSize}`);
    console.log(`  • Build metadata: dist/build-info.json`);
    console.log('\n💡 Tip: run `node build.js --fast` for a quicker build.');
    console.log('   Try `node build.js --slow` or `node build.js --very-slow` for extra chill pace.');
}

runBuild().catch(error => {
    console.error('🔥 Build failed:', error);
    process.exit(1);
});
