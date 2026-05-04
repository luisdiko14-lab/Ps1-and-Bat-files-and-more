const https = require('https');
const url = require('url');

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

function sendFileUpdateNotification(fileName, lineNumber, oldLine, newLine) {
    if (!WEBHOOK_URL) {
        console.error('DISCORD_WEBHOOK_URL environment variable is not set');
        return Promise.reject(new Error('Webhook URL not configured'));
    }

    const embed = {
        title: "📝 File Updated",
        color: 0x0078D4,
        fields: [
            {
                name: "📁 File Name",
                value: `\`${fileName}\``,
                inline: true
            },
            {
                name: "📍 Line Number",
                value: `\`${lineNumber}\``,
                inline: true
            },
            {
                name: "❌ Old Line",
                value: `\`\`\`\n${oldLine || '(empty)'}\n\`\`\``,
                inline: false
            },
            {
                name: "✅ New Line",
                value: `\`\`\`\n${newLine || '(empty)'}\n\`\`\``,
                inline: false
            }
        ],
        timestamp: new Date().toISOString(),
        footer: {
            text: "Windows 10 Simulator"
        }
    };

    const payload = JSON.stringify({
        username: "File Watcher",
        avatar_url: "https://cdn-icons-png.flaticon.com/512/888/888882.png",
        embeds: [embed]
    });

    const parsedUrl = url.parse(WEBHOOK_URL);
    
    const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log('✅ Discord notification sent successfully!');
                    resolve(data);
                } else {
                    console.error(`❌ Failed to send notification: ${res.statusCode}`);
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Error sending notification:', error.message);
            reject(error);
        });

        req.write(payload);
        req.end();
    });
}

if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length < 4) {
        console.log('Usage: node discord-webhook.js <fileName> <lineNumber> <oldLine> <newLine>');
        console.log('Example: node discord-webhook.js "script.js" 42 "const x = 1;" "const x = 2;"');
        process.exit(1);
    }

    const [fileName, lineNumber, oldLine, newLine] = args;
    
    sendFileUpdateNotification(fileName, lineNumber, oldLine, newLine)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { sendFileUpdateNotification };
