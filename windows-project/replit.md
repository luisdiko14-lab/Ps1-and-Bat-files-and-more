# Windows 10 Setup Simulator

## Overview

This is a web-based Windows 10 simulator that recreates the complete Windows installation experience and desktop environment using HTML, CSS, and JavaScript, backed by a Node.js/Express server for Discord OAuth2.

## Recent Fixes & Features
- **🛠️ Setup wizard expanded**: `setup_2.html` now has 13 steps with progress bar (WiFi w/ signal bars + show password, Bluetooth pairing 6 devices + scan animation, Account type, Microsoft/Local flow, Security questions, PIN, Theme, 10 accent colors, 16 timezones with live clocks, Cortana, Find my device, 6 Privacy toggles). Submits via URL params to new `setup_final.html` which shows summary cards, Confirm/Edit, applying overlay, and saves to `localStorage.windowsUserData`.
- **⚙️ Settings overhaul**: 25-item sidebar, 17 new sections (Devices, Network, Phone, Ease of Access, Search, Cortana, Themes, Lock screen, Display, Sound, Notifications, Power & Sleep, Storage, Mouse, Keyboard, Mixed reality, About), shared `settingsToggle/Slider/Button` helpers.
- **🌐 Network & Internet** (rebuilt): 10-tab sidebar (Status, Wi-Fi, Ethernet, Dial-up, VPN, Airplane, Hotspot, Data usage, Proxy, Advanced) with IP/MAC details, signal-bar networks, live VPN connect, per-app data usage chart, DNS-over-HTTPS, and reset/diagnostics actions.
- **📡 Bluetooth & Devices app** (new): scan animation, pair/connect/disconnect/remove, 6 device types, battery indicators, registered as `bluetooth` in appFactories, icons on desktop + Start menu.
- **🌐 Browsers actually load real websites!** New `/proxy?url=` endpoint in `server.js` fetches sites server-side, strips `X-Frame-Options`/`Content-Security-Policy` headers, and rewrites all hrefs/srcs/srcsets/css `url()`/imports + injects a `fetch`/`XHR` shim so dynamic requests also go through the proxy. Both Edge and Chrome iframes now use `/proxy?url=` for their src.
- **🎨 AI Image Generator** (new app `imagegen`): Pollinations.AI-powered. 12 style presets (realistic/anime/oil/watercolor/cyberpunk/etc.), 6 model choices (flux/turbo/flux-realism/flux-anime/flux-3d/any-dark), 6 size presets, 1/2/4 image batches, negative prompts, quick-prompt chips, per-image download/copy URL/regenerate, generation history.
- **🎨 Paint v2**: 16 tools (brush/pencil/eraser/fill/picker/text/line/spray + 8 shapes incl. rect/ellipse/triangle/star/heart/arrow/diamond/hexagon), 20-color palette + custom color picker, fill/stroke toggle, undo/redo (30-step history), real flood fill, save as PNG, open image, status bar with cursor pos and current tool/color.
- **🔢 Calculator v2**: Three modes (Standard/Scientific/History tabs). Scientific has sin/cos/tan/asin/acos/atan/log/ln/10ˣ/eˣ/x³/∛x/x!/π/e. History persists across opens, click any entry to recall the result.
- **📝 Notepad v2**: Menu bar (File/Edit/Format/View/Help with dropdown popups), toolbar with New/Open/Save (download .txt), Find & Replace bar with case sensitivity, font/size selector (10 fonts + 12 sizes), bold/italic, color picker, word wrap toggle, status bar with line/col/words/chars/selection/file count.
- **🌤️ Weather v2**: 7 cities (NYC/Tokyo/London/Sydney/Dubai/Reykjavik/Rio), live clock, condition-driven background gradients, 12-hour hourly strip, 7-day forecast with hi/lo gradient bars, 8 detail tiles (wind/humidity/visibility/pressure/sunrise+sunset/feels-like/UV index slider/AQI badge).
- **Lazy App Factory**: All 40+ apps use a lazy `appFactories` pattern — only the requested app's constructor runs on open. Fixes Chrome/media timers firing on every window open.
- **Discord OAuth2 Reworked**: Opens a server-side OAuth popup (`/api/auth/discord`), server manages state (CSRF safe), popup lands on `discord-success.html` which writes `localStorage`, main window polls and shows full Discord UI.
- **Full Discord UI**: Server sidebar with guilds, channel list (text + voice), live chat with auto-replies, members panel, user panel with mute/deafen/settings.
- **This PC Upgraded**: Drive usage bars, 4 drives (C/D/E/F), 6 quick-access folders, system info panel with all specs.
- **Switched to Express**: Workflow now runs `node server.js` instead of Python — enables `/api/auth/discord`, `/api/auth/discord-callback`, `/api/auth/user`, `/api/auth/logout`.
- **Real Tabbed Browser**: Microsoft Edge and Chrome both have working tabs, bookmarks bar, history nav, new tab page with tiles, and actual iframe loading of real websites.
- **30+ Apps**: WordPad, Sticky Notes, PowerShell, Control Panel, Device Manager, Registry Editor, Media Player, Teams, Xbox, Mail, Speed Test, and all previous apps.
- **CMD Expanded**: 30+ commands including ipconfig /all, tracert, netstat, tasklist, taskkill, systeminfo, shutdown, sfc, reg, net, cd, mkdir, tree, attrib, set, and more.
- **Window Resize**: All windows have drag handles on all 8 edges/corners for resizing.
- **Pinned Taskbar**: 8 pinned app icons always visible in the taskbar.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Backend: Node.js / Express (`server.js`)
- Serves all static files from root
- Discord OAuth2 routes: `/api/auth/discord`, `/api/auth/discord-callback`, `/api/auth/user`, `/api/auth/logout`
- Session-based user storage (`express-session`)
- Port 5000

### Frontend: Pure HTML/CSS/JS
- No frameworks — all vanilla JS
- Multi-screen SPA using visibility toggling (`.active` class + `style.display`)

### App Window System
- `createWindow(appName)` in `script.js` — **lazy** `appFactories` object (only creates the requested app)
- Each app has a `create*()` function that returns HTML string
- Windows are draggable/resizable, z-stacked, minimizable/maximizable

### Discord OAuth Flow (cool authentication.html)
1. User clicks "Login with Discord" in Discord app → `discordStartOAuth()` opens `/api/auth/discord` in a new tab
2. Server generates CSRF state, redirects to Discord's OAuth page
3. Discord redirects back to `/api/auth/discord-callback?code=&state=`
4. Server verifies state, then **exchanges the code immediately** (gets username + avatar URL + guilds, stores in session)
5. Server redirects to `authentication.html?username=...&avatar=...&statecode=...&callbackcode=...`
6. **`authentication.html`** is a Discord-themed cool loader page: animated avatar ring, fade-in username, 4-step status list (Verifying → Loading → Syncing → Returning), shimmering progress bar, code display, confetti burst on completion
7. authentication.html calls `/api/auth/user` to get the full user object, saves to `localStorage.discord_user_data`, posts message to opener (if popup), then either closes itself or redirects to `/`
8. Main app reads `localStorage.discord_user_data` on boot and `_discordPollInterval` so the Discord app shows the profile instantly
9. **Fallback**: if the callback exchange fails, it falls back to the old `/?discord_code=&discord_state=` flow which uses `/api/auth/exchange`

### VM Launcher (`run_vm_on.html`)
- 4 plan cards (Free / Pro / Master / Exclusive) with specs and perks
- Click button → fullscreen launching overlay with: pulsing Windows logo, plan pill, animated progress bar (8 steps "Allocating RAM…", "Spinning up cores…", etc.), 4-spec grid (CPU/RAM/GPU/Storage)
- Boot animation completes → navigates to `/?plan=...&ram=...&cpu=...&gpu=...&storage=...`
- script.js IIFE at top reads the params and stores them in `localStorage.vmSpecs` + `window._vmSpecs`; About/Task Manager/Device Manager all read from `_vmSpecs` to show plan-specific hardware

### Active VM plan UI (Settings + tray badge)
- `getPlanMeta(plan)` returns icon/name/tagline + 2 gradient colors for free/pro/master/exclusive
- **Tray badge**: `index.html` system-tray has `<span id="plan-badge">`; `updatePlanBadge()` runs on DOMContentLoaded and after any plan change; click → `openPlanPopup()` opens a glass-style popup with current CPU/RAM/GPU/Storage and "View details" + "Switch plan" buttons
- **Settings → About**: now opens with a colored gradient banner at the top showing the active plan + a "Switch plan →" button; the device-specs grid reads CPU/RAM/Graphics/Storage from `_vmSpecs`; "Reset VM plan" button at the bottom clears `vmSpecs` and reroutes to the launcher

### Screen Management
- Multiple "screen" divs for boot, lock, login, desktop, setup steps
- `showScreen()` toggles `.active` class + `style.display`

### State Management
- `userData` — logged-in Windows user (username, password, email, etc.)
- `openWindows` — array of open window objects
- `window._discordLoggedInUser` — logged-in Discord user (also mirrored in localStorage)
- All data persisted via `localStorage`

## File Structure
- `index.html` — Main desktop and login experience
- `setup_1.html`, `setup_2.html` — Windows installation wizard steps
- `styles.css` — All styling including Windows 10 visual design
- `script.js` — Core application logic, all app `create*()` functions, event handlers
- `server.js` — Express server, Discord OAuth2 backend (port 5000)
- `discord-success.html` — OAuth popup landing page (fetches user, writes localStorage, closes)
- `discord-callback-handler.js` — Standalone alt handler on port 3001 (not used in main flow)

## Specs in the Simulator
- CPU: Intel Core i9-14900K @ 8.0 GHz (24-core)
- RAM: 500 GB DDR5
- GPU: NVIDIA RTX 4090 24 GB
- Storage: 100 TB Samsung 990 Pro NVMe SSD

## Required Environment Secrets
- `SESSION_SECRET` — for express-session
- `DISCORD_CLIENT_SECRET` — Discord OAuth2 (client ID is hardcoded: `1370655950310080522`)
- `REDIRECT_URI` (optional, defaults to the worf.replit.dev callback URL)
