// Lightweight Discord OAuth handler
const http = require('http');
const url = require('url');
const querystring = require('querystring');
const crypto = require('crypto');

const PORT = process.env.PORTs || 5000;

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';

const BASE_URL = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : `http://localhost:${PORT}`;

const REDIRECT_URI = `${BASE_URL}/api/auth/discord-callback`;

// simple memory state store
const oauthStates = new Set();

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const query = parsed.query;

  // LOGIN
  if (pathname === '/api/auth/discord') {

    const state = crypto.randomBytes(16).toString('hex');
    oauthStates.add(state);

    const authUrl =
      `https://discord.com/api/oauth2/authorize` +
      `?client_id=${DISCORD_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=identify%20guilds` +
      `&state=${state}`;

    res.writeHead(302, { Location: authUrl });
    return res.end();
  }

  // CALLBACK
  if (pathname === '/api/auth/discord-callback') {

    const { code, state, error } = query;

    if (error) {
      res.writeHead(400);
      return res.end(`Discord OAuth error: ${error}`);
    }

    if (!code || !state || !oauthStates.has(state)) {
      res.writeHead(400);
      return res.end('Invalid OAuth state or code');
    }

    oauthStates.delete(state);

    try {

      const tokenRes = await fetch(
        'https://discord.com/api/v10/oauth2/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: querystring.stringify({
            client_id: DISCORD_CLIENT_ID,
            client_secret: DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
            redirect_uri: REDIRECT_URI
          })
        }
      );

      const tokenData = await tokenRes.json();

      if (!tokenData.access_token) {
        throw new Error(JSON.stringify(tokenData));
      }

      const accessToken = tokenData.access_token;

      const userRes = await fetch(
        'https://discord.com/api/v10/users/@me',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const user = await userRes.json();

      const guildsRes = await fetch(
        'https://discord.com/api/v10/users/@me/guilds',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const guilds = await guildsRes.json();

      const avatar = user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator) % 5}.png`;

      const payload = {
        id: user.id,
        username: user.username,
        avatar,
        guilds: Array.isArray(guilds) ? guilds.slice(0, 10) : []
      };

      const redirect =
        `${BASE_URL}/?user=${encodeURIComponent(JSON.stringify(payload))}` +
        `&discord_token=${accessToken}`;

      res.writeHead(302, { Location: redirect });
      res.end();

    } catch (err) {
      console.error('OAuth error:', err);
      res.writeHead(500);
      res.end('OAuth authentication failed');
    }

    return;
  }

  // LOGOUT
  if (pathname === '/api/auth/logout') {
    res.writeHead(302, { Location: '/' });
    return res.end();
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Discord OAuth running on ${PORT}`);
});