// Simple callback handler for Discord OAuth
const http = require('http');
const https = require('https');
const url = require('url');
const querystring = require('querystring');

const PORT = 3001;
const CLIENT_ID = '1370655950310080522';
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const REDIRECT_URI = 'https://dc97442b-2e83-447c-806e-1718dc226361-00-ry3rm930k0c5.worf.replit.dev/api/auth/discord-callback';

function makeRequest(options, data) {
    return new Promise((resolve, reject) => {
        const proto = options.protocol === 'https:' ? https : http;
        const req = proto.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data: responseData }));
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (pathname === '/api/auth/discord-callback') {
        const code = query.code;
        const state = query.state;

        if (!code) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            return res.end('<h1>Error: No authorization code provided</h1>');
        }

        if (!CLIENT_SECRET) {
            res.writeHead(500, { 'Content-Type': 'text/html' });
            return res.end('<h1>Error: DISCORD_CLIENT_SECRET not configured</h1>');
        }

        try {
            const tokenOptions = {
                hostname: 'discord.com',
                port: 443,
                path: '/api/v10/oauth2/token',
                method: 'POST',
                protocol: 'https:',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            };

            const tokenPayload = querystring.stringify({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: REDIRECT_URI
            });

            const tokenRes = await makeRequest(tokenOptions, tokenPayload);
            const tokenData = JSON.parse(tokenRes.data);

            if (!tokenData.access_token) {
                throw new Error('No access token in response');
            }

            const userOptions = {
                hostname: 'discord.com',
                port: 443,
                path: '/api/v10/users/@me',
                method: 'GET',
                protocol: 'https:',
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`
                }
            };

            const userRes = await makeRequest(userOptions);
            const userData = JSON.parse(userRes.data);

            const guildsOptions = {
                hostname: 'discord.com',
                port: 443,
                path: '/api/v10/users/@me/guilds',
                method: 'GET',
                protocol: 'https:',
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`
                }
            };

            const guildsRes = await makeRequest(guildsOptions);
            const guildsData = JSON.parse(guildsRes.data);

            const userInfo = {
                id: userData.id,
                username: userData.username,
                email: userData.email,
                avatar: `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`,
                guilds: (guildsData || []).slice(0, 10).map(g => ({
                    id: g.id,
                    name: g.name,
                    icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null
                }))
            };

            const appUrl = 'https://dc97442b-2e83-447c-806e-1718dc226361-00-ry3rm930k0c5.worf.replit.dev';
            const redirectUrl = `${appUrl}/?user=${encodeURIComponent(JSON.stringify(userInfo))}&discord_token=${tokenData.access_token}`;

            res.writeHead(302, { 'Location': redirectUrl });
            res.end();
        } catch (error) {
            console.error('OAuth error:', error);
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`<h1>Authentication Error</h1><p>${error.message}</p>`);
        }
    } else {
        res.writeHead(404).end('Not found');
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Discord OAuth callback handler listening on port ${PORT}`);
});
