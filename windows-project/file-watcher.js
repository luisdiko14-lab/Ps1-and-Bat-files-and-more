const fs = require('fs');
const path = require('path');
const https = require('https');
const url = require('url');

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const WATCH_DIR = process.cwd();
const WATCH_EXTENSIONS = ['.html', '.css', '.js'];
const IGNORE_FILES = ['file-watcher.js', 'discord-webhook.js', 'node_modules', '.git', 'package-lock.json'];

const fileContents = new Map();

function sendDiscordEmbed(fileName, lineNumber, oldLine, newLine) {
    if (!WEBHOOK_URL) {
        console.error('DISCORD_WEBHOOK_URL not set');
        return;
    }

    const embed = {
        title: "📝 File Updated",
        color: 0x0078D4,
        fields: [
            { name: "📁 File", value: `\`${fileName}\``, inline: true },
            { name: "📍 Line", value: `\`${lineNumber}\``, inline: true },
            { name: "❌ Old", value: `\`\`\`\n${(oldLine || '(empty)').substring(0, 200)}\n\`\`\``, inline: false },
            { name: "✅ New", value: `\`\`\`\n${(newLine || '(empty)').substring(0, 200)}\n\`\`\``, inline: false }
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "File Watcher" }
    };

    const payload = JSON.stringify({
        username: "File Watcher",
        avatar_url: "https://cdn-icons-png.flaticon.com/512/888/888882.png",
        embeds: [embed]
    });

    const parsedUrl = url.parse(WEBHOOK_URL);
    const req = https.request({
        hostname: parsedUrl.hostname,
        path: parsedUrl.path,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`✅ Notified: ${fileName} line ${lineNumber}`);
        }
    });
    req.on('error', (e) => console.error('Webhook error:', e.message));
    req.write(payload);
    req.end();
}

function getFileLines(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8').split('\n');
    } catch {
        return [];
    }
}

function compareAndNotify(filePath) {
    const fileName = path.basename(filePath);
    const newLines = getFileLines(filePath);
    const oldLines = fileContents.get(filePath) || [];
    
    if (oldLines.length === 0) {
        fileContents.set(filePath, newLines);
        return;
    }

    const maxLen = Math.max(oldLines.length, newLines.length);
    let changesFound = 0;
    
    for (let i = 0; i < maxLen && changesFound < 3; i++) {
        const oldLine = oldLines[i] || '';
        const newLine = newLines[i] || '';
        
        if (oldLine !== newLine) {
            changesFound++;
            setTimeout(() => {
                sendDiscordEmbed(fileName, i + 1, oldLine.trim(), newLine.trim());
            }, changesFound * 500);
        }
    }
    
    fileContents.set(filePath, newLines);
}

function shouldWatch(filePath) {
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath);
    
    if (IGNORE_FILES.some(ig => filePath.includes(ig))) return false;
    if (!WATCH_EXTENSIONS.includes(ext)) return false;
    
    return true;
}

function initializeFile(filePath) {
    if (shouldWatch(filePath)) {
        fileContents.set(filePath, getFileLines(filePath));
        console.log(`👁️ Watching: ${path.basename(filePath)}`);
    }
}

function watchDirectory(dir) {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isFile()) {
            initializeFile(filePath);
        }
    });

    fs.watch(dir, { recursive: false }, (eventType, fileName) => {
        if (!fileName) return;
        const filePath = path.join(dir, fileName);
        
        if (shouldWatch(filePath) && eventType === 'change') {
            setTimeout(() => compareAndNotify(filePath), 100);
        }
    });
}

console.log('🚀 File Watcher Started');
console.log('📁 Watching directory:', WATCH_DIR);
console.log('📋 Extensions:', WATCH_EXTENSIONS.join(', '));
console.log('---');

watchDirectory(WATCH_DIR);

console.log('---');
console.log('✅ Ready! Edit any watched file to send Discord notifications.');
