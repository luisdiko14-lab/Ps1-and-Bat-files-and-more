// ── Parse all URL params once at startup ──
(function() {
    const p = new URLSearchParams(window.location.search);

    // VM plan specs — URL params override localStorage; both persist across refresh
    const plan = p.get('plan');
    let _savedSpecs = null;
    try { _savedSpecs = JSON.parse(localStorage.getItem('vmSpecs') || 'null'); } catch(e) {}
    window._vmSpecs = {
        plan:    plan || (_savedSpecs && _savedSpecs.plan) || 'free',
        ram:     p.get('ram')     || (_savedSpecs && _savedSpecs.ram)     || null,
        cpu:     p.get('cpu')     || (_savedSpecs && _savedSpecs.cpu)     || null,
        gpu:     p.get('gpu')     || (_savedSpecs && _savedSpecs.gpu)     || null,
        storage: p.get('storage') || (_savedSpecs && _savedSpecs.storage) || null,
    };
    // Persist so specs survive page refresh (URL params get stripped)
    if (plan || p.get('ram') || p.get('cpu')) {
        localStorage.setItem('vmSpecs', JSON.stringify(window._vmSpecs));
    }

    // Discord OAuth callback params — fire exchange immediately, don't wait for desktop
    const discordCode  = p.get('discord_code');
    const discordState = p.get('discord_state');

    // Strip all recognised params from the URL bar without reloading
    if (plan || discordCode) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (discordCode && discordState) {
        // Exchange code immediately — Discord codes expire in ~30 seconds
        fetch('/api/auth/exchange?code=' + encodeURIComponent(discordCode) + '&state=' + encodeURIComponent(discordState))
            .then(function(r) { return r.json(); })
            .then(function(user) {
                if (user && user.id) {
                    localStorage.setItem('discord_user_data', JSON.stringify(user));
                    window._discordLoggedInUser = user;
                    // Apply to UI if already open
                    var body = document.getElementById('discord-app-body');
                    if (body && typeof discordShowProfile === 'function') discordShowProfile(user);
                    // Show a toast when DOM is ready
                    var showTst = function() {
                        var t = document.createElement('div');
                        t.style.cssText = 'position:fixed;bottom:60px;right:16px;z-index:99999;background:#3ba55d;color:white;padding:10px 18px;border-radius:8px;font-size:13px;font-family:Segoe UI,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,0.4);display:flex;align-items:center;gap:8px;animation:fadeIn .3s;';
                        t.innerHTML = '✅ Signed into Discord as <strong>' + (user.username || 'you') + '</strong>!';
                        document.body.appendChild(t);
                        setTimeout(function() { t.remove(); }, 3500);
                    };
                    if (document.body) showTst(); else document.addEventListener('DOMContentLoaded', showTst);
                } else {
                    throw new Error((user && user.error) || 'No user');
                }
            })
            .catch(function() {
                // Fallback: restore from existing server session
                fetch('/api/auth/user').then(function(r) { return r.json(); }).then(function(user) {
                    if (user && user.id) {
                        localStorage.setItem('discord_user_data', JSON.stringify(user));
                        window._discordLoggedInUser = user;
                    }
                }).catch(function() {});
            });
    }
})();

// ── Called when desktop becomes visible — restores Discord session into the UI ──
function _discordAutoExchange() {
    // If the IIFE already exchanged the code, the user is in localStorage/window
    const stored = localStorage.getItem('discord_user_data');
    const user = window._discordLoggedInUser || (stored ? (() => { try { return JSON.parse(stored); } catch(e) { return null; } })() : null);
    if (user && user.id) {
        window._discordLoggedInUser = user;
        const body = document.getElementById('discord-app-body');
        if (body && typeof discordShowProfile === 'function') discordShowProfile(user);
        if (typeof _discordPollInterval !== 'undefined' && _discordPollInterval) {
            clearInterval(_discordPollInterval);
            _discordPollInterval = null;
        }
    }
}

let currentSetupStep = 0;
let users = [
    {
        username: 'User',
        password: '',
        email: '',
        avatar: '👤',
        avatarColor: '#0078d4',
        accountType: 'local'
    }
];
let currentUserIndex = 0;
let userData = users[0];
let openWindows = [];
let nextWindowZ = 100;
let calculatorDisplay = '0';
let calculatorMemory = 0;
let calculatorOperator = null;
let cpuUsage = 0;
let memUsage = 0;
let processes = [];

const setupSteps = [
    'step-welcome',
    'step-region',
    'step-keyboard',
    'step-wifi',
    'step-drive',
    'step-account-type',
    'step-installing'
];

function setupNext() {
    const currentStep = setupSteps[currentSetupStep];
    
    if (currentStep === 'step-wifi') {
        if (!userData.wifiNetwork) {
            userData.wifiNetwork = 'offline';
        }
    }
    
    if (currentStep === 'step-drive') {
        if (userData.selectedDrive === -1) {
            alert('Please select a drive');
            return;
        }
    }
    
    if (currentStep === 'step-account') {
        const username = document.getElementById('username-input').value.trim();
        if (!username) {
            alert('Please enter a name');
            return;
        }
        userData.username = username;
    }
    
    if (currentStep === 'step-password') {
        const password = document.getElementById('password-input').value;
        const confirm = document.getElementById('password-confirm').value;
        if (!password) {
            alert('Please enter a password');
            return;
        }
        if (password !== confirm) {
            alert('Passwords do not match');
            return;
        }
        userData.password = password;
    }
    
    if (currentStep === 'step-microsoft-account') {
        const email = document.getElementById('microsoft-email').value.trim();
        if (!email) {
            alert('Please enter your email');
            return;
        }
        userData.email = email;
        userData.username = email.split('@')[0];
        document.getElementById('microsoft-email-display').textContent = email;
    }
    
    if (currentStep === 'step-microsoft-password') {
        const password = document.getElementById('microsoft-password-input').value;
        if (!password) {
            alert('Please enter your password');
            return;
        }
        userData.password = password;
    }
    
    const currentStepElement = document.getElementById(currentStep);
    if (currentStepElement) {
        currentStepElement.classList.remove('active');
    }
    currentSetupStep++;
    
    if (currentSetupStep < setupSteps.length) {
        const nextStepElement = document.getElementById(setupSteps[currentSetupStep]);
        if (nextStepElement) {
            nextStepElement.classList.add('active');
        }
        
        if (setupSteps[currentSetupStep] === 'step-installing') {
            startInstallation();
        }
    }
}

function selectWifi(networkName) {
    userData.wifiNetwork = networkName;
    document.getElementById('wifi-network-name').textContent = networkName;
    
    if (networkName === 'Guest Network') {
        setupNext();
    } else {
        document.getElementById('step-wifi').classList.remove('active');
        document.getElementById('step-wifi-password').classList.add('active');
    }
}

function connectWifi() {
    const password = document.getElementById('wifi-password-input').value;
    if (!password) {
        alert('Please enter the network password');
        return;
    }
    
    document.getElementById('step-wifi-password').classList.remove('active');
    document.getElementById('step-wifi').classList.add('active');
    setupNext();
}

function selectDrive(driveIndex) {
    document.querySelectorAll('.drive-item').forEach((item, index) => {
        item.classList.toggle('selected', index === driveIndex);
    });
    
    userData.selectedDrive = driveIndex;
    document.getElementById('drive-next-btn').disabled = false;
}

function selectAccountType(type) {
    userData.accountType = type;
    
    if (type === 'microsoft') {
        document.getElementById('step-account-type').classList.remove('active');
        document.getElementById('step-microsoft-account').classList.add('active');
    } else {
        document.getElementById('step-account-type').classList.remove('active');
        document.getElementById('step-account').classList.add('active');
    }
}

function handleMicrosoftAccountNext() {
    document.getElementById('step-microsoft-account').classList.remove('active');
    document.getElementById('step-microsoft-password').classList.add('active');
}

function handleMicrosoftPasswordNext() {
    document.getElementById('step-microsoft-password').classList.remove('active');
    document.getElementById('step-privacy').classList.add('active');
}

function handleLocalAccountNext() {
    const username = document.getElementById('username-input').value.trim();
    if (!username) {
        alert('Please enter a name');
        return;
    }
    userData.username = username;
    document.getElementById('step-account').classList.remove('active');
    document.getElementById('step-password').classList.add('active');
}

function handleLocalPasswordNext() {
    const password = document.getElementById('password-input').value;
    const confirm = document.getElementById('password-confirm').value;
    if (!password) {
        alert('Please enter a password');
        return;
    }
    if (password !== confirm) {
        alert('Passwords do not match');
        return;
    }
    userData.password = password;
    document.getElementById('step-password').classList.remove('active');
    document.getElementById('step-privacy').classList.add('active');
}

function handleMicrosoftAccountNext() {
    const email = document.getElementById('microsoft-email').value.trim();
    if (!email) {
        alert('Please enter your email');
        return;
    }
    userData.email = email;
    userData.username = email.split('@')[0];
    document.getElementById('microsoft-email-display').textContent = email;
    document.getElementById('step-microsoft-account').classList.remove('active');
    document.getElementById('step-microsoft-password').classList.add('active');
}

function handleMicrosoftPasswordNext() {
    const password = document.getElementById('microsoft-password-input').value;
    if (!password) {
        alert('Please enter your password');
        return;
    }
    userData.password = password;
    document.getElementById('step-microsoft-password').classList.remove('active');
    document.getElementById('step-privacy').classList.add('active');
}

function handlePrivacyNext() {
    document.getElementById('step-privacy').classList.remove('active');
    currentSetupStep = setupSteps.indexOf('step-installing');
    document.getElementById('step-installing').classList.add('active');
    startInstallation();
}

function createMicrosoftAccount() {
    alert('Create account feature - redirects to Microsoft account creation page');
}

function forgotPassword() {
    alert('Forgot password feature - redirects to Microsoft account recovery');
}

function startInstallation() {
    const messages = [
        'Installing Windows...',
        'Setting up devices...',
        'Getting ready...',
        'Almost there...',
        'Finalizing setup...'
    ];
    
    let progress = 0;
    let messageIndex = 0;
    
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 100) progress = 100;
        
        document.getElementById('progress-fill').style.width = progress + '%';
        document.getElementById('progress-text').textContent = Math.floor(progress) + '%';
        
        if (progress > 20 * (messageIndex + 1) && messageIndex < messages.length - 1) {
            messageIndex++;
            document.getElementById('install-message').textContent = messages[messageIndex];
        }
        
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                showScreen('screen-lock');
                updateLockTime();
            }, 1000);
        }
    }, 500);
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
        target.style.display = 'flex';
    }
    // Auto-exchange Discord OAuth code when the desktop first becomes visible
    if (screenId === 'screen-desktop') {
        setTimeout(_discordAutoExchange, 600);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const savedUsers = localStorage.getItem('windowsUsers');
    if (savedUsers) {
        try {
            users = JSON.parse(savedUsers);
            userData = users[0];
        } catch (e) {
            console.error('Error parsing users:', e);
        }
    }
    
    const savedUserData = localStorage.getItem('windowsUserData');
    if (!savedUserData && !savedUsers) {
        // Only redirect if we're not already on a setup page
        if (!window.location.pathname.includes('setup')) {
            window.location.href = 'setup_1.html';
            return;
        }
    }
    
    // Ensure we have at least one user
    if (!users || users.length === 0) {
        users = [{
            username: 'User',
            password: '',
            email: '',
            avatar: '👤',
            avatarColor: '#0078d4',
            accountType: 'local'
        }];
        userData = users[0];
    }
    
    // ── Skip boot/lock/login if user already set up — just restore desktop ──
    const _alreadySetup = localStorage.getItem('windowsUserData') || localStorage.getItem('windowsUsers');
    if (_alreadySetup) {
        // Snap straight to desktop — update profile info then show it
        const _su = document.getElementById('start-username');
        if (_su) _su.textContent = userData ? userData.username : 'User';
        const _sa = document.querySelector('.start-avatar');
        if (_sa) {
            if (userData && userData.avatarUrl) {
                _sa.innerHTML = '';
                _sa.style.background = `url('${userData.avatarUrl}') center/cover no-repeat`;
            } else {
                _sa.innerHTML = (userData && userData.avatar) || '👤';
                _sa.style.background = (userData && userData.avatarColor) || '#0078d4';
            }
        }
        showScreen('screen-desktop');
        // Also restore Discord session into the UI
        setTimeout(_discordAutoExchange, 200);
    } else {
        startBootSequence();
    }

    document.getElementById('screen-lock')?.addEventListener('click', () => {
        showScreen('screen-login');
        if (userData) {
            document.getElementById('login-username').textContent = userData.username;
        }
        renderUserList();
    });
    
    const loginPasswordInput = document.getElementById('login-password');
    if (loginPasswordInput) {
        loginPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') attemptLogin();
        });
    }
    
    updateClock();
    setInterval(updateClock, 1000);
    
    startPerformanceMonitoring();
    updatePlanBadge();
    
    checkUrlParams();
});

// ── Plan badge in the system tray (shows current VM plan, click for popup) ──
function updatePlanBadge() {
    const badge = document.getElementById('plan-badge');
    if (!badge) return;
    const s = window._vmSpecs || {};
    if (!s.plan) { badge.style.display = 'none'; return; }
    const meta = (typeof getPlanMeta === 'function') ? getPlanMeta(s.plan) : { name:s.plan, icon:'💻', color1:'#3ba55d', color2:'#22c55e' };
    badge.style.display = 'inline-block';
    badge.textContent = meta.icon + ' ' + meta.name.toUpperCase();
    badge.style.background = `linear-gradient(135deg, ${meta.color1}, ${meta.color2})`;
}

// ── Click the plan badge → cool popup with current specs + switch button ──
function openPlanPopup() {
    document.getElementById('plan-popup')?.remove();
    const s = window._vmSpecs || {};
    const meta = getPlanMeta(s.plan);
    const ramStr     = s.ram     ? `${s.ram} GB DDR5`             : '500 GB DDR5';
    const cpuStr     = s.cpu     ? `${s.cpu} GHz`                 : '8.0 GHz';
    const gpuStr     = s.gpu     ? `NVIDIA ${s.gpu}`              : 'NVIDIA RTX 4090 24GB';
    const storageStr = s.storage ? (s.storage >= 1000 ? (s.storage/1000).toFixed(0)+' TB' : s.storage+' GB') : '100 TB';
    const popup = document.createElement('div');
    popup.id = 'plan-popup';
    popup.style.cssText = 'position:fixed;bottom:54px;right:14px;width:300px;background:rgba(28,30,42,0.96);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:0;z-index:99999;color:white;font-family:Segoe UI,sans-serif;box-shadow:0 16px 40px rgba(0,0,0,0.5);animation:planPopupIn .25s cubic-bezier(.2,1.1,.4,1);overflow:hidden;';
    popup.innerHTML = `
        <style>
            @keyframes planPopupIn { from { opacity:0; transform:translateY(10px) scale(.95); } to { opacity:1; transform:translateY(0) scale(1); } }
        </style>
        <div style="padding:16px 18px;background:linear-gradient(135deg,${meta.color1},${meta.color2});">
            <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;opacity:.85;font-weight:700;">Active VM Plan</div>
            <div style="font-size:20px;font-weight:700;margin-top:4px;">${meta.icon} ${meta.name}</div>
            <div style="font-size:11px;opacity:.85;margin-top:2px;">${meta.tagline}</div>
        </div>
        <div style="padding:14px 18px;display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
            <div style="background:rgba(255,255,255,0.05);padding:10px;border-radius:8px;"><div style="font-size:10px;color:#8e9bff;letter-spacing:1px;font-weight:700;">CPU</div><div style="font-size:13px;font-weight:600;margin-top:2px;">${cpuStr}</div></div>
            <div style="background:rgba(255,255,255,0.05);padding:10px;border-radius:8px;"><div style="font-size:10px;color:#8e9bff;letter-spacing:1px;font-weight:700;">RAM</div><div style="font-size:13px;font-weight:600;margin-top:2px;">${ramStr}</div></div>
            <div style="background:rgba(255,255,255,0.05);padding:10px;border-radius:8px;grid-column:span 2;"><div style="font-size:10px;color:#8e9bff;letter-spacing:1px;font-weight:700;">GPU</div><div style="font-size:13px;font-weight:600;margin-top:2px;">${gpuStr}</div></div>
            <div style="background:rgba(255,255,255,0.05);padding:10px;border-radius:8px;grid-column:span 2;"><div style="font-size:10px;color:#8e9bff;letter-spacing:1px;font-weight:700;">Storage</div><div style="font-size:13px;font-weight:600;margin-top:2px;">${storageStr} NVMe SSD</div></div>
        </div>
        <div style="padding:0 18px 16px;display:flex;gap:8px;">
            <button onclick="openApp('settings');setTimeout(()=>{document.querySelectorAll('.settings-menu-item').forEach(m=>{if(m.textContent.trim()==='About') m.click();});},150);document.getElementById('plan-popup').remove();" style="flex:1;padding:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);color:white;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">View details</button>
            <button onclick="window.location.href='/run_vm_on.html'" style="flex:1;padding:10px;border:none;background:linear-gradient(135deg,${meta.color1},${meta.color2});color:white;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700;">Switch plan</button>
        </div>
    `;
    document.body.appendChild(popup);
    // Click outside to close
    setTimeout(() => {
        const close = (e) => { if (!popup.contains(e.target)) { popup.remove(); document.removeEventListener('click', close); } };
        document.addEventListener('click', close);
    }, 100);
}

function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const openedApp = params.get('opened');
    if (openedApp) {
        setTimeout(() => {
            openApp(openedApp);
        }, 5500);
    }
}

function updateUrlParam(appName) {
    const url = new URL(window.location);
    if (appName) {
        url.searchParams.set('opened', appName);
    } else {
        url.searchParams.delete('opened');
    }
    window.history.replaceState({}, '', url);
}

function playSound(soundName) {
    try {
        if (soundName === 'startup') {
            const iframe = document.getElementById('startup-sound');
            if (iframe) {
                iframe.src = 'https://www.myinstants.com/instant/windows-10-startup-sound-tune-93817/embed/';
            }
        } else if (soundName === 'boot') {
            const iframe = document.getElementById('boot-sound');
            if (iframe) {
                iframe.src = 'https://www.myinstants.com/instant/windows-10-boot-8293/embed/';
            }
        } else {
            const audio = document.getElementById(soundName + '-sound');
            if (audio) {
                audio.currentTime = 0;
                audio.volume = 0.5;
                audio.play().catch(() => {});
            }
        }
    } catch (e) {}
}

function startBootSequence() {
    console.log('Boot sequence started');
    const bootStatus = document.getElementById('boot-status');
    const bootMessages = [
        'Loading Windows...',
        'Starting services...',
        'Loading system files...',
        'Starting desktop environment...'
    ];
    
    let messageIndex = 0;
    if (window.bootInterval) clearInterval(window.bootInterval);
    if (window.bootTimeout) clearTimeout(window.bootTimeout);

    // Immediate first message
    if (bootStatus) bootStatus.textContent = bootMessages[0];

    window.bootInterval = setInterval(() => {
        messageIndex++;
        if (messageIndex < bootMessages.length) {
            if (bootStatus) bootStatus.textContent = bootMessages[messageIndex];
        } else {
            clearInterval(window.bootInterval);
            finishBoot();
        }
    }, 1000);

    // Safety fallback
    window.bootTimeout = setTimeout(() => {
        const bootScreen = document.getElementById('screen-boot');
        if (bootScreen && bootScreen.classList.contains('active')) {
            console.log('Boot safety trigger');
            clearInterval(window.bootInterval);
            finishBoot();
        }
    }, 6000);
}

function finishBoot() {
    console.log('Boot finished');
    if (window.bootInterval) clearInterval(window.bootInterval);
    if (window.bootTimeout) clearTimeout(window.bootTimeout);
    
    showScreen('screen-lock');
    updateLockTime();
    playSound('startup');
}

function startLoginSequence() {
    const loggingInText = document.getElementById('logging-in-text');
    const loginStatus = document.getElementById('login-status');
    
    if (loggingInText) loggingInText.textContent = 'Welcome';
    if (loginStatus) loginStatus.textContent = userData.username;
    
    // Make sure other screens are hidden
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    showScreen('screen-logging-in');
    
    setTimeout(() => {
        if (loggingInText) loggingInText.textContent = 'Signing in...';
        if (loginStatus) loginStatus.textContent = 'Setting up your account';
    }, 1500);
    
    setTimeout(() => {
        showScreen('screen-getting-ready');
    }, 3000);
    
    setTimeout(() => {
        // Force all other screens off before showing desktop
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });
        const desktopScreen = document.getElementById('screen-desktop');
        if (desktopScreen) {
            desktopScreen.classList.add('active');
            desktopScreen.style.display = 'block';
        }
        
        // Update Desktop Profile Info
        const startUsernameEl = document.getElementById('start-username');
        if (startUsernameEl) startUsernameEl.textContent = userData.username;
        
        const startAvatarEl = document.querySelector('.start-avatar');
        if (startAvatarEl) {
            if (userData.avatarUrl) {
                startAvatarEl.innerHTML = '';
                startAvatarEl.style.background = `url('${userData.avatarUrl}') center/cover no-repeat`;
            } else {
                startAvatarEl.innerHTML = userData.avatar || '👤';
                startAvatarEl.style.background = userData.avatarColor || '#0078d4';
            }
        }
        
        playSound('notification');
    }, 5000);
}

function attemptLogin() {
    const passwordInput = document.getElementById('login-password');
    const enteredPassword = passwordInput.value;
    const errorElement = document.getElementById('login-error');
    
    if (enteredPassword === userData.password) {
        passwordInput.value = '';
        if (errorElement) errorElement.textContent = '';
        startLoginSequence();
    } else {
        if (errorElement) errorElement.textContent = 'Incorrect password. Please try again.';
        passwordInput.value = '';
        playSound('error');
    }
}

function switchUser() {
    document.getElementById('login-password').value = '';
    document.getElementById('login-error').textContent = '';
}

function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const dateStr = now.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
    
    const clockElement = document.getElementById('taskbar-clock');
    if (clockElement) {
        clockElement.innerHTML = `${timeStr}<br>${dateStr}`;
    }
    
    // Also update lock screen time if it's visible
    const lockTime = document.getElementById('lock-time');
    const lockDate = document.getElementById('lock-date');
    if (lockTime) lockTime.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    if (lockDate) lockDate.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function updateLockTime() {
    updateClock();
}

function toggleStartMenu() {
    const startMenu = document.getElementById('start-menu');
    startMenu.classList.toggle('active');
    
    const powerMenu = document.getElementById('power-menu');
    if (powerMenu.classList.contains('active')) {
        powerMenu.classList.remove('active');
    }
}

function togglePowerMenu() {
    const powerMenu = document.getElementById('power-menu');
    powerMenu.classList.toggle('active');
}

function toggleNotifications() {
    const notificationCenter = document.getElementById('notification-center');
    notificationCenter.classList.toggle('active');
}

function lockScreen() {
    showScreen('screen-lock');
    updateLockTime();
    closeAllWindows();
}

function signOut() {
    closeAllWindows();
    toggleStartMenu(false);
    
    showScreen('screen-signout');
    
    setTimeout(() => {
        showScreen('screen-lock');
        updateLockTime();
        document.getElementById('login-password').value = '';
    }, 2500);
}

function restart() {
    closeAllWindows();
    showScreen('screen-shutdown');
    document.getElementById('shutdown-text').textContent = 'Restarting...';
    
    setTimeout(() => {
        showScreen('screen-lock');
        updateLockTime();
    }, 3000);
}

function shutdown() {
    playSound('shutdown');
    closeAllWindows();
    toggleStartMenu(false);
    showScreen('screen-shutdown');
    document.getElementById('shutdown-text').textContent = 'Shutting down...';
    
    setTimeout(() => {
        showScreen('screen-off');
        
        setTimeout(() => {
            window.close();
            
            if (!window.closed) {
                document.body.innerHTML = `
                    <div style="width: 100%; height: 100vh; background: #000; display: flex; align-items: center; justify-content: center; flex-direction: column; color: #333;">
                        <p style="font-size: 14px; color: #555;">Computer has been shut down</p>
                        <button onclick="location.reload()" style="margin-top: 20px; padding: 12px 24px; background: #0078d4; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">🔄 Power On</button>
                    </div>
                `;
            }
        }, 500);
    }, 5000);
}

function closeAllWindows() {
    openWindows.forEach(win => {
        if (win.element && win.element.parentNode) {
            win.element.parentNode.removeChild(win.element);
        }
    });
    openWindows = [];
    updateTaskbar();
}

function openApp(appName) {
    const existingWindow = openWindows.find(w => w.appName === appName);
    if (existingWindow) {
        focusWindow(existingWindow);
        return;
    }
    
    const windowData = createWindow(appName);
    openWindows.push(windowData);
    updateTaskbar();
    updateUrlParam(appName);
    
    const startMenu = document.getElementById('start-menu');
    if (startMenu.classList.contains('active')) {
        startMenu.classList.remove('active');
    }
}

function createWindow(appName) {
    const windowEl = document.createElement('div');
    windowEl.className = 'window active';
    windowEl.dataset.app = appName;
    windowEl.style.left = (100 + openWindows.length * 30) + 'px';
    windowEl.style.top = (50 + openWindows.length * 30) + 'px';
    windowEl.style.zIndex = nextWindowZ++;
    
    const defaultSizes = {
        browser: { w: 900, h: 600 },
        chrome: { w: 900, h: 600 },
        explorer: { w: 800, h: 500 },
        settings: { w: 750, h: 550 },
        taskmgr: { w: 650, h: 450 },
        cmd: { w: 650, h: 400 },
        powershell: { w: 650, h: 400 },
        notepad: { w: 600, h: 450 },
        wordpad: { w: 700, h: 500 },
        code: { w: 800, h: 550 },
        stickynotes: { w: 300, h: 300 },
        calculator: { w: 320, h: 430 }
    };
    const size = defaultSizes[appName] || { w: 700, h: 480 };
    windowEl.style.width = size.w + 'px';
    windowEl.style.height = size.h + 'px';
    
    // LAZY: only create the requested app — prevents all timers/setIntervals from running on every openApp call
    const appFactories = {
        calculator:   () => ({ title: '🔢 Calculator',            content: createCalculator() }),
        notepad:      () => ({ title: '📝 Notepad',               content: createNotepad() }),
        wordpad:      () => ({ title: '📄 WordPad',               content: createWordPad() }),
        explorer:     () => ({ title: '📁 File Explorer',         content: createExplorer() }),
        settings:     () => ({ title: '⚙️ Settings',              content: createSettings() }),
        taskmgr:      () => ({ title: '📊 Task Manager',          content: createTaskManager() }),
        browser:      () => ({ title: '🌐 Microsoft Edge',        content: createBrowser() }),
        computer:     () => ({ title: '💻 This PC',               content: createComputer() }),
        trash:        () => ({ title: '🗑️ Recycle Bin',           content: createRecycleBin() }),
        search:       () => ({ title: '🔍 Search',                content: createSearch() }),
        google_setup: () => ({ title: '🌐 Google Chrome Setup',   content: createGoogleSetup() }),
        chrome:       () => ({ title: '🔵 Google Chrome',         content: createChrome() }),
        cmd:          () => ({ title: '⬛ Command Prompt',         content: createCMD() }),
        powershell:   () => ({ title: '🔷 Windows PowerShell',    content: createPowerShell() }),
        paint:        () => ({ title: '🎨 Paint',                 content: createPaint() }),
        weather:      () => ({ title: '🌤️ Weather',               content: createWeather() }),
        snipping:     () => ({ title: '✂️ Snipping Tool',          content: createSnipping() }),
        photos:       () => ({ title: '🖼️ Photos',                content: createPhotos() }),
        calendar:     () => ({ title: '📅 Calendar',              content: createCalendar() }),
        clock:        () => ({ title: '⏰ Alarms & Clock',         content: createClockApp() }),
        maps:         () => ({ title: '🗺️ Maps',                  content: createMaps() }),
        store:        () => ({ title: '🛍️ Microsoft Store',       content: createStore() }),
        wifi:         () => ({ title: '📶 Network & Internet',     content: createWifiSettings() }),
        defender:     () => ({ title: '🛡️ Windows Security',      content: createDefender() }),
        music:        () => ({ title: '🎵 Groove Music',           content: createMusicPlayer() }),
        solitaire:    () => ({ title: '🃏 Solitaire',             content: createSolitaire() }),
        discord:      () => ({ title: '💬 Discord',               content: createDiscordApp() }),
        advanced:     () => ({ title: '⚙️ Advanced Settings',     content: createAdvancedSettings() }),
        code:         () => ({ title: '💻 VS Code',               content: createCodeEditor() }),
        sysinfo:      () => ({ title: 'ℹ️ System Information',     content: createSystemInfo() }),
        stickynotes:  () => ({ title: '🟡 Sticky Notes',          content: createStickyNotes() }),
        controlpanel: () => ({ title: '🎛️ Control Panel',         content: createControlPanel() }),
        devmgr:       () => ({ title: '🖥️ Device Manager',        content: createDeviceManager() }),
        registry:     () => ({ title: '📋 Registry Editor',       content: createRegistryEditor() }),
        mediaplayer:  () => ({ title: '▶️ Windows Media Player',  content: createMediaPlayer() }),
        teams:        () => ({ title: '👥 Microsoft Teams',       content: createTeams() }),
        speedtest:    () => ({ title: '⚡ Speed Test',            content: createSpeedTest() }),
        mail:         () => ({ title: '📧 Mail',                  content: createMail() }),
        xbox:         () => ({ title: '🎮 Xbox',                  content: createXbox() }),
        imagegen:     () => ({ title: '🎨 AI Image Generator',    content: createImageGenerator() }),
        bluetooth:    () => ({ title: '📡 Bluetooth & Devices',   content: createBluetooth() }),
    };

    const appData = (appFactories[appName] || (() => ({ title: '🪟 Window', content: '<div style="padding:20px;color:#666;">App not found: ' + appName + '</div>' })))();
    
    windowEl.innerHTML = `
        <div class="window-resize-n"></div>
        <div class="window-resize-s"></div>
        <div class="window-resize-e"></div>
        <div class="window-resize-w"></div>
        <div class="window-resize-ne"></div>
        <div class="window-resize-nw"></div>
        <div class="window-resize-se"></div>
        <div class="window-resize-sw"></div>
        <div class="window-titlebar" ondblclick="maximizeWindow('${appName}')">
            <div class="window-title">${appData.title}</div>
            <div class="window-controls">
                <button class="window-control minimize" onclick="minimizeWindow('${appName}')">−</button>
                <button class="window-control maximize" onclick="maximizeWindow('${appName}')">□</button>
                <button class="window-control close" onclick="closeWindow('${appName}')">✕</button>
            </div>
        </div>
        <div class="window-content ${appName === 'notepad' || appName === 'wordpad' ? 'notepad-content' : ''}" id="window-content-${appName}">
            ${appData.content}
        </div>
    `;
    
    document.getElementById('windows-container').appendChild(windowEl);
    
    if (appName === 'paint') {
        setTimeout(setupPaint, 100);
    }
    if (appName === 'discord') {
        setTimeout(discordInitIfLoggedIn, 50);
    }
    
    windowEl.addEventListener('mousedown', () => focusWindow({ appName, element: windowEl }));
    
    makeDraggable(windowEl);
    makeResizable(windowEl);
    
    return { appName, element: windowEl, title: appData.title };
}

function makeDraggable(element) {
    const titlebar = element.querySelector('.window-titlebar');
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    titlebar.onmousedown = dragMouseDown;
    
    function dragMouseDown(e) {
        if (e.target.classList.contains('window-control')) return;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        element.style.transition = 'none';
    }
    
    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        let newTop = element.offsetTop - pos2;
        let newLeft = element.offsetLeft - pos1;
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - 48));
        newLeft = Math.max(-element.offsetWidth + 100, Math.min(newLeft, window.innerWidth - 100));
        element.style.top = newTop + 'px';
        element.style.left = newLeft + 'px';
    }
    
    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        element.style.transition = '';
    }
}

function makeResizable(element) {
    const handles = element.querySelectorAll('[class^="window-resize"]');
    handles.forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const dir = handle.className.replace('window-resize-', '');
            const startX = e.clientX, startY = e.clientY;
            const startW = element.offsetWidth, startH = element.offsetHeight;
            const startLeft = element.offsetLeft, startTop = element.offsetTop;
            
            function onMove(e) {
                const dx = e.clientX - startX, dy = e.clientY - startY;
                if (dir.includes('e')) element.style.width = Math.max(300, startW + dx) + 'px';
                if (dir.includes('s')) element.style.height = Math.max(200, startH + dy) + 'px';
                if (dir.includes('w')) {
                    const newW = Math.max(300, startW - dx);
                    element.style.width = newW + 'px';
                    element.style.left = (startLeft + startW - newW) + 'px';
                }
                if (dir.includes('n')) {
                    const newH = Math.max(200, startH - dy);
                    element.style.height = newH + 'px';
                    element.style.top = (startTop + startH - newH) + 'px';
                }
            }
            function onUp() {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            }
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    });
}

function focusWindow(windowData) {
    openWindows.forEach(w => {
        if (w.element) w.element.classList.remove('active');
    });
    if (windowData.element) {
        windowData.element.classList.add('active');
        windowData.element.style.zIndex = nextWindowZ++;
    }
    updateTaskbar();
}

function minimizeWindow(appName) {
    const windowData = openWindows.find(w => w.appName === appName);
    if (windowData && windowData.element) {
        windowData.element.style.display = 'none';
    }
    updateTaskbar();
}

function maximizeWindow(appName) {
    const windowData = openWindows.find(w => w.appName === appName);
    if (windowData && windowData.element) {
        const win = windowData.element;
        if (win.style.width === '100%') {
            win.style.width = '';
            win.style.height = '';
            win.style.left = '';
            win.style.top = '';
        } else {
            win.style.width = '100%';
            win.style.height = 'calc(100% - 48px)';
            win.style.left = '0';
            win.style.top = '0';
        }
    }
}

function closeWindow(appName) {
    const windowData = openWindows.find(w => w.appName === appName);
    if (windowData && windowData.element) {
        windowData.element.remove();
    }
    openWindows = openWindows.filter(w => w.appName !== appName);
    updateTaskbar();
}

function updateTaskbar() {
    const taskbarApps = document.getElementById('taskbar-apps');
    taskbarApps.innerHTML = '';
    
    openWindows.forEach(win => {
        const btn = document.createElement('button');
        btn.className = 'taskbar-app';
        btn.textContent = win.title;
        btn.onclick = () => {
            if (win.element.style.display === 'none') {
                win.element.style.display = 'flex';
                focusWindow(win);
            } else {
                focusWindow(win);
            }
        };
        
        if (win.element && win.element.classList.contains('active') && win.element.style.display !== 'none') {
            btn.classList.add('active');
        }
        
        taskbarApps.appendChild(btn);
    });
}

function createCalculator() {
    setTimeout(() => {
        calculatorDisplay = '0';
        updateCalculatorDisplay();
        window._calcMode = 'standard';
        window._calcHistory = window._calcHistory || [];
    }, 10);

    return `
    <div style="display:flex;flex-direction:column;height:100%;background:#1c1c1c;font-family:Segoe UI,sans-serif;user-select:none;">
      <!-- Mode tabs -->
      <div style="display:flex;background:#2d2d2d;border-bottom:1px solid #444;">
        <button id="calc-tab-std" onclick="calcSetMode('standard',this)" style="flex:1;padding:8px;border:none;background:#0078d4;color:white;cursor:pointer;font-size:13px;font-weight:600;">Standard</button>
        <button id="calc-tab-sci" onclick="calcSetMode('scientific',this)" style="flex:1;padding:8px;border:none;background:transparent;color:#aaa;cursor:pointer;font-size:13px;">Scientific</button>
        <button id="calc-tab-his" onclick="calcSetMode('history',this)" style="flex:1;padding:8px;border:none;background:transparent;color:#aaa;cursor:pointer;font-size:13px;">History</button>
      </div>

      <!-- Display -->
      <div style="padding:16px 20px 8px;text-align:right;">
        <div id="calc-expr" style="font-size:12px;color:#888;min-height:18px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></div>
        <div id="calc-display" style="font-size:40px;font-weight:300;color:white;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">0</div>
      </div>

      <!-- Standard buttons -->
      <div id="calc-panel-standard" style="flex:1;display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:1fr;gap:1px;background:#444;padding-top:1px;">
        <button class="calc-btn2" onclick="calcPercent()" style="grid-column:1">%</button>
        <button class="calc-btn2" onclick="calcClearEntry()">CE</button>
        <button class="calc-btn2" onclick="calcClear()">C</button>
        <button class="calc-btn2 op2" onclick="calcDelete()">⌫</button>

        <button class="calc-btn2" onclick="calcSpecial('1/x')">¹/x</button>
        <button class="calc-btn2" onclick="calcSpecial('x²')">x²</button>
        <button class="calc-btn2" onclick="calcSpecial('√x')">²√x</button>
        <button class="calc-btn2 op2" onclick="calcOperation('/')">÷</button>

        <button class="calc-btn2 num2" onclick="calcNumber('7')">7</button>
        <button class="calc-btn2 num2" onclick="calcNumber('8')">8</button>
        <button class="calc-btn2 num2" onclick="calcNumber('9')">9</button>
        <button class="calc-btn2 op2" onclick="calcOperation('*')">×</button>

        <button class="calc-btn2 num2" onclick="calcNumber('4')">4</button>
        <button class="calc-btn2 num2" onclick="calcNumber('5')">5</button>
        <button class="calc-btn2 num2" onclick="calcNumber('6')">6</button>
        <button class="calc-btn2 op2" onclick="calcOperation('-')">−</button>

        <button class="calc-btn2 num2" onclick="calcNumber('1')">1</button>
        <button class="calc-btn2 num2" onclick="calcNumber('2')">2</button>
        <button class="calc-btn2 num2" onclick="calcNumber('3')">3</button>
        <button class="calc-btn2 op2" onclick="calcOperation('+')">+</button>

        <button class="calc-btn2" onclick="calcSign()">+/−</button>
        <button class="calc-btn2 num2" onclick="calcNumber('0')">0</button>
        <button class="calc-btn2" onclick="calcDecimal()">.</button>
        <button class="calc-btn2" onclick="calcEquals()" style="background:#0078d4;color:white;">=</button>
      </div>

      <!-- Scientific panel (hidden by default) -->
      <div id="calc-panel-scientific" style="flex:1;display:none;flex-direction:column;">
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:#444;flex:1;">
          <button class="calc-btn2" onclick="calcSci('sin')">sin</button>
          <button class="calc-btn2" onclick="calcSci('cos')">cos</button>
          <button class="calc-btn2" onclick="calcSci('tan')">tan</button>
          <button class="calc-btn2" onclick="calcSci('log')">log</button>
          <button class="calc-btn2" onclick="calcSci('ln')">ln</button>

          <button class="calc-btn2" onclick="calcSci('asin')">sin⁻¹</button>
          <button class="calc-btn2" onclick="calcSci('acos')">cos⁻¹</button>
          <button class="calc-btn2" onclick="calcSci('atan')">tan⁻¹</button>
          <button class="calc-btn2" onclick="calcSci('10^x')">10ˣ</button>
          <button class="calc-btn2" onclick="calcSci('e^x')">eˣ</button>

          <button class="calc-btn2" onclick="calcNumber(String(Math.PI.toFixed(10)))">π</button>
          <button class="calc-btn2" onclick="calcNumber(String(Math.E.toFixed(10)))">e</button>
          <button class="calc-btn2" onclick="calcSci('x³')">x³</button>
          <button class="calc-btn2" onclick="calcSci('∛x')">∛x</button>
          <button class="calc-btn2" onclick="calcSci('x!')">x!</button>

          <button class="calc-btn2" onclick="calcPercent()">%</button>
          <button class="calc-btn2" onclick="calcClearEntry()">CE</button>
          <button class="calc-btn2" onclick="calcClear()">C</button>
          <button class="calc-btn2 op2" style="grid-column:span 2" onclick="calcDelete()">⌫</button>

          <button class="calc-btn2" onclick="calcSpecial('1/x')">¹/x</button>
          <button class="calc-btn2" onclick="calcSpecial('x²')">x²</button>
          <button class="calc-btn2" onclick="calcSpecial('√x')">²√x</button>
          <button class="calc-btn2 op2" style="grid-column:span 2" onclick="calcOperation('/')">÷</button>

          <button class="calc-btn2 num2" onclick="calcNumber('7')">7</button>
          <button class="calc-btn2 num2" onclick="calcNumber('8')">8</button>
          <button class="calc-btn2 num2" onclick="calcNumber('9')">9</button>
          <button class="calc-btn2 op2" style="grid-column:span 2" onclick="calcOperation('*')">×</button>

          <button class="calc-btn2 num2" onclick="calcNumber('4')">4</button>
          <button class="calc-btn2 num2" onclick="calcNumber('5')">5</button>
          <button class="calc-btn2 num2" onclick="calcNumber('6')">6</button>
          <button class="calc-btn2 op2" style="grid-column:span 2" onclick="calcOperation('-')">−</button>

          <button class="calc-btn2 num2" onclick="calcNumber('1')">1</button>
          <button class="calc-btn2 num2" onclick="calcNumber('2')">2</button>
          <button class="calc-btn2 num2" onclick="calcNumber('3')">3</button>
          <button class="calc-btn2 op2" style="grid-column:span 2" onclick="calcOperation('+')">+</button>

          <button class="calc-btn2" onclick="calcSign()">+/−</button>
          <button class="calc-btn2 num2" onclick="calcNumber('0')">0</button>
          <button class="calc-btn2" onclick="calcDecimal()">.</button>
          <button class="calc-btn2" onclick="calcEquals()" style="background:#0078d4;color:white;grid-column:span 2">=</button>
        </div>
      </div>

      <!-- History panel -->
      <div id="calc-panel-history" style="flex:1;display:none;overflow-y:auto;padding:12px;background:#1c1c1c;">
        <div id="calc-history-list" style="display:flex;flex-direction:column;gap:8px;"></div>
        <div style="text-align:center;margin-top:16px;"><button onclick="window._calcHistory=[];calcRenderHistory()" style="background:#444;border:none;border-radius:4px;padding:6px 16px;color:#aaa;cursor:pointer;font-size:12px;">Clear history</button></div>
      </div>
    </div>
    <style>
      .calc-btn2{background:#3d3d3d;border:none;color:white;font-size:16px;cursor:pointer;padding:0;transition:background 0.1s;}
      .calc-btn2:hover{background:#525252;}
      .calc-btn2:active{background:#6a6a6a;}
      .calc-btn2.num2{background:#323232;}
      .calc-btn2.num2:hover{background:#444;}
      .calc-btn2.op2{background:#3d3d3d;color:#0078d4;font-size:20px;}
      .calc-btn2.op2:hover{background:#525252;}
    </style>`;
}

function calcSetMode(mode, btn) {
    window._calcMode = mode;
    ['standard','scientific','history'].forEach(m => {
        const tab = document.getElementById('calc-tab-' + m.slice(0,3));
        const panel = document.getElementById('calc-panel-' + m);
        if (tab) { tab.style.background = m === mode ? '#0078d4' : 'transparent'; tab.style.color = m === mode ? 'white' : '#aaa'; }
        if (panel) { panel.style.display = m === mode ? (m === 'history' ? 'block' : m === 'scientific' ? 'flex' : 'grid') : 'none'; }
    });
    if (mode === 'history') calcRenderHistory();
}

function calcRenderHistory() {
    const list = document.getElementById('calc-history-list');
    if (!list) return;
    const h = window._calcHistory || [];
    list.innerHTML = h.length === 0
        ? '<div style="text-align:center;color:#666;padding:40px 0;font-size:14px;">No calculations yet</div>'
        : h.map(e => `<div onclick="calculatorDisplay='${e.result}';updateCalculatorDisplay();calcSetMode('standard')" style="background:#2d2d2d;border-radius:6px;padding:10px 14px;cursor:pointer;" onmouseover="this.style.background='#3d3d3d'" onmouseout="this.style.background='#2d2d2d'">
            <div style="font-size:12px;color:#888;">${e.expr}</div>
            <div style="font-size:20px;color:white;">= ${e.result}</div>
          </div>`).join('');
}

function calcSci(fn) {
    const val = parseFloat(calculatorDisplay);
    if (isNaN(val)) return;
    let result;
    const deg = val * Math.PI / 180;
    switch(fn) {
        case 'sin':   result = Math.sin(deg); break;
        case 'cos':   result = Math.cos(deg); break;
        case 'tan':   result = Math.tan(deg); break;
        case 'asin':  result = Math.asin(val) * 180 / Math.PI; break;
        case 'acos':  result = Math.acos(val) * 180 / Math.PI; break;
        case 'atan':  result = Math.atan(val) * 180 / Math.PI; break;
        case 'log':   result = Math.log10(val); break;
        case 'ln':    result = Math.log(val); break;
        case '10^x':  result = Math.pow(10, val); break;
        case 'e^x':   result = Math.exp(val); break;
        case 'x³':    result = Math.pow(val, 3); break;
        case '∛x':    result = Math.cbrt(val); break;
        case 'x!':
            if (val < 0 || !Number.isInteger(val)) { result = NaN; break; }
            result = 1; for (let i = 2; i <= val; i++) result *= i; break;
        default: return;
    }
    const exprEl = document.getElementById('calc-expr');
    if (exprEl) exprEl.textContent = `${fn}(${calculatorDisplay})`;
    const r = parseFloat(result.toFixed(10));
    (window._calcHistory = window._calcHistory || []).unshift({ expr: `${fn}(${calculatorDisplay})`, result: isNaN(r) ? 'Error' : String(r) });
    calculatorDisplay = isNaN(r) ? 'Error' : String(r);
    updateCalculatorDisplay();
}

function calcPercent() {
    const val = parseFloat(calculatorDisplay);
    if (!isNaN(val)) {
        calculatorDisplay = String(val / 100);
        updateCalculatorDisplay();
    }
}

function calcSign() {
    const val = parseFloat(calculatorDisplay);
    if (!isNaN(val)) {
        calculatorDisplay = String(-val);
        updateCalculatorDisplay();
    }
}

function calcNumber(num) {
    if (calculatorDisplay === '0' || calculatorDisplay === 'Error') {
        calculatorDisplay = num;
    } else {
        calculatorDisplay += num;
    }
    updateCalculatorDisplay();
}

function calcOperation(op) {
    if (calculatorOperator && calculatorDisplay !== '') {
        calcEquals();
    }
    calculatorMemory = parseFloat(calculatorDisplay);
    calculatorOperator = op;
    calculatorDisplay = '';
}

function calcEquals() {
    if (calculatorOperator && calculatorDisplay !== '') {
        const current = parseFloat(calculatorDisplay);
        let result = 0;
        
        switch (calculatorOperator) {
            case '+': result = calculatorMemory + current; break;
            case '-': result = calculatorMemory - current; break;
            case '*': result = calculatorMemory * current; break;
            case '/': result = calculatorMemory / current; break;
        }
        
        calculatorDisplay = result.toString();
        calculatorOperator = null;
        updateCalculatorDisplay();
    }
}

function calcClear() {
    calculatorDisplay = '0';
    calculatorMemory = 0;
    calculatorOperator = null;
    updateCalculatorDisplay();
}

function calcClearEntry() {
    calculatorDisplay = '0';
    updateCalculatorDisplay();
}

function calcDelete() {
    if (calculatorDisplay.length > 1) {
        calculatorDisplay = calculatorDisplay.slice(0, -1);
    } else {
        calculatorDisplay = '0';
    }
    updateCalculatorDisplay();
}

function calcDecimal() {
    if (!calculatorDisplay.includes('.')) {
        calculatorDisplay += '.';
        updateCalculatorDisplay();
    }
}

function updateCalculatorDisplay() {
    const display = document.getElementById('calc-display');
    if (display) {
        display.textContent = calculatorDisplay;
    }
}

function createNotepad() {
    setTimeout(() => initNotepad(), 100);
    return `
    <div style="display:flex;flex-direction:column;height:100%;background:white;font-family:Segoe UI,sans-serif;">
      <!-- Menu bar -->
      <div style="background:#f3f3f3;border-bottom:1px solid #ddd;padding:2px 8px;display:flex;gap:0;font-size:13px;user-select:none;">
        ${['File','Edit','Format','View','Help'].map(m => `
          <div class="np-menu" data-menu="${m}" onclick="npMenu('${m}',event)" style="padding:5px 12px;cursor:pointer;border-radius:3px;" onmouseover="this.style.background='#e5f1fb'" onmouseout="this.style.background='transparent'">${m}</div>`).join('')}
      </div>

      <!-- Toolbar -->
      <div style="background:#fafafa;border-bottom:1px solid #eee;padding:6px 10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <button onclick="npNew()" style="padding:5px 10px;background:white;border:1px solid #ccc;border-radius:3px;cursor:pointer;font-size:12px;">📄 New</button>
        <button onclick="npOpen()" style="padding:5px 10px;background:white;border:1px solid #ccc;border-radius:3px;cursor:pointer;font-size:12px;">📂 Open</button>
        <button onclick="npSave()" style="padding:5px 10px;background:#0078d4;color:white;border:none;border-radius:3px;cursor:pointer;font-size:12px;">💾 Save</button>
        <button onclick="npFindShow()" style="padding:5px 10px;background:white;border:1px solid #ccc;border-radius:3px;cursor:pointer;font-size:12px;">🔍 Find</button>
        <button onclick="npReplaceShow()" style="padding:5px 10px;background:white;border:1px solid #ccc;border-radius:3px;cursor:pointer;font-size:12px;">🔁 Replace</button>
        <button onclick="npDateTime()" style="padding:5px 10px;background:white;border:1px solid #ccc;border-radius:3px;cursor:pointer;font-size:12px;">📅 Date/Time</button>
        <span style="width:1px;height:20px;background:#ddd;"></span>
        <label style="font-size:12px;color:#444;">Font:</label>
        <select id="np-font" onchange="npApplyStyle()" style="padding:4px 6px;font-size:12px;border:1px solid #ccc;border-radius:3px;">
          <option>Consolas</option><option>Segoe UI</option><option>Arial</option><option>Calibri</option>
          <option>Courier New</option><option>Times New Roman</option><option>Verdana</option><option>Comic Sans MS</option>
          <option>Georgia</option><option>Trebuchet MS</option>
        </select>
        <label style="font-size:12px;color:#444;">Size:</label>
        <select id="np-size" onchange="npApplyStyle()" style="padding:4px 6px;font-size:12px;border:1px solid #ccc;border-radius:3px;">
          ${[10,11,12,14,16,18,20,24,28,32,40,48].map(s => `<option ${s===14?'selected':''}>${s}</option>`).join('')}
        </select>
        <button onclick="document.getElementById('np-area').style.fontWeight=document.getElementById('np-area').style.fontWeight==='bold'?'normal':'bold'" style="padding:5px 10px;background:white;border:1px solid #ccc;border-radius:3px;cursor:pointer;font-size:12px;font-weight:bold;">B</button>
        <button onclick="document.getElementById('np-area').style.fontStyle=document.getElementById('np-area').style.fontStyle==='italic'?'normal':'italic'" style="padding:5px 10px;background:white;border:1px solid #ccc;border-radius:3px;cursor:pointer;font-size:12px;font-style:italic;">I</button>
        <input type="color" value="#000000" onchange="document.getElementById('np-area').style.color=this.value" style="width:28px;height:24px;border:1px solid #ccc;cursor:pointer;padding:0;" title="Text color">
        <label style="font-size:12px;color:#444;display:flex;align-items:center;gap:4px;"><input type="checkbox" id="np-wrap" checked onchange="document.getElementById('np-area').style.whiteSpace=this.checked?'pre-wrap':'pre';document.getElementById('np-area').style.wordWrap=this.checked?'break-word':'normal'"> Word wrap</label>
      </div>

      <!-- Find/Replace bar (hidden) -->
      <div id="np-find-bar" style="display:none;background:#fff8dc;border-bottom:1px solid #e8d97a;padding:6px 10px;align-items:center;gap:6px;flex-wrap:wrap;">
        <input id="np-find-input" placeholder="Find..." onkeydown="if(event.key==='Enter')npFindNext()" style="padding:5px 8px;border:1px solid #ccc;border-radius:3px;font-size:12px;width:160px;">
        <input id="np-replace-input" placeholder="Replace with..." onkeydown="if(event.key==='Enter')npReplaceOne()" style="padding:5px 8px;border:1px solid #ccc;border-radius:3px;font-size:12px;width:160px;">
        <button onclick="npFindNext()" style="padding:4px 10px;font-size:12px;cursor:pointer;background:white;border:1px solid #ccc;border-radius:3px;">▼ Next</button>
        <button onclick="npFindPrev()" style="padding:4px 10px;font-size:12px;cursor:pointer;background:white;border:1px solid #ccc;border-radius:3px;">▲ Prev</button>
        <button onclick="npReplaceOne()" style="padding:4px 10px;font-size:12px;cursor:pointer;background:white;border:1px solid #ccc;border-radius:3px;">Replace</button>
        <button onclick="npReplaceAll()" style="padding:4px 10px;font-size:12px;cursor:pointer;background:#0078d4;color:white;border:none;border-radius:3px;">Replace all</button>
        <label style="font-size:11px;display:flex;align-items:center;gap:3px;"><input type="checkbox" id="np-find-case"> Match case</label>
        <span id="np-find-status" style="font-size:11px;color:#666;margin-left:auto;"></span>
        <button onclick="document.getElementById('np-find-bar').style.display='none'" style="padding:2px 8px;cursor:pointer;background:transparent;border:none;font-size:14px;">✕</button>
      </div>

      <!-- Text area -->
      <textarea id="np-area" class="notepad-textarea" placeholder="Start typing..."
        style="flex:1;border:none;outline:none;resize:none;padding:14px 18px;font-family:Consolas,monospace;font-size:14px;line-height:1.5;color:#000;background:white;width:100%;box-sizing:border-box;"
        oninput="npUpdateStats()"></textarea>

      <!-- Status bar -->
      <div style="background:#0078d4;color:white;padding:4px 14px;font-size:11px;display:flex;gap:18px;">
        <span id="np-pos">Ln 1, Col 1</span>
        <span id="np-words">0 words</span>
        <span id="np-chars">0 chars (0 selected)</span>
        <span id="np-lines">1 line</span>
        <span style="margin-left:auto;">UTF-8 · CRLF · 100%</span>
      </div>
    </div>`;
}

function initNotepad() {
    const a = document.getElementById('np-area');
    if (!a) return;
    a.addEventListener('keyup', npUpdateStats);
    a.addEventListener('click', npUpdateStats);
    a.addEventListener('select', npUpdateStats);
    npUpdateStats();
}

function npUpdateStats() {
    const a = document.getElementById('np-area');
    if (!a) return;
    const text = a.value;
    const sel = text.substring(a.selectionStart, a.selectionEnd);
    const words = (text.match(/\S+/g) || []).length;
    const lines = text.split(/\r\n|\r|\n/).length;
    const before = text.substring(0, a.selectionStart);
    const ln = before.split(/\r\n|\r|\n/).length;
    const col = before.length - before.lastIndexOf('\n');
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('np-pos', `Ln ${ln}, Col ${col}`);
    set('np-words', `${words} words`);
    set('np-chars', `${text.length} chars (${sel.length} selected)`);
    set('np-lines', `${lines} line${lines!==1?'s':''}`);
}

function npApplyStyle() {
    const a = document.getElementById('np-area');
    const f = document.getElementById('np-font')?.value;
    const s = document.getElementById('np-size')?.value;
    if (a) {
        if (f) a.style.fontFamily = f + ',monospace';
        if (s) a.style.fontSize = s + 'px';
    }
}

function npNew() {
    const a = document.getElementById('np-area');
    if (!a) return;
    if (a.value && !confirm('Discard current document?')) return;
    a.value = '';
    npUpdateStats();
}

function npOpen() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.txt,.md,.log,.json,.js,.css,.html,.csv,text/*';
    inp.onchange = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = (ev) => {
            const a = document.getElementById('np-area');
            if (a) { a.value = ev.target.result; npUpdateStats(); }
        };
        r.readAsText(f);
    };
    inp.click();
}

function npSave() {
    const a = document.getElementById('np-area');
    if (!a) return;
    const blob = new Blob([a.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'untitled.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 200);
    if (typeof addNotification === 'function') addNotification('📝', 'Notepad', 'Saved as untitled.txt');
}

function npFindShow() {
    const bar = document.getElementById('np-find-bar');
    if (bar) { bar.style.display = 'flex'; document.getElementById('np-find-input')?.focus(); }
}

function npReplaceShow() {
    npFindShow();
    document.getElementById('np-replace-input')?.focus();
}

function npFindNext(reverse) {
    const a = document.getElementById('np-area');
    const q = document.getElementById('np-find-input')?.value;
    const cs = document.getElementById('np-find-case')?.checked;
    if (!a || !q) return;
    const hay = cs ? a.value : a.value.toLowerCase();
    const needle = cs ? q : q.toLowerCase();
    const start = a.selectionEnd;
    let idx = reverse ? hay.lastIndexOf(needle, a.selectionStart - 1) : hay.indexOf(needle, start);
    if (idx === -1) idx = reverse ? hay.lastIndexOf(needle) : hay.indexOf(needle); // wrap
    const status = document.getElementById('np-find-status');
    if (idx === -1) { if (status) status.textContent = 'Not found'; return; }
    a.focus();
    a.setSelectionRange(idx, idx + q.length);
    if (status) status.textContent = `Found at ${idx + 1}`;
    npUpdateStats();
}

function npFindPrev() { npFindNext(true); }

function npReplaceOne() {
    const a = document.getElementById('np-area');
    const q = document.getElementById('np-find-input')?.value;
    const r = document.getElementById('np-replace-input')?.value || '';
    if (!a || !q) return;
    const sel = a.value.substring(a.selectionStart, a.selectionEnd);
    const cs = document.getElementById('np-find-case')?.checked;
    if ((cs && sel === q) || (!cs && sel.toLowerCase() === q.toLowerCase())) {
        a.setRangeText(r, a.selectionStart, a.selectionEnd, 'end');
        npUpdateStats();
    }
    npFindNext();
}

function npReplaceAll() {
    const a = document.getElementById('np-area');
    const q = document.getElementById('np-find-input')?.value;
    const r = document.getElementById('np-replace-input')?.value || '';
    const cs = document.getElementById('np-find-case')?.checked;
    if (!a || !q) return;
    const flags = cs ? 'g' : 'gi';
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    const before = a.value;
    a.value = before.replace(re, r);
    const n = (before.match(re) || []).length;
    const status = document.getElementById('np-find-status');
    if (status) status.textContent = `Replaced ${n} occurrence${n!==1?'s':''}`;
    npUpdateStats();
}

function npDateTime() {
    const a = document.getElementById('np-area');
    if (!a) return;
    const now = new Date();
    const stamp = now.toLocaleString();
    const start = a.selectionStart;
    a.value = a.value.slice(0, start) + stamp + a.value.slice(a.selectionEnd);
    a.selectionStart = a.selectionEnd = start + stamp.length;
    npUpdateStats();
}

function npMenu(menu, evt) {
    const items = {
        File:    [['📄 New','npNew()'],['📂 Open...','npOpen()'],['💾 Save','npSave()'],['—',null],['🖨 Print','window.print()']],
        Edit:    [['↶ Undo','document.execCommand(\'undo\')'],['↷ Redo','document.execCommand(\'redo\')'],['—',null],['✂ Cut','document.execCommand(\'cut\')'],['📋 Copy','document.execCommand(\'copy\')'],['📥 Paste','document.execCommand(\'paste\')'],['—',null],['🔍 Find','npFindShow()'],['🔁 Replace','npReplaceShow()'],['—',null],['🅰 Select All','document.getElementById(\'np-area\').select()'],['📅 Date/Time','npDateTime()']],
        Format:  [['📐 Word Wrap','document.getElementById(\'np-wrap\').click()'],['🔤 Font...','document.getElementById(\'np-font\').focus()']],
        View:    [['📊 Status Bar','']],
        Help:    [['ℹ️ About Notepad','alert(\'Notepad\\nWindows 10 Simulator\\nVersion 10.0\')']]
    };
    document.querySelectorAll('.np-popup').forEach(p => p.remove());
    const list = items[menu] || [];
    const pop = document.createElement('div');
    pop.className = 'np-popup';
    pop.style.cssText = 'position:fixed;background:white;border:1px solid #999;box-shadow:2px 2px 8px rgba(0,0,0,0.2);min-width:200px;z-index:9999;padding:4px 0;font-size:13px;';
    const r = evt.target.getBoundingClientRect();
    pop.style.left = r.left + 'px';
    pop.style.top = (r.bottom + 2) + 'px';
    list.forEach(([label, action]) => {
        if (label === '—') {
            const sep = document.createElement('div');
            sep.style.cssText = 'border-top:1px solid #eee;margin:4px 0;';
            pop.appendChild(sep);
        } else {
            const it = document.createElement('div');
            it.textContent = label;
            it.style.cssText = 'padding:6px 16px;cursor:pointer;';
            it.onmouseover = () => it.style.background = '#e5f1fb';
            it.onmouseout = () => it.style.background = 'transparent';
            it.onclick = () => { try { eval(action); } catch(e){} pop.remove(); };
            pop.appendChild(it);
        }
    });
    document.body.appendChild(pop);
    setTimeout(() => {
        const close = (e) => { if (!pop.contains(e.target)) { pop.remove(); document.removeEventListener('click', close); } };
        document.addEventListener('click', close);
    }, 50);
}

let explorerPath = 'This PC';
let explorerHistory = ['This PC'];
let explorerHistoryIndex = 0;

const fileSystem = {
    'This PC': {
        type: 'folder',
        items: [
            { name: 'Desktop', type: 'folder', icon: '🖥️', color: '#0078d4' },
            { name: 'Documents', type: 'folder', icon: '📁', color: '#f4b400' },
            { name: 'Downloads', type: 'folder', icon: '⬇️', color: '#34a853' },
            { name: 'Pictures', type: 'folder', icon: '🖼️', color: '#ea4335' },
            { name: 'Music', type: 'folder', icon: '🎵', color: '#9c27b0' },
            { name: 'Videos', type: 'folder', icon: '🎬', color: '#ff5722' },
            { name: 'Local Disk (C:)', type: 'drive', icon: '💾', color: '#607d8b', size: '237 GB free of 476 GB' },
            { name: 'USB Drive (D:)', type: 'drive', icon: '🔌', color: '#795548', size: '14.2 GB free of 16 GB' }
        ]
    },
    'Desktop': {
        type: 'folder',
        items: [
            { name: 'This PC', type: 'shortcut', icon: '💻', color: '#0078d4' },
            { name: 'Recycle Bin', type: 'shortcut', icon: '🗑️', color: '#666' },
            { name: 'Notes.txt', type: 'file', icon: '📝', color: '#4caf50' },
            { name: 'Project.docx', type: 'file', icon: '📄', color: '#2196f3' }
        ]
    },
    'Documents': {
        type: 'folder',
        items: [
            { name: 'Work', type: 'folder', icon: '💼', color: '#795548' },
            { name: 'Personal', type: 'folder', icon: '👤', color: '#9c27b0' },
            { name: 'Resume.pdf', type: 'file', icon: '📕', color: '#f44336' },
            { name: 'Budget.xlsx', type: 'file', icon: '📊', color: '#4caf50' },
            { name: 'Notes.txt', type: 'file', icon: '📝', color: '#ff9800' }
        ]
    },
    'Downloads': {
        type: 'folder',
        items: [
            { name: 'Setup.exe', type: 'file', icon: '⚙️', color: '#607d8b' },
            { name: 'Photo.jpg', type: 'file', icon: '🖼️', color: '#e91e63' },
            { name: 'Music.mp3', type: 'file', icon: '🎵', color: '#9c27b0' },
            { name: 'Video.mp4', type: 'file', icon: '🎬', color: '#ff5722' }
        ]
    },
    'Pictures': {
        type: 'folder',
        items: [
            { name: 'Wallpapers', type: 'folder', icon: '🖼️', color: '#3f51b5' },
            { name: 'Screenshots', type: 'folder', icon: '📸', color: '#009688' },
            { name: 'vacation.jpg', type: 'file', icon: '🏖️', color: '#ff9800' },
            { name: 'family.png', type: 'file', icon: '👨‍👩‍👧', color: '#e91e63' }
        ]
    },
    'Music': {
        type: 'folder',
        items: [
            { name: 'Playlists', type: 'folder', icon: '📋', color: '#673ab7' },
            { name: 'song1.mp3', type: 'file', icon: '🎵', color: '#9c27b0' },
            { name: 'song2.mp3', type: 'file', icon: '🎵', color: '#9c27b0' }
        ]
    },
    'Videos': {
        type: 'folder',
        items: [
            { name: 'Movies', type: 'folder', icon: '🎬', color: '#f44336' },
            { name: 'Clips', type: 'folder', icon: '🎥', color: '#ff5722' }
        ]
    }
};

function createExplorer() {
    setTimeout(() => setupExplorerEvents(), 100);
    return renderExplorer();
}

function renderExplorer() {
    const currentFolder = fileSystem[explorerPath] || fileSystem['This PC'];
    const items = currentFolder.items || [];
    
    return `
        <div class="explorer-toolbar" style="background: linear-gradient(180deg, #f8f9fa, #e9ecef); padding: 8px 12px; display: flex; gap: 8px; align-items: center; border-bottom: 1px solid #dee2e6;">
            <button class="explorer-nav-btn" onclick="explorerBack()" style="padding: 6px 12px; border: 1px solid #ced4da; border-radius: 4px; background: white; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                <span style="font-size: 16px;">←</span>
            </button>
            <button class="explorer-nav-btn" onclick="explorerForward()" style="padding: 6px 12px; border: 1px solid #ced4da; border-radius: 4px; background: white; cursor: pointer;">
                <span style="font-size: 16px;">→</span>
            </button>
            <button class="explorer-nav-btn" onclick="explorerUp()" style="padding: 6px 12px; border: 1px solid #ced4da; border-radius: 4px; background: white; cursor: pointer;">
                <span style="font-size: 16px;">↑</span>
            </button>
            <div style="flex: 1; display: flex; align-items: center; background: white; border: 1px solid #ced4da; border-radius: 4px; padding: 6px 12px;">
                <span style="color: #0078d4; margin-right: 8px;">📁</span>
                <span id="explorer-path-display" style="color: #333;">${explorerPath}</span>
            </div>
            <input type="text" placeholder="🔍 Search" style="padding: 6px 12px; border: 1px solid #ced4da; border-radius: 4px; width: 200px;">
        </div>
        <div style="display: flex; flex: 1; overflow: hidden;">
            <div class="explorer-sidebar" style="width: 200px; background: #f8f9fa; border-right: 1px solid #dee2e6; padding: 12px; overflow-y: auto;">
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 12px; color: #666; margin-bottom: 8px; font-weight: 600;">Quick access</div>
                    <div class="explorer-sidebar-item" onclick="navigateExplorer('Desktop')" style="padding: 8px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.2s;">
                        <span style="font-size: 18px;">🖥️</span> Desktop
                    </div>
                    <div class="explorer-sidebar-item" onclick="navigateExplorer('Downloads')" style="padding: 8px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 18px;">⬇️</span> Downloads
                    </div>
                    <div class="explorer-sidebar-item" onclick="navigateExplorer('Documents')" style="padding: 8px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 18px;">📁</span> Documents
                    </div>
                    <div class="explorer-sidebar-item" onclick="navigateExplorer('Pictures')" style="padding: 8px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 18px;">🖼️</span> Pictures
                    </div>
                </div>
                <div>
                    <div style="font-size: 12px; color: #666; margin-bottom: 8px; font-weight: 600;">This PC</div>
                    <div class="explorer-sidebar-item" onclick="navigateExplorer('This PC')" style="padding: 8px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 18px;">💻</span> This PC
                    </div>
                </div>
            </div>
            <div class="explorer-main" id="explorer-main" style="flex: 1; padding: 16px; overflow-y: auto; background: white;">
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 16px;">
                    ${items.map(item => `
                        <div class="explorer-item" onclick="${item.type === 'folder' ? `navigateExplorer('${item.name}')` : `openFile('${item.name}')`}" 
                             style="padding: 16px; border-radius: 8px; cursor: pointer; text-align: center; transition: all 0.2s; border: 2px solid transparent;">
                            <div style="font-size: 48px; margin-bottom: 8px; filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.1));">${item.icon}</div>
                            <div style="font-size: 13px; color: #333; word-break: break-word;">${item.name}</div>
                            ${item.size ? `<div style="font-size: 11px; color: #666; margin-top: 4px;">${item.size}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        <div style="background: #f8f9fa; padding: 6px 12px; border-top: 1px solid #dee2e6; font-size: 12px; color: #666;">
            ${items.length} items
        </div>
    `;
}

function setupExplorerEvents() {
    document.querySelectorAll('.explorer-sidebar-item').forEach(item => {
        item.addEventListener('mouseenter', () => item.style.background = '#e9ecef');
        item.addEventListener('mouseleave', () => item.style.background = 'transparent');
    });
    document.querySelectorAll('.explorer-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.background = '#e3f2fd';
            item.style.borderColor = '#90caf9';
        });
        item.addEventListener('mouseleave', () => {
            item.style.background = 'transparent';
            item.style.borderColor = 'transparent';
        });
    });
}

function navigateExplorer(path) {
    if (fileSystem[path]) {
        explorerPath = path;
        explorerHistory = explorerHistory.slice(0, explorerHistoryIndex + 1);
        explorerHistory.push(path);
        explorerHistoryIndex = explorerHistory.length - 1;
        updateExplorerView();
    }
}

function explorerBack() {
    if (explorerHistoryIndex > 0) {
        explorerHistoryIndex--;
        explorerPath = explorerHistory[explorerHistoryIndex];
        updateExplorerView();
    }
}

function explorerForward() {
    if (explorerHistoryIndex < explorerHistory.length - 1) {
        explorerHistoryIndex++;
        explorerPath = explorerHistory[explorerHistoryIndex];
        updateExplorerView();
    }
}

function explorerUp() {
    if (explorerPath !== 'This PC') {
        navigateExplorer('This PC');
    }
}

function updateExplorerView() {
    const explorerWindow = document.querySelector('.window[data-app="explorer"] .window-content');
    if (explorerWindow) {
        explorerWindow.innerHTML = renderExplorer();
        setTimeout(() => setupExplorerEvents(), 50);
    }
}

function openFile(filename) {
    if (filename.endsWith('.txt')) {
        openApp('notepad');
    } else if (filename.endsWith('.jpg') || filename.endsWith('.png')) {
        openApp('photos');
    } else if (filename.endsWith('.mp3')) {
        playSound('notification');
        alert('Now playing: ' + filename);
    } else {
        alert('Opening: ' + filename);
    }
}

let currentWallpaper = 'gradient1';
let accentColor = '#0078d4';

function createSettings() {
    setTimeout(() => {
        const menuItems = document.querySelectorAll('.settings-menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', function() {
                menuItems.forEach(mi => mi.classList.remove('active'));
                this.classList.add('active');
                
                const contentArea = this.closest('.window-content').querySelector('.settings-content');
                const section = this.textContent.trim();
                
                let content = '';
                
                switch(section) {
                    case 'System':
                        content = `
                            <h2>⚙️ System</h2>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Display brightness</div>
                                    <div class="setting-description">Adjust screen brightness</div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <input type="range" min="20" max="100" value="80" style="width: 200px;" oninput="setSettingsBrightness(this.value)">
                                    <span id="settings-brightness-val">80%</span>
                                </div>
                            </div>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Night light</div>
                                    <div class="setting-description">Reduce blue light to help you sleep</div>
                                </div>
                                <label class="toggle-switch"><input type="checkbox" onchange="toggleSettingsNightLight(this.checked)"><span class="toggle-slider"></span></label>
                            </div>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Sound volume</div>
                                    <div class="setting-description" id="sound-vol-desc">Volume: 75%</div>
                                </div>
                                <input type="range" min="0" max="100" value="75" style="width: 200px;" oninput="document.getElementById('sound-vol-desc').textContent='Volume: '+this.value+'%'">
                            </div>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Notifications</div>
                                    <div class="setting-description">Get notifications from apps</div>
                                </div>
                                <label class="toggle-switch"><input type="checkbox" checked><span class="toggle-slider"></span></label>
                            </div>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Power & battery</div>
                                    <div class="setting-description">87% - Plugged in</div>
                                </div>
                                <select style="padding: 8px; border-radius: 4px;">
                                    <option>Balanced</option>
                                    <option>Best performance</option>
                                    <option>Best battery life</option>
                                </select>
                            </div>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Storage</div>
                                    <div class="setting-description">C: Drive - 237 GB free of 476 GB</div>
                                </div>
                                <div style="width: 200px; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
                                    <div style="width: 50%; height: 100%; background: #0078d4;"></div>
                                </div>
                            </div>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">About</div>
                                    <div class="setting-description">Windows 10 Pro - Version 22H2</div>
                                </div>
                                <button onclick="alert('Device name: DESKTOP-WIN10\\nProcessor: Intel Core i7\\nRAM: 16.0 GB\\nSystem type: 64-bit')" style="padding: 8px 16px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc;">View specs</button>
                            </div>
                        `;
                        break;
                    case 'Personalization':
                        content = `
                            <h2>🎨 Personalization</h2>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Background</div>
                                    <div class="setting-description">Choose your desktop wallpaper</div>
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0;">
                                <div class="wallpaper-option" onclick="setWallpaper('gradient1', this)" style="height: 80px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 8px; cursor: pointer; border: 3px solid ${currentWallpaper === 'gradient1' ? '#0078d4' : 'transparent'};"></div>
                                <div class="wallpaper-option" onclick="setWallpaper('gradient2', this)" style="height: 80px; background: linear-gradient(135deg, #11998e, #38ef7d); border-radius: 8px; cursor: pointer; border: 3px solid ${currentWallpaper === 'gradient2' ? '#0078d4' : 'transparent'};"></div>
                                <div class="wallpaper-option" onclick="setWallpaper('gradient3', this)" style="height: 80px; background: linear-gradient(135deg, #ee0979, #ff6a00); border-radius: 8px; cursor: pointer; border: 3px solid ${currentWallpaper === 'gradient3' ? '#0078d4' : 'transparent'};"></div>
                                <div class="wallpaper-option" onclick="setWallpaper('gradient4', this)" style="height: 80px; background: linear-gradient(135deg, #2193b0, #6dd5ed); border-radius: 8px; cursor: pointer; border: 3px solid ${currentWallpaper === 'gradient4' ? '#0078d4' : 'transparent'};"></div>
                                <div class="wallpaper-option" onclick="setWallpaper('solid1', this)" style="height: 80px; background: #0078d4; border-radius: 8px; cursor: pointer; border: 3px solid ${currentWallpaper === 'solid1' ? '#0078d4' : 'transparent'};"></div>
                                <div class="wallpaper-option" onclick="setWallpaper('solid2', this)" style="height: 80px; background: #1a1a2e; border-radius: 8px; cursor: pointer; border: 3px solid ${currentWallpaper === 'solid2' ? '#0078d4' : 'transparent'};"></div>
                                <div class="wallpaper-option" onclick="setWallpaper('solid3', this)" style="height: 80px; background: #16213e; border-radius: 8px; cursor: pointer; border: 3px solid ${currentWallpaper === 'solid3' ? '#0078d4' : 'transparent'};"></div>
                                <div class="wallpaper-option" onclick="setWallpaper('nature', this)" style="height: 80px; background: linear-gradient(to bottom, #87ceeb, #228b22); border-radius: 8px; cursor: pointer; border: 3px solid ${currentWallpaper === 'nature' ? '#0078d4' : 'transparent'};"></div>
                            </div>
                            <div class="setting-item" style="background: #f0f8ff; border-radius: 8px; padding: 16px; margin: 16px 0;">
                                <div style="margin-bottom: 12px;">
                                    <div class="setting-label">🌐 Custom wallpaper from URL</div>
                                    <div class="setting-description">Paste an image URL to use as wallpaper</div>
                                </div>
                                <div style="display: flex; gap: 8px;">
                                    <input type="text" id="custom-wallpaper-url" placeholder="https://example.com/image.jpg" style="flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                                    <button onclick="setCustomWallpaper()" style="padding: 10px 20px; background: #0078d4; color: white; border: none; border-radius: 4px; cursor: pointer;">Apply</button>
                                </div>
                                <div id="wallpaper-preview" style="margin-top: 12px; display: none;">
                                    <img id="wallpaper-preview-img" style="max-width: 200px; max-height: 100px; border-radius: 8px; border: 2px solid #0078d4;">
                                </div>
                            </div>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Accent color</div>
                                    <div class="setting-description">Used for highlights and buttons</div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px; margin: 16px 0;">
                                <div onclick="setAccentColor('#0078d4', this)" style="width: 40px; height: 40px; background: #0078d4; border-radius: 4px; cursor: pointer; border: 3px solid ${accentColor === '#0078d4' ? 'white' : 'transparent'};"></div>
                                <div onclick="setAccentColor('#e81123', this)" style="width: 40px; height: 40px; background: #e81123; border-radius: 4px; cursor: pointer; border: 3px solid ${accentColor === '#e81123' ? 'white' : 'transparent'};"></div>
                                <div onclick="setAccentColor('#107c10', this)" style="width: 40px; height: 40px; background: #107c10; border-radius: 4px; cursor: pointer; border: 3px solid ${accentColor === '#107c10' ? 'white' : 'transparent'};"></div>
                                <div onclick="setAccentColor('#ff8c00', this)" style="width: 40px; height: 40px; background: #ff8c00; border-radius: 4px; cursor: pointer; border: 3px solid ${accentColor === '#ff8c00' ? 'white' : 'transparent'};"></div>
                                <div onclick="setAccentColor('#881798', this)" style="width: 40px; height: 40px; background: #881798; border-radius: 4px; cursor: pointer; border: 3px solid ${accentColor === '#881798' ? 'white' : 'transparent'};"></div>
                                <div onclick="setAccentColor('#00cc6a', this)" style="width: 40px; height: 40px; background: #00cc6a; border-radius: 4px; cursor: pointer; border: 3px solid ${accentColor === '#00cc6a' ? 'white' : 'transparent'};"></div>
                            </div>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Transparency effects</div>
                                    <div class="setting-description">Add blur and transparency to windows</div>
                                </div>
                                <label class="toggle-switch"><input type="checkbox" checked onchange="toggleTransparency(this.checked)"><span class="toggle-slider"></span></label>
                            </div>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Animation effects</div>
                                    <div class="setting-description">Animate windows and controls</div>
                                </div>
                                <label class="toggle-switch"><input type="checkbox" checked><span class="toggle-slider"></span></label>
                            </div>
                        `;
                        break;
                    case 'Apps':
                        content = `
                            <h2>📦 Apps & features</h2>
                            <div style="margin-bottom: 16px;">
                                <input type="text" placeholder="Search apps..." style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                            </div>
                            <div class="setting-item">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <span style="font-size: 24px;">🧮</span>
                                    <div>
                                        <div class="setting-label">Calculator</div>
                                        <div class="setting-description">125 MB • Microsoft</div>
                                    </div>
                                </div>
                                <button onclick="uninstallApp('Calculator', this)" style="padding: 6px 16px; border-radius: 4px; background: #f0f0f0; border: 1px solid #ccc; cursor: pointer;">Uninstall</button>
                            </div>
                            <div class="setting-item">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <span style="font-size: 24px;">🌐</span>
                                    <div>
                                        <div class="setting-label">Microsoft Edge</div>
                                        <div class="setting-description">1.2 GB • Microsoft</div>
                                    </div>
                                </div>
                                <button onclick="uninstallApp('Edge', this)" style="padding: 6px 16px; border-radius: 4px; background: #f0f0f0; border: 1px solid #ccc; cursor: pointer;">Uninstall</button>
                            </div>
                            <div class="setting-item">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <span style="font-size: 24px;">📝</span>
                                    <div>
                                        <div class="setting-label">Notepad</div>
                                        <div class="setting-description">45 MB • Microsoft</div>
                                    </div>
                                </div>
                                <button onclick="uninstallApp('Notepad', this)" style="padding: 6px 16px; border-radius: 4px; background: #f0f0f0; border: 1px solid #ccc; cursor: pointer;">Uninstall</button>
                            </div>
                            <div class="setting-item">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <span style="font-size: 24px;">🎨</span>
                                    <div>
                                        <div class="setting-label">Paint</div>
                                        <div class="setting-description">89 MB • Microsoft</div>
                                    </div>
                                </div>
                                <button onclick="uninstallApp('Paint', this)" style="padding: 6px 16px; border-radius: 4px; background: #f0f0f0; border: 1px solid #ccc; cursor: pointer;">Uninstall</button>
                            </div>
                            <div class="setting-item">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <span style="font-size: 24px;">🛍️</span>
                                    <div>
                                        <div class="setting-label">Microsoft Store</div>
                                        <div class="setting-description">256 MB • Microsoft</div>
                                    </div>
                                </div>
                                <span style="color: #666; font-size: 12px;">System app</span>
                            </div>
                            <h3 style="margin-top: 24px;">Default apps</h3>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Web browser</div>
                                </div>
                                <select style="padding: 8px 12px; border-radius: 4px; border: 1px solid #ccc;">
                                    <option>Microsoft Edge</option>
                                    <option>Google Chrome</option>
                                </select>
                            </div>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Email</div>
                                </div>
                                <select style="padding: 8px 12px; border-radius: 4px; border: 1px solid #ccc;">
                                    <option>Mail</option>
                                    <option>Outlook</option>
                                </select>
                            </div>
                        `;
                        break;
                    case 'Accounts':
                        content = `
                            <h2>👤 Your info</h2>
                            <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 30px; background: linear-gradient(135deg, #f0f8ff, #e6f3ff); padding: 24px; border-radius: 12px;">
                                <div id="account-avatar" style="width: 100px; height: 100px; background: ${userData.avatarColor || '#0078d4'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 48px; cursor: pointer; transition: transform 0.2s; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" onclick="changeAvatar()" title="Click to change avatar">
                                    ${userData.avatar || '👤'}
                                </div>
                                <div>
                                    <div style="font-size: 24px; font-weight: 600; margin-bottom: 4px;" id="display-username">${userData.username}</div>
                                    <div style="font-size: 14px; color: #666;">${userData.email || 'Local Account'}</div>
                                    <div style="font-size: 12px; color: #0078d4; margin-top: 4px;">Administrator</div>
                                </div>
                            </div>
                            
                            <h3 style="margin: 24px 0 16px;">Edit profile</h3>
                            <div class="setting-item" style="background: #f8f9fa; border-radius: 8px; padding: 16px;">
                                <div style="width: 100%;">
                                    <div class="setting-label" style="margin-bottom: 8px;">Username</div>
                                    <div style="display: flex; gap: 8px;">
                                        <input type="text" id="edit-username" value="${userData.username}" style="flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                                        <button onclick="updateUsername()" style="padding: 10px 20px; background: #0078d4; color: white; border: none; border-radius: 4px; cursor: pointer;">Save</button>
                                    </div>
                                </div>
                            </div>
                            <div class="setting-item" style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-top: 12px;">
                                <div style="width: 100%;">
                                    <div class="setting-label" style="margin-bottom: 8px;">Change Password</div>
                                    <div style="display: flex; flex-direction: column; gap: 8px;">
                                        <input type="password" id="current-password" placeholder="Current password" style="padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                                        <input type="password" id="new-password" placeholder="New password" style="padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                                        <input type="password" id="confirm-password" placeholder="Confirm new password" style="padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                                        <button onclick="updatePassword()" style="padding: 10px 20px; background: #0078d4; color: white; border: none; border-radius: 4px; cursor: pointer; align-self: flex-start;">Update Password</button>
                                    </div>
                                </div>
                            </div>
                            <div class="setting-item" style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-top: 12px;">
                                <div style="width: 100%;">
                                    <div class="setting-label" style="margin-bottom: 8px;">Profile Picture</div>
                                    <div class="setting-description" style="margin-bottom: 12px;">Choose an avatar or use a custom image</div>
                                    <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 12px;">
                                        <div onclick="setAvatar('👤', '#0078d4')" style="width: 50px; height: 50px; background: #0078d4; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; cursor: pointer; border: 3px solid ${(userData.avatar || '👤') === '👤' ? '#333' : 'transparent'};">👤</div>
                                        <div onclick="setAvatar('😊', '#4caf50')" style="width: 50px; height: 50px; background: #4caf50; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; cursor: pointer; border: 3px solid ${userData.avatar === '😊' ? '#333' : 'transparent'};">😊</div>
                                        <div onclick="setAvatar('🎮', '#9c27b0')" style="width: 50px; height: 50px; background: #9c27b0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; cursor: pointer; border: 3px solid ${userData.avatar === '🎮' ? '#333' : 'transparent'};">🎮</div>
                                        <div onclick="setAvatar('🎨', '#ff5722')" style="width: 50px; height: 50px; background: #ff5722; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; cursor: pointer; border: 3px solid ${userData.avatar === '🎨' ? '#333' : 'transparent'};">🎨</div>
                                        <div onclick="setAvatar('💻', '#607d8b')" style="width: 50px; height: 50px; background: #607d8b; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; cursor: pointer; border: 3px solid ${userData.avatar === '💻' ? '#333' : 'transparent'};">💻</div>
                                        <div onclick="setAvatar('🚀', '#e91e63')" style="width: 50px; height: 50px; background: #e91e63; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; cursor: pointer; border: 3px solid ${userData.avatar === '🚀' ? '#333' : 'transparent'};">🚀</div>
                                        <div onclick="setAvatar('🌟', '#ffc107')" style="width: 50px; height: 50px; background: #ffc107; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; cursor: pointer; border: 3px solid ${userData.avatar === '🌟' ? '#333' : 'transparent'};">🌟</div>
                                        <div onclick="setAvatar('🐱', '#795548')" style="width: 50px; height: 50px; background: #795548; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; cursor: pointer; border: 3px solid ${userData.avatar === '🐱' ? '#333' : 'transparent'};">🐱</div>
                                    </div>
                                    <div style="display: flex; gap: 8px;">
                                        <input type="text" id="custom-avatar-url" placeholder="Or enter image URL..." style="flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
                                        <button onclick="setCustomAvatar()" style="padding: 10px 20px; background: #0078d4; color: white; border: none; border-radius: 4px; cursor: pointer;">Apply</button>
                                    </div>
                                </div>
                            </div>
                            
                            <h3 style="margin: 24px 0 16px;">Sign-in options</h3>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Windows Hello</div>
                                    <div class="setting-description">Sign in with face, fingerprint, or PIN</div>
                                </div>
                                <button style="padding: 8px 16px; border-radius: 4px; background: #f0f0f0; border: 1px solid #ccc; cursor: pointer;">Set up</button>
                            </div>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Require sign-in</div>
                                    <div class="setting-description">When should Windows require you to sign in again?</div>
                                </div>
                                <select style="padding: 8px 12px; border-radius: 4px; border: 1px solid #ccc;">
                                    <option>When PC wakes from sleep</option>
                                    <option>Never</option>
                                </select>
                            </div>
                        `;
                        break;
                    case 'Time & Language':
                        content = `
                            <h2>Date & time</h2>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Set time automatically</div>
                                    <div class="setting-description">Sync with internet time servers</div>
                                </div>
                                <label class="toggle-switch"><input type="checkbox" checked><span class="toggle-slider"></span></label>
                            </div>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Time zone</div>
                                    <div class="setting-description">Current time zone</div>
                                </div>
                                <select style="padding: 8px; border-radius: 4px; width: 250px;">
                                    <option>(UTC-08:00) Pacific Time</option>
                                    <option>(UTC-05:00) Eastern Time</option>
                                    <option>(UTC+00:00) London</option>
                                    <option>(UTC+01:00) Paris, Berlin</option>
                                </select>
                            </div>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Language</div>
                                    <div class="setting-description">Windows display language</div>
                                </div>
                                <div>English (United States)</div>
                            </div>
                        `;
                        break;
                    case 'Privacy':
                        content = `
                            <h2>Privacy</h2>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Location</div>
                                    <div class="setting-description">Let apps use your location</div>
                                </div>
                                <label class="toggle-switch"><input type="checkbox" checked onchange="playSound('notification')"><span class="toggle-slider"></span></label>
                            </div>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Camera</div>
                                    <div class="setting-description">Let apps use your camera</div>
                                </div>
                                <label class="toggle-switch"><input type="checkbox" checked onchange="playSound('notification')"><span class="toggle-slider"></span></label>
                            </div>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Microphone</div>
                                    <div class="setting-description">Let apps use your microphone</div>
                                </div>
                                <label class="toggle-switch"><input type="checkbox" checked onchange="playSound('notification')"><span class="toggle-slider"></span></label>
                            </div>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Diagnostics & feedback</div>
                                    <div class="setting-description">Send diagnostic data to Microsoft</div>
                                </div>
                                <select style="padding: 8px; border-radius: 4px;">
                                    <option>Required</option>
                                    <option selected>Optional</option>
                                </select>
                            </div>
                        `;
                        break;
                    case 'Update & Security':
                        content = `
                            <h2>🔄 Windows Update</h2>
                            <div style="background: #e6f4ea; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #34a853;">
                                <div style="font-size: 18px; margin-bottom: 8px; color: #137333;">✅ You're up to date</div>
                                <div style="font-size: 14px; color: #666;">Last checked: Today at ${new Date().toLocaleTimeString()}</div>
                            </div>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Check for updates</div>
                                    <div class="setting-description">Download and install the latest updates</div>
                                </div>
                                <button onclick="checkForUpdates(this)" style="padding: 10px 24px; border-radius: 4px; background: #0078d4; color: white; border: none; cursor: pointer; font-size: 14px;">Check now</button>
                            </div>
                            <h3 style="margin-top: 24px;">🛡️ Windows Security</h3>
                            <div class="setting-item" style="background: #e8f5e9; border-radius: 8px; padding: 16px;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <span style="font-size: 32px;">🛡️</span>
                                    <div>
                                        <div class="setting-label" style="color: #2e7d32;">Your device is protected</div>
                                        <div class="setting-description">No threats found</div>
                                    </div>
                                </div>
                                <button onclick="openApp('defender')" style="padding: 8px 16px; border-radius: 4px; background: white; border: 1px solid #ccc; cursor: pointer;">Open Security</button>
                            </div>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Virus & threat protection</div>
                                    <div class="setting-description">Last scan: Today</div>
                                </div>
                                <button onclick="runQuickScan()" style="padding: 8px 16px; border-radius: 4px; background: #f0f0f0; border: 1px solid #ccc; cursor: pointer;">Quick scan</button>
                            </div>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Firewall & network</div>
                                    <div class="setting-description">Protected</div>
                                </div>
                                <span style="color: #2e7d32;">✓ On</span>
                            </div>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Backup</div>
                                    <div class="setting-description">Back up files to OneDrive</div>
                                </div>
                                <label class="toggle-switch"><input type="checkbox"><span class="toggle-slider"></span></label>
                            </div>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Recovery</div>
                                    <div class="setting-description">Reset this PC or advanced startup</div>
                                </div>
                                <button onclick="alert('Recovery options would reset your PC. This is a simulation.')" style="padding: 8px 16px; border-radius: 4px; background: #f0f0f0; border: 1px solid #ccc; cursor: pointer;">Get started</button>
                            </div>
                        `;
                        break;
                    case 'Gaming':
                        content = `
                            <h2>🎮 Gaming</h2>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Xbox Game Bar</div>
                                    <div class="setting-description">Record clips, chat with friends, and get invites</div>
                                </div>
                                <label class="toggle-switch"><input type="checkbox" checked><span class="toggle-slider"></span></label>
                            </div>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Game Mode</div>
                                    <div class="setting-description">Optimize your PC for gaming</div>
                                </div>
                                <label class="toggle-switch"><input type="checkbox" checked><span class="toggle-slider"></span></label>
                            </div>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Captures</div>
                                    <div class="setting-description">Screenshots and game clips location</div>
                                </div>
                                <span style="color: #666;">C:\\Users\\${userData.username}\\Videos\\Captures</span>
                            </div>
                            <div class="setting-item">
                                <div>
                                    <div class="setting-label">Graphics</div>
                                    <div class="setting-description">Default graphics settings</div>
                                </div>
                                <select style="padding: 8px 12px; border-radius: 4px; border: 1px solid #ccc;">
                                    <option>Let Windows decide</option>
                                    <option>Power saving</option>
                                    <option>High performance</option>
                                </select>
                            </div>
                        `;
                        break;
                    case 'Devices':
                        content = settingsRenderDevices();
                        break;
                    case 'Network & Internet':
                        content = settingsRenderNetwork();
                        break;
                    case 'Phone':
                        content = settingsRenderPhone();
                        break;
                    case 'Ease of Access':
                        content = settingsRenderAccess();
                        break;
                    case 'Search':
                        content = settingsRenderSearch();
                        break;
                    case 'Cortana':
                        content = settingsRenderCortana();
                        break;
                    case 'Themes':
                        content = settingsRenderThemes();
                        break;
                    case 'Lock screen':
                        content = settingsRenderLockScreen();
                        break;
                    case 'Display':
                        content = settingsRenderDisplay();
                        break;
                    case 'Sound':
                        content = settingsRenderSound();
                        break;
                    case 'Notifications':
                        content = settingsRenderNotifications();
                        break;
                    case 'Power & Sleep':
                        content = settingsRenderPower();
                        break;
                    case 'Storage':
                        content = settingsRenderStorage();
                        break;
                    case 'Mouse':
                        content = settingsRenderMouse();
                        break;
                    case 'Keyboard':
                        content = settingsRenderKeyboard();
                        break;
                    case 'Mixed reality':
                        content = settingsRenderMR();
                        break;
                    case 'About':
                        content = settingsRenderAbout();
                        break;
                }
                
                contentArea.innerHTML = content;
            });
        });
    }, 100);
    
    return `
        <div style="display: flex; height: 100%;">
            <div class="settings-sidebar" style="overflow-y:auto;">
                <div class="settings-menu-item active">System</div>
                <div class="settings-menu-item">Display</div>
                <div class="settings-menu-item">Sound</div>
                <div class="settings-menu-item">Notifications</div>
                <div class="settings-menu-item">Power & Sleep</div>
                <div class="settings-menu-item">Storage</div>
                <div class="settings-menu-item">Devices</div>
                <div class="settings-menu-item">Mouse</div>
                <div class="settings-menu-item">Keyboard</div>
                <div class="settings-menu-item">Phone</div>
                <div class="settings-menu-item">Network & Internet</div>
                <div class="settings-menu-item">Personalization</div>
                <div class="settings-menu-item">Themes</div>
                <div class="settings-menu-item">Lock screen</div>
                <div class="settings-menu-item">Apps</div>
                <div class="settings-menu-item">Accounts</div>
                <div class="settings-menu-item">Time & Language</div>
                <div class="settings-menu-item">Gaming</div>
                <div class="settings-menu-item">Ease of Access</div>
                <div class="settings-menu-item">Search</div>
                <div class="settings-menu-item">Cortana</div>
                <div class="settings-menu-item">Privacy</div>
                <div class="settings-menu-item">Update & Security</div>
                <div class="settings-menu-item">Mixed reality</div>
                <div class="settings-menu-item">About</div>
            </div>
            <div class="settings-content">
                <h2>⚙️ System</h2>
                <div class="setting-item">
                    <div>
                        <div class="setting-label">Display brightness</div>
                        <div class="setting-description">Adjust screen brightness</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <input type="range" min="20" max="100" value="80" style="width: 200px;" oninput="setSettingsBrightness(this.value)">
                        <span id="settings-brightness-val">80%</span>
                    </div>
                </div>
                <div class="setting-item">
                    <div>
                        <div class="setting-label">Night light</div>
                        <div class="setting-description">Reduce blue light to help you sleep</div>
                    </div>
                    <label class="toggle-switch"><input type="checkbox" onchange="toggleSettingsNightLight(this.checked)"><span class="toggle-slider"></span></label>
                </div>
                <div class="setting-item">
                    <div>
                        <div class="setting-label">Sound volume</div>
                        <div class="setting-description" id="sound-vol-desc">Volume: 75%</div>
                    </div>
                    <input type="range" min="0" max="100" value="75" style="width: 200px;" oninput="document.getElementById('sound-vol-desc').textContent='Volume: '+this.value+'%'">
                </div>
                <div class="setting-item">
                    <div>
                        <div class="setting-label">Storage</div>
                        <div class="setting-description">C: Drive - 237 GB free of 476 GB</div>
                    </div>
                    <div style="width: 200px; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
                        <div style="width: 50%; height: 100%; background: #0078d4;"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS SECTION RENDERERS — extend the 8 built-in sections to 25+
// ═══════════════════════════════════════════════════════════════════════════
function settingsToggle(name, desc, checked) {
    return `<div class="setting-item"><div><div class="setting-label">${name}</div><div class="setting-description">${desc}</div></div>
        <label class="toggle-switch"><input type="checkbox" ${checked?'checked':''}><span class="toggle-slider"></span></label></div>`;
}
function settingsSlider(name, desc, val, min=0, max=100) {
    const id = 'sl_'+Math.random().toString(36).slice(2,8);
    return `<div class="setting-item"><div><div class="setting-label">${name}</div><div class="setting-description">${desc}</div></div>
        <div style="display:flex;align-items:center;gap:10px;"><input type="range" min="${min}" max="${max}" value="${val}" style="width:200px" oninput="document.getElementById('${id}').textContent=this.value">
        <span id="${id}" style="min-width:30px;text-align:right;">${val}</span></div></div>`;
}
function settingsButton(name, desc, btnLabel, action) {
    return `<div class="setting-item"><div><div class="setting-label">${name}</div><div class="setting-description">${desc}</div></div>
        <button onclick="${action}" style="padding:8px 16px;border-radius:4px;background:#0078d4;color:white;border:none;cursor:pointer;">${btnLabel}</button></div>`;
}

function settingsRenderDevices() {
    return `<h2>📱 Devices</h2>
        <div style="background:#f0f8ff;padding:14px;border-radius:8px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
            <div><div style="font-weight:500;">Bluetooth</div><div style="color:#666;font-size:12px;">Discoverable as "DESKTOP-WIN10"</div></div>
            <label class="toggle-switch"><input type="checkbox" checked><span class="toggle-slider"></span></label>
        </div>
        <button onclick="openApp('bluetooth')" style="padding:10px 18px;background:#0078d4;color:white;border:none;border-radius:4px;cursor:pointer;margin-bottom:14px;">+ Add Bluetooth or other device</button>
        <h3 style="margin:14px 0 8px;">Mouse, keyboard, & pen</h3>
        ${settingsToggle('Logitech MX Master 3', 'Connected • Battery 64%', true)}
        ${settingsToggle('Logitech K380 Keyboard', 'Connected • Battery 45%', true)}
        <h3 style="margin:14px 0 8px;">Audio</h3>
        ${settingsToggle('Sony WH-1000XM5', 'Paired', true)}
        ${settingsToggle('AirPods Pro', 'Paired • Battery 88%', false)}
        <h3 style="margin:14px 0 8px;">Other devices</h3>
        ${settingsToggle('iPhone 15 Pro', 'Paired', true)}
        ${settingsToggle('Xbox Wireless Controller', 'Paired', false)}
        ${settingsButton('Default save locations', 'New apps will save to', 'Change', "alert('Open Storage settings to change default save location.')")}`;
}

function settingsRenderNetwork() {
    return `<h2>🌐 Network & Internet</h2>
        ${settingsButton('Open full network settings', 'Wi-Fi, Ethernet, VPN, Mobile hotspot, Proxy', 'Open', "openApp('wifi')")}
        ${settingsToggle('Wi-Fi',  'Connected to Home_WiFi_5G', true)}
        ${settingsToggle('Bluetooth', 'On — 4 devices paired', true)}
        ${settingsToggle('Airplane mode', 'Turn off all wireless communication', false)}
        ${settingsToggle('Mobile hotspot', 'Share your internet connection', false)}
        ${settingsToggle('VPN', 'Add and manage VPN connections', false)}
        <div class="setting-item"><div><div class="setting-label">Data usage</div><div class="setting-description">This month: 24.6 GB / 100 GB</div></div>
            <div style="width:200px;height:8px;background:#e0e0e0;border-radius:4px;"><div style="width:24.6%;height:100%;background:#0078d4;border-radius:4px;"></div></div></div>
        ${settingsButton('Network reset', 'Reinstall all network adapters', 'Reset now', "alert('Network would be reset. (Simulation)')")}`;
}

function settingsRenderPhone() {
    return `<h2>📱 Your Phone</h2>
        <div style="background:linear-gradient(135deg,#0078d4,#00bcf2);color:white;padding:24px;border-radius:10px;margin-bottom:16px;">
            <div style="font-size:20px;font-weight:300;">Link your Android or iPhone</div>
            <div style="opacity:.85;margin:8px 0 16px;font-size:13px;">Get instant access to texts, photos, calls, and more.</div>
            <button onclick="alert('Phone Link app would launch.')" style="padding:10px 22px;background:white;color:#0078d4;border:none;border-radius:4px;cursor:pointer;font-weight:500;">+ Add a phone</button>
        </div>
        <h3 style="margin:14px 0 8px;">Linked phones</h3>
        ${settingsToggle('iPhone 15 Pro', 'Last seen: 2 minutes ago', true)}
        ${settingsToggle('Sync notifications', 'Send phone notifications to this PC', true)}
        ${settingsToggle('Send texts from this PC', 'Reply to messages from your computer', true)}
        ${settingsToggle('Make and receive calls', 'Use your PC for phone calls', false)}
        ${settingsToggle('Photo transfer', 'Copy recent photos automatically', true)}`;
}

function settingsRenderAccess() {
    return `<h2>♿ Ease of Access</h2>
        <h3 style="margin:14px 0 8px;">Vision</h3>
        ${settingsSlider('Text size', 'Make text larger', 100, 100, 225)}
        ${settingsToggle('Magnifier', 'Press Win + Plus to zoom in', false)}
        ${settingsToggle('High contrast', 'Easier to see content', false)}
        ${settingsToggle('Color filters', 'For colorblindness', false)}
        ${settingsToggle('Narrator', 'Screen reader reads everything aloud', false)}
        <h3 style="margin:14px 0 8px;">Hearing</h3>
        ${settingsToggle('Mono audio', 'Combine left and right channels', false)}
        ${settingsToggle('Closed captions', 'Show captions for video', true)}
        ${settingsToggle('Visual notifications for sound', 'Flash the screen for alerts', false)}
        <h3 style="margin:14px 0 8px;">Interaction</h3>
        ${settingsToggle('Sticky keys', 'Press one key at a time for shortcuts', false)}
        ${settingsToggle('Toggle keys', 'Hear a tone when caps/num lock toggled', false)}
        ${settingsToggle('Filter keys', 'Ignore brief or repeated keystrokes', false)}
        ${settingsToggle('On-screen keyboard', 'Type without a physical keyboard', false)}
        ${settingsToggle('Eye control', 'Use eye-tracking technology', false)}`;
}

function settingsRenderSearch() {
    return `<h2>🔍 Search</h2>
        ${settingsToggle('Show search box on taskbar', 'Quick access to search', true)}
        ${settingsToggle('Show search highlights', 'Trending content from the web', true)}
        ${settingsToggle('Cloud content search', 'Get results from OneDrive, Bing, Outlook', true)}
        ${settingsToggle('SafeSearch — Strict', 'Filter adult content from web results', true)}
        ${settingsToggle('History on this device', 'Personalize search results', true)}
        ${settingsButton('Clear my device search history', 'Remove searches stored on this PC', 'Clear', "alert('Search history cleared.')")}
        <h3 style="margin:14px 0 8px;">Indexing</h3>
        <div class="setting-item"><div><div class="setting-label">Indexing status</div><div class="setting-description">3,847 items indexed • Indexing complete</div></div>
            <span style="color:#107c10;">✓ Up to date</span></div>
        ${settingsToggle('Enhanced indexing', 'Index entire PC instead of just libraries', false)}`;
}

function settingsRenderCortana() {
    return `<h2>🎙️ Cortana</h2>
        <div style="background:radial-gradient(circle at top,#00bcf2,#0078d4);color:white;padding:24px;border-radius:10px;margin-bottom:16px;text-align:center;">
            <div style="font-size:54px;margin-bottom:8px;">🎙️</div>
            <div style="font-size:18px;font-weight:300;">Hi, I'm Cortana. How can I help?</div>
        </div>
        ${settingsToggle('Let Cortana respond to "Hey Cortana"', 'Wake-word detection', true)}
        ${settingsToggle('Use Cortana even when locked', 'Voice control on lock screen', false)}
        ${settingsToggle('Keyboard shortcut', 'Win + C opens Cortana', true)}
        <div class="setting-item"><div><div class="setting-label">Cortana voice</div><div class="setting-description">Choose a voice persona</div></div>
            <select style="padding:8px;border-radius:4px;border:1px solid #ccc;"><option>Aria (US, Female)</option><option>Davis (US, Male)</option><option>Jenny (UK, Female)</option><option>Ryan (UK, Male)</option></select></div>
        ${settingsToggle('Microphone access', 'Allow Cortana to use your mic', true)}
        ${settingsButton('Sign in to personalize', 'Use across devices with your Microsoft account', 'Sign in', "alert('Microsoft sign-in would open.')")}`;
}

function settingsRenderThemes() {
    const themes = [
        { name: 'Windows (light)', g: 'linear-gradient(135deg,#0078d4,#00bcf2)' },
        { name: 'Windows (dark)',  g: 'linear-gradient(135deg,#1a1a2e,#16213e)' },
        { name: 'Flowers',         g: 'linear-gradient(135deg,#ff9a9e,#fad0c4)' },
        { name: 'Mountains',       g: 'linear-gradient(135deg,#667eea,#764ba2)' },
        { name: 'Auroras',         g: 'linear-gradient(135deg,#43cea2,#185a9d)' },
        { name: 'Sunset',          g: 'linear-gradient(135deg,#ee0979,#ff6a00)' },
        { name: 'Ocean',           g: 'linear-gradient(135deg,#2193b0,#6dd5ed)' },
        { name: 'Galaxy',          g: 'radial-gradient(ellipse at center,#1d2671,#c33764)' }
    ];
    return `<h2>🎨 Themes</h2>
        <p style="color:#666;margin-bottom:16px;">A theme contains a desktop background, accent color, sounds, and mouse cursor.</p>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:20px;">
            ${themes.map(t => `<div onclick="alert('Theme &quot;${t.name}&quot; applied!')" style="cursor:pointer;border:2px solid transparent;border-radius:8px;padding:8px;transition:.2s;" onmouseover="this.style.borderColor='#0078d4'" onmouseout="this.style.borderColor='transparent'">
                <div style="height:100px;background:${t.g};border-radius:6px;margin-bottom:6px;"></div>
                <div style="font-size:13px;color:#333;">${t.name}</div></div>`).join('')}
        </div>
        ${settingsButton('Get more themes in Microsoft Store', 'Hundreds of themes to choose from', 'Browse', "openApp('store')")}
        <h3 style="margin:14px 0 8px;">Sounds</h3>
        <div class="setting-item"><div><div class="setting-label">Sound scheme</div><div class="setting-description">Notification and event sounds</div></div>
            <select style="padding:8px;border-radius:4px;border:1px solid #ccc;"><option>Windows Default</option><option>Calligraphy</option><option>Characters</option><option>Cityscape</option><option>Delta</option><option>Festival</option><option>Garden</option><option>Heritage</option><option>Landscape</option><option>Quirky</option><option>Raga</option><option>Savannah</option><option>Sonata</option></select></div>`;
}

function settingsRenderLockScreen() {
    return `<h2>🔒 Lock screen</h2>
        <div style="height:200px;background:linear-gradient(135deg,#0078d4,#00bcf2);border-radius:10px;margin-bottom:16px;display:flex;align-items:flex-end;padding:20px;color:white;">
            <div><div style="font-size:48px;font-weight:200;">9:41</div><div style="font-size:14px;opacity:.85;">Wednesday, October 15</div></div>
        </div>
        <div class="setting-item"><div><div class="setting-label">Background</div><div class="setting-description">Choose lock screen wallpaper</div></div>
            <select style="padding:8px;border-radius:4px;border:1px solid #ccc;"><option>Windows spotlight</option><option>Picture</option><option>Slideshow</option></select></div>
        ${settingsToggle('Show fun facts, tips, tricks on lock screen', 'Microsoft serves daily content', true)}
        ${settingsToggle('Show weather details on lock screen', 'Quick glance at the forecast', true)}
        <h3 style="margin:14px 0 8px;">Apps with detailed status</h3>
        ${settingsToggle('Calendar', 'Show upcoming events', true)}
        ${settingsToggle('Mail', 'Show email count', false)}
        ${settingsToggle('Weather', 'Show current conditions', true)}
        <h3 style="margin:14px 0 8px;">Screen saver</h3>
        <div class="setting-item"><div><div class="setting-label">Screen saver</div><div class="setting-description">Activate after 10 minutes of inactivity</div></div>
            <select style="padding:8px;border-radius:4px;border:1px solid #ccc;"><option>(None)</option><option>3D Text</option><option>Blank</option><option>Bubbles</option><option>Mystify</option><option>Photos</option><option>Ribbons</option></select></div>`;
}

function settingsRenderDisplay() {
    return `<h2>🖥️ Display</h2>
        ${settingsSlider('Brightness', 'Adjust screen brightness', 80)}
        ${settingsToggle('Night light', 'Reduce blue light for better sleep', false)}
        ${settingsSlider('Night light strength', 'Color temperature', 48)}
        ${settingsToggle('Auto-adjust at sunset/sunrise', 'Schedule night light', true)}
        <div class="setting-item"><div><div class="setting-label">Display resolution</div><div class="setting-description">Native: 3840 × 2160</div></div>
            <select style="padding:8px;border-radius:4px;border:1px solid #ccc;"><option>3840 × 2160 (Recommended)</option><option>2560 × 1440</option><option>1920 × 1080</option><option>1680 × 1050</option><option>1280 × 720</option></select></div>
        <div class="setting-item"><div><div class="setting-label">Display orientation</div><div class="setting-description"></div></div>
            <select style="padding:8px;border-radius:4px;border:1px solid #ccc;"><option>Landscape</option><option>Portrait</option><option>Landscape (flipped)</option><option>Portrait (flipped)</option></select></div>
        <div class="setting-item"><div><div class="setting-label">Scale & layout</div><div class="setting-description">Make text and apps bigger</div></div>
            <select style="padding:8px;border-radius:4px;border:1px solid #ccc;"><option>100% (Recommended)</option><option>125%</option><option>150%</option><option>175%</option><option>200%</option></select></div>
        <div class="setting-item"><div><div class="setting-label">Refresh rate</div><div class="setting-description">Higher = smoother motion</div></div>
            <select style="padding:8px;border-radius:4px;border:1px solid #ccc;"><option>240 Hz</option><option>165 Hz</option><option>144 Hz</option><option>120 Hz</option><option>60 Hz</option></select></div>
        ${settingsToggle('HDR', 'High Dynamic Range for compatible displays', true)}
        ${settingsButton('Multiple displays', 'Detect or arrange external monitors', 'Detect', "alert('No additional displays detected.')")}`;
}

function settingsRenderSound() {
    return `<h2>🔊 Sound</h2>
        <h3 style="margin:14px 0 8px;">Output</h3>
        <div class="setting-item"><div><div class="setting-label">Output device</div><div class="setting-description">Speakers (Realtek Audio)</div></div>
            <select style="padding:8px;border-radius:4px;border:1px solid #ccc;"><option>Speakers (Realtek)</option><option>Headphones</option><option>HDMI Audio</option><option>Sony WH-1000XM5</option></select></div>
        ${settingsSlider('Master volume', '', 75)}
        ${settingsSlider('Balance — Left', '', 100)}
        ${settingsSlider('Balance — Right', '', 100)}
        <h3 style="margin:14px 0 8px;">Input</h3>
        <div class="setting-item"><div><div class="setting-label">Input device</div><div class="setting-description">Microphone (Realtek)</div></div>
            <select style="padding:8px;border-radius:4px;border:1px solid #ccc;"><option>Microphone (Realtek)</option><option>Headset Mic</option><option>USB Mic</option></select></div>
        ${settingsSlider('Microphone volume', '', 80)}
        ${settingsToggle('Microphone boost (+20 dB)', 'Increase mic sensitivity', false)}
        ${settingsButton('Test microphone', 'Speak to see input level', 'Start test', "alert('🎤 Listening... mic is working.')")}
        <h3 style="margin:14px 0 8px;">Advanced</h3>
        ${settingsToggle('Spatial sound (Dolby Atmos)', '3D audio for movies & games', true)}
        ${settingsToggle('Mono audio', 'Combine left and right', false)}
        ${settingsButton('App volume mixer', 'Set volume per application', 'Open', "alert('Volume mixer would open.')")}`;
}

function settingsRenderNotifications() {
    return `<h2>🔔 Notifications & actions</h2>
        ${settingsToggle('Notifications', 'Get notifications from apps and other senders', true)}
        ${settingsToggle('Notification sound', 'Play a sound when notifications arrive', true)}
        ${settingsToggle('Show notifications on lock screen', 'See alerts before signing in', false)}
        ${settingsToggle('Show reminders and incoming VoIP calls on lock screen', '', true)}
        ${settingsToggle('Hide content of sensitive notifications', 'Until you sign in', true)}
        ${settingsToggle('Allow notifications to play sounds', '', true)}
        <h3 style="margin:14px 0 8px;">Focus assist</h3>
        <div class="setting-item"><div><div class="setting-label">Focus assist</div><div class="setting-description">Hide notifications during certain times</div></div>
            <select style="padding:8px;border-radius:4px;border:1px solid #ccc;"><option>Off</option><option>Priority only</option><option>Alarms only</option></select></div>
        ${settingsToggle('Automatic rule: When using full-screen apps', 'Like games or movies', true)}
        ${settingsToggle('Automatic rule: When duplicating my display', 'Useful during presentations', true)}
        ${settingsToggle('Automatic rule: During these hours', '10:00 PM – 7:00 AM', true)}
        <h3 style="margin:14px 0 8px;">Notifications from these senders</h3>
        ${settingsToggle('Mail', '', true)}
        ${settingsToggle('Calendar', '', true)}
        ${settingsToggle('Microsoft Edge', '', true)}
        ${settingsToggle('Discord', '', true)}
        ${settingsToggle('Microsoft Store', '', false)}`;
}

function settingsRenderPower() {
    return `<h2>🔋 Power & sleep</h2>
        <h3 style="margin:14px 0 8px;">Screen</h3>
        <div class="setting-item"><div><div class="setting-label">On battery, turn off after</div><div class="setting-description"></div></div>
            <select style="padding:8px;border-radius:4px;border:1px solid #ccc;"><option>1 minute</option><option>3 minutes</option><option>5 minutes</option><option selected>10 minutes</option><option>15 minutes</option><option>30 minutes</option><option>Never</option></select></div>
        <div class="setting-item"><div><div class="setting-label">When plugged in, turn off after</div><div class="setting-description"></div></div>
            <select style="padding:8px;border-radius:4px;border:1px solid #ccc;"><option>5 minutes</option><option>10 minutes</option><option selected>15 minutes</option><option>30 minutes</option><option>1 hour</option><option>Never</option></select></div>
        <h3 style="margin:14px 0 8px;">Sleep</h3>
        <div class="setting-item"><div><div class="setting-label">On battery, sleep after</div><div class="setting-description"></div></div>
            <select style="padding:8px;border-radius:4px;border:1px solid #ccc;"><option selected>15 minutes</option><option>30 minutes</option><option>1 hour</option><option>Never</option></select></div>
        <div class="setting-item"><div><div class="setting-label">When plugged in, sleep after</div><div class="setting-description"></div></div>
            <select style="padding:8px;border-radius:4px;border:1px solid #ccc;"><option>30 minutes</option><option selected>1 hour</option><option>3 hours</option><option>Never</option></select></div>
        <h3 style="margin:14px 0 8px;">Battery</h3>
        <div class="setting-item"><div><div class="setting-label">Battery level</div><div class="setting-description">87% — 4h 32m remaining</div></div>
            <div style="width:200px;height:14px;background:#e0e0e0;border-radius:7px;overflow:hidden;"><div style="width:87%;height:100%;background:linear-gradient(90deg,#107c10,#4caf50);"></div></div></div>
        ${settingsToggle('Battery saver', 'Automatically turn on at 20%', true)}
        ${settingsToggle('Lower screen brightness while in battery saver', '', true)}
        <div class="setting-item"><div><div class="setting-label">Power mode</div><div class="setting-description"></div></div>
            <select style="padding:8px;border-radius:4px;border:1px solid #ccc;"><option>Best battery life</option><option selected>Balanced</option><option>Best performance</option></select></div>`;
}

function settingsRenderStorage() {
    return `<h2>💾 Storage</h2>
        <div style="background:#f5f5f5;padding:18px;border-radius:8px;margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><strong>Local Disk (C:)</strong><span style="color:#666;">237 GB free of 476 GB</span></div>
            <div style="height:14px;background:#e0e0e0;border-radius:7px;overflow:hidden;display:flex;">
                <div style="width:25%;background:#0078d4;" title="Apps"></div>
                <div style="width:8%;background:#00bcf2;" title="Documents"></div>
                <div style="width:6%;background:#107c10;" title="Pictures"></div>
                <div style="width:5%;background:#ff8c00;" title="Music"></div>
                <div style="width:6%;background:#e81123;" title="Videos"></div>
            </div>
            <div style="display:flex;gap:14px;margin-top:8px;font-size:11px;color:#666;flex-wrap:wrap;">
                <span><span style="display:inline-block;width:10px;height:10px;background:#0078d4;border-radius:2px;"></span> Apps 119 GB</span>
                <span><span style="display:inline-block;width:10px;height:10px;background:#00bcf2;border-radius:2px;"></span> Docs 38 GB</span>
                <span><span style="display:inline-block;width:10px;height:10px;background:#107c10;border-radius:2px;"></span> Pics 28 GB</span>
                <span><span style="display:inline-block;width:10px;height:10px;background:#ff8c00;border-radius:2px;"></span> Music 24 GB</span>
                <span><span style="display:inline-block;width:10px;height:10px;background:#e81123;border-radius:2px;"></span> Video 30 GB</span>
            </div>
        </div>
        ${settingsToggle('Storage Sense', 'Automatically free up space', true)}
        ${settingsToggle('Delete temporary files', "Files apps don't use", true)}
        ${settingsToggle('Delete files in Recycle Bin after 30 days', '', true)}
        ${settingsToggle('Delete files in Downloads after 60 days', '', false)}
        ${settingsButton('Clean up recommendations', 'Free up space now', 'Run cleanup', "alert('Storage cleanup would free 4.2 GB.')")}
        <h3 style="margin:14px 0 8px;">More storage settings</h3>
        ${settingsButton('Change where new content is saved', 'Apps, documents, pictures location', 'Change', "alert('Default save locations dialog.')")}
        ${settingsButton('Manage Storage Spaces', 'Combine drives into pools', 'Manage', "alert('Storage Spaces would open.')")}
        ${settingsButton('Optimize drives', 'Defragment and trim drives', 'Optimize', "alert('Drive optimization would start.')")}`;
}

function settingsRenderMouse() {
    return `<h2>🖱️ Mouse</h2>
        <div class="setting-item"><div><div class="setting-label">Primary button</div><div class="setting-description">Choose your main mouse button</div></div>
            <select style="padding:8px;border-radius:4px;border:1px solid #ccc;"><option selected>Left</option><option>Right</option></select></div>
        ${settingsSlider('Cursor speed', 'How fast your pointer moves', 10, 1, 20)}
        ${settingsSlider('Scroll wheel speed', '', 3, 1, 10)}
        <div class="setting-item"><div><div class="setting-label">Roll the mouse wheel to scroll</div><div class="setting-description"></div></div>
            <select style="padding:8px;border-radius:4px;border:1px solid #ccc;"><option selected>Multiple lines at a time</option><option>One screen at a time</option></select></div>
        ${settingsToggle('Scroll inactive windows when hovering', 'Wheel-scroll any window under cursor', true)}
        <h3 style="margin:14px 0 8px;">Pointer</h3>
        <div class="setting-item"><div><div class="setting-label">Cursor scheme</div><div class="setting-description"></div></div>
            <select style="padding:8px;border-radius:4px;border:1px solid #ccc;"><option>Windows Default</option><option>Windows Black</option><option>Windows Inverted</option><option>Windows Standard (large)</option><option>Magnified</option></select></div>
        ${settingsSlider('Cursor size', '', 1, 1, 15)}
        ${settingsToggle('Show pointer trails', 'Visible trail when moving', false)}
        ${settingsToggle('Hide pointer while typing', '', true)}
        ${settingsToggle('Show pointer location when I press Ctrl', 'Animated circle reveals cursor', true)}`;
}

function settingsRenderKeyboard() {
    return `<h2>⌨️ Keyboard</h2>
        ${settingsSlider('Repeat delay', 'Long → short', 2, 0, 4)}
        ${settingsSlider('Repeat rate', 'Slow → fast', 25, 0, 30)}
        ${settingsSlider('Cursor blink rate', '', 5, 0, 10)}
        <h3 style="margin:14px 0 8px;">Input</h3>
        <div class="setting-item"><div><div class="setting-label">Default input language</div><div class="setting-description"></div></div>
            <select style="padding:8px;border-radius:4px;border:1px solid #ccc;"><option>English (US) — US keyboard</option><option>English (UK)</option><option>Español</option><option>Français</option><option>Deutsch</option><option>日本語</option></select></div>
        ${settingsToggle('Autocorrect misspelled words', '', true)}
        ${settingsToggle('Highlight misspelled words', '', true)}
        ${settingsToggle('Show text suggestions as I type', '', true)}
        ${settingsToggle('Multilingual text suggestions', '', false)}
        <h3 style="margin:14px 0 8px;">Advanced</h3>
        ${settingsToggle('Use the desktop language bar when available', '', false)}
        ${settingsToggle('Let me set a different input method for each app window', '', false)}
        ${settingsButton('Keyboard shortcuts', 'Customize hotkeys', 'Customize', "alert('Keyboard shortcut customization.')")}`;
}

function settingsRenderMR() {
    return `<h2>🥽 Mixed reality</h2>
        <div style="background:linear-gradient(135deg,#5c2d91,#1a1a2e);color:white;padding:24px;border-radius:10px;margin-bottom:16px;text-align:center;">
            <div style="font-size:54px;margin-bottom:8px;">🥽</div>
            <div style="font-size:18px;font-weight:300;">Windows Mixed Reality</div>
            <div style="opacity:.85;font-size:13px;margin-top:6px;">No mixed reality headset detected</div>
        </div>
        ${settingsToggle('Run Mixed Reality on this PC', '', true)}
        ${settingsToggle('Use boundary', 'Set a play area for safe movement', true)}
        ${settingsSlider('Boundary tracker range', 'meters', 3, 1, 10)}
        <div class="setting-item"><div><div class="setting-label">Headset display</div><div class="setting-description"></div></div>
            <select style="padding:8px;border-radius:4px;border:1px solid #ccc;"><option>Auto</option><option>60 Hz</option><option>90 Hz</option></select></div>
        ${settingsToggle('Audio and speech', 'Use headset audio when worn', true)}
        ${settingsToggle('Allow apps to access spatial mapping', '', false)}
        ${settingsButton('Set up a mixed reality headset', 'Pair a Meta Quest, HoloLens, or other', 'Set up', "alert('Headset pairing wizard would launch.')")}`;
}

function settingsRenderAbout() {
    const s = window._vmSpecs || {};
    const planMeta = getPlanMeta(s.plan);
    const cpuStr  = s.cpu     ? `Intel® Core™ @ ${s.cpu} GHz` : 'Intel® Core™ i9-14900K @ 8.0 GHz (24-core)';
    const ramStr  = s.ram     ? `${s.ram} GB DDR5` : '500 GB DDR5';
    const gpuStr  = s.gpu     ? `NVIDIA ${s.gpu}` : 'NVIDIA RTX 4090 24GB';
    const diskStr = s.storage ? (s.storage >= 1000 ? (s.storage/1000).toFixed(0)+' TB' : s.storage+' GB') + ' NVMe SSD' : '100 TB Samsung NVMe SSD';
    return `<h2>ℹ️ About</h2>
        <div style="background:linear-gradient(135deg,${planMeta.color1},${planMeta.color2});color:white;padding:18px 22px;border-radius:10px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 6px 20px ${planMeta.shadow};">
            <div>
                <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:.85;font-weight:700;">Active VM Plan</div>
                <div style="font-size:24px;font-weight:700;margin-top:2px;">${planMeta.icon} ${planMeta.name}</div>
                <div style="font-size:12px;opacity:.85;margin-top:4px;">${planMeta.tagline}</div>
            </div>
            <button onclick="window.location.href='/run_vm_on.html'" style="background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.4);color:white;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;backdrop-filter:blur(8px);">Switch plan →</button>
        </div>
        <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin-bottom:14px;">
            <h3 style="margin-bottom:14px;">Device specifications</h3>
            <div style="display:grid;grid-template-columns:140px 1fr;gap:6px 14px;font-size:13px;">
                <div style="color:#666;">Device name</div><div><strong>DESKTOP-${(userData.username||'WIN10').toUpperCase().slice(0,8)}</strong></div>
                <div style="color:#666;">Processor</div><div>${cpuStr}</div>
                <div style="color:#666;">Installed RAM</div><div>${ramStr}</div>
                <div style="color:#666;">Graphics</div><div>${gpuStr}</div>
                <div style="color:#666;">Storage</div><div>${diskStr}</div>
                <div style="color:#666;">Device ID</div><div>A8F2B1C9-44E7-4D8A-9C32-6E5F8D3A1B7C</div>
                <div style="color:#666;">Product ID</div><div>00330-80000-00000-AA420</div>
                <div style="color:#666;">System type</div><div>64-bit operating system, x64-based processor</div>
                <div style="color:#666;">Pen and touch</div><div>No pen or touch input is available for this display</div>
            </div>
        </div>
        <div style="background:#f5f5f5;padding:20px;border-radius:8px;margin-bottom:14px;">
            <h3 style="margin-bottom:14px;">Windows specifications</h3>
            <div style="display:grid;grid-template-columns:140px 1fr;gap:6px 14px;font-size:13px;">
                <div style="color:#666;">Edition</div><div>Windows 10 Pro</div>
                <div style="color:#666;">Version</div><div>22H2</div>
                <div style="color:#666;">Installed on</div><div>${new Date().toLocaleDateString()}</div>
                <div style="color:#666;">OS build</div><div>19045.3803</div>
                <div style="color:#666;">Experience</div><div>Windows Feature Experience Pack 1000.19053.1000.0</div>
            </div>
        </div>
        ${settingsButton('Copy', 'Copy specs to clipboard', 'Copy', `navigator.clipboard.writeText('Windows 10 Pro 22H2 — ${planMeta.name} VM\\n${cpuStr}\\n${ramStr}\\n${gpuStr}\\n${diskStr}'); alert('Specs copied!')`)}
        ${settingsButton('Rename this PC', 'Change your computer name', 'Rename', "const n=prompt('New PC name:'); if(n) alert('PC will be renamed to: '+n+' (after restart)')")}
        ${settingsButton('Reset VM plan', 'Choose a different VM plan', 'Choose plan', "if(confirm('Pick a new VM plan? Your apps & data stay.')){localStorage.removeItem('vmSpecs');window.location.href='/run_vm_on.html';}")}`;
}

// ── VM plan metadata (shared by About, taskbar badge, etc.) ──
function getPlanMeta(plan) {
    const plans = {
        free:      { name:'Free',      icon:'💻', tagline:'Standard VM for everyday use',         color1:'#3ba55d', color2:'#22c55e', shadow:'rgba(59,165,93,0.35)' },
        pro:       { name:'Pro',       icon:'🚀', tagline:'High-performance VM for power users',  color1:'#5865f2', color2:'#7289da', shadow:'rgba(88,101,242,0.35)' },
        master:    { name:'Master',    icon:'⚡', tagline:'Beast-tier hardware for serious work', color1:'#e67e22', color2:'#e91e8c', shadow:'rgba(230,126,34,0.35)' },
        exclusive: { name:'Exclusive', icon:'💎', tagline:'The ultimate VM — no compromises',     color1:'#9b59b6', color2:'#e91e8c', shadow:'rgba(155,89,182,0.45)' }
    };
    return plans[plan] || plans.free;
}

// ═══════════════════════════════════════════════════════════════════════════
// BLUETOOTH APP
// ═══════════════════════════════════════════════════════════════════════════
let _btDevices = [
    { name:'Sony WH-1000XM5',     icon:'🎧', type:'Audio',      paired:true,  connected:true,  batt:76 },
    { name:'Logitech MX Master 3', icon:'🖱️', type:'Mouse',      paired:true,  connected:true,  batt:64 },
    { name:'Logitech K380',        icon:'⌨️', type:'Keyboard',   paired:true,  connected:true,  batt:45 },
    { name:'iPhone 15 Pro',        icon:'📱', type:'Phone',      paired:true,  connected:false, batt:92 },
    { name:'AirPods Pro',          icon:'🎧', type:'Audio',      paired:true,  connected:false, batt:88 },
    { name:'Xbox Wireless Ctrl',   icon:'🎮', type:'Controller', paired:true,  connected:false, batt:50 }
];
let _btScanning = false;

function createBluetooth() {
    setTimeout(renderBluetoothDevices, 50);
    return `<div style="height:100%;background:#f5f5f5;display:flex;flex-direction:column;">
        <div style="padding:18px 22px;background:#fff;border-bottom:1px solid #e0e0e0;display:flex;justify-content:space-between;align-items:center;">
            <div>
                <h2 style="margin:0;font-weight:400;">📡 Bluetooth & other devices</h2>
                <div style="color:#666;font-size:13px;margin-top:4px;">Discoverable as "DESKTOP-${(userData.username||'WIN10').toUpperCase().slice(0,8)}"</div>
            </div>
            <label class="toggle-switch"><input type="checkbox" id="bt-master" checked onchange="btToggleMaster(this.checked)"><span class="toggle-slider"></span></label>
        </div>
        <div style="padding:18px 22px;border-bottom:1px solid #e0e0e0;background:#fff;">
            <button onclick="btScanForDevices()" style="padding:10px 20px;background:#0078d4;color:white;border:none;border-radius:4px;cursor:pointer;font-size:14px;">+ Add Bluetooth or other device</button>
        </div>
        <div id="bt-scanning" style="display:none;padding:14px 22px;background:#fff8e1;border-bottom:1px solid #ffe082;color:#5d4037;font-size:13px;">
            🔍 Scanning for nearby devices... <span id="bt-found-count">0</span> found
        </div>
        <div id="bt-list" style="flex:1;overflow-y:auto;padding:0 22px;"></div>
    </div>`;
}

function renderBluetoothDevices() {
    const list = document.getElementById('bt-list');
    if (!list) return;
    const groups = {};
    _btDevices.forEach(d => { (groups[d.type] = groups[d.type] || []).push(d); });
    list.innerHTML = Object.keys(groups).map(type => {
        const items = groups[type].map((d,gi) => {
            const idx = _btDevices.indexOf(d);
            const battColor = d.batt > 50 ? '#4caf50' : d.batt > 20 ? '#ff9800' : '#f44336';
            return `<div style="display:flex;align-items:center;gap:14px;padding:14px;background:white;border-radius:8px;margin-bottom:8px;">
                <div style="font-size:32px;">${d.icon}</div>
                <div style="flex:1;">
                    <div style="font-weight:500;font-size:14px;">${d.name}</div>
                    <div style="color:${d.connected?'#107c10':'#666'};font-size:12px;">
                        ${d.connected ? '● Connected' : (d.paired ? '○ Paired' : 'Available')} • Battery <span style="color:${battColor};font-weight:500;">${d.batt}%</span>
                    </div>
                </div>
                <button onclick="btToggleConnect(${idx})" style="padding:6px 14px;border-radius:4px;border:1px solid ${d.connected?'#e81123':'#0078d4'};background:white;color:${d.connected?'#e81123':'#0078d4'};cursor:pointer;font-size:13px;">
                    ${d.connected ? 'Disconnect' : 'Connect'}
                </button>
                <button onclick="btRemoveDevice(${idx})" style="padding:6px 10px;border-radius:4px;border:1px solid #ccc;background:white;color:#666;cursor:pointer;font-size:13px;">Remove</button>
            </div>`;
        }).join('');
        return `<h3 style="margin:18px 0 10px;color:#444;font-size:14px;text-transform:uppercase;letter-spacing:.5px;">${type}</h3>${items}`;
    }).join('');
}

function btToggleMaster(on) {
    const list = document.getElementById('bt-list');
    if (list) { list.style.opacity = on?'1':'0.4'; list.style.pointerEvents = on?'auto':'none'; }
}

function btToggleConnect(idx) {
    const d = _btDevices[idx];
    d.connected = !d.connected;
    renderBluetoothDevices();
    if (typeof playSound === 'function') playSound('notification');
}

function btRemoveDevice(idx) {
    if (!confirm('Remove ' + _btDevices[idx].name + '?')) return;
    _btDevices.splice(idx, 1);
    renderBluetoothDevices();
}

function btScanForDevices() {
    if (_btScanning) return;
    _btScanning = true;
    const banner = document.getElementById('bt-scanning');
    const cnt    = document.getElementById('bt-found-count');
    if (banner) banner.style.display = 'block';
    let found = 0;
    const candidates = [
        { name:'JBL Flip 6',           icon:'🔊', type:'Audio',      batt:Math.floor(60+Math.random()*30) },
        { name:'Magic Trackpad',       icon:'🖱️', type:'Mouse',      batt:Math.floor(60+Math.random()*30) },
        { name:'Apple Watch Series 9', icon:'⌚', type:'Other',      batt:Math.floor(60+Math.random()*30) },
        { name:'Samsung Galaxy Buds',  icon:'🎧', type:'Audio',      batt:Math.floor(60+Math.random()*30) }
    ];
    const t = setInterval(() => {
        if (found >= candidates.length) {
            clearInterval(t);
            _btScanning = false;
            if (banner) setTimeout(() => banner.style.display='none', 1500);
            return;
        }
        const c = candidates[found];
        if (!_btDevices.find(d => d.name === c.name)) {
            _btDevices.push({ ...c, paired:false, connected:false });
            renderBluetoothDevices();
        }
        found++;
        if (cnt) cnt.textContent = found;
    }, 800);
}

function createTaskManager() {
    const baseProcs = [
        { name: 'System Idle Process',   icon: '⚙️', pid: 0,    cpu: 0.0,  mem: 8,      status: 'Running', type: 'System' },
        { name: 'System',                icon: '⚙️', pid: 4,    cpu: 0.1,  mem: 144,    status: 'Running', type: 'System' },
        { name: 'Registry',              icon: '📋', pid: 108,  cpu: 0.0,  mem: 72000,  status: 'Running', type: 'System' },
        { name: 'smss.exe',              icon: '🖥️', pid: 348,  cpu: 0.0,  mem: 1024,   status: 'Running', type: 'System' },
        { name: 'csrss.exe',             icon: '🖥️', pid: 512,  cpu: 0.2,  mem: 4096,   status: 'Running', type: 'System' },
        { name: 'winlogon.exe',          icon: '🔐', pid: 620,  cpu: 0.0,  mem: 5120,   status: 'Running', type: 'System' },
        { name: 'services.exe',          icon: '⚙️', pid: 668,  cpu: 0.0,  mem: 6144,   status: 'Running', type: 'System' },
        { name: 'lsass.exe',             icon: '🔒', pid: 676,  cpu: 0.1,  mem: 12288,  status: 'Running', type: 'System' },
        { name: 'svchost.exe',           icon: '⚙️', pid: 872,  cpu: 0.3,  mem: 18432,  status: 'Running', type: 'System' },
        { name: 'svchost.exe',           icon: '⚙️', pid: 960,  cpu: 0.1,  mem: 15360,  status: 'Running', type: 'System' },
        { name: 'MsMpEng.exe',           icon: '🛡️', pid: 1234, cpu: 0.4,  mem: 32768,  status: 'Running', type: 'Background' },
        { name: 'explorer.exe',          icon: '📁', pid: 2340, cpu: 0.8,  mem: 48640,  status: 'Running', type: 'App' },
        { name: 'taskmgr.exe',           icon: '📊', pid: 3120, cpu: 2.1,  mem: 20480,  status: 'Running', type: 'App' },
        { name: 'chrome.exe',            icon: '🔵', pid: 4096, cpu: 3.2,  mem: 256000, status: 'Running', type: 'App' },
        { name: 'Code.exe',              icon: '💻', pid: 5120, cpu: 2.8,  mem: 312000, status: 'Running', type: 'App' },
        { name: 'Discord.exe',           icon: '💬', pid: 6144, cpu: 0.9,  mem: 128000, status: 'Running', type: 'App' },
        { name: 'RuntimeBroker.exe',     icon: '⚙️', pid: 7200, cpu: 0.1,  mem: 9216,   status: 'Running', type: 'Background' },
        { name: 'SearchApp.exe',         icon: '🔍', pid: 7800, cpu: 0.2,  mem: 24576,  status: 'Running', type: 'App' },
        { name: 'OneDrive.exe',          icon: '☁️', pid: 8900, cpu: 0.1,  mem: 22016,  status: 'Running', type: 'Background' },
        { name: 'Widgets.exe',           icon: '🪟', pid: 9100, cpu: 0.0,  mem: 11264,  status: 'Running', type: 'Background' },
    ];

    let selectedPid = null;
    window._tmProcs = baseProcs;

    setTimeout(() => { tmStartUpdater(); }, 100);

    return `
    <div style="height:100%;display:flex;flex-direction:column;font-family:'Segoe UI',sans-serif;font-size:13px;">
      <div style="display:flex;background:#f3f3f3;border-bottom:1px solid #ddd;">
        <button class="tm-tab active" id="tm-tab-proc" onclick="tmSwitchTab('processes',event)">Processes</button>
        <button class="tm-tab" id="tm-tab-perf" onclick="tmSwitchTab('performance',event)">Performance</button>
        <button class="tm-tab" id="tm-tab-app" onclick="tmSwitchTab('apphistory',event)">App history</button>
        <button class="tm-tab" id="tm-tab-start" onclick="tmSwitchTab('startup',event)">Startup</button>
        <button class="tm-tab" id="tm-tab-users" onclick="tmSwitchTab('users',event)">Users</button>
        <button class="tm-tab" id="tm-tab-det" onclick="tmSwitchTab('details',event)">Details</button>
      </div>

      <!-- PROCESSES TAB -->
      <div id="tm-processes" style="flex:1;display:flex;flex-direction:column;overflow:hidden;">
        <div style="display:grid;grid-template-columns:1fr 80px 100px 90px 90px;background:#f3f3f3;border-bottom:2px solid #ddd;padding:4px 10px;font-weight:600;font-size:12px;color:#444;cursor:pointer;user-select:none;">
          <span onclick="tmSortBy('name')">Name ⇅</span>
          <span style="text-align:right;" onclick="tmSortBy('cpu')">CPU ⇅</span>
          <span style="text-align:right;" onclick="tmSortBy('mem')">Memory ⇅</span>
          <span style="text-align:right;">PID</span>
          <span>Status</span>
        </div>
        <div id="tm-proc-list" style="flex:1;overflow-y:auto;"></div>
        <div style="display:flex;justify-content:flex-end;align-items:center;padding:6px 10px;border-top:1px solid #ddd;background:#f9f9f9;gap:8px;">
          <span style="flex:1;font-size:12px;color:#666;" id="tm-proc-count">${baseProcs.length} processes</span>
          <button onclick="tmEndTask()" style="padding:6px 20px;background:#d13438;color:white;border:none;border-radius:3px;cursor:pointer;font-size:13px;font-weight:600;" id="tm-end-btn" disabled>End Task</button>
        </div>
      </div>

      <!-- PERFORMANCE TAB -->
      <div id="tm-performance" style="flex:1;display:none;overflow:hidden;display:none;">
        <div style="display:flex;height:100%;">
          <div style="width:180px;border-right:1px solid #eee;overflow-y:auto;background:#fafafa;">
            ${(()=>{
              const s = window._vmSpecs || {};
              const cpuSub = s.cpu ? 'Intel Core @ '+s.cpu+' GHz' : 'Intel Core i9-14900K';
              const memSub = s.ram ? s.ram+' GB DDR5' : '500 GB DDR5';
              const dskSub = s.storage ? (s.storage>=1000?(s.storage/1000).toFixed(0)+'TB':s.storage+'GB')+' NVMe' : 'Samsung 990 Pro 100TB';
              const gpuSub = s.gpu ? s.gpu : 'RTX 4090';
              return [
                ['cpu','🖥️','CPU',cpuSub],
                ['mem','🧠','Memory',memSub],
                ['disk','💾','Disk 0 (C:)',dskSub],
                ['gpu','🎮','GPU 0',gpuSub],
                ['net','🌐','Ethernet','Intel I225-V 2.5Gb'],
              ];
            })().map(([id,icon,label,sub],i)=>`
            <div id="tm-nav-${id}" onclick="tmPerfNav('${id}')" style="padding:12px;cursor:pointer;border-bottom:1px solid #f0f0f0;${i===0?'background:#e3f2fd;border-left:3px solid #0078d4;':''}" onmouseover="this.style.background='#e8f4ff'" onmouseout="this.style.background='${i===0?'#e3f2fd':'transparent'}'">
              <div style="font-size:18px;margin-bottom:2px;">${icon}</div>
              <div style="font-weight:600;font-size:13px;">${label}</div>
              <div style="font-size:11px;color:#888;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${sub}</div>
              <div style="font-size:11px;color:#0078d4;margin-top:2px;" id="tm-nav-${id}-val">Loading...</div>
            </div>`).join('')}
          </div>
          <div style="flex:1;padding:20px;overflow-y:auto;" id="tm-perf-detail">
            <!-- filled by tmPerfNav -->
          </div>
        </div>
      </div>

      <!-- STARTUP TAB -->
      <div id="tm-startup" style="flex:1;display:none;overflow:auto;padding:0;">
        <div style="display:grid;grid-template-columns:1fr 100px 120px 120px;background:#f3f3f3;border-bottom:2px solid #ddd;padding:6px 12px;font-weight:600;font-size:12px;color:#444;">
          <span>Name</span><span>Publisher</span><span>Status</span><span>Startup impact</span>
        </div>
        ${[
          ['Microsoft Edge','Microsoft Corp.','Enabled','Medium'],
          ['Discord','Discord Inc.','Enabled','High'],
          ['OneDrive','Microsoft Corp.','Enabled','Medium'],
          ['Spotify','Spotify AB','Disabled','Low'],
          ['Steam','Valve Corp.','Disabled','High'],
          ['Teams','Microsoft Corp.','Enabled','High'],
          ['Zoom','Zoom Video','Disabled','Medium'],
          ['Slack','Slack Tech.','Disabled','Medium'],
        ].map(([n,p,s,i])=>`
        <div style="display:grid;grid-template-columns:1fr 100px 120px 120px;padding:8px 12px;border-bottom:1px solid #f5f5f5;cursor:pointer;" onmouseover="this.style.background='#f0f7ff'" onmouseout="this.style.background='transparent'">
          <span style="font-weight:500;">${n}</span>
          <span style="color:#666;font-size:12px;">${p}</span>
          <span style="color:${s==='Enabled'?'#107c10':'#d13438'};font-size:12px;">${s}</span>
          <span style="color:${i==='High'?'#d13438':i==='Medium'?'#ca5010':'#107c10'};font-size:12px;">${i}</span>
        </div>`).join('')}
      </div>

      <!-- USERS TAB -->
      <div id="tm-users" style="flex:1;display:none;overflow:auto;padding:16px;">
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#f0f7ff;border-radius:8px;border:1px solid #cce4ff;margin-bottom:8px;">
          <div style="width:48px;height:48px;background:linear-gradient(135deg,#0078d4,#50a0ff);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;">😊</div>
          <div>
            <div style="font-weight:600;font-size:15px;">${userData?.username||'User'}</div>
            <div style="font-size:12px;color:#666;">Administrator • Active • Connected</div>
          </div>
          <div style="margin-left:auto;font-size:12px;color:#888;">CPU: <span id="tm-user-cpu">0%</span>  Mem: <span id="tm-user-mem">0 MB</span></div>
        </div>
      </div>

      <!-- DETAILS TAB -->
      <div id="tm-details" style="flex:1;display:none;overflow:auto;">
        <div style="display:grid;grid-template-columns:1fr 60px 100px 80px 120px;background:#f3f3f3;border-bottom:2px solid #ddd;padding:5px 10px;font-weight:600;font-size:12px;color:#444;">
          <span>Name</span><span>PID</span><span>Status</span><span>CPU</span><span>Memory</span>
        </div>
        ${baseProcs.map(p=>`
        <div style="display:grid;grid-template-columns:1fr 60px 100px 80px 120px;padding:4px 10px;border-bottom:1px solid #f5f5f5;font-size:12px;cursor:pointer;" onmouseover="this.style.background='#f0f7ff'" onmouseout="this.style.background='transparent'">
          <span>${p.name}</span>
          <span style="color:#666;">${p.pid}</span>
          <span style="color:#107c10;">${p.status}</span>
          <span>${p.cpu.toFixed(1)}%</span>
          <span>${(p.mem/1024).toFixed(1)} MB</span>
        </div>`).join('')}
      </div>

      <!-- APP HISTORY TAB -->
      <div id="tm-apphistory" style="flex:1;display:none;overflow:auto;padding:12px;">
        <div style="color:#666;font-size:12px;margin-bottom:12px;">Resource usage since 1/1/2024 for current user account</div>
        <div style="display:grid;grid-template-columns:1fr 80px 80px 80px;background:#f3f3f3;border-bottom:2px solid #ddd;padding:5px 10px;font-weight:600;font-size:12px;color:#444;margin-bottom:0;">
          <span>Name</span><span>CPU time</span><span>Network</span><span>Metered</span>
        </div>
        ${[['Microsoft Edge','0:12:34','124 MB','2.1 MB'],['Teams','1:08:22','540 MB','80 MB'],['Mail','0:02:11','12 MB','0 MB'],['Discord','2:34:00','320 MB','44 MB'],['Xbox','0:45:00','56 MB','0 MB']].map(([n,c,net,m])=>`
        <div style="display:grid;grid-template-columns:1fr 80px 80px 80px;padding:7px 10px;border-bottom:1px solid #f5f5f5;font-size:12px;cursor:pointer;" onmouseover="this.style.background='#f0f7ff'" onmouseout="this.style.background='transparent'">
          <span>${n}</span><span style="color:#0078d4;">${c}</span><span>${net}</span><span style="color:#666;">${m}</span>
        </div>`).join('')}
      </div>
    </div>`;
}

function tmSwitchTab(tab, e) {
    const tabs = ['processes','performance','apphistory','startup','users','details'];
    tabs.forEach(t => {
        const el = document.getElementById('tm-' + t);
        if (el) el.style.display = 'none';
        const btn = document.getElementById('tm-tab-' + t.replace('processes','proc').replace('performance','perf').replace('apphistory','app').replace('startup','start').replace('users','users').replace('details','det'));
        if (btn) btn.classList.remove('active');
    });
    const show = document.getElementById('tm-' + tab);
    if (show) show.style.display = 'flex';
    if (e?.target) e.target.classList.add('active');
    if (tab === 'processes') tmRenderProcs();
    if (tab === 'performance') { tmPerfNav('cpu'); tmStartPerfUpdater(); }
}

let _tmProcInterval = null;
let _tmPerfInterval = null;
let _tmSelectedPid = null;

function tmStartUpdater() {
    tmRenderProcs();
    if (_tmProcInterval) clearInterval(_tmProcInterval);
    _tmProcInterval = setInterval(() => {
        if (document.getElementById('tm-proc-list')) tmRenderProcs();
        else clearInterval(_tmProcInterval);
    }, 2000);
    tmPerfNav('cpu');
}

function tmRenderProcs() {
    const list = document.getElementById('tm-proc-list');
    if (!list) return;

    // Give open windows stable PIDs stored on the window object itself
    const windowProcs = (openWindows || []).map(w => {
        if (!w._tmPid) w._tmPid = 10000 + Math.floor(Math.random() * 89999);
        if (w._tmCpu === undefined) w._tmCpu = Math.random() * 5;
        if (w._tmMem === undefined) w._tmMem = 30000 + Math.random() * 80000;
        // small jitter each render
        w._tmCpu = Math.max(0, w._tmCpu + (Math.random() - 0.5) * 0.4);
        return {
            name: w.title, icon: '🪟', pid: w._tmPid,
            cpu: w._tmCpu, mem: w._tmMem,
            status: 'Running', type: 'App',
            _appName: w.appName   // used by tmEndTask to actually close the window
        };
    });

    const sysProcNames = new Set(windowProcs.map(p => p.name.replace(/[^a-zA-Z]/g, '').toLowerCase()));
    const sysProcs = (window._tmProcs || []).filter(p => !sysProcNames.has(p.name.replace(/[^a-zA-Z]/g, '').toLowerCase()));
    sysProcs.forEach(p => { p.cpu = Math.max(0, p.cpu + (Math.random() - 0.5) * 0.4); });

    const procs = [...windowProcs, ...sysProcs];

    // Store full rendered list so tmEndTask can look up any proc by pid
    window._tmAllRendered = procs;

    const totalCpu = procs.reduce((a, b) => a + b.cpu, 0);
    const totalMem = procs.reduce((a, b) => a + b.mem, 0);
    const countEl = document.getElementById('tm-proc-count');
    if (countEl) countEl.textContent = `${procs.length} processes  |  CPU ${Math.min(totalCpu, 100).toFixed(1)}%  |  Memory ${(totalMem / 1024).toFixed(0)} MB`;

    const userCpu = document.getElementById('tm-user-cpu');
    const userMem = document.getElementById('tm-user-mem');
    if (userCpu) userCpu.textContent = Math.min(totalCpu, 100).toFixed(1) + '%';
    if (userMem) userMem.textContent = (totalMem / 1024).toFixed(0) + ' MB';

    list.innerHTML = procs.map(p => {
        const cpuPct = Math.min(p.cpu, 100);
        const cpuColor = cpuPct > 50 ? '#d13438' : cpuPct > 20 ? '#ca5010' : '#107c10';
        const memMb = (p.mem / 1024).toFixed(0);
        const isSelected = _tmSelectedPid === p.pid;
        const bg = isSelected ? 'background:#cce4ff;' : '';
        return `<div onclick="tmSelectProc(${p.pid})" style="display:grid;grid-template-columns:1fr 80px 100px 90px 90px;padding:5px 10px;border-bottom:1px solid #f5f5f5;cursor:pointer;${bg}align-items:center;"
            onmouseover="if(!${isSelected})this.style.background='#f0f7ff'"
            onmouseout="this.style.background='${isSelected ? '#cce4ff' : 'transparent'}'">
          <span style="display:flex;align-items:center;gap:6px;overflow:hidden;">
            <span style="font-size:15px;">${p.icon || '⚙️'}</span>
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.name}</span>
          </span>
          <span style="text-align:right;color:${cpuColor};font-size:12px;">${cpuPct.toFixed(1)}%</span>
          <span style="text-align:right;font-size:12px;">${memMb} MB</span>
          <span style="text-align:right;color:#888;font-size:12px;">${p.pid}</span>
          <span style="font-size:12px;color:#107c10;">${p.status}</span>
        </div>`;
    }).join('');
}

function tmSelectProc(pid) {
    _tmSelectedPid = pid;
    const btn = document.getElementById('tm-end-btn');
    if (btn) btn.disabled = false;
    tmRenderProcs();
}

function tmEndTask() {
    if (!_tmSelectedPid) return;

    // Search ALL rendered procs (system + open windows)
    const allProcs = window._tmAllRendered || [];
    const proc = allProcs.find(p => p.pid === _tmSelectedPid);
    if (!proc) return;

    const systemProcs = ['System', 'smss.exe', 'winlogon.exe', 'csrss.exe', 'lsass.exe'];
    if (systemProcs.includes(proc.name)) {
        if (confirm(`⚠️ Warning: Ending "${proc.name}" may cause system instability or a BSOD.\n\nAre you sure?`)) {
            triggerBSOD();
        }
        return;
    }

    // Close the actual window if it came from openWindows
    if (proc._appName) {
        closeWindow(proc._appName);
    }

    // Also remove from _tmProcs (simulated system procs)
    const sysProcs = window._tmProcs || [];
    const sysIdx = sysProcs.findIndex(p => p.pid === _tmSelectedPid);
    if (sysIdx > -1) sysProcs.splice(sysIdx, 1);
    window._tmProcs = sysProcs;

    addNotification('📊', 'Task Manager', `"${proc.name}" (PID ${proc.pid}) was ended.`);
    _tmSelectedPid = null;
    const btn = document.getElementById('tm-end-btn');
    if (btn) btn.disabled = true;
    tmRenderProcs();
}

function tmSortBy(col) {
    const procs = window._tmProcs || [];
    if (col === 'name') procs.sort((a,b)=>a.name.localeCompare(b.name));
    if (col === 'cpu') procs.sort((a,b)=>b.cpu-a.cpu);
    if (col === 'mem') procs.sort((a,b)=>b.mem-a.mem);
    window._tmProcs = procs;
    tmRenderProcs();
}

let _tmCpuHistory = Array(60).fill(0);
let _tmMemHistory = Array(60).fill(0);

function tmStartPerfUpdater() {
    if (_tmPerfInterval) clearInterval(_tmPerfInterval);
    _tmPerfInterval = setInterval(() => {
        const cpu = Math.random() * 12 + 2;
        const mem = 41000 + Math.random() * 2000; // ~8% of 500GB
        _tmCpuHistory.push(cpu); _tmCpuHistory.shift();
        _tmMemHistory.push(mem); _tmMemHistory.shift();
        const navCpu = document.getElementById('tm-nav-cpu-val');
        if (navCpu) navCpu.textContent = cpu.toFixed(1) + '%';
        const navMem = document.getElementById('tm-nav-mem-val');
        if (navMem) navMem.textContent = (mem/1024).toFixed(0) + ' MB';
        updateTmGraph('cpu', _tmCpuHistory, cpu.toFixed(1)+'%', '#0078d4');
        updateTmGraph('mem', _tmMemHistory, (mem/1024).toFixed(0)+' MB', '#107c10');
        if (!document.getElementById('tm-perf-detail')) clearInterval(_tmPerfInterval);
    }, 1000);
}

function updateTmGraph(type, history, valText, color) {
    const canvas = document.getElementById('tm-graph-' + type);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f0f8ff';
    ctx.fillRect(0, 0, w, h);
    // grid
    ctx.strokeStyle = '#dde8f4';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = (i / 4) * h;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    // graph line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.fillStyle = color + '22';
    ctx.beginPath();
    history.forEach((v, i) => {
        const x = (i / (history.length - 1)) * w;
        const maxVal = type === 'mem' ? 512000 : 100;
        const y = h - (v / maxVal) * h;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
}

function tmPerfNav(section) {
    ['cpu','mem','disk','gpu','net'].forEach(s => {
        const el = document.getElementById('tm-nav-' + s);
        if (el) { el.style.background = 'transparent'; el.style.borderLeft = 'none'; }
    });
    const active = document.getElementById('tm-nav-' + section);
    if (active) { active.style.background = '#e3f2fd'; active.style.borderLeft = '3px solid #0078d4'; }

    const detail = document.getElementById('tm-perf-detail');
    if (!detail) return;

    const cpu = Math.random()*12+2;
    const mem = 41000 + Math.random()*2000;

    const sections = {
        cpu: {
            title: 'CPU', sub: (()=>{ const _s=window._vmSpecs||{}; return _s.cpu ? 'Intel® Core™ @ '+_s.cpu+' GHz' : 'Intel® Core™ i9-14900K @ 8.00 GHz'; })(),
            stats: [
                ['Utilization', (cpu).toFixed(1) + '%'],
                ['Speed', (()=>{ const _s=window._vmSpecs||{}; return (_s.cpu||'8.00')+' GHz'; })()],
                ['Processes', (window._tmProcs||[]).length + ''],
                ['Threads', '524'],
                ['Handles', '41,832'],
                ['Up time', '0:' + String(Math.floor(Math.random()*60)).padStart(2,'0') + ':' + String(Math.floor(Math.random()*60)).padStart(2,'0') + ':' + String(Math.floor(Math.random()*60)).padStart(2,'0')],
            ],
            extra: ['Sockets: 1','Cores: 24 (8P+16E)','Logical processors: 32','Virtualization: Enabled','L1 cache: 2.0 MB','L2 cache: 32.0 MB','L3 cache: 36.0 MB'],
            color: '#0078d4', histKey: 'cpu', maxVal: 100
        },
        mem: (()=>{
            const _s = window._vmSpecs||{};
            const ramGB = _s.ram ? parseInt(_s.ram) : 500;
            const inUse = (mem/1024).toFixed(1);
            return {
                title: 'Memory', sub: ramGB + ' GB DDR5-6400',
                stats: [
                    ['In use', inUse + ' GB'],
                    ['Available', (ramGB - parseFloat(inUse)).toFixed(1) + ' GB'],
                    ['Committed', (mem/1024*1.1).toFixed(1) + ' / ' + (ramGB+12) + '.0 GB'],
                    ['Cached', '12.4 GB'],
                    ['Paged pool', '2.1 GB'],
                    ['Non-paged pool', '0.8 GB'],
                ],
                extra: ['Speed: 6400 MT/s','Slots used: 4 of 4','Form factor: DIMM','Hardware reserved: 128 MB'],
                color: '#107c10', histKey: 'mem', maxVal: ramGB * 1024
            };
        })(),
        disk: {
            title: 'Disk 0 (C:)', sub: (()=>{ const _s=window._vmSpecs||{}; return _s.storage ? (_s.storage>=1000?(_s.storage/1000).toFixed(0)+' TB':_s.storage+' GB')+' NVMe SSD' : 'Samsung 990 Pro NVMe — 100 TB'; })(),
            stats: [
                ['Active time', (Math.random()*20).toFixed(0) + '%'],
                ['Avg response time', (Math.random()*2+0.1).toFixed(2) + ' ms'],
                ['Read speed', (Math.random()*500).toFixed(0) + ' MB/s'],
                ['Write speed', (Math.random()*400).toFixed(0) + ' MB/s'],
                ['Capacity', '100.0 TB'],
                ['Used space', (Math.random()*10+5).toFixed(1) + ' TB'],
            ],
            extra: ['Interface: NVMe PCIe 5.0','Sequential read: 12,400 MB/s','Sequential write: 11,800 MB/s','Partitions: 3'],
            color: '#6b69d6', histKey: 'disk', maxVal: 100
        },
        gpu: {
            title: 'GPU 0', sub: (()=>{ const _s=window._vmSpecs||{}; return _s.gpu ? 'NVIDIA '+_s.gpu : 'NVIDIA GeForce RTX 4090 — 24 GB GDDR6X'; })(),
            stats: [
                ['GPU utilization', (Math.random()*8).toFixed(1) + '%'],
                ['Dedicated GPU memory', (Math.random()*4+1).toFixed(1) + ' GB / ' + (()=>{ const _s=window._vmSpecs||{}; return _s.gpu && _s.gpu.match(/\d+GB/) ? _s.gpu.match(/(\d+)GB/)[1] : '24'; })() + ' GB'],
                ['Shared GPU memory', (Math.random()*2).toFixed(1) + ' GB'],
                ['GPU temperature', Math.floor(Math.random()*15+45) + '°C'],
                ['Driver version', '560.81'],
                ['DirectX version', '12 Ultimate'],
            ],
            extra: ['CUDA cores: 16,384','Boost clock: 2.52 GHz','Memory bandwidth: 1,008 GB/s'],
            color: '#76b900', histKey: 'gpu', maxVal: 100
        },
        net: {
            title: 'Ethernet', sub: 'Intel I225-V 2.5Gbps LAN',
            stats: [
                ['Send', (Math.random()*50).toFixed(1) + ' Kbps'],
                ['Receive', (Math.random()*200).toFixed(1) + ' Kbps'],
                ['IPv4 Address', '192.168.1.105'],
                ['IPv6 Address', 'fe80::1'],
                ['Signal strength', '100%'],
                ['DNS name', 'DESKTOP-WIN10SIM'],
            ],
            extra: ['Adapter name: Intel I225-V','Interface: 2.5GbE','Operational state: Up','DHCP enabled: Yes'],
            color: '#ca5010', histKey: 'net', maxVal: 2500
        },
    };

    const s = sections[section];
    if (!s) return;

    const histData = section === 'cpu' ? _tmCpuHistory :
                     section === 'mem' ? _tmMemHistory :
                     Array(60).fill(0).map(() => Math.random() * s.maxVal * 0.2);

    detail.innerHTML = `
    <div>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
        <div>
          <div style="font-size:20px;font-weight:600;color:#1a1a1a;">${s.title}</div>
          <div style="font-size:12px;color:#666;margin-top:2px;">${s.sub}</div>
        </div>
        <div style="font-size:22px;font-weight:300;color:${s.color};">${s.stats[0][1]}</div>
      </div>
      <canvas id="tm-graph-${section}" width="420" height="140" style="width:100%;max-width:420px;height:140px;border:1px solid #dde8f4;border-radius:4px;display:block;margin-bottom:16px;"></canvas>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin-bottom:16px;">
        ${s.stats.map(([k,v])=>`<div><div style="font-size:11px;color:#888;">${k}</div><div style="font-size:14px;font-weight:500;">${v}</div></div>`).join('')}
      </div>
      <div style="background:#f5f5f5;border-radius:4px;padding:12px;font-size:12px;color:#555;line-height:1.8;">
        ${s.extra.join('<br>')}
      </div>
    </div>`;

    tmStartPerfUpdater();
    // draw initial graph
    setTimeout(() => updateTmGraph(section, histData, s.stats[0][1], s.color), 50);
}

// Keep old compat names
function switchTaskMgrTab(tab) { tmSwitchTab(tab === 'processes' ? 'processes' : 'performance', null); }

function updateProcessList() {
    const tbody = document.getElementById('process-tbody');
    if (tbody) {
        const procs = window._tmProcs || [];
        tbody.innerHTML = procs.map(p => `
            <tr>
                <td>${p.name}</td>
                <td class="cpu-usage">${p.cpu.toFixed(1)}%</td>
                <td class="mem-usage">${(p.mem/1024).toFixed(0)} MB</td>
            </tr>
        `).join('');
    }
}

function startPerformanceMonitoring() {
    setInterval(() => {
        cpuUsage = Math.random() * 50 + 10;
        memUsage = 2000 + Math.random() * 2000;
        
        const perfCpu = document.getElementById('perf-cpu');
        const perfMemory = document.getElementById('perf-memory');
        const cpuGraph = document.getElementById('cpu-graph');
        const memGraph = document.getElementById('mem-graph');
        
        if (perfCpu) perfCpu.textContent = cpuUsage.toFixed(1) + '%';
        if (perfMemory) perfMemory.textContent = memUsage.toFixed(0) + ' MB';
        if (cpuGraph) cpuGraph.style.height = cpuUsage + '%';
        if (memGraph) memGraph.style.height = (memUsage / 80) + '%';
        
        updateProcessList();
    }, 2000);
}

let edgeTabs = [{ id: 1, url: '', title: 'New Tab', favicon: '🌐', history: [], histIdx: -1 }];
let edgeActiveTab = 1;
let edgeTabCounter = 2;

function createBrowser() {
    setTimeout(() => setupEdgeBrowser(), 100);
    return `
    <div style="height:100%;display:flex;flex-direction:column;background:#f3f3f3;">
      <div id="edge-tabs-bar" style="display:flex;align-items:center;background:#e8e8e8;padding:4px 8px 0;gap:2px;min-height:36px;">
        <div class="edge-tab active" id="edge-tab-1" onclick="switchEdgeTab(1)">
          <span class="edge-tab-favicon">🌐</span>
          <span class="edge-tab-title">New Tab</span>
          <span class="edge-tab-close" onclick="closeEdgeTab(event,1)">✕</span>
        </div>
        <button onclick="newEdgeTab()" style="background:none;border:none;cursor:pointer;font-size:18px;padding:4px 8px;border-radius:4px;color:#555;" title="New Tab">+</button>
      </div>
      <div style="background:#fff;border-bottom:1px solid #ddd;padding:6px 8px;display:flex;align-items:center;gap:6px;">
        <button onclick="edgeNav('back')" style="background:none;border:none;cursor:pointer;font-size:18px;padding:4px 8px;border-radius:20px;color:#333;" title="Back">←</button>
        <button onclick="edgeNav('forward')" style="background:none;border:none;cursor:pointer;font-size:18px;padding:4px 8px;border-radius:20px;color:#333;" title="Forward">→</button>
        <button onclick="edgeNav('refresh')" style="background:none;border:none;cursor:pointer;font-size:18px;padding:4px 8px;border-radius:20px;color:#333;" title="Refresh">↻</button>
        <div style="flex:1;display:flex;align-items:center;background:#f5f5f5;border:1px solid #ddd;border-radius:20px;padding:6px 14px;gap:8px;">
          <span id="edge-lock-icon" style="font-size:13px;color:#666;">🔒</span>
          <input id="edge-url-bar" type="text" value="" placeholder="Search the web or enter a URL"
            style="flex:1;border:none;background:none;outline:none;font-size:14px;"
            onkeydown="if(event.key==='Enter')edgeGo()"
            onfocus="this.select()">
        </div>
        <button onclick="edgeGo()" style="background:#0078d4;border:none;cursor:pointer;font-size:13px;padding:6px 14px;border-radius:20px;color:#fff;font-weight:600;">Go</button>
        <button onclick="edgeBookmark()" style="background:none;border:none;cursor:pointer;font-size:18px;" title="Bookmark">☆</button>
      </div>
      <div id="edge-bookmarks-bar" style="background:#f9f9f9;border-bottom:1px solid #eee;padding:3px 10px;display:flex;gap:8px;flex-wrap:wrap;">
        <a class="edge-bookmark" onclick="edgeLoadUrl('https://www.google.com')">🔍 Google</a>
        <a class="edge-bookmark" onclick="edgeLoadUrl('https://www.youtube.com')">▶️ YouTube</a>
        <a class="edge-bookmark" onclick="edgeLoadUrl('https://www.github.com')">🐙 GitHub</a>
        <a class="edge-bookmark" onclick="edgeLoadUrl('https://www.reddit.com')">🤖 Reddit</a>
        <a class="edge-bookmark" onclick="edgeLoadUrl('https://www.wikipedia.org')">📖 Wikipedia</a>
        <a class="edge-bookmark" onclick="edgeLoadUrl('https://www.twitter.com')">🐦 X (Twitter)</a>
        <a class="edge-bookmark" onclick="edgeLoadUrl('https://news.ycombinator.com')">🟧 Hacker News</a>
      </div>
      <div id="edge-content" style="flex:1;position:relative;background:white;">
        ${edgeNewTabPage()}
      </div>
    </div>`;
}

function edgeNewTabPage() {
    const sites = [
        { icon: '🔍', name: 'Google', url: 'https://www.google.com' },
        { icon: '▶️', name: 'YouTube', url: 'https://www.youtube.com' },
        { icon: '🐙', name: 'GitHub', url: 'https://github.com' },
        { icon: '🤖', name: 'Reddit', url: 'https://www.reddit.com' },
        { icon: '📖', name: 'Wikipedia', url: 'https://www.wikipedia.org' },
        { icon: '🐦', name: 'Twitter', url: 'https://www.twitter.com' },
        { icon: '📰', name: 'BBC News', url: 'https://www.bbc.com/news' },
        { icon: '🛍️', name: 'Amazon', url: 'https://www.amazon.com' }
    ];
    return `
    <div style="height:100%;display:flex;flex-direction:column;align-items:center;padding-top:40px;background:linear-gradient(to bottom,#f0f4f9,#fff);">
      <div style="font-size:50px;margin-bottom:10px;">🌐</div>
      <h1 style="font-size:32px;font-weight:300;color:#333;margin-bottom:30px;">Microsoft Edge</h1>
      <div style="display:flex;align-items:center;background:white;border:2px solid #0078d4;border-radius:30px;padding:10px 20px;width:560px;max-width:90%;gap:10px;box-shadow:0 2px 12px rgba(0,120,212,0.15);">
        <span style="font-size:18px;">🔍</span>
        <input id="edge-newtab-search" type="text" placeholder="Search the web..."
          style="flex:1;border:none;outline:none;font-size:16px;"
          onkeydown="if(event.key==='Enter'){edgeLoadUrl('https://www.bing.com/search?q='+encodeURIComponent(this.value))}">
        <button onclick="var q=document.getElementById('edge-newtab-search').value;if(q)edgeLoadUrl('https://www.bing.com/search?q='+encodeURIComponent(q))"
          style="background:#0078d4;color:white;border:none;border-radius:20px;padding:6px 16px;cursor:pointer;">Search</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,110px);gap:16px;margin-top:40px;">
        ${sites.map(s => `
        <div onclick="edgeLoadUrl('${s.url}')" style="background:white;border-radius:12px;padding:16px;text-align:center;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.08);transition:transform 0.15s,box-shadow 0.15s;" onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 6px 16px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)'">
          <div style="font-size:32px;margin-bottom:6px;">${s.icon}</div>
          <div style="font-size:12px;color:#444;">${s.name}</div>
        </div>`).join('')}
      </div>
      <div id="edge-news" style="margin-top:40px;width:600px;max-width:90%;">
        <h3 style="color:#555;margin-bottom:16px;font-weight:400;">📰 Top Stories</h3>
        <div style="display:grid;gap:10px;">
          ${['Tech giants announce AI breakthroughs at summit','Scientists discover new exoplanet in habitable zone','Global markets react to new economic data','New open-source project gains 100k stars in 24 hours'].map(h=>`
          <div onclick="edgeLoadUrl('https://news.ycombinator.com')" style="background:white;border-radius:8px;padding:14px;cursor:pointer;border:1px solid #eee;display:flex;gap:12px;align-items:center;" onmouseover="this.style.background='#f5f9ff'" onmouseout="this.style.background='white'">
            <span style="font-size:24px;">📰</span><span style="color:#333;font-size:14px;">${h}</span>
          </div>`).join('')}
        </div>
      </div>
    </div>`;
}

function setupEdgeBrowser() {}

function edgeGo() {
    const bar = document.getElementById('edge-url-bar');
    if (!bar) return;
    let url = bar.value.trim();
    if (!url) return;
    edgeLoadUrl(url);
}

function edgeLoadUrl(url) {
    const bar = document.getElementById('edge-url-bar');
    const content = document.getElementById('edge-content');
    const lockIcon = document.getElementById('edge-lock-icon');
    if (!content) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        if (url.includes('.') && !url.includes(' ')) {
            url = 'https://' + url;
        } else {
            url = 'https://www.bing.com/search?q=' + encodeURIComponent(url);
        }
    }
    if (bar) bar.value = url;
    if (lockIcon) lockIcon.textContent = url.startsWith('https') ? '🔒' : '⚠️';

    const tab = edgeTabs.find(t => t.id === edgeActiveTab);
    if (tab) {
        tab.url = url;
        tab.history = tab.history.slice(0, tab.histIdx + 1);
        tab.history.push(url);
        tab.histIdx = tab.history.length - 1;
        try { tab.title = new URL(url).hostname.replace('www.',''); } catch(e) { tab.title = url; }
        const tabEl = document.getElementById('edge-tab-' + tab.id);
        if (tabEl) tabEl.querySelector('.edge-tab-title').textContent = tab.title;
    }

    let hostname = '';
    try { hostname = new URL(url).hostname; } catch(e) { hostname = url; }
    const siteName = hostname.replace('www.','');
    const isHttps = url.startsWith('https');

    // Route through our server-side proxy so X-Frame-Options/CSP can't block it
    const proxiedSrc = '/proxy?url=' + encodeURIComponent(url);

    content.innerHTML = `
        <div style="position:relative;width:100%;height:100%;display:flex;flex-direction:column;background:#f3f3f3;">
          <div id="edge-load-bar" style="background:linear-gradient(90deg,#0078d4,#50a0ff);height:3px;width:0%;transition:width 0.6s ease;"></div>
          <iframe id="edge-iframe" src="${proxiedSrc}"
            style="flex:1;border:none;width:100%;background:white;"
            referrerpolicy="no-referrer"
            onload="var lb=document.getElementById('edge-load-bar');if(lb){lb.style.width='100%';setTimeout(()=>{if(lb)lb.style.display='none';},400);}">
          </iframe>
        </div>`;

    setTimeout(() => { const lb = document.getElementById('edge-load-bar'); if (lb) lb.style.width = '70%'; }, 60);
}

function edgeNav(action) {
    const tab = edgeTabs.find(t => t.id === edgeActiveTab);
    if (!tab) return;
    if (action === 'back' && tab.histIdx > 0) {
        tab.histIdx--;
        edgeLoadUrl(tab.history[tab.histIdx]);
    } else if (action === 'forward' && tab.histIdx < tab.history.length - 1) {
        tab.histIdx++;
        edgeLoadUrl(tab.history[tab.histIdx]);
    } else if (action === 'refresh') {
        const iframe = document.getElementById('edge-iframe');
        if (iframe) iframe.src = iframe.src;
        else if (tab.url) edgeLoadUrl(tab.url);
    }
}

function newEdgeTab() {
    const id = edgeTabCounter++;
    edgeTabs.push({ id, url: '', title: 'New Tab', favicon: '🌐', history: [], histIdx: -1 });
    const bar = document.getElementById('edge-tabs-bar');
    const addBtn = bar.querySelector('button');
    const tabEl = document.createElement('div');
    tabEl.className = 'edge-tab';
    tabEl.id = 'edge-tab-' + id;
    tabEl.innerHTML = `<span class="edge-tab-favicon">🌐</span><span class="edge-tab-title">New Tab</span><span class="edge-tab-close" onclick="closeEdgeTab(event,${id})">✕</span>`;
    tabEl.onclick = () => switchEdgeTab(id);
    bar.insertBefore(tabEl, addBtn);
    switchEdgeTab(id);
}

function switchEdgeTab(id) {
    edgeActiveTab = id;
    document.querySelectorAll('.edge-tab').forEach(t => t.classList.remove('active'));
    const tabEl = document.getElementById('edge-tab-' + id);
    if (tabEl) tabEl.classList.add('active');
    const tab = edgeTabs.find(t => t.id === id);
    const bar = document.getElementById('edge-url-bar');
    if (bar && tab) bar.value = tab.url;
    const content = document.getElementById('edge-content');
    if (content && tab) {
        if (tab.url) edgeLoadUrl(tab.url);
        else content.innerHTML = edgeNewTabPage();
    }
}

function closeEdgeTab(e, id) {
    e.stopPropagation();
    if (edgeTabs.length === 1) { closeWindow('browser'); return; }
    edgeTabs = edgeTabs.filter(t => t.id !== id);
    const tabEl = document.getElementById('edge-tab-' + id);
    if (tabEl) tabEl.remove();
    if (edgeActiveTab === id) switchEdgeTab(edgeTabs[0].id);
}

function edgeBookmark() {
    const tab = edgeTabs.find(t => t.id === edgeActiveTab);
    if (tab && tab.url) {
        const bar = document.getElementById('edge-bookmarks-bar');
        if (bar) {
            const bm = document.createElement('a');
            bm.className = 'edge-bookmark';
            bm.textContent = '⭐ ' + (tab.title || tab.url);
            bm.onclick = () => edgeLoadUrl(tab.url);
            bar.appendChild(bm);
        }
    }
}

function createComputer() {
    const drives = [
        { icon: '💿', letter: 'C:', name: 'Windows (C:)', total: 476, free: 237, color: '#0078d4' },
        { icon: '💾', letter: 'D:', name: 'Data (D:)', total: 1000, free: 648, color: '#107c10' },
        { icon: '📀', letter: 'E:', name: 'Backup (E:)', total: 2000, free: 1820, color: '#8764b8' },
        { icon: '🔌', letter: 'F:', name: 'USB Drive (F:)', total: 32, free: 18, color: '#ca5010' },
    ];
    const folders = [
        { icon: '🖥️', name: 'Desktop', count: '4 items' },
        { icon: '📄', name: 'Documents', count: '23 items' },
        { icon: '📥', name: 'Downloads', count: '12 items' },
        { icon: '🎵', name: 'Music', count: '148 items' },
        { icon: '🖼️', name: 'Pictures', count: '56 items' },
        { icon: '🎬', name: 'Videos', count: '8 items' },
    ];
    return `
    <div style="height:100%;display:flex;flex-direction:column;background:#fff;font-family:'Segoe UI',sans-serif;">
      <div style="background:#f5f5f5;border-bottom:1px solid #e0e0e0;padding:6px 12px;display:flex;align-items:center;gap:8px;font-size:12px;">
        <button style="background:none;border:none;cursor:pointer;font-size:16px;color:#555;">←</button>
        <button style="background:none;border:none;cursor:pointer;font-size:16px;color:#555;">→</button>
        <button style="background:none;border:none;cursor:pointer;font-size:16px;color:#555;">↑</button>
        <div style="flex:1;background:white;border:1px solid #ccc;border-radius:3px;padding:3px 10px;font-size:12px;">
          💻 This PC
        </div>
        <input type="text" placeholder="🔍 Search This PC" style="padding:4px 10px;border:1px solid #ccc;border-radius:3px;font-size:12px;width:180px;">
      </div>
      <div style="display:flex;flex:1;overflow:hidden;">
        <div style="width:180px;border-right:1px solid #e8e8e8;overflow-y:auto;padding:8px 0;background:#fafafa;">
          <div style="padding:4px 12px;font-size:11px;font-weight:600;color:#888;text-transform:uppercase;margin-top:4px;">Quick access</div>
          ${folders.map(f=>`<div style="display:flex;align-items:center;gap:8px;padding:5px 16px;cursor:pointer;font-size:13px;" onmouseover="this.style.background='#e8f4ff'" onmouseout="this.style.background='transparent'">${f.icon} ${f.name}</div>`).join('')}
          <div style="padding:4px 12px;font-size:11px;font-weight:600;color:#888;text-transform:uppercase;margin-top:8px;">This PC</div>
          ${drives.map(d=>`<div style="display:flex;align-items:center;gap:8px;padding:5px 16px;cursor:pointer;font-size:13px;" onmouseover="this.style.background='#e8f4ff'" onmouseout="this.style.background='transparent'">${d.icon} ${d.letter}</div>`).join('')}
          <div style="padding:4px 12px;font-size:11px;font-weight:600;color:#888;text-transform:uppercase;margin-top:8px;">Network</div>
          <div style="display:flex;align-items:center;gap:8px;padding:5px 16px;cursor:pointer;font-size:13px;" onmouseover="this.style.background='#e8f4ff'" onmouseout="this.style.background='transparent'">🌐 Network</div>
        </div>
        <div style="flex:1;overflow-y:auto;padding:16px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
            <div style="font-size:13px;font-weight:600;color:#333;">Folders (${folders.length})</div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;margin-bottom:20px;">
            ${folders.map(f=>`
            <div onclick="addNotification('${f.icon}','File Explorer','Opening ${f.name}...')" style="display:flex;flex-direction:column;align-items:center;padding:12px 8px;border:1px solid transparent;border-radius:4px;cursor:pointer;text-align:center;" onmouseover="this.style.background='#e8f4ff';this.style.borderColor='#90caf9'" onmouseout="this.style.background='transparent';this.style.borderColor='transparent'">
              <span style="font-size:40px;margin-bottom:6px;">${f.icon}</span>
              <span style="font-size:12px;color:#333;">${f.name}</span>
              <span style="font-size:10px;color:#888;">${f.count}</span>
            </div>`).join('')}
          </div>
          <div style="font-size:13px;font-weight:600;color:#333;margin-bottom:12px;">Devices and drives (${drives.length})</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${drives.map(d=>{
              const usedPct = Math.round((1 - d.free/d.total)*100);
              const barColor = usedPct > 90 ? '#d13438' : usedPct > 70 ? '#ca5010' : d.color;
              return `
              <div style="display:flex;align-items:center;gap:14px;padding:10px 14px;border:1px solid #e0e0e0;border-radius:4px;cursor:pointer;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='white'">
                <span style="font-size:36px;">${d.icon}</span>
                <div style="flex:1;">
                  <div style="font-size:13px;font-weight:600;">${d.name}</div>
                  <div style="height:8px;background:#e0e0e0;border-radius:4px;margin:5px 0;overflow:hidden;">
                    <div style="height:100%;width:${usedPct}%;background:${barColor};border-radius:4px;transition:width 0.3s;"></div>
                  </div>
                  <div style="font-size:11px;color:#666;">${d.free} GB free of ${d.total} GB</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:13px;font-weight:600;color:${barColor};">${usedPct}%</div>
                  <div style="font-size:10px;color:#888;">used</div>
                </div>
              </div>`;
            }).join('')}
          </div>
          <div style="font-size:13px;font-weight:600;color:#333;margin:16px 0 10px;">System Info</div>
          <div style="background:#f8f8f8;border:1px solid #e0e0e0;border-radius:6px;padding:14px;">
            ${(function(){
              const s = window._vmSpecs || {};
              const plan = s.plan || 'free';
              const ram = s.ram ? s.ram + ' GB DDR5' : '500 GB DDR5';
              const cpu = s.cpu ? 'Intel Core @ ' + s.cpu + ' GHz' : 'Intel Core i9-14900K @ 8.0 GHz';
              const gpu = s.gpu ? 'NVIDIA ' + s.gpu : 'NVIDIA RTX 4090 24GB';
              const storage = s.storage ? (s.storage >= 1000 ? (s.storage/1000).toFixed(0)+' TB' : s.storage+' GB') + ' NVMe SSD' : '100 TB NVMe SSD';
              const planBadge = plan !== 'free' ? `<span style="background:linear-gradient(135deg,#5865f2,#9b59b6);color:white;padding:1px 8px;border-radius:10px;font-size:10px;font-weight:700;text-transform:uppercase;margin-left:6px;">${plan}</span>` : '';
              return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;">
                <div><span style="color:#888;">Computer name: </span><strong>DESKTOP-WIN10SIM</strong></div>
                <div><span style="color:#888;">User: </span><strong>${userData?.username||'User'}${planBadge}</strong></div>
                <div><span style="color:#888;">OS: </span><strong>Windows 10 Pro</strong></div>
                <div><span style="color:#888;">Build: </span><strong>19045.3803</strong></div>
                <div><span style="color:#888;">CPU: </span><strong>${cpu}</strong></div>
                <div><span style="color:#888;">RAM: </span><strong>${ram}</strong></div>
                <div><span style="color:#888;">GPU: </span><strong>${gpu}</strong></div>
                <div><span style="color:#888;">Storage: </span><strong>${storage}</strong></div>
              </div>`;
            })()}
          </div>
        </div>
      </div>
    </div>`;
}

function createGoogleSetup() {
    setTimeout(() => {
        startChromeDownload();
    }, 100);
    
    return `
        <div class="chrome-setup">
            <div class="chrome-setup-header">
                <div class="chrome-logo">
                    <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #ea4335 0%, #ea4335 25%, #fbbc05 25%, #fbbc05 50%, #34a853 50%, #34a853 75%, #4285f4 75%); border-radius: 50%; position: relative;">
                        <div style="width: 24px; height: 24px; background: white; border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"></div>
                        <div style="width: 16px; height: 16px; background: #4285f4; border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"></div>
                    </div>
                </div>
                <h2 style="margin: 20px 0 10px;">Installing Google Chrome</h2>
                <p style="color: #666; margin-bottom: 30px;">Please wait while we download and install Chrome...</p>
            </div>
            <div class="chrome-download-info">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span id="chrome-download-status">Downloading...</span>
                    <span id="chrome-download-percent">0%</span>
                </div>
                <div class="chrome-progress-bar">
                    <div class="chrome-progress-fill" id="chrome-progress-fill"></div>
                </div>
                <div style="margin-top: 15px; color: #666; font-size: 12px;">
                    <div id="chrome-download-speed">Speed: 0 MB/s</div>
                    <div id="chrome-download-size">Downloaded: 0 MB / 89.2 MB</div>
                </div>
            </div>
        </div>
    `;
}

function startChromeDownload() {
    let progress = 0;
    let downloaded = 0;
    const totalSize = 89.2;
    
    const interval = setInterval(() => {
        const speed = (Math.random() * 5 + 2).toFixed(1);
        const increment = parseFloat(speed) * 0.3;
        downloaded = Math.min(downloaded + increment, totalSize);
        progress = (downloaded / totalSize) * 100;
        
        const progressFill = document.getElementById('chrome-progress-fill');
        const percentText = document.getElementById('chrome-download-percent');
        const statusText = document.getElementById('chrome-download-status');
        const speedText = document.getElementById('chrome-download-speed');
        const sizeText = document.getElementById('chrome-download-size');
        
        if (progressFill) progressFill.style.width = progress + '%';
        if (percentText) percentText.textContent = Math.floor(progress) + '%';
        if (speedText) speedText.textContent = 'Speed: ' + speed + ' MB/s';
        if (sizeText) sizeText.textContent = 'Downloaded: ' + downloaded.toFixed(1) + ' MB / ' + totalSize + ' MB';
        
        if (progress >= 100) {
            clearInterval(interval);
            if (statusText) statusText.textContent = 'Installing...';
            
            setTimeout(() => {
                if (statusText) statusText.textContent = 'Installation complete!';
                setTimeout(() => {
                    closeWindow('google_setup');
                    openApp('chrome');
                }, 1000);
            }, 1500);
        }
    }, 300);
}

let chromeTabs = [{ id: 1, url: '', title: 'New Tab', history: [], histIdx: -1 }];
let chromeActiveTab = 1;
let chromeTabCounter = 2;

function createChrome() {
    setTimeout(() => {}, 100);
    return `
    <div style="height:100%;display:flex;flex-direction:column;background:#dee1e6;">
      <div id="chrome-tabs-bar" style="display:flex;align-items:flex-end;background:#dee1e6;padding:8px 8px 0;gap:1px;min-height:40px;">
        <div class="chrome-tab active" id="chrome-tab-1" onclick="switchChromeTab(1)">
          <span class="chrome-tab-favicon">🌐</span>
          <span class="chrome-tab-title">New Tab</span>
          <span class="chrome-tab-close" onclick="closeChromeTab(event,1)">✕</span>
        </div>
        <button onclick="newChromeTab()" style="background:none;border:none;cursor:pointer;font-size:20px;padding:2px 10px;color:#555;margin-bottom:2px;" title="New Tab">+</button>
        <div style="flex:1"></div>
        <div style="display:flex;gap:6px;align-items:center;padding:4px 8px;">
          <button style="background:none;border:none;cursor:pointer;font-size:16px;color:#555;" title="Extensions">🧩</button>
          <button style="background:none;border:none;cursor:pointer;font-size:16px;color:#555;" title="Profile">👤</button>
          <button style="background:none;border:none;cursor:pointer;font-size:16px;color:#555;" title="Menu">⋮</button>
        </div>
      </div>
      <div style="background:white;border-bottom:1px solid #ddd;padding:6px 8px;display:flex;align-items:center;gap:6px;">
        <button onclick="chromeNavAction('back')" style="background:none;border:none;cursor:pointer;font-size:18px;padding:4px 8px;border-radius:20px;color:#333;">←</button>
        <button onclick="chromeNavAction('forward')" style="background:none;border:none;cursor:pointer;font-size:18px;padding:4px 8px;border-radius:20px;color:#333;">→</button>
        <button onclick="chromeNavAction('refresh')" style="background:none;border:none;cursor:pointer;font-size:18px;padding:4px 8px;border-radius:20px;color:#333;">↻</button>
        <div style="flex:1;display:flex;align-items:center;background:#f1f3f4;border-radius:24px;padding:8px 16px;gap:8px;">
          <span id="chrome-lock-icon" style="font-size:13px;color:#666;">🔒</span>
          <input id="chrome-url-input" type="text" value="" placeholder="Search Google or type a URL"
            style="flex:1;border:none;background:none;outline:none;font-size:14px;"
            onkeydown="if(event.key==='Enter')chromeGoUrl()"
            onfocus="this.select()">
        </div>
        <button onclick="chromeGoUrl()" style="background:#4285f4;color:white;border:none;border-radius:20px;padding:6px 16px;cursor:pointer;font-size:13px;font-weight:600;">Go</button>
        <button onclick="chromeBookmark()" style="background:none;border:none;cursor:pointer;font-size:18px;" title="Bookmark">☆</button>
      </div>
      <div id="chrome-content" style="flex:1;position:relative;background:white;">
        ${chromeNewTabPage()}
      </div>
    </div>`;
}

function chromeNewTabPage() {
    const sites = [
        { icon: '📺', name: 'YouTube', url: 'https://www.youtube.com' },
        { icon: '🐙', name: 'GitHub', url: 'https://github.com' },
        { icon: '🤖', name: 'Reddit', url: 'https://www.reddit.com' },
        { icon: '📖', name: 'Wikipedia', url: 'https://www.wikipedia.org' },
        { icon: '🛍️', name: 'Amazon', url: 'https://www.amazon.com' },
        { icon: '🐦', name: 'Twitter', url: 'https://twitter.com' },
        { icon: '💼', name: 'LinkedIn', url: 'https://www.linkedin.com' },
        { icon: '🗺️', name: 'Maps', url: 'https://maps.google.com' }
    ];
    return `
    <div style="height:100%;display:flex;flex-direction:column;align-items:center;padding-top:60px;background:linear-gradient(to bottom,#fff,#f8f9fa);">
      <div style="display:flex;align-items:center;margin-bottom:30px;gap:6px;">
        <span style="color:#4285f4;font-size:48px;font-weight:300;font-family:serif;">G</span>
        <span style="color:#ea4335;font-size:48px;font-weight:300;font-family:serif;">o</span>
        <span style="color:#fbbc05;font-size:48px;font-weight:300;font-family:serif;">o</span>
        <span style="color:#4285f4;font-size:48px;font-weight:300;font-family:serif;">g</span>
        <span style="color:#34a853;font-size:48px;font-weight:300;font-family:serif;">l</span>
        <span style="color:#ea4335;font-size:48px;font-weight:300;font-family:serif;">e</span>
      </div>
      <div style="display:flex;align-items:center;border:1px solid #dfe1e5;border-radius:24px;padding:10px 20px;width:560px;max-width:90%;gap:10px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <span style="font-size:18px;color:#9aa0a6;">🔍</span>
        <input id="chrome-newtab-search" type="text" placeholder="Search Google or type a URL"
          style="flex:1;border:none;outline:none;font-size:16px;"
          onkeydown="if(event.key==='Enter'){chromeLoadUrl('https://www.google.com/search?q='+encodeURIComponent(this.value))}">
      </div>
      <div style="display:flex;gap:12px;margin-top:12px;">
        <button onclick="var q=document.getElementById('chrome-newtab-search').value;chromeLoadUrl(q?'https://www.google.com/search?q='+encodeURIComponent(q):'https://www.google.com')" style="padding:8px 20px;background:#f8f9fa;border:1px solid #dfe1e5;border-radius:4px;cursor:pointer;color:#3c4043;">Google Search</button>
        <button onclick="chromeLoadUrl('https://www.google.com/search?q=i+am+feeling+lucky')" style="padding:8px 20px;background:#f8f9fa;border:1px solid #dfe1e5;border-radius:4px;cursor:pointer;color:#3c4043;">I'm Feeling Lucky</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,100px);gap:12px;margin-top:40px;">
        ${sites.map(s=>`
        <div onclick="chromeLoadUrl('${s.url}')" style="display:flex;flex-direction:column;align-items:center;padding:12px;border-radius:8px;cursor:pointer;" onmouseover="this.style.background='#f1f3f4'" onmouseout="this.style.background='transparent'">
          <div style="width:48px;height:48px;background:#f1f3f4;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:6px;">${s.icon}</div>
          <span style="font-size:12px;color:#3c4043;">${s.name}</span>
        </div>`).join('')}
      </div>
      <div style="margin-top:40px;padding:12px 24px;background:#fff3cd;border-radius:8px;border:1px solid #ffc107;text-align:center;">
        <p style="margin-bottom:10px;color:#856404;font-size:13px;">⚠️ Suspicious downloads found:</p>
        <div style="display:flex;gap:10px;justify-content:center;">
          <button onclick="downloadRansomware()" style="padding:8px 16px;background:#dc3545;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">⚠️ Ransomware.exe</button>
          <button onclick="downloadFreeGames()" style="padding:8px 16px;background:#28a745;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">🎮 FreeGames2024.exe</button>
        </div>
      </div>
    </div>`;
}

function chromeGoUrl() {
    const bar = document.getElementById('chrome-url-input');
    if (!bar) return;
    chromeLoadUrl(bar.value.trim());
}

function chromeLoadUrl(url) {
    const bar = document.getElementById('chrome-url-input');
    const content = document.getElementById('chrome-content');
    const lock = document.getElementById('chrome-lock-icon');
    if (!content) return;
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = url.includes('.') && !url.includes(' ') ? 'https://' + url : 'https://www.google.com/search?q=' + encodeURIComponent(url);
    }
    if (bar) bar.value = url;
    if (lock) lock.textContent = url.startsWith('https') ? '🔒' : '⚠️';
    const tab = chromeTabs.find(t => t.id === chromeActiveTab);
    if (tab) {
        tab.url = url;
        tab.history = tab.history.slice(0, tab.histIdx + 1);
        tab.history.push(url);
        tab.histIdx++;
        try { tab.title = new URL(url).hostname.replace('www.',''); } catch(e) { tab.title = url; }
        const tabEl = document.getElementById('chrome-tab-' + tab.id);
        if (tabEl) tabEl.querySelector('.chrome-tab-title').textContent = tab.title;
    }

    let hostname = '';
    try { hostname = new URL(url).hostname; } catch(e) { hostname = url; }
    const siteName = hostname.replace('www.','');

    // Route through proxy to bypass X-Frame-Options/CSP
    const proxiedSrc = '/proxy?url=' + encodeURIComponent(url);

    content.innerHTML = `
        <div style="position:relative;width:100%;height:100%;display:flex;flex-direction:column;background:#f1f3f4;">
          <div id="chrome-load-bar" style="background:linear-gradient(90deg,#4285f4,#34a853);height:3px;width:0%;transition:width 0.6s ease;position:absolute;top:0;left:0;z-index:5;"></div>
          <iframe id="chrome-iframe" src="${proxiedSrc}"
            style="flex:1;border:none;width:100%;height:100%;background:white;"
            referrerpolicy="no-referrer"
            onload="var lb=document.getElementById('chrome-load-bar');if(lb){lb.style.width='100%';setTimeout(()=>{if(lb)lb.style.display='none';},400);}">
          </iframe>
        </div>`;

    setTimeout(() => { const lb = document.getElementById('chrome-load-bar'); if(lb) lb.style.width = '70%'; }, 60);
}

function chromeIframeLoaded(iframe, url) {
    try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc || !doc.body || doc.body.innerHTML.trim() === '') {
            showChromeBlockedOverlay();
        }
    } catch(e) { /* cross-origin = actually loaded */ }
}

function showChromeBlockedOverlay() {
    const overlay = document.getElementById('chrome-blocked-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        const iframe = document.getElementById('chrome-iframe');
        if (iframe) iframe.style.display = 'none';
    }
}

function chromeNavAction(action) {
    const tab = chromeTabs.find(t => t.id === chromeActiveTab);
    if (!tab) return;
    if (action === 'back' && tab.histIdx > 0) { tab.histIdx--; chromeLoadUrl(tab.history[tab.histIdx]); }
    else if (action === 'forward' && tab.histIdx < tab.history.length - 1) { tab.histIdx++; chromeLoadUrl(tab.history[tab.histIdx]); }
    else if (action === 'refresh') { const c=document.getElementById('chrome-content'); const f=c?.querySelector('iframe'); if(f){f.src=f.src;} else if(tab.url) chromeLoadUrl(tab.url); }
}

function newChromeTab() {
    const id = chromeTabCounter++;
    chromeTabs.push({ id, url: '', title: 'New Tab', history: [], histIdx: -1 });
    const bar = document.getElementById('chrome-tabs-bar');
    const addBtn = bar.querySelector('button');
    const t = document.createElement('div');
    t.className = 'chrome-tab';
    t.id = 'chrome-tab-' + id;
    t.innerHTML = `<span class="chrome-tab-favicon">🌐</span><span class="chrome-tab-title">New Tab</span><span class="chrome-tab-close" onclick="closeChromeTab(event,${id})">✕</span>`;
    t.onclick = () => switchChromeTab(id);
    bar.insertBefore(t, addBtn);
    switchChromeTab(id);
}

function switchChromeTab(id) {
    chromeActiveTab = id;
    document.querySelectorAll('.chrome-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('chrome-tab-' + id)?.classList.add('active');
    const tab = chromeTabs.find(t => t.id === id);
    const bar = document.getElementById('chrome-url-input');
    if (bar && tab) bar.value = tab.url;
    const content = document.getElementById('chrome-content');
    if (content) content.innerHTML = tab?.url ? `<iframe src="${tab.url}" style="width:100%;height:100%;border:none;" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"></iframe>` : chromeNewTabPage();
}

function closeChromeTab(e, id) {
    e.stopPropagation();
    if (chromeTabs.length === 1) { closeWindow('chrome'); return; }
    chromeTabs = chromeTabs.filter(t => t.id !== id);
    document.getElementById('chrome-tab-' + id)?.remove();
    if (chromeActiveTab === id) switchChromeTab(chromeTabs[0].id);
}

function chromeBookmark() {
    const tab = chromeTabs.find(t => t.id === chromeActiveTab);
    if (tab?.url) addNotification('☆', 'Bookmark Added', tab.title || tab.url);
}

function navigateChrome() { chromeGoUrl(); }
function chromeBack() { chromeNavAction('back'); }
function chromeForward() { chromeNavAction('forward'); }
function chromeRefresh() { chromeNavAction('refresh'); }

function navigateChrome() {
    const urlInput = document.getElementById('chrome-url-input');
    const contentArea = document.getElementById('chrome-content');
    
    if (!urlInput || !contentArea) return;
    
    let url = urlInput.value.trim();
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        if (url.includes('.') && !url.includes(' ')) {
            url = 'https://' + url;
        } else {
            url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
        }
        urlInput.value = url;
    }
    
    contentArea.innerHTML = `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column;">
            <iframe src="${url}" style="width: 100%; flex: 1; border: none;" 
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                onload="this.style.background='white'"
                onerror="this.parentElement.innerHTML='<div style=\\'text-align: center; padding: 50px;\\'><h2>Cannot load this page</h2><p>The website may have blocked embedding.</p></div>'">
            </iframe>
        </div>
    `;
}

function chromeBack() {
    const contentArea = document.getElementById('chrome-content');
    const urlInput = document.getElementById('chrome-url-input');
    if (contentArea && urlInput) {
        urlInput.value = 'https://www.google.com';
        contentArea.innerHTML = `
            <div class="chrome-google-page">
                <div class="google-logo">
                    <span style="color: #4285f4; font-size: 72px; font-weight: 400;">G</span>
                    <span style="color: #ea4335; font-size: 72px; font-weight: 400;">o</span>
                    <span style="color: #fbbc05; font-size: 72px; font-weight: 400;">o</span>
                    <span style="color: #4285f4; font-size: 72px; font-weight: 400;">g</span>
                    <span style="color: #34a853; font-size: 72px; font-weight: 400;">l</span>
                    <span style="color: #ea4335; font-size: 72px; font-weight: 400;">e</span>
                </div>
                <div class="google-search-box">
                    <input type="text" placeholder="Search Google or type a URL" style="width: 100%; padding: 12px 20px; border: 1px solid #dfe1e5; border-radius: 24px; font-size: 16px; outline: none;">
                </div>
            </div>
        `;
    }
}

function chromeForward() {}

function chromeRefresh() {
    navigateChrome();
}

// Command Prompt
let cmdHistory = [];
let cmdHistoryIndex = -1;

// Command Prompt Logic
function createCMD() {
    setTimeout(() => {
        const input = document.getElementById('cmd-input');
        if (input) {
            input.focus();
            input.addEventListener('keydown', handleCMDInput);
        }
    }, 100);
    
    return `
        <div class="cmd-window" id="cmd-container" onclick="document.getElementById('cmd-input')?.focus()">
            <div class="cmd-output" id="cmd-output">Microsoft Windows [Version 10.0.19045.3803]
(c) Microsoft Corporation. All rights reserved.

</div>
            <div class="cmd-input-line">
                <span class="cmd-prompt">C:\\Users\\${userData.username}></span>
                <input type="text" class="cmd-input" id="cmd-input" autofocus autocomplete="off">
            </div>
        </div>
    `;
}

function handleCMDInput(e) {
    if (e.key === 'Enter') {
        const input = document.getElementById('cmd-input');
        const output = document.getElementById('cmd-output');
        const command = input.value.trim();
        
        if (command) {
            cmdHistory.push(command);
            cmdHistoryIndex = cmdHistory.length;
        }
        
        output.textContent += `C:\\Users\\${userData.username}>${command}\n`;
        
        const result = executeCMDCommand(command);
        if (result) output.textContent += result + '\n';
        output.textContent += '\n';
        
        input.value = '';
        output.scrollTop = output.scrollHeight;
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (cmdHistoryIndex > 0) {
            cmdHistoryIndex--;
            document.getElementById('cmd-input').value = cmdHistory[cmdHistoryIndex];
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (cmdHistoryIndex < cmdHistory.length - 1) {
            cmdHistoryIndex++;
            document.getElementById('cmd-input').value = cmdHistory[cmdHistoryIndex];
        } else {
            cmdHistoryIndex = cmdHistory.length;
            document.getElementById('cmd-input').value = '';
        }
    }
}

let cmdCurrentPath = 'C:\\Users\\' + (userData?.username || 'User');

function executeCMDCommand(cmd) {
    const rawParts = cmd.trim().split(' ');
    const parts = rawParts.map(p => p.toLowerCase());
    const command = parts[0];
    const args = rawParts.slice(1);
    
    switch(command) {
        case 'help':
            return `
Microsoft Windows [Version 10.0.19045.3803]
(c) Microsoft Corporation. All rights reserved.

Available commands:
  help       - Show this help
  dir        - List directory contents
  cd         - Change directory
  cls        - Clear screen
  echo       - Display message
  type       - Display file contents
  mkdir / md - Create directory
  del        - Delete file (simulated)
  copy       - Copy file (simulated)
  move       - Move file (simulated)
  ren        - Rename file (simulated)
  date       - Display current date
  time       - Display current time
  whoami     - Display current user
  hostname   - Display computer name
  ver        - Display Windows version
  ping       - Test network connectivity
  tracert    - Trace route to host
  ipconfig   - Network configuration
  netstat    - Network connections
  tasklist   - Running processes
  taskkill   - Kill a process
  systeminfo - System information
  set        - Environment variables
  path       - Show PATH variable
  color      - Change console colors
  title      - Change window title
  tree       - Show directory tree
  attrib     - File attributes
  format     - Format drive (simulated)
  shutdown   - Shutdown/restart PC
  chkdsk     - Check disk
  sfc        - System file checker
  reg        - Registry operations
  net        - Network commands
  runas      - Run as administrator
  start      - Start application
  exit       - Close command prompt`;

        case 'dir': {
            const date = new Date().toLocaleDateString('en-US', {month:'2-digit',day:'2-digit',year:'numeric'});
            const time = new Date().toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit',hour12:true});
            return ` Volume in drive C has no label.\n Volume Serial Number is A1B2-C3D4\n\n Directory of ${cmdCurrentPath}\n\n${date}  ${time}    <DIR>          .\n${date}  ${time}    <DIR>          ..\n${date}  ${time}    <DIR>          Desktop\n${date}  ${time}    <DIR>          Documents\n${date}  ${time}    <DIR>          Downloads\n${date}  ${time}    <DIR>          Pictures\n${date}  ${time}    <DIR>          Music\n${date}  ${time}    <DIR>          Videos\n${date}  ${time}         4,096   NTUSER.DAT\n               1 File(s)          4,096 bytes\n               7 Dir(s)  237,410,172,928 bytes free`;
        }

        case 'cd': {
            if (!args[0] || args[0] === '.') return cmdCurrentPath;
            if (args[0] === '..') {
                const parts2 = cmdCurrentPath.split('\\');
                if (parts2.length > 1) parts2.pop();
                cmdCurrentPath = parts2.join('\\');
                updateCMDPrompt();
                return '';
            }
            if (args[0].includes(':')) { cmdCurrentPath = args[0].toUpperCase(); updateCMDPrompt(); return ''; }
            cmdCurrentPath = cmdCurrentPath + '\\' + args[0];
            updateCMDPrompt();
            return '';
        }

        case 'cls': {
            const out = document.getElementById('cmd-output') || document.getElementById('ps-output');
            if (out) out.textContent = '';
            return '';
        }

        case 'echo':
            if (args.length === 0) return 'ECHO is on.';
            return args.join(' ');

        case 'mkdir': case 'md':
            if (!args[0]) return 'The syntax of the command is incorrect.';
            return ``;

        case 'del':
            if (!args[0]) return 'The syntax of the command is incorrect.';
            return `Could Not Find ${cmdCurrentPath}\\${args[0]}`;

        case 'copy':
            if (args.length < 2) return 'The syntax of the command is incorrect.';
            return `        1 file(s) copied.`;

        case 'move': case 'ren':
            if (args.length < 2) return 'The syntax of the command is incorrect.';
            return ``;

        case 'type':
            if (!args[0]) return 'The syntax of the command is incorrect.';
            return `The system cannot find the file specified: ${args[0]}`;

        case 'date':
            return `The current date is: ${new Date().toLocaleDateString('en-US', {weekday:'short',month:'2-digit',day:'2-digit',year:'numeric'})}`;

        case 'time':
            return `The current time is: ${new Date().toLocaleTimeString()}`;

        case 'whoami':
            return `desktop-win10sim\\${userData?.username || 'user'}`;

        case 'hostname':
            return 'DESKTOP-WIN10SIM';

        case 'ver':
            return 'Microsoft Windows [Version 10.0.19045.3803]';

        case 'ping': {
            if (!args[0]) return 'Usage: ping <hostname>';
            const host = args[0];
            const ip = `192.168.1.${Math.floor(Math.random()*254)+1}`;
            return `\nPinging ${host} [${ip}] with 32 bytes of data:\nReply from ${ip}: bytes=32 time=${Math.floor(Math.random()*15)+5}ms TTL=55\nReply from ${ip}: bytes=32 time=${Math.floor(Math.random()*15)+5}ms TTL=55\nReply from ${ip}: bytes=32 time=${Math.floor(Math.random()*15)+5}ms TTL=55\nReply from ${ip}: bytes=32 time=${Math.floor(Math.random()*15)+5}ms TTL=55\n\nPing statistics for ${ip}:\n    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),\nApproximate round trip times in milli-seconds:\n    Minimum = 5ms, Maximum = 20ms, Average = ${Math.floor(Math.random()*10)+8}ms`;
        }

        case 'tracert': {
            if (!args[0]) return 'Usage: tracert <hostname>';
            let hops = `\nTracing route to ${args[0]} over a maximum of 30 hops:\n\n`;
            for (let i = 1; i <= 8; i++) {
                const ms = Math.floor(Math.random()*30)+i*5;
                hops += `  ${String(i).padStart(2)}    ${ms} ms    ${ms+2} ms    ${ms+1} ms  ${i===1?'192.168.1.1':i===2?'10.0.0.1':`${Math.floor(Math.random()*200)}.${Math.floor(Math.random()*200)}.${Math.floor(Math.random()*200)}.${Math.floor(Math.random()*200)}`}\n`;
            }
            hops += `\nTrace complete.`;
            return hops;
        }

        case 'ipconfig': {
            const flags = parts.slice(1);
            if (flags.includes('/all')) {
                return `\nWindows IP Configuration\n\n   Host Name . . . . . . . . . . . . : DESKTOP-WIN10SIM\n   Primary Dns Suffix  . . . . . . . :\n   Node Type . . . . . . . . . . . . : Hybrid\n   IP Routing Enabled. . . . . . . . : No\n   WINS Proxy Enabled. . . . . . . . : No\n\nEthernet adapter Ethernet:\n\n   Connection-specific DNS Suffix  . : lan\n   Description . . . . . . . . . . . : Intel(R) Ethernet Connection I219-V\n   Physical Address. . . . . . . . . : A4-BB-6D-E2-1F-09\n   DHCP Enabled. . . . . . . . . . . : Yes\n   Autoconfiguration Enabled . . . . : Yes\n   IPv4 Address. . . . . . . . . . . : 192.168.1.105\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n   Default Gateway . . . . . . . . . : 192.168.1.1\n   DNS Servers . . . . . . . . . . . : 8.8.8.8\n                                       8.8.4.4\n   Lease Obtained. . . . . . . . . . : ${new Date().toLocaleDateString()}\n   Lease Expires . . . . . . . . . . : ${new Date(Date.now()+86400000).toLocaleDateString()}`;
            }
            return `\nWindows IP Configuration\n\nEthernet adapter Ethernet:\n\n   Connection-specific DNS Suffix  . : lan\n   IPv4 Address. . . . . . . . . . . : 192.168.1.105\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n   Default Gateway . . . . . . . . . : 192.168.1.1\n\nWireless LAN adapter Wi-Fi:\n\n   Connection-specific DNS Suffix  . :\n   IPv4 Address. . . . . . . . . . . : 192.168.1.108\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n   Default Gateway . . . . . . . . . : 192.168.1.1`;
        }

        case 'netstat': {
            return `\nActive Connections\n\n  Proto  Local Address          Foreign Address        State\n  TCP    0.0.0.0:80             0.0.0.0:0              LISTENING\n  TCP    0.0.0.0:443            0.0.0.0:0              LISTENING\n  TCP    127.0.0.1:5432         0.0.0.0:0              LISTENING\n  TCP    192.168.1.105:49672    142.250.80.46:443      ESTABLISHED\n  TCP    192.168.1.105:49673    151.101.1.140:443      ESTABLISHED\n  TCP    192.168.1.105:49680    52.114.132.73:443      ESTABLISHED\n  TCP    192.168.1.105:49685    13.107.42.14:443       TIME_WAIT\n  UDP    0.0.0.0:5353           *:*`;
        }

        case 'tasklist': {
            const procs = [
                ['System','4','0 K'],['smss.exe','308','1,024 K'],['csrss.exe','512','4,096 K'],
                ['winlogon.exe','620','5,120 K'],['services.exe','668','6,144 K'],['lsass.exe','676','12,288 K'],
                ['svchost.exe','872','18,432 K'],['svchost.exe','960','15,360 K'],['explorer.exe','2340','48,640 K'],
                ['taskmgr.exe','3120','20,480 K'],['chrome.exe','4096','256,000 K'],['code.exe','5120','312,000 K'],
                ['discord.exe','6144','128,000 K'],['MsMpEng.exe','1234','32,768 K']
            ];
            let out = `\nImage Name                     PID Session Name        Session#    Mem Usage\n========================= ======== ================ =========== ============\n`;
            procs.forEach(([name,pid,mem]) => {
                out += `${name.padEnd(25)} ${pid.padStart(8)} Console                    1 ${mem.padStart(12)}\n`;
            });
            return out;
        }

        case 'taskkill': {
            const pidIdx = parts.indexOf('/pid');
            const imIdx = parts.indexOf('/im');
            if (pidIdx >= 0 && args[pidIdx]) return `SUCCESS: The process with PID ${rawParts[pidIdx+1]} has been terminated.`;
            if (imIdx >= 0 && args[imIdx]) return `SUCCESS: Sent termination signal to the process "${rawParts[imIdx+1]}".`;
            return 'ERROR: Invalid arguments.\nUsage: taskkill /PID <pid> or /IM <imagename>';
        }

        case 'systeminfo':
            return `\nHost Name:                 DESKTOP-WIN10SIM\nOS Name:                   Microsoft Windows 10 Pro\nOS Version:                10.0.19045 N/A Build 19045\nOS Manufacturer:           Microsoft Corporation\nOS Configuration:          Standalone Workstation\nOS Build Type:             Multiprocessor Free\nRegistered Owner:          ${userData?.username || 'User'}\nRegistered Organization:   N/A\nProduct ID:                00331-10000-00001-AA837\nOriginal Install Date:     1/1/2024, 10:00:00 AM\nSystem Boot Time:          ${new Date().toLocaleString()}\nSystem Manufacturer:       Intel\nSystem Model:              Custom Build\nSystem Type:               x64-based PC\nProcessor(s):              1 Processor(s) Installed.\n                           [01]: Intel64 Family 6 Model 186 i7-13700K\nBIOS Version/Date:         American Megatrends Inc. 2.12, 1/1/2024\nWindows Directory:         C:\\Windows\nSystem Directory:          C:\\Windows\\system32\nBoot Device:               \\Device\\HarddiskVolume2\nSystem Locale:             en-us\nInput Locale:              en-us\nTime Zone:                 (UTC-05:00) Eastern Time\nTotal Physical Memory:     16,384 MB\nAvailable Physical Memory: 8,192 MB\nPage File Space:           20,480 MB\nDomain:                    WORKGROUP\nLogon Server:              \\\\DESKTOP-WIN10SIM`;

        case 'set':
            return `ALLUSERSPROFILE=C:\\ProgramData\nAPPDATA=C:\\Users\\${userData?.username||'User'}\\AppData\\Roaming\nCOMPUTERNAME=DESKTOP-WIN10SIM\nComSpec=C:\\Windows\\system32\\cmd.exe\nDRIVERDATA=C:\\Windows\\System32\\Drivers\\DriverData\nHOMEDRIVE=C:\\\nHOMEPATH=\\Users\\${userData?.username||'User'}\nLOCALAPPDATA=C:\\Users\\${userData?.username||'User'}\\AppData\\Local\nNUMBER_OF_PROCESSORS=16\nOS=Windows_NT\nPATH=C:\\Windows\\system32;C:\\Windows;C:\\Windows\\System32\\Wbem\nPROCESSOR_ARCHITECTURE=AMD64\nPROCESSOR_IDENTIFIER=Intel64 Family 6 Model 186\nPROGRAMFILES=C:\\Program Files\nSYSTEMDRIVE=C:\nSYSTEMROOT=C:\\Windows\nTEMP=C:\\Users\\${userData?.username||'User'}\\AppData\\Local\\Temp\nUSERDOMAIN=DESKTOP-WIN10SIM\nUSERNAME=${userData?.username||'User'}\nUSERPROFILE=C:\\Users\\${userData?.username||'User'}\nWINDIR=C:\\Windows`;

        case 'path':
            return `PATH=C:\\Windows\\system32;C:\\Windows;C:\\Windows\\System32\\Wbem;C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\;C:\\Program Files\\Git\\bin;C:\\Program Files\\nodejs\\`;

        case 'tree':
            return `Folder PATH listing\nVolume serial number is A1B2-C3D4\n${cmdCurrentPath}\n├── Desktop\n│   ├── This PC.lnk\n│   └── Recycle Bin.lnk\n├── Documents\n│   ├── Work\n│   ├── Personal\n│   └── Resume.pdf\n├── Downloads\n│   ├── Setup.exe\n│   └── Photo.jpg\n├── Pictures\n│   ├── Wallpapers\n│   └── Screenshots\n├── Music\n└── Videos`;

        case 'attrib':
            if (!args[0]) return 'Error - No files found.';
            return `  A    H       C:\\Users\\${userData?.username||'User'}\\${args[0]}`;

        case 'chkdsk':
            return `The type of the file system is NTFS.\nVolume label is OS.\n\nWARNING!  /F parameter not specified.\nRunning CHKDSK in read-only mode.\n\nStage 1: Examining basic file system structure ...\n  262144 file records processed.\nFile verification completed.\n  0 large file records processed.\n  0 bad file records processed.\n\nStage 2: Examining file name linkage ...\n  320521 index entries processed.\nIndex verification completed.\n\nStage 3: Examining security descriptors ...\nSecurity descriptor verification completed.\n  29810 data files processed.\nUSN Journal verification completed.\n\nWindows has scanned the file system and found no problems.\n256,026,623 KB total disk space.\n  9,720,832 KB in 108,412 files.\n    198,656 KB in 29,810 indexes.\n          0 KB in bad sectors.\n    386,431 KB in use by the system.\n245,720,704 KB available on disk.\n      4,096 bytes in each allocation unit.\n  64,006,655 total allocation units on disk.\n  61,430,176 allocation units available on disk.`;

        case 'sfc':
            return `Beginning system scan.  This process will take some time.\n\nBeginning verification phase of system scan.\nVerification 100% complete.\n\nWindows Resource Protection did not find any integrity violations.`;

        case 'format':
            return `ERROR: The disk drive is in use. Please try again later.\nAlternatively: Access denied. You do not have sufficient privileges.`;

        case 'shutdown': {
            if (parts.includes('/s')) { setTimeout(() => shutdown(), 2000); return 'Shutting down in 2 seconds...'; }
            if (parts.includes('/r')) { setTimeout(() => restart(), 2000); return 'Restarting in 2 seconds...'; }
            if (parts.includes('/l')) { signOut(); return ''; }
            if (parts.includes('/a')) return 'Shutdown aborted.';
            return 'Usage: shutdown /s (shutdown) /r (restart) /l (logoff) /a (abort)';
        }

        case 'reg':
            return `The operation completed successfully.\n\nHKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\n    ProductName    REG_SZ    Windows 10 Pro\n    CurrentBuild   REG_SZ    19045`;

        case 'net':
            if (parts[1] === 'user') return `User accounts for \\\\DESKTOP-WIN10SIM\n\n-------------------------------------------------------------------------------\n${userData?.username||'User'}            Administrator            DefaultAccount\nGuest\nThe command completed successfully.`;
            if (parts[1] === 'use') return `New connections will be remembered.\n\nStatus       Local     Remote                    Network\n-------------------------------------------------------------------------------\nOK           Z:        \\\\NAS\\Shared               Microsoft Windows Network\nThe command completed successfully.`;
            return 'The syntax of this command is:\nNET [ ACCOUNTS | COMPUTER | CONFIG | CONTINUE | FILE | GROUP | HELP |\n    HELPMSG | LOCALGROUP | PAUSE | SESSION | SHARE | START |\n    STATISTICS | STOP | TIME | USE | USER | VIEW ]';

        case 'runas':
            return 'ERROR: The user account you selected is not logged on to this computer.\nPlease try with Administrator credentials.';

        case 'start':
            if (args[0]) {
                const appMap = { notepad: 'notepad', calc: 'calculator', mspaint: 'paint', explorer: 'explorer', cmd: 'cmd', powershell: 'powershell' };
                const appName = appMap[parts[1]];
                if (appName) { setTimeout(() => openApp(appName), 100); return ''; }
            }
            return 'Usage: start [application]\nAvailable: notepad, calc, mspaint, explorer, cmd, powershell';

        case 'color':
            const colors = {'0':'#000','1':'#000080','2':'#008000','3':'#008080','4':'#800000','5':'#800080','6':'#808000','7':'#c0c0c0','8':'#808080','9':'#0000ff','a':'#00ff00','b':'#00ffff','c':'#ff0000','d':'#ff00ff','e':'#ffff00','f':'#fff'};
            if (parts[1] && parts[1].length === 2) {
                const bg = colors[parts[1][0]], fg = colors[parts[1][1]];
                if (bg && fg) {
                    const win = document.getElementById('cmd-container');
                    if (win) { win.style.backgroundColor = bg; win.style.color = fg; }
                    const inp = document.getElementById('cmd-input');
                    if (inp) inp.style.color = fg;
                    return '';
                }
            }
            return 'Invalid color attribute.\nUsage: color [attr]   (e.g. color 0a = black bg, green text)';

        case 'title': {
            const t2 = rawParts.slice(1).join(' ');
            if (t2) {
                const titleEl = document.querySelector('.window[data-app="cmd"] .window-title');
                if (titleEl) titleEl.textContent = t2;
                return '';
            }
            return 'Usage: title <string>';
        }

        case 'exit':
            closeWindow('cmd');
            return '';

        case '':
            return '';

        default:
            return `'${command}' is not recognized as an internal or external command,\noperable program or batch file.`;
    }
}

function updateCMDPrompt() {
    const prompt = document.querySelector('.cmd-prompt');
    if (prompt) prompt.textContent = cmdCurrentPath + '>';
}

// Paint App
let paintColor = '#000000';
let paintSize = 5;
let paintTool = 'brush';
let isDrawing = false;

function createPaint() {
    setTimeout(() => initPaintCanvas(), 100);
    const palette = [
        '#000000','#7f7f7f','#880015','#ed1c24','#ff7f27','#fff200','#22b14c','#00a2e8','#3f48cc','#a349a4',
        '#ffffff','#c3c3c3','#b97a57','#ffaec9','#ffc90e','#efe4b0','#b5e61d','#99d9ea','#7092be','#c8bfe7'
    ];
    return `
    <div class="paint-app" style="height:100%;display:flex;flex-direction:column;background:#f0f0f0;font-family:Segoe UI,sans-serif;">
      <!-- Ribbon -->
      <div style="background:white;border-bottom:1px solid #d0d0d0;padding:8px 12px;display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap;">

        <!-- Tools group -->
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
          <div style="display:grid;grid-template-columns:repeat(4,32px);gap:2px;">
            <button class="paint-tool active" data-tool="brush"  onclick="setPaintTool('brush',this)"  title="Brush"     style="padding:6px;font-size:14px;cursor:pointer;border:1px solid transparent;background:transparent;border-radius:3px;">🖌️</button>
            <button class="paint-tool"        data-tool="pencil" onclick="setPaintTool('pencil',this)" title="Pencil"    style="padding:6px;font-size:14px;cursor:pointer;border:1px solid transparent;background:transparent;border-radius:3px;">✏️</button>
            <button class="paint-tool"        data-tool="eraser" onclick="setPaintTool('eraser',this)" title="Eraser"    style="padding:6px;font-size:14px;cursor:pointer;border:1px solid transparent;background:transparent;border-radius:3px;">🧹</button>
            <button class="paint-tool"        data-tool="fill"   onclick="setPaintTool('fill',this)"   title="Fill"      style="padding:6px;font-size:14px;cursor:pointer;border:1px solid transparent;background:transparent;border-radius:3px;">🪣</button>
            <button class="paint-tool"        data-tool="picker" onclick="setPaintTool('picker',this)" title="Color picker" style="padding:6px;font-size:14px;cursor:pointer;border:1px solid transparent;background:transparent;border-radius:3px;">💧</button>
            <button class="paint-tool"        data-tool="text"   onclick="setPaintTool('text',this)"   title="Text"      style="padding:6px;font-size:14px;cursor:pointer;border:1px solid transparent;background:transparent;border-radius:3px;">🅰️</button>
            <button class="paint-tool"        data-tool="line"   onclick="setPaintTool('line',this)"   title="Line"      style="padding:6px;font-size:14px;cursor:pointer;border:1px solid transparent;background:transparent;border-radius:3px;">📏</button>
            <button class="paint-tool"        data-tool="spray"  onclick="setPaintTool('spray',this)"  title="Airbrush"  style="padding:6px;font-size:14px;cursor:pointer;border:1px solid transparent;background:transparent;border-radius:3px;">💨</button>
          </div>
          <div style="font-size:10px;color:#666;">Tools</div>
        </div>

        <!-- Shapes group -->
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
          <div style="display:grid;grid-template-columns:repeat(4,32px);gap:2px;">
            <button class="paint-tool" data-tool="rect"      onclick="setPaintTool('rect',this)"      title="Rectangle" style="padding:6px;font-size:14px;cursor:pointer;border:1px solid transparent;background:transparent;border-radius:3px;">▭</button>
            <button class="paint-tool" data-tool="circle"    onclick="setPaintTool('circle',this)"    title="Ellipse"   style="padding:6px;font-size:14px;cursor:pointer;border:1px solid transparent;background:transparent;border-radius:3px;">⬭</button>
            <button class="paint-tool" data-tool="triangle"  onclick="setPaintTool('triangle',this)"  title="Triangle"  style="padding:6px;font-size:14px;cursor:pointer;border:1px solid transparent;background:transparent;border-radius:3px;">△</button>
            <button class="paint-tool" data-tool="star"      onclick="setPaintTool('star',this)"      title="Star"      style="padding:6px;font-size:14px;cursor:pointer;border:1px solid transparent;background:transparent;border-radius:3px;">★</button>
            <button class="paint-tool" data-tool="heart"     onclick="setPaintTool('heart',this)"     title="Heart"     style="padding:6px;font-size:14px;cursor:pointer;border:1px solid transparent;background:transparent;border-radius:3px;">♥</button>
            <button class="paint-tool" data-tool="arrow"     onclick="setPaintTool('arrow',this)"     title="Arrow"     style="padding:6px;font-size:14px;cursor:pointer;border:1px solid transparent;background:transparent;border-radius:3px;">→</button>
            <button class="paint-tool" data-tool="diamond"   onclick="setPaintTool('diamond',this)"   title="Diamond"   style="padding:6px;font-size:14px;cursor:pointer;border:1px solid transparent;background:transparent;border-radius:3px;">◆</button>
            <button class="paint-tool" data-tool="hexagon"   onclick="setPaintTool('hexagon',this)"   title="Hexagon"   style="padding:6px;font-size:14px;cursor:pointer;border:1px solid transparent;background:transparent;border-radius:3px;">⬡</button>
          </div>
          <div style="font-size:10px;color:#666;">Shapes</div>
        </div>

        <!-- Size + colors -->
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
          <div style="display:flex;gap:4px;align-items:center;">
            <label style="font-size:11px;">Size</label>
            <input type="range" class="paint-size" min="1" max="60" value="5" oninput="paintSize=parseInt(this.value);document.getElementById('paint-size-num').textContent=this.value">
            <span id="paint-size-num" style="font-size:11px;width:18px;color:#444;">5</span>
          </div>
          <div style="display:flex;gap:4px;align-items:center;">
            <input type="color" id="paint-custom-color" value="#000000" onchange="setPaintColor(this.value)" style="width:30px;height:22px;border:1px solid #ccc;cursor:pointer;padding:0;">
            <label style="font-size:11px;">Fill</label>
            <input type="checkbox" id="paint-fill-shape" checked> 
          </div>
          <div style="font-size:10px;color:#666;">Style</div>
        </div>

        <!-- Color palette -->
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
          <div style="display:grid;grid-template-columns:repeat(10,18px);gap:2px;">
            ${palette.map((c,i) => `<div class="paint-color${i===0?' active':''}" style="width:18px;height:18px;background:${c};cursor:pointer;border:1px solid ${i===0?'#0078d4':'#999'};" onclick="setPaintColor('${c}',this)" title="${c}"></div>`).join('')}
          </div>
          <div style="font-size:10px;color:#666;">Colors</div>
        </div>

        <!-- Actions -->
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;margin-left:auto;">
          <div style="display:grid;grid-template-columns:repeat(3,auto);gap:4px;">
            <button onclick="paintUndo()" title="Undo (Ctrl+Z)" style="padding:6px 10px;font-size:13px;cursor:pointer;background:#f0f0f0;border:1px solid #ccc;border-radius:3px;">↶ Undo</button>
            <button onclick="paintRedo()" title="Redo (Ctrl+Y)" style="padding:6px 10px;font-size:13px;cursor:pointer;background:#f0f0f0;border:1px solid #ccc;border-radius:3px;">↷ Redo</button>
            <button onclick="clearCanvas()" title="Clear" style="padding:6px 10px;font-size:13px;cursor:pointer;background:#f0f0f0;border:1px solid #ccc;border-radius:3px;">🗑️ Clear</button>
            <button onclick="paintDownload()" title="Save as PNG" style="padding:6px 10px;font-size:13px;cursor:pointer;background:#0078d4;color:white;border:none;border-radius:3px;">💾 Save</button>
            <button onclick="paintLoadImage()" title="Open image" style="padding:6px 10px;font-size:13px;cursor:pointer;background:#f0f0f0;border:1px solid #ccc;border-radius:3px;">📂 Open</button>
            <button onclick="paintFillAll()" title="Fill canvas with current color" style="padding:6px 10px;font-size:13px;cursor:pointer;background:#f0f0f0;border:1px solid #ccc;border-radius:3px;">🎨 Fill all</button>
          </div>
        </div>
      </div>

      <!-- Canvas area -->
      <div class="paint-canvas-container" style="flex:1;overflow:auto;padding:20px;background:#adb5bd;display:flex;justify-content:center;align-items:flex-start;position:relative;">
        <canvas id="paint-canvas" width="800" height="500" style="background:white;box-shadow:0 0 12px rgba(0,0,0,0.25);cursor:crosshair;"></canvas>
        <canvas id="paint-overlay" width="800" height="500" style="position:absolute;background:transparent;pointer-events:none;box-shadow:0 0 12px rgba(0,0,0,0);"></canvas>
      </div>

      <!-- Status bar -->
      <div style="background:#0078d4;color:white;padding:4px 14px;font-size:11px;display:flex;gap:18px;">
        <span id="paint-pos">📍 0, 0</span>
        <span id="paint-canvas-info">📐 800 × 500 px</span>
        <span id="paint-tool-info">🖌️ Brush</span>
        <span id="paint-color-info">🎨 #000000</span>
      </div>
    </div>`;
}

let paintIsDrawing = false;
let paintStartX = 0, paintStartY = 0;
let paintLastX = 0, paintLastY = 0;
let paintHistory = [];
let paintHistoryIdx = -1;
let paintSavedSnapshot = null;

function initPaintCanvas() {
    const canvas = document.getElementById('paint-canvas');
    const overlay = document.getElementById('paint-overlay');
    if (!canvas || !overlay) return;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    paintHistory = [canvas.toDataURL()];
    paintHistoryIdx = 0;
    paintIsDrawing = false;

    // Position overlay exactly over the canvas
    overlay.style.left = canvas.offsetLeft + 'px';
    overlay.style.top = canvas.offsetTop + 'px';

    const getPos = (e) => {
        const r = canvas.getBoundingClientRect();
        return [e.clientX - r.left, e.clientY - r.top];
    };

    canvas.addEventListener('mousedown', (e) => {
        const [x, y] = getPos(e);
        paintIsDrawing = true;
        paintStartX = x; paintStartY = y;
        paintLastX = x; paintLastY = y;
        paintSavedSnapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

        if (paintTool === 'brush' || paintTool === 'pencil' || paintTool === 'eraser' || paintTool === 'spray') {
            drawPoint(ctx, x, y);
        } else if (paintTool === 'fill') {
            floodFill(ctx, Math.floor(x), Math.floor(y), paintColor);
            paintIsDrawing = false;
            paintCommit();
        } else if (paintTool === 'picker') {
            const px = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
            const hex = '#' + [px[0],px[1],px[2]].map(n => n.toString(16).padStart(2,'0')).join('');
            setPaintColor(hex);
            const ci = document.getElementById('paint-custom-color');
            if (ci) ci.value = hex;
            paintIsDrawing = false;
        } else if (paintTool === 'text') {
            const txt = prompt('Enter text:');
            if (txt) {
                ctx.fillStyle = paintColor;
                ctx.font = (paintSize * 3) + 'px Segoe UI';
                ctx.fillText(txt, x, y);
                paintCommit();
            }
            paintIsDrawing = false;
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        const [x, y] = getPos(e);
        const posEl = document.getElementById('paint-pos');
        if (posEl) posEl.textContent = `📍 ${Math.floor(x)}, ${Math.floor(y)}`;

        if (!paintIsDrawing) return;

        if (paintTool === 'brush' || paintTool === 'pencil' || paintTool === 'eraser') {
            ctx.strokeStyle = paintTool === 'eraser' ? 'white' : paintColor;
            ctx.lineWidth = paintTool === 'pencil' ? Math.max(1, paintSize/3) : paintSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(paintLastX, paintLastY);
            ctx.lineTo(x, y);
            ctx.stroke();
            paintLastX = x; paintLastY = y;
        } else if (paintTool === 'spray') {
            ctx.fillStyle = paintColor;
            for (let i = 0; i < 20; i++) {
                const ox = (Math.random() - 0.5) * paintSize * 2;
                const oy = (Math.random() - 0.5) * paintSize * 2;
                if (ox*ox + oy*oy <= paintSize*paintSize) {
                    ctx.fillRect(x + ox, y + oy, 1, 1);
                }
            }
        } else if (['rect','circle','triangle','star','heart','arrow','line','diamond','hexagon'].includes(paintTool)) {
            // Preview shape on overlay
            ctx.putImageData(paintSavedSnapshot, 0, 0);
            drawShape(ctx, paintTool, paintStartX, paintStartY, x, y);
        }
    });

    const stopDrawing = () => {
        if (paintIsDrawing) {
            paintIsDrawing = false;
            paintCommit();
        }
    };
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
}

function drawPoint(ctx, x, y) {
    ctx.beginPath();
    ctx.arc(x, y, paintSize/2, 0, Math.PI * 2);
    ctx.fillStyle = paintTool === 'eraser' ? 'white' : paintColor;
    ctx.fill();
}

function drawShape(ctx, tool, x1, y1, x2, y2) {
    const fill = document.getElementById('paint-fill-shape')?.checked;
    ctx.strokeStyle = paintColor;
    ctx.fillStyle = paintColor;
    ctx.lineWidth = Math.max(1, paintSize/2);
    ctx.beginPath();

    const w = x2 - x1, h = y2 - y1;
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
    const rx = Math.abs(w/2), ry = Math.abs(h/2);

    if (tool === 'rect') {
        if (fill) ctx.fillRect(Math.min(x1,x2), Math.min(y1,y2), Math.abs(w), Math.abs(h));
        else ctx.strokeRect(Math.min(x1,x2), Math.min(y1,y2), Math.abs(w), Math.abs(h));
    } else if (tool === 'circle') {
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        fill ? ctx.fill() : ctx.stroke();
    } else if (tool === 'line') {
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineWidth = paintSize; ctx.lineCap = 'round'; ctx.stroke();
    } else if (tool === 'triangle') {
        ctx.moveTo(cx, y1); ctx.lineTo(x1, y2); ctx.lineTo(x2, y2); ctx.closePath();
        fill ? ctx.fill() : ctx.stroke();
    } else if (tool === 'diamond') {
        ctx.moveTo(cx, y1); ctx.lineTo(x2, cy); ctx.lineTo(cx, y2); ctx.lineTo(x1, cy); ctx.closePath();
        fill ? ctx.fill() : ctx.stroke();
    } else if (tool === 'star') {
        const spikes = 5, outer = Math.min(rx, ry), inner = outer / 2.5;
        for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 === 0 ? outer : inner;
            const a = (Math.PI / spikes) * i - Math.PI/2;
            const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        fill ? ctx.fill() : ctx.stroke();
    } else if (tool === 'heart') {
        const s = Math.min(Math.abs(w), Math.abs(h));
        ctx.moveTo(cx, y1 + s * 0.3);
        ctx.bezierCurveTo(cx, y1, x1, y1, x1, y1 + s * 0.3);
        ctx.bezierCurveTo(x1, y1 + s * 0.6, cx, y2, cx, y2);
        ctx.bezierCurveTo(cx, y2, x2, y1 + s * 0.6, x2, y1 + s * 0.3);
        ctx.bezierCurveTo(x2, y1, cx, y1, cx, y1 + s * 0.3);
        fill ? ctx.fill() : ctx.stroke();
    } else if (tool === 'arrow') {
        ctx.lineWidth = paintSize;
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        // arrowhead
        const ang = Math.atan2(y2 - y1, x2 - x1), len = paintSize * 3;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - len * Math.cos(ang - Math.PI/6), y2 - len * Math.sin(ang - Math.PI/6));
        ctx.lineTo(x2 - len * Math.cos(ang + Math.PI/6), y2 - len * Math.sin(ang + Math.PI/6));
        ctx.closePath(); ctx.fill();
    } else if (tool === 'hexagon') {
        for (let i = 0; i < 6; i++) {
            const a = (Math.PI / 3) * i;
            const px = cx + Math.cos(a) * rx, py = cy + Math.sin(a) * ry;
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        fill ? ctx.fill() : ctx.stroke();
    }
}

function floodFill(ctx, x, y, hex) {
    const w = ctx.canvas.width, h = ctx.canvas.height;
    const img = ctx.getImageData(0, 0, w, h);
    const data = img.data;
    const idx = (x, y) => (y * w + x) * 4;
    const target = [data[idx(x,y)], data[idx(x,y)+1], data[idx(x,y)+2], data[idx(x,y)+3]];
    const r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16);
    if (target[0] === r && target[1] === g && target[2] === b) return;
    const stack = [[x,y]];
    let visited = 0;
    while (stack.length && visited < w * h) {
        const [cx, cy] = stack.pop();
        if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue;
        const i = idx(cx, cy);
        if (data[i] !== target[0] || data[i+1] !== target[1] || data[i+2] !== target[2] || data[i+3] !== target[3]) continue;
        data[i] = r; data[i+1] = g; data[i+2] = b; data[i+3] = 255;
        stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
        visited++;
    }
    ctx.putImageData(img, 0, 0);
}

function paintCommit() {
    const canvas = document.getElementById('paint-canvas');
    if (!canvas) return;
    paintHistory = paintHistory.slice(0, paintHistoryIdx + 1);
    paintHistory.push(canvas.toDataURL());
    if (paintHistory.length > 30) paintHistory.shift();
    paintHistoryIdx = paintHistory.length - 1;
}

function paintUndo() {
    if (paintHistoryIdx <= 0) return;
    paintHistoryIdx--;
    paintLoadFromHistory();
}

function paintRedo() {
    if (paintHistoryIdx >= paintHistory.length - 1) return;
    paintHistoryIdx++;
    paintLoadFromHistory();
}

function paintLoadFromHistory() {
    const canvas = document.getElementById('paint-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => { ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(img, 0, 0); };
    img.src = paintHistory[paintHistoryIdx];
}

function setPaintColor(color, el) {
    paintColor = color;
    document.querySelectorAll('.paint-color').forEach(c => c.style.border = '1px solid #999');
    if (el) el.style.border = '2px solid #0078d4';
    const ci = document.getElementById('paint-color-info');
    if (ci) ci.textContent = '🎨 ' + color;
    const cc = document.getElementById('paint-custom-color');
    if (cc && /^#[0-9a-f]{6}$/i.test(color)) cc.value = color;
}

function setPaintTool(tool, el) {
    paintTool = tool;
    document.querySelectorAll('.paint-tool').forEach(t => {
        t.classList.remove('active');
        t.style.background = 'transparent';
        t.style.border = '1px solid transparent';
    });
    if (el) {
        el.classList.add('active');
        el.style.background = '#cce4f7';
        el.style.border = '1px solid #0078d4';
    }
    const labels = { brush:'🖌️ Brush', pencil:'✏️ Pencil', eraser:'🧹 Eraser', fill:'🪣 Fill', picker:'💧 Picker', text:'🅰️ Text', line:'📏 Line', spray:'💨 Airbrush', rect:'▭ Rectangle', circle:'⬭ Ellipse', triangle:'△ Triangle', star:'★ Star', heart:'♥ Heart', arrow:'→ Arrow', diamond:'◆ Diamond', hexagon:'⬡ Hexagon' };
    const ti = document.getElementById('paint-tool-info');
    if (ti) ti.textContent = labels[tool] || tool;
    const canvas = document.getElementById('paint-canvas');
    if (canvas) canvas.style.cursor = (tool === 'picker' || tool === 'fill') ? 'cell' : (tool === 'text' ? 'text' : 'crosshair');
}

function clearCanvas() {
    const canvas = document.getElementById('paint-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    paintCommit();
}

function paintFillAll() {
    const canvas = document.getElementById('paint-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = paintColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    paintCommit();
}

function paintDownload() {
    const canvas = document.getElementById('paint-canvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = 'paint-' + Date.now() + '.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
    if (typeof addNotification === 'function') addNotification('🎨', 'Paint', 'Image saved as PNG');
}

function paintLoadImage() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.getElementById('paint-canvas');
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'white';
                ctx.fillRect(0,0,canvas.width,canvas.height);
                const r = Math.min(canvas.width / img.width, canvas.height / img.height);
                ctx.drawImage(img, 0, 0, img.width * r, img.height * r);
                paintCommit();
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    };
    inp.click();
}

// Weather App
const _weatherCities = [
    { name: 'New York',    country: 'US', temp: 72, cond: 'Partly Cloudy', icon: '⛅', hi: 78, lo: 64, humidity: 58, wind: 8,  uv: 5, feels: 74, vis: 10, pressure: 1014, dew: 56, sunrise: '6:21 AM', sunset: '7:48 PM', aqi: 42 },
    { name: 'Tokyo',       country: 'JP', temp: 86, cond: 'Sunny',          icon: '☀️', hi: 91, lo: 75, humidity: 67, wind: 6,  uv: 9, feels: 92, vis: 9,  pressure: 1009, dew: 73, sunrise: '4:48 AM', sunset: '6:54 PM', aqi: 35 },
    { name: 'London',      country: 'UK', temp: 58, cond: 'Light Rain',     icon: '🌧️', hi: 64, lo: 52, humidity: 82, wind: 12, uv: 2, feels: 55, vis: 6,  pressure: 1003, dew: 52, sunrise: '5:12 AM', sunset: '8:33 PM', aqi: 28 },
    { name: 'Sydney',      country: 'AU', temp: 64, cond: 'Clear',          icon: '🌤️', hi: 70, lo: 58, humidity: 60, wind: 14, uv: 4, feels: 64, vis: 10, pressure: 1018, dew: 50, sunrise: '7:01 AM', sunset: '5:02 PM', aqi: 18 },
    { name: 'Dubai',       country: 'AE', temp: 105, cond: 'Hot & Dry',     icon: '🔥', hi: 112, lo: 89, humidity: 25, wind: 9,  uv: 11,feels: 110,vis: 7,  pressure: 1006, dew: 64, sunrise: '5:36 AM', sunset: '7:08 PM', aqi: 78 },
    { name: 'Reykjavik',   country: 'IS', temp: 41, cond: 'Snow',           icon: '❄️', hi: 45, lo: 32, humidity: 88, wind: 22, uv: 1, feels: 28, vis: 4,  pressure: 998,  dew: 36, sunrise: '4:02 AM', sunset: '11:04 PM', aqi: 12 },
    { name: 'Rio de Janeiro', country: 'BR', temp: 80, cond: 'Thunderstorms', icon: '⛈️', hi: 84, lo: 73, humidity: 78, wind: 11, uv: 7, feels: 88, vis: 5,  pressure: 1011, dew: 72, sunrise: '6:32 AM', sunset: '5:48 PM', aqi: 51 }
];
let _weatherCityIdx = 0;

function createWeather() {
    setTimeout(() => renderWeather(), 50);
    return `
    <div id="weather-root" style="height:100%;display:flex;flex-direction:column;background:linear-gradient(180deg,#4a90e2,#357abd);color:white;font-family:Segoe UI,sans-serif;overflow-y:auto;">
      <div style="padding:14px 20px;display:flex;align-items:center;gap:10px;background:rgba(0,0,0,0.15);">
        <span style="font-size:20px;">📍</span>
        <select id="weather-city" onchange="_weatherCityIdx=this.value;renderWeather()" style="background:rgba(255,255,255,0.2);color:white;border:1px solid rgba(255,255,255,0.4);border-radius:4px;padding:6px 10px;font-size:14px;cursor:pointer;">
          ${_weatherCities.map((c,i) => `<option value="${i}" style="color:#000;">${c.name}, ${c.country}</option>`).join('')}
        </select>
        <span style="margin-left:auto;font-size:13px;opacity:0.85;" id="weather-clock">--:--</span>
      </div>
      <div id="weather-body" style="flex:1;"></div>
    </div>`;
}

function renderWeather() {
    const root = document.getElementById('weather-root');
    const body = document.getElementById('weather-body');
    if (!body) return;
    const c = _weatherCities[_weatherCityIdx];
    const clock = document.getElementById('weather-clock');
    if (clock) clock.textContent = new Date().toLocaleString();

    // Background based on condition
    const bgs = {
        'Sunny':           'linear-gradient(180deg,#ff9966,#ff5e62)',
        'Hot & Dry':       'linear-gradient(180deg,#f12711,#f5af19)',
        'Clear':           'linear-gradient(180deg,#56ccf2,#2f80ed)',
        'Partly Cloudy':   'linear-gradient(180deg,#4a90e2,#357abd)',
        'Light Rain':      'linear-gradient(180deg,#536976,#292e49)',
        'Thunderstorms':   'linear-gradient(180deg,#373b44,#4286f4)',
        'Snow':            'linear-gradient(180deg,#83a4d4,#b6fbff)'
    };
    if (root) root.style.background = bgs[c.cond] || bgs['Partly Cloudy'];

    // Hourly forecast (next 24h)
    const hourIcons = ['☀️','☀️','⛅','⛅','☁️','🌧️','⛈️','🌤️'];
    const hours = Array.from({length: 12}).map((_, i) => {
        const h = (new Date().getHours() + i) % 24;
        const t = c.temp + Math.floor(Math.sin(i / 2) * 6 - 2);
        const hi = hourIcons[(i + _weatherCityIdx) % hourIcons.length];
        return { h: h === 0 ? '12 AM' : (h < 12 ? h + ' AM' : (h === 12 ? '12 PM' : (h - 12) + ' PM')), t, icon: hi };
    });

    const days = ['Today','Tue','Wed','Thu','Fri','Sat','Sun'];
    const dayIcons = ['☀️','⛅','☁️','🌧️','⛈️','🌤️','❄️'];
    const dayTemps = days.map((_, i) => ({ hi: c.hi + Math.floor(Math.sin(i)*4), lo: c.lo + Math.floor(Math.cos(i)*3), icon: dayIcons[(i + _weatherCityIdx) % dayIcons.length] }));

    const aqiColor = c.aqi < 50 ? '#00e676' : c.aqi < 100 ? '#ffeb3b' : c.aqi < 150 ? '#ff9800' : '#f44336';
    const aqiLabel = c.aqi < 50 ? 'Good' : c.aqi < 100 ? 'Moderate' : c.aqi < 150 ? 'Unhealthy' : 'Very Unhealthy';
    const uvLabel = c.uv <= 2 ? 'Low' : c.uv <= 5 ? 'Moderate' : c.uv <= 7 ? 'High' : c.uv <= 10 ? 'Very High' : 'Extreme';
    const uvColor = c.uv <= 2 ? '#4caf50' : c.uv <= 5 ? '#ffeb3b' : c.uv <= 7 ? '#ff9800' : '#f44336';

    body.innerHTML = `
      <div style="padding:30px 20px;text-align:center;">
        <div style="font-size:96px;line-height:1;">${c.icon}</div>
        <div style="font-size:80px;font-weight:200;letter-spacing:-2px;">${c.temp}°<span style="font-size:32px;vertical-align:top;opacity:0.7;">F</span></div>
        <div style="font-size:20px;opacity:0.95;">${c.cond}</div>
        <div style="font-size:14px;opacity:0.85;margin-top:4px;">Feels like ${c.feels}° · H ${c.hi}° · L ${c.lo}°</div>
      </div>

      <!-- Hourly -->
      <div style="background:rgba(255,255,255,0.12);margin:0 16px;border-radius:12px;padding:14px;">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;opacity:0.85;margin-bottom:10px;">⏱ Hourly forecast</div>
        <div style="display:flex;gap:14px;overflow-x:auto;padding-bottom:4px;">
          ${hours.map((h, i) => `
            <div style="text-align:center;min-width:54px;${i===0?'background:rgba(255,255,255,0.18);border-radius:8px;padding:6px 4px;':''}">
              <div style="font-size:12px;opacity:0.85;">${i===0?'Now':h.h}</div>
              <div style="font-size:24px;margin:4px 0;">${h.icon}</div>
              <div style="font-size:14px;font-weight:600;">${h.t}°</div>
            </div>`).join('')}
        </div>
      </div>

      <!-- 7-day -->
      <div style="background:rgba(255,255,255,0.12);margin:14px 16px 0;border-radius:12px;padding:14px;">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;opacity:0.85;margin-bottom:10px;">📅 7-day forecast</div>
        ${days.map((d, i) => {
          const t = dayTemps[i];
          const lowPct = ((t.lo - c.lo) / Math.max(1, c.hi - c.lo)) * 100;
          const hiPct = ((t.hi - c.lo) / Math.max(1, c.hi - c.lo)) * 100;
          return `
          <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:${i===days.length-1?'none':'1px solid rgba(255,255,255,0.1)'};">
            <div style="width:60px;font-size:14px;font-weight:${i===0?600:400};">${d}</div>
            <div style="font-size:22px;width:30px;text-align:center;">${t.icon}</div>
            <div style="font-size:13px;opacity:0.7;width:30px;text-align:right;">${t.lo}°</div>
            <div style="flex:1;height:6px;background:rgba(255,255,255,0.2);border-radius:3px;position:relative;">
              <div style="position:absolute;left:${Math.max(0,Math.min(100,lowPct))}%;width:${Math.max(10,hiPct - lowPct)}%;height:100%;background:linear-gradient(90deg,#5fbff9,#fce96a,#ff9966);border-radius:3px;"></div>
            </div>
            <div style="font-size:13px;width:30px;font-weight:600;">${t.hi}°</div>
          </div>`;
        }).join('')}
      </div>

      <!-- Detail tiles -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;padding:14px 16px;">
        ${[
          ['💨','Wind',         c.wind + ' mph', 'NW'],
          ['💧','Humidity',     c.humidity + '%', `Dew point ${c.dew}°`],
          ['👁️','Visibility',   c.vis + ' mi', 'Clear'],
          ['🌡️','Pressure',     c.pressure + ' mb', c.pressure > 1013 ? 'High' : 'Low'],
          ['🌅','Sunrise',      c.sunrise, 'Sunset ' + c.sunset],
          ['🤒','Feels like',   c.feels + '°', c.feels > c.temp ? 'Warmer' : 'Cooler'],
        ].map(([ic, lbl, val, sub]) => `
          <div style="background:rgba(255,255,255,0.12);border-radius:10px;padding:12px;">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;opacity:0.8;">${ic} ${lbl}</div>
            <div style="font-size:22px;font-weight:600;margin:4px 0;">${val}</div>
            <div style="font-size:11px;opacity:0.7;">${sub}</div>
          </div>`).join('')}

        <div style="background:rgba(255,255,255,0.12);border-radius:10px;padding:12px;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;opacity:0.8;">☀️ UV index</div>
          <div style="font-size:22px;font-weight:600;margin:4px 0;color:${uvColor};">${c.uv} · ${uvLabel}</div>
          <div style="height:5px;background:linear-gradient(90deg,#4caf50,#ffeb3b,#ff9800,#f44336,#9c27b0);border-radius:3px;position:relative;margin-top:6px;">
            <div style="position:absolute;left:${(c.uv/12)*100}%;top:-3px;width:11px;height:11px;background:white;border-radius:50%;border:2px solid #333;transform:translateX(-50%);"></div>
          </div>
        </div>

        <div style="background:rgba(255,255,255,0.12);border-radius:10px;padding:12px;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;opacity:0.8;">🍃 Air quality</div>
          <div style="font-size:22px;font-weight:600;margin:4px 0;color:${aqiColor};">${c.aqi} · ${aqiLabel}</div>
          <div style="font-size:11px;opacity:0.7;">${c.aqi < 50 ? 'Air quality is satisfactory.' : c.aqi < 100 ? 'Acceptable for most.' : 'Sensitive groups beware.'}</div>
        </div>
      </div>

      <div style="text-align:center;padding:8px 0 14px;font-size:11px;opacity:0.6;">Data is simulated · Updated ${new Date().toLocaleTimeString()}</div>
    </div>`;
}

// Snipping Tool
function createSnipping() {
    return `
        <div class="snipping-app">
            <div class="snipping-toolbar">
                <button class="snipping-btn" onclick="takeSnip()">+ New</button>
                <select style="padding: 6px;">
                    <option>Rectangular Snip</option>
                    <option>Free-form Snip</option>
                    <option>Window Snip</option>
                    <option>Full-screen Snip</option>
                </select>
            </div>
            <div class="snipping-content" id="snipping-content">
                <div style="text-align: center">
                    <p style="font-size: 48px">✂️</p>
                    <p>Click "New" to take a screenshot</p>
                    <p style="font-size: 12px; margin-top: 10px">Press Windows + Shift + S for quick snip</p>
                </div>
            </div>
        </div>
    `;
}

function takeSnip() {
    const content = document.getElementById('snipping-content');
    if (content) {
        content.innerHTML = `
            <div style="text-align: center">
                <p style="font-size: 48px">📸</p>
                <p>Screenshot captured!</p>
                <p style="font-size: 12px; margin-top: 10px; color: #0078d4">Saved to clipboard</p>
            </div>
        `;
    }
}

// Context Menu
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('contextmenu', (e) => {
        const desktop = document.getElementById('screen-desktop');
        if (desktop && desktop.classList.contains('active')) {
            const contextMenu = document.getElementById('context-menu');
            if (contextMenu && e.target.closest('.desktop-icons')) {
                e.preventDefault();
                contextMenu.style.left = e.pageX + 'px';
                contextMenu.style.top = e.pageY + 'px';
                contextMenu.classList.add('active');
            }
        }
    });
    
    document.addEventListener('click', () => {
        const contextMenu = document.getElementById('context-menu');
        if (contextMenu) contextMenu.classList.remove('active');
    });
});

function refreshDesktop() {
    const icons = document.querySelector('.desktop-icons');
    if (icons) {
        icons.style.opacity = '0.5';
        setTimeout(() => icons.style.opacity = '1', 300);
    }
}

function createFolder() {
    const icons = document.querySelector('.desktop-icons');
    if (icons) {
        const folder = document.createElement('div');
        folder.className = 'desktop-icon';
        folder.innerHTML = '<div class="icon">📁</div><div class="icon-label">New folder</div>';
        folder.ondblclick = () => openApp('explorer');
        icons.appendChild(folder);
    }
}

function toggleQuickAction(el) {
    el.classList.toggle('active');
}

// WiFi and Volume Menus
function toggleWifiMenu() {
    const menu = document.getElementById('wifi-menu');
    const volumeMenu = document.getElementById('volume-menu');
    if (volumeMenu) volumeMenu.classList.remove('active');
    if (menu) menu.classList.toggle('active');
}

function toggleVolumeMenu() {
    const menu = document.getElementById('volume-menu');
    const wifiMenu = document.getElementById('wifi-menu');
    if (wifiMenu) wifiMenu.classList.remove('active');
    if (menu) menu.classList.toggle('active');
    
    const slider = document.getElementById('volume-slider');
    const value = document.getElementById('volume-value');
    if (slider && value) {
        slider.oninput = () => value.textContent = slider.value + '%';
    }
}

function toggleWifiState(checkbox) {
    const wifiList = document.getElementById('wifi-list');
    if (wifiList) {
        wifiList.style.opacity = checkbox.checked ? '1' : '0.5';
        wifiList.style.pointerEvents = checkbox.checked ? 'auto' : 'none';
    }
}

function selectWifi(el) {
    document.querySelectorAll('.wifi-network').forEach(n => {
        n.classList.remove('connected');
        n.querySelector('.wifi-status').textContent = n.querySelector('.wifi-status').textContent.replace('Connected, ', '');
    });
    el.classList.add('connected');
    const status = el.querySelector('.wifi-status');
    status.textContent = 'Connected, ' + status.textContent;
    playSound('notification');
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.wifi-menu') && !e.target.closest('.tray-icon')) {
        const wifiMenu = document.getElementById('wifi-menu');
        if (wifiMenu) wifiMenu.classList.remove('active');
    }
    if (!e.target.closest('.volume-menu') && !e.target.closest('.tray-icon')) {
        const volumeMenu = document.getElementById('volume-menu');
        if (volumeMenu) volumeMenu.classList.remove('active');
    }
});

// Photos App
function createPhotos() {
    const images = [
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=400&q=80'
    ];
    return `
        <div class="photos-app" style="height: 100%; background: #111; padding: 20px; overflow-y: auto;">
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px;">
                ${images.map(src => `<img src="${src}" style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 4px; cursor: pointer; transition: 0.2s;" onclick="openImageFullScreen('${src}')">`).join('')}
            </div>
        </div>
    `;
}

function openImageFullScreen(src) {
    const viewer = document.createElement('div');
    viewer.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 100000; display: flex; align-items: center; justify-content: center; cursor: pointer;';
    viewer.innerHTML = `<img src="${src}" style="max-width: 90%; max-height: 90%; box-shadow: 0 0 30px rgba(0,0,0,0.5);">`;
    viewer.onclick = () => viewer.remove();
    document.body.appendChild(viewer);
}

function createCamera() {
    setTimeout(() => {
        const video = document.getElementById('camera-stream');
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => { video.srcObject = stream; })
                .catch(err => {
                    const errEl = document.getElementById('camera-error');
                    if (errEl) errEl.textContent = 'Camera not found or access denied.';
                });
        }
    }, 100);
    return `
        <div style="height: 100%; background: #000; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; position: relative;">
            <video id="camera-stream" autoplay style="width: 100%; height: 100%; object-fit: cover;"></video>
            <div id="camera-error" style="position: absolute; color: white; text-align: center; padding: 20px;"></div>
            <div style="position: absolute; bottom: 30px; display: flex; gap: 20px;">
                <button onclick="alert('Photo saved to Pictures!')" style="width: 60px; height: 60px; border-radius: 50%; border: 5px solid white; background: transparent; cursor: pointer;"></button>
            </div>
        </div>
    `;
}

// Calendar App
function createCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    let daysHtml = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<div class="calendar-day header">${d}</div>`).join('');
    
    for (let i = 0; i < firstDay; i++) {
        daysHtml += '<div class="calendar-day"></div>';
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === today ? 'today' : '';
        daysHtml += `<div class="calendar-day ${isToday}">${day}</div>`;
    }
    
    return `
        <div class="calendar-app">
            <div class="calendar-header">
                <button onclick="changeMonth(-1)" style="padding: 8px 16px; cursor: pointer;">←</button>
                <h2>${monthNames[month]} ${year}</h2>
                <button onclick="changeMonth(1)" style="padding: 8px 16px; cursor: pointer;">→</button>
            </div>
            <div class="calendar-grid">
                ${daysHtml}
            </div>
        </div>
    `;
}

// Clock App
function createClockApp() {
    setTimeout(() => {
        updateClockApp();
        setInterval(updateClockApp, 1000);
    }, 100);
    
    return `
        <div class="clock-app">
            <div class="clock-display" id="clock-app-time">00:00:00</div>
            <div class="clock-date" id="clock-app-date">Loading...</div>
        </div>
    `;
}

function updateClockApp() {
    const now = new Date();
    const timeEl = document.getElementById('clock-app-time');
    const dateEl = document.getElementById('clock-app-date');
    if (timeEl) timeEl.textContent = now.toLocaleTimeString();
    if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// Maps App
function createMaps() {
    return `
        <div class="maps-app">
            <div class="maps-search">
                <input type="text" placeholder="Search for a place...">
            </div>
            <div class="maps-content">🗺️</div>
        </div>
    `;
}

// Microsoft Store App
function createMusicPlayer() {
    return `
        <div style="padding: 20px; background: #111; color: white; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <div style="font-size: 80px; margin-bottom: 20px;">🎵</div>
            <h3>Now Playing</h3>
            <p style="color: #888;">Windows 10 Remix.mp3</p>
            <div style="width: 100%; height: 4px; background: #333; margin: 20px 0; border-radius: 2px;">
                <div style="width: 45%; height: 100%; background: #0078d4; border-radius: 2px;"></div>
            </div>
            <div style="display: flex; gap: 20px; font-size: 24px;">
                <span>⏮️</span>
                <span style="font-size: 32px;">⏸️</span>
                <span>⏭️</span>
            </div>
        </div>
    `;
}

function createSolitaire() {
    return `
        <div style="padding: 20px; background: #0e4e2c; height: 100%; color: white;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                <div>Score: 1250</div>
                <div>Time: 04:23</div>
            </div>
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <div style="width: 80px; height: 120px; background: white; border-radius: 5px; border: 1px solid #ccc; color: red; padding: 5px;">A ❤️</div>
                <div style="width: 80px; height: 120px; background: white; border-radius: 5px; border: 1px solid #ccc; color: black; padding: 5px;">K ♠️</div>
                <div style="width: 80px; height: 120px; background: white; border-radius: 5px; border: 1px solid #ccc; color: red; padding: 5px;">Q ♦️</div>
                <div style="width: 80px; height: 120px; background: white; border-radius: 5px; border: 1px solid #ccc; color: black; padding: 5px;">J ♣️</div>
            </div>
            <div style="margin-top: 50px; text-align: center; opacity: 0.5;">[ Game in Progress ]</div>
        </div>
    `;
}

// Weather App
function createStore() {
    const apps = [
        { icon: '🎮', name: 'Xbox', rating: '★★★★☆' },
        { icon: '🎵', name: 'Spotify', rating: '★★★★★' },
        { icon: '📺', name: 'Netflix', rating: '★★★★☆' },
        { icon: '💬', name: 'WhatsApp', rating: '★★★★☆' },
        { icon: '📷', name: 'Instagram', rating: '★★★★☆' },
        { icon: '🎥', name: 'TikTok', rating: '★★★★☆' },
        { icon: '📝', name: 'OneNote', rating: '★★★★☆' },
        { icon: '🎨', name: 'Canva', rating: '★★★★★' },
        { icon: '🔐', name: '1Password', rating: '★★★★★' }
    ];
    
    return `
        <div class="store-app">
            <div class="store-header">
                <h1>🛍️ Microsoft Store</h1>
                <p>Discover apps, games, and more</p>
            </div>
            <div class="store-apps">
                ${apps.map(app => `
                    <div class="store-app-item">
                        <div class="store-app-icon">${app.icon}</div>
                        <div class="store-app-name">${app.name}</div>
                        <div class="store-app-rating">${app.rating}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// WiFi Settings App
// Night Light
function toggleNightLight(el) {
    el.classList.toggle('active');
    const overlay = document.getElementById('night-light-overlay');
    if (overlay) overlay.classList.toggle('active');
    playSound('notification');
}

// Brightness control
function changeBrightness(value) {
    document.getElementById('brightness-value').textContent = value + '%';
    document.body.style.filter = `brightness(${value / 100})`;
}

// Focus Assist
function toggleFocusAssist(el) {
    el.classList.toggle('active');
    document.body.classList.toggle('focus-assist-active');
    playSound('notification');
}

// Clear notifications
function clearNotifications() {
    const list = document.getElementById('notification-list');
    if (list) {
        list.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No new notifications</p>';
    }
}

// Battery popup
function toggleBatteryPopup() {
    const popup = document.getElementById('battery-popup');
    const wifiMenu = document.getElementById('wifi-menu');
    const volumeMenu = document.getElementById('volume-menu');
    if (wifiMenu) wifiMenu.classList.remove('active');
    if (volumeMenu) volumeMenu.classList.remove('active');
    if (popup) popup.classList.toggle('active');
}

// Close battery popup when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.battery-popup') && !e.target.closest('.tray-icon[onclick*="Battery"]')) {
        const popup = document.getElementById('battery-popup');
        if (popup) popup.classList.remove('active');
    }
});

// Loading cursor effect when opening apps
function showLoadingCursor() {
    document.body.classList.add('loading-cursor');
    setTimeout(() => document.body.classList.remove('loading-cursor'), 500);
}

// Add notification dynamically
function addNotification(icon, title, body) {
    const list = document.getElementById('notification-list');
    if (list) {
        const noNotif = list.querySelector('p');
        if (noNotif) noNotif.remove();
        
        const notif = document.createElement('div');
        notif.className = 'notification';
        notif.onclick = () => notif.remove();
        notif.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-text">
                <div class="notification-title">${title}</div>
                <div class="notification-body">${body}</div>
                <div class="notification-time">Just now</div>
            </div>
        `;
        list.insertBefore(notif, list.firstChild);
        playSound('notification');
    }
}

// Random notifications every 30 seconds
setInterval(() => {
    const notifications = [
        { icon: '📧', title: 'Mail', body: 'New message from John Doe' },
        { icon: '🔔', title: 'Reminder', body: 'Meeting in 15 minutes' },
        { icon: '💬', title: 'Teams', body: 'Sarah: Are you available?' },
        { icon: '📅', title: 'Calendar', body: 'Event starting soon' },
        { icon: '⬇️', title: 'Downloads', body: 'Download complete' }
    ];
    const random = notifications[Math.floor(Math.random() * notifications.length)];
    if (document.getElementById('screen-desktop')?.classList.contains('active')) {
        addNotification(random.icon, random.title, random.body);
    }
}, 60000);

function setSettingsBrightness(value) {
    document.getElementById('settings-brightness-val').textContent = value + '%';
    document.body.style.filter = `brightness(${value / 100})`;
}

function toggleSettingsNightLight(checked) {
    const overlay = document.getElementById('night-light-overlay');
    if (overlay) {
        if (checked) overlay.classList.add('active');
        else overlay.classList.remove('active');
    }
}

function setWallpaper(type, el) {
    currentWallpaper = type;
    const desktop = document.querySelector('.desktop');
    const wallpapers = {
        gradient1: 'linear-gradient(135deg, #667eea, #764ba2)',
        gradient2: 'linear-gradient(135deg, #11998e, #38ef7d)',
        gradient3: 'linear-gradient(135deg, #ee0979, #ff6a00)',
        gradient4: 'linear-gradient(135deg, #2193b0, #6dd5ed)',
        solid1: '#0078d4',
        solid2: '#1a1a2e',
        solid3: '#16213e',
        nature: 'linear-gradient(to bottom, #87ceeb, #228b22)'
    };
    if (desktop) {
        desktop.style.background = wallpapers[type];
        desktop.style.backgroundSize = 'cover';
    }
    document.querySelectorAll('.wallpaper-option').forEach(w => w.style.border = '3px solid transparent');
    if (el) el.style.border = '3px solid #0078d4';
    playSound('notification');
}

function setCustomWallpaper() {
    const urlInput = document.getElementById('custom-wallpaper-url');
    const url = urlInput.value.trim();
    
    if (!url) {
        alert('Please enter an image URL');
        return;
    }
    
    const desktop = document.querySelector('.desktop');
    if (desktop) {
        desktop.style.background = `url('${url}') center/cover no-repeat`;
        currentWallpaper = 'custom';
        
        const preview = document.getElementById('wallpaper-preview');
        const previewImg = document.getElementById('wallpaper-preview-img');
        if (preview && previewImg) {
            previewImg.src = url;
            preview.style.display = 'block';
        }
        
        document.querySelectorAll('.wallpaper-option').forEach(w => w.style.border = '3px solid transparent');
        playSound('notification');
    }
}

function updateUsername() {
    const newUsername = document.getElementById('edit-username').value.trim();
    if (newUsername && newUsername.length >= 2) {
        userData.username = newUsername;
        users[currentUserIndex].username = newUsername;
        
        const displayUsername = document.getElementById('display-username');
        if (displayUsername) displayUsername.textContent = newUsername;
        
        const loginUsername = document.getElementById('login-username');
        if (loginUsername) loginUsername.textContent = newUsername;
        
        const lockUsername = document.querySelector('.lock-username');
        if (lockUsername) lockUsername.textContent = newUsername;
        
        document.querySelectorAll('.start-user-name').forEach(el => el.textContent = newUsername);
        
        saveUsers();
        playSound('notification');
        alert('Username updated successfully!');
    } else {
        alert('Username must be at least 2 characters');
    }
}

function saveUsers() {
    localStorage.setItem('windowsUsers', JSON.stringify(users));
}

function createNewUser() {
    const name = prompt('Enter new username:');
    if (!name) return;
    const password = prompt('Enter password:');
    
    const newUser = {
        username: name,
        password: password || '',
        email: '',
        avatar: '👤',
        avatarColor: '#' + Math.floor(Math.random()*16777215).toString(16),
        accountType: 'local'
    };
    
    users.push(newUser);
    saveUsers();
    alert('User created! You can switch from the login screen.');
    renderUserList();
}

function renderUserList() {
    const container = document.getElementById('login-user-list');
    if (!container) return;
    
    container.innerHTML = users.map((user, index) => `
        <div class="user-item ${index === currentUserIndex ? 'active' : ''}" onclick="selectLoginUser(${index})">
            <div class="user-avatar-small" style="background: ${user.avatarColor}">${user.avatar}</div>
            <div class="user-name-small">${user.username}</div>
        </div>
    `).join('');
}

function selectLoginUser(index) {
    currentUserIndex = index;
    userData = users[index];
    document.getElementById('login-username').textContent = userData.username;
    const loginAvatar = document.getElementById('login-avatar-container');
    if (loginAvatar) {
        if (userData.avatarUrl) {
            loginAvatar.innerHTML = '';
            loginAvatar.style.background = `url('${userData.avatarUrl}') center/cover no-repeat`;
        } else {
            loginAvatar.style.background = userData.avatarColor || '#0078d4';
            loginAvatar.innerHTML = userData.avatar || '👤';
        }
    }
    renderUserList();
}

function setAvatar(emoji, color) {
    userData.avatar = emoji;
    userData.avatarColor = color;
    users[currentUserIndex].avatar = emoji;
    users[currentUserIndex].avatarColor = color;
    
    const accountAvatar = document.getElementById('account-avatar');
    if (accountAvatar) {
        accountAvatar.innerHTML = emoji;
        accountAvatar.style.background = color;
    }
    
    document.querySelectorAll('.start-user-avatar').forEach(el => {
        el.innerHTML = emoji;
        el.style.background = color;
    });
    
    const lockAvatar = document.querySelector('.lock-avatar');
    if (lockAvatar) {
        lockAvatar.innerHTML = emoji;
        lockAvatar.style.background = color;
    }
    
    saveUsers();
    playSound('notification');
}

function setCustomAvatar() {
    const url = document.getElementById('custom-avatar-url').value.trim();
    if (!url) {
        alert('Please enter an image URL');
        return;
    }
    
    userData.avatar = '';
    userData.avatarUrl = url;
    users[currentUserIndex].avatarUrl = url;
    
    const avatarStyle = `background: url('${url}') center/cover no-repeat;`;
    
    const accountAvatar = document.getElementById('account-avatar');
    if (accountAvatar) {
        accountAvatar.innerHTML = '';
        accountAvatar.style.cssText = `width: 100px; height: 100px; border-radius: 50%; ${avatarStyle} border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.15);`;
    }
    
    saveUsers();
    playSound('notification');
}

function changeAvatar() {
    const avatars = ['👤', '😊', '🎮', '🎨', '💻', '🚀', '🌟', '🐱', '🦊', '🐶'];
    const colors = ['#0078d4', '#4caf50', '#9c27b0', '#ff5722', '#607d8b', '#e91e63', '#ffc107', '#795548', '#ff9800', '#3f51b5'];
    const randomIndex = Math.floor(Math.random() * avatars.length);
    setAvatar(avatars[randomIndex], colors[randomIndex]);
}

function setAccentColor(color, el) {
    accentColor = color;
    document.documentElement.style.setProperty('--accent-color', color);
    document.querySelectorAll('.start-button, .calc-btn.equals, button[style*="0078d4"]').forEach(btn => {
        if (btn.style.background) btn.style.background = color;
    });
    playSound('notification');
}

function toggleTransparency(enabled) {
    if (enabled) {
        document.querySelectorAll('.window, .start-menu, .notification-center').forEach(el => {
            el.style.backdropFilter = 'blur(10px)';
        });
    } else {
        document.querySelectorAll('.window, .start-menu, .notification-center').forEach(el => {
            el.style.backdropFilter = 'none';
        });
    }
}

function uninstallApp(appName, btn) {
    btn.textContent = 'Uninstalling...';
    btn.disabled = true;
    setTimeout(() => {
        btn.closest('.setting-item').style.opacity = '0.5';
        btn.textContent = 'Uninstalled';
        playSound('notification');
    }, 1500);
}

function checkForUpdates(btn) {
    btn.textContent = 'Checking...';
    btn.disabled = true;
    setTimeout(() => {
        btn.textContent = 'Up to date ✓';
        btn.style.background = '#107c10';
        playSound('notification');
    }, 2000);
}

function runQuickScan() {
    openApp('defender');
}

function createDefender() {
    return `
        <div style="height: 100%; background: #f5f5f5; padding: 20px; overflow-y: auto;">
            <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
                <span style="font-size: 48px;">🛡️</span>
                <div>
                    <h2 style="margin: 0;">Windows Security</h2>
                    <p style="color: #666; margin: 4px 0;">Your device is being protected</p>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #107c10;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <span style="font-size: 24px;">🛡️</span>
                        <strong>Virus & threat protection</strong>
                    </div>
                    <p style="color: #107c10; margin: 0;">✓ No threats found</p>
                    <button onclick="startScan(this)" style="margin-top: 12px; padding: 8px 16px; background: #0078d4; color: white; border: none; border-radius: 4px; cursor: pointer;">Quick scan</button>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #107c10;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <span style="font-size: 24px;">🔥</span>
                        <strong>Firewall & network</strong>
                    </div>
                    <p style="color: #107c10; margin: 0;">✓ Firewall is on</p>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #107c10;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <span style="font-size: 24px;">🌐</span>
                        <strong>App & browser control</strong>
                    </div>
                    <p style="color: #107c10; margin: 0;">✓ Protected</p>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #107c10;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <span style="font-size: 24px;">💻</span>
                        <strong>Device security</strong>
                    </div>
                    <p style="color: #107c10; margin: 0;">✓ Standard hardware security</p>
                </div>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 16px;">
                <h3>Recent scans</h3>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee;">
                    <span>Quick scan</span>
                    <span style="color: #666;">Today at ${new Date().toLocaleTimeString()}</span>
                    <span style="color: #107c10;">No threats</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee;">
                    <span>Full scan</span>
                    <span style="color: #666;">Yesterday</span>
                    <span style="color: #107c10;">No threats</span>
                </div>
            </div>
        </div>
    `;
}

function startScan(btn) {
    const originalText = btn.textContent;
    btn.textContent = 'Scanning...';
    btn.disabled = true;
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            clearInterval(interval);
            btn.textContent = 'No threats found ✓';
            btn.style.background = '#107c10';
            playSound('notification');
        } else {
            btn.textContent = `Scanning... ${Math.floor(progress)}%`;
        }
    }, 300);
}

let ransomTimerInterval;

function downloadRansomware() {
    playSound('error');
    
    const downloadPopup = document.createElement('div');
    downloadPopup.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); z-index: 100000; text-align: center;';
    downloadPopup.innerHTML = `
        <h3 style="margin-bottom: 16px;">⬇️ Downloading Ransomware.exe...</h3>
        <div style="width: 300px; height: 20px; background: #e0e0e0; border-radius: 10px; overflow: hidden;">
            <div id="ransom-download-progress" style="width: 0%; height: 100%; background: linear-gradient(90deg, #ff0000, #ff6600); transition: width 0.1s;"></div>
        </div>
        <p id="ransom-download-text" style="margin-top: 12px; color: #666;">0% - Starting download...</p>
    `;
    document.body.appendChild(downloadPopup);
    
    let progress = 0;
    const downloadInterval = setInterval(() => {
        progress += Math.random() * 8;
        if (progress >= 100) {
            progress = 100;
            clearInterval(downloadInterval);
            document.getElementById('ransom-download-text').textContent = '100% - Running executable...';
            
            setTimeout(() => {
                downloadPopup.remove();
                activateRansomware();
            }, 1000);
        }
        document.getElementById('ransom-download-progress').style.width = progress + '%';
        document.getElementById('ransom-download-text').textContent = Math.floor(progress) + '% - Downloading...';
    }, 100);
}

function activateRansomware() {
    playSound('error');
    showScreen('screen-ransomware');
    
    let timeLeft = 1 * 25;
    ransomTimerInterval = setInterval(() => {
        timeLeft--;
        const hours = Math.floor(timeLeft / 3600);
        const mins = Math.floor((timeLeft % 3600) / 60);
        const secs = timeLeft % 60;
        const timerEl = document.getElementById('ransom-timer');
        if (timerEl) {
            timerEl.textContent = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

function decryptFiles() {
    clearInterval(ransomTimerInterval);
    const content = document.querySelector('.ransomware-content');
    if (content) {
        content.innerHTML = `
            <div style="font-size: 80px; margin-bottom: 20px;">✅</div>
            <h2 style="color: #00ff00;">Payment Received!</h2>
            <p>Just kidding! This was a simulation.</p>
            <p>Never pay ransomware attackers in real life!</p>
            <p style="margin-top: 20px;">Tips to stay safe:</p>
            <ul style="text-align: left; margin: 20px auto; max-width: 400px;">
                <li>Keep regular backups</li>
                <li>Don't click suspicious links</li>
                <li>Keep your software updated</li>
                <li>Use antivirus software</li>
            </ul>
            <button onclick="closeRansomware()" style="padding: 14px 28px; background: #00cc00; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; margin-top: 20px;">Return to Desktop</button>
        `;
    }
    playSound('notification');
}

function closeRansomware() {
    clearInterval(ransomTimerInterval);
    showScreen('screen-desktop');
    playSound('startup');
}

function downloadFreeGames() {
    playSound('error');
    triggerBSOD();
}

function triggerBSOD() {
    showScreen('screen-bsod');
    
    let percent = 0;
    const bsodInterval = setInterval(() => {
        percent += Math.random() * 3;
        if (percent >= 100) {
            percent = 100;
            clearInterval(bsodInterval);
            setTimeout(() => {
                showScreen('screen-boot');
                setTimeout(() => {
                    showScreen('screen-lock');
                    playSound('startup');
                }, 3000);
            }, 2000);
        }
        const percentEl = document.getElementById('bsod-percent');
        if (percentEl) percentEl.textContent = Math.floor(percent);
    }, 200);
}

function showVirusAlert() {
    playSound('error');
    const alert = document.createElement('div');
    alert.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: linear-gradient(135deg, #ff0000, #cc0000); color: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 40px rgba(255,0,0,0.5); z-index: 100000; text-align: center; animation: shake 0.5s infinite;';
    alert.innerHTML = `
        <style>@keyframes shake { 0%, 100% { transform: translate(-50%, -50%) rotate(0deg); } 25% { transform: translate(-50%, -50%) rotate(-2deg); } 75% { transform: translate(-50%, -50%) rotate(2deg); } }</style>
        <div style="font-size: 60px; margin-bottom: 16px;">⚠️🦠⚠️</div>
        <h2>VIRUS DETECTED!</h2>
        <p>Your computer has been infected with 47 viruses!</p>
        <p style="font-size: 12px; opacity: 0.8; margin-top: 16px;">(This is fake, don't worry)</p>
        <button onclick="this.parentElement.remove(); playSound('notification');" style="margin-top: 20px; padding: 12px 24px; background: white; color: #cc0000; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Close</button>
    `;
    document.body.appendChild(alert);
}

// ═══════════════════════════════════════════════════════════════════════════
// NETWORK & INTERNET — full multi-tab settings
// ═══════════════════════════════════════════════════════════════════════════
let _wifiTab = 'status';
let _wifiAvailable = [
    { name:'Home_WiFi_5G',     bars:4, secure:true,  connected:true,  speed:'1.2 Gbps', freq:'5 GHz' },
    { name:'Home_WiFi_2.4G',   bars:4, secure:true,  connected:false, speed:'150 Mbps', freq:'2.4 GHz' },
    { name:'Neighbors_Network',bars:3, secure:true,  connected:false, speed:'80 Mbps',  freq:'5 GHz' },
    { name:'Coffee_Shop_Free', bars:3, secure:false, connected:false, speed:'30 Mbps',  freq:'2.4 GHz' },
    { name:'Office_Guest',     bars:2, secure:true,  connected:false, speed:'50 Mbps',  freq:'5 GHz' },
    { name:'TP-Link_5G',       bars:1, secure:true,  connected:false, speed:'?',        freq:'5 GHz' }
];
let _vpnList = [
    { name:'Work VPN',        host:'vpn.company.com',     type:'L2TP/IPsec', connected:false },
    { name:'Personal NordVPN',host:'us-server-3242',      type:'OpenVPN',    connected:true },
    { name:'Home OpenVPN',    host:'home.example.com',    type:'OpenVPN',    connected:false }
];

function createWifiSettings() {
    setTimeout(renderWifiTab, 50);
    return `
        <div style="height:100%;display:flex;background:#f5f5f5;">
            <div style="width:230px;background:white;border-right:1px solid #e0e0e0;padding:14px 0;overflow-y:auto;">
                <h2 style="padding:0 18px 14px;font-weight:400;font-size:18px;margin:0;">🌐 Network &amp; Internet</h2>
                ${[
                    ['status','📊 Status'],
                    ['wifi','📶 Wi-Fi'],
                    ['ethernet','🔌 Ethernet'],
                    ['dialup','☎️ Dial-up'],
                    ['vpn','🔐 VPN'],
                    ['airplane','✈️ Airplane mode'],
                    ['hotspot','📡 Mobile hotspot'],
                    ['data','📈 Data usage'],
                    ['proxy','🛡️ Proxy'],
                    ['advanced','⚙️ Advanced']
                ].map(([id,lbl]) => `<div onclick="wifiSwitchTab('${id}')" id="wifi-tab-${id}" style="padding:10px 18px;cursor:pointer;font-size:13px;border-left:3px solid transparent;${_wifiTab===id?'background:#e3f2fd;border-left-color:#0078d4;font-weight:500;':''}" onmouseover="if(_wifiTab!=='${id}') this.style.background='#f5f5f5'" onmouseout="if(_wifiTab!=='${id}') this.style.background='transparent'">${lbl}</div>`).join('')}
            </div>
            <div id="wifi-tab-content" style="flex:1;overflow-y:auto;padding:24px;background:white;"></div>
        </div>
    `;
}

function wifiSwitchTab(tab) { _wifiTab = tab; renderWifiTab(); }

function renderWifiTab() {
    const el = document.getElementById('wifi-tab-content');
    if (!el) return;
    document.querySelectorAll('[id^="wifi-tab-"]').forEach(n => {
        if (n.id === 'wifi-tab-content') return;
        const id = n.id.replace('wifi-tab-','');
        if (id === _wifiTab) { n.style.background = '#e3f2fd'; n.style.borderLeftColor = '#0078d4'; n.style.fontWeight = '500'; }
        else { n.style.background = 'transparent'; n.style.borderLeftColor = 'transparent'; n.style.fontWeight = '400'; }
    });
    const connected = _wifiAvailable.find(w => w.connected);
    const tabs = {
        status: () => `<h2 style="font-weight:400;margin-bottom:18px;">📊 Network status</h2>
            <div style="background:linear-gradient(135deg,#0078d4,#00bcf2);color:white;padding:24px;border-radius:10px;margin-bottom:20px;">
                <div style="font-size:64px;margin-bottom:10px;">🌐</div>
                <div style="font-size:18px;font-weight:500;">${connected ? connected.name : 'Not connected'}</div>
                <div style="opacity:.85;font-size:13px;margin-top:4px;">You're connected to the Internet • Public network</div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;">
                ${[
                    ['IPv4 address','192.168.1.142'],
                    ['IPv6 address','fe80::a4f7:9b21:3c8e:d2f4'],
                    ['Default gateway','192.168.1.1'],
                    ['DNS servers','1.1.1.1, 8.8.8.8'],
                    ['MAC address','3C:6A:A7:B5:F2:91'],
                    ['DHCP enabled','Yes'],
                    ['Link speed (Receive/Transmit)','866/866 (Mbps)'],
                    ['Signal quality','Excellent (5/5)']
                ].map(([k,v]) => `<div style="background:#f5f5f5;padding:12px 14px;border-radius:6px;"><div style="color:#666;font-size:11px;text-transform:uppercase;letter-spacing:.5px;">${k}</div><div style="font-weight:500;font-size:14px;margin-top:2px;">${v}</div></div>`).join('')}
            </div>
            <h3 style="margin:20px 0 10px;">Properties</h3>
            ${settingsToggle('Set as metered connection', 'Some apps may use less data', false)}
            ${settingsToggle('Random hardware addresses', 'Make harder to track', false)}
            <div style="margin-top:14px;display:flex;gap:10px;">
                <button onclick="alert('Network would be reset')" style="padding:10px 18px;background:#0078d4;color:white;border:none;border-radius:4px;cursor:pointer;">Reset network</button>
                <button onclick="alert('Connection diagnosed: All systems normal')" style="padding:10px 18px;background:#f0f0f0;color:#333;border:1px solid #ccc;border-radius:4px;cursor:pointer;">Network troubleshooter</button>
            </div>`,
        wifi: () => `<h2 style="font-weight:400;margin-bottom:18px;">📶 Wi-Fi</h2>
            <div style="background:#f5f5f5;padding:18px;border-radius:8px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center;">
                <div><div style="font-weight:500;font-size:15px;">Wi-Fi</div><div style="color:#666;font-size:13px;margin-top:2px;">${connected ? 'Connected to '+connected.name : 'Not connected'}</div></div>
                <label class="toggle-switch"><input type="checkbox" checked><span class="toggle-slider"></span></label>
            </div>
            <h3 style="margin-bottom:10px;">Available networks</h3>
            <div style="border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
                ${_wifiAvailable.map((n,i) => `<div onclick="wifiConnectTo(${i})" style="padding:12px 16px;border-bottom:${i<_wifiAvailable.length-1?'1px solid #e0e0e0':'none'};cursor:pointer;display:flex;align-items:center;gap:12px;${n.connected?'background:#e3f2fd;':''}" onmouseover="if(!${n.connected}) this.style.background='#f5f5f5'" onmouseout="if(!${n.connected}) this.style.background='white'">
                    <span style="display:inline-flex;gap:2px;align-items:flex-end;height:18px;">
                        <span style="width:3px;height:5px;background:#333;${n.bars>=1?'':'opacity:.25'}"></span>
                        <span style="width:3px;height:9px;background:#333;${n.bars>=2?'':'opacity:.25'}"></span>
                        <span style="width:3px;height:13px;background:#333;${n.bars>=3?'':'opacity:.25'}"></span>
                        <span style="width:3px;height:18px;background:#333;${n.bars>=4?'':'opacity:.25'}"></span>
                    </span>
                    <div style="flex:1;"><div><strong>${n.name}</strong> ${n.connected?'<span style="color:#107c10">— Connected, secured</span>':''}</div><div style="font-size:12px;color:#666;">${n.freq} • ${n.speed} • ${n.secure?'🔒 Secured':'Open'}</div></div>
                </div>`).join('')}
            </div>
            <div style="margin-top:14px;">${settingsToggle('Connect automatically when in range','Reconnect to known networks',true)}</div>
            ${settingsToggle('Show available networks in taskbar','Quick Wi-Fi access',true)}
            <button onclick="alert('Manage known networks dialog would open')" style="padding:10px 18px;background:#f0f0f0;color:#333;border:1px solid #ccc;border-radius:4px;cursor:pointer;margin-top:14px;">Manage known networks</button>`,
        ethernet: () => `<h2 style="font-weight:400;margin-bottom:18px;">🔌 Ethernet</h2>
            <div style="background:#f5f5f5;padding:18px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
                <div><div style="font-weight:500;font-size:15px;">Ethernet</div><div style="color:#666;font-size:13px;">Realtek PCIe GbE — No cable connected</div></div>
                <span style="padding:4px 12px;background:#fbe9e7;color:#bf360c;border-radius:12px;font-size:12px;">Disconnected</span>
            </div>
            <h3 style="margin:18px 0 10px;">Related settings</h3>
            <button onclick="alert('Adapter properties dialog')" style="padding:10px 18px;background:#f0f0f0;color:#333;border:1px solid #ccc;border-radius:4px;cursor:pointer;margin-right:8px;">Change adapter options</button>
            <button onclick="alert('Sharing center')" style="padding:10px 18px;background:#f0f0f0;color:#333;border:1px solid #ccc;border-radius:4px;cursor:pointer;">Network and Sharing Center</button>`,
        dialup: () => `<h2 style="font-weight:400;margin-bottom:18px;">☎️ Dial-up</h2>
            <p style="color:#666;margin-bottom:14px;">Set up a dial-up connection</p>
            <div style="background:#f5f5f5;padding:24px;border-radius:8px;text-align:center;color:#666;">
                <div style="font-size:48px;margin-bottom:10px;">📞</div>
                <p>You don't have any dial-up connections yet.</p>
                <button onclick="alert('Set up a new connection wizard')" style="padding:10px 20px;background:#0078d4;color:white;border:none;border-radius:4px;cursor:pointer;margin-top:14px;">Set up a new connection</button>
            </div>`,
        vpn: () => `<h2 style="font-weight:400;margin-bottom:18px;">🔐 VPN</h2>
            <button onclick="alert('Add VPN connection wizard')" style="padding:10px 18px;background:#0078d4;color:white;border:none;border-radius:4px;cursor:pointer;margin-bottom:18px;">+ Add a VPN connection</button>
            ${_vpnList.map((v,i) => `<div style="background:#f5f5f5;padding:14px;border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                <div><div style="font-weight:500;">🔐 ${v.name}</div><div style="font-size:12px;color:#666;">${v.type} • ${v.host}</div></div>
                <button onclick="_vpnList[${i}].connected=!_vpnList[${i}].connected; renderWifiTab();" style="padding:6px 14px;background:${v.connected?'#107c10':'#0078d4'};color:white;border:none;border-radius:4px;cursor:pointer;font-size:13px;">${v.connected?'✓ Connected':'Connect'}</button>
            </div>`).join('')}
            <h3 style="margin:18px 0 10px;">Advanced options</h3>
            ${settingsToggle('Allow VPN over metered networks','Use VPN even when on cellular',true)}
            ${settingsToggle('Allow VPN while roaming','Use VPN when traveling',false)}`,
        airplane: () => `<h2 style="font-weight:400;margin-bottom:18px;">✈️ Airplane mode</h2>
            <div style="background:#f5f5f5;padding:18px;border-radius:8px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;">
                <div><div style="font-weight:500;font-size:15px;">Airplane mode</div><div style="color:#666;font-size:13px;">Stops all wireless communication</div></div>
                <label class="toggle-switch"><input type="checkbox"><span class="toggle-slider"></span></label>
            </div>
            <h3 style="margin:14px 0 10px;">Wireless devices</h3>
            ${settingsToggle('Wi-Fi','',true)}
            ${settingsToggle('Bluetooth','',true)}
            ${settingsToggle('Cellular','No SIM detected',false)}
            ${settingsToggle('GPS','Use location services',true)}
            ${settingsToggle('NFC','Near field communication',false)}`,
        hotspot: () => `<h2 style="font-weight:400;margin-bottom:18px;">📡 Mobile hotspot</h2>
            <div style="background:#f5f5f5;padding:18px;border-radius:8px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;">
                <div><div style="font-weight:500;">Share my Internet connection with other devices</div></div>
                <label class="toggle-switch"><input type="checkbox"><span class="toggle-slider"></span></label>
            </div>
            <div class="setting-item"><div><div class="setting-label">Share over</div><div class="setting-description">Choose how to share your connection</div></div>
                <select style="padding:8px;border-radius:4px;border:1px solid #ccc;"><option>Wi-Fi</option><option>Bluetooth</option></select></div>
            <div class="setting-item"><div><div class="setting-label">Network name</div><div class="setting-description">DESKTOP-${(userData.username||'WIN10').toUpperCase().slice(0,8)} 2354</div></div>
                <button onclick="alert('Edit hotspot details')" style="padding:6px 14px;background:#f0f0f0;color:#333;border:1px solid #ccc;border-radius:4px;cursor:pointer;">Edit</button></div>
            <div class="setting-item"><div><div class="setting-label">Network band</div><div class="setting-description">Choose 5GHz or 2.4GHz</div></div>
                <select style="padding:8px;border-radius:4px;border:1px solid #ccc;"><option>Any available</option><option>5 GHz</option><option>2.4 GHz</option></select></div>
            ${settingsToggle('Power saving','Turn off hotspot when no devices connected',true)}
            ${settingsToggle('Turn on remotely','Activate via Bluetooth from paired devices',false)}
            <h3 style="margin:14px 0 10px;">Connected devices: 0 of 8</h3>
            <p style="color:#666;font-size:13px;">No devices currently connected.</p>`,
        data: () => `<h2 style="font-weight:400;margin-bottom:18px;">📈 Data usage</h2>
            <div style="background:linear-gradient(135deg,#0078d4,#00bcf2);color:white;padding:24px;border-radius:10px;margin-bottom:18px;">
                <div style="opacity:.85;font-size:13px;">This month (Wi-Fi)</div>
                <div style="font-size:36px;font-weight:300;margin:6px 0;">24.6 GB</div>
                <div style="opacity:.85;font-size:13px;">of 100 GB limit</div>
                <div style="height:8px;background:rgba(255,255,255,.25);border-radius:4px;margin-top:12px;overflow:hidden;"><div style="width:24.6%;height:100%;background:white;"></div></div>
            </div>
            <h3 style="margin:14px 0 10px;">Usage by app</h3>
            ${[
                ['Microsoft Edge','🌐',6.2],['YouTube','▶️',5.4],['Discord','💬',2.8],
                ['Spotify','🎵',2.1],['Steam','🎮',1.9],['Windows Update','🔄',1.6],
                ['OneDrive','☁️',1.4],['Mail','📧',0.9],['Other','📦',2.3]
            ].map(([n,i,gb]) => `<div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #f0f0f0;">
                <span style="font-size:20px;">${i}</span>
                <div style="flex:1;"><div style="font-size:13px;">${n}</div><div style="height:6px;background:#e0e0e0;border-radius:3px;margin-top:4px;overflow:hidden;"><div style="width:${gb*4}%;max-width:100%;height:100%;background:#0078d4;"></div></div></div>
                <div style="font-size:13px;color:#666;font-weight:500;">${gb} GB</div>
            </div>`).join('')}
            <button onclick="alert('Data limit set')" style="padding:10px 18px;background:#0078d4;color:white;border:none;border-radius:4px;cursor:pointer;margin-top:14px;">Enter limit</button>`,
        proxy: () => `<h2 style="font-weight:400;margin-bottom:18px;">🛡️ Proxy</h2>
            <h3 style="margin-bottom:10px;">Automatic proxy setup</h3>
            ${settingsToggle('Automatically detect settings','Best for most networks',true)}
            ${settingsToggle('Use setup script','Use a configuration script (PAC) URL',false)}
            <div style="display:flex;gap:8px;margin:8px 0 18px;">
                <input type="text" placeholder="http://proxy.example.com/proxy.pac" style="flex:1;padding:10px;border:1px solid #ccc;border-radius:4px;">
                <button onclick="alert('Proxy script saved')" style="padding:10px 18px;background:#f0f0f0;color:#333;border:1px solid #ccc;border-radius:4px;cursor:pointer;">Save</button>
            </div>
            <h3 style="margin-bottom:10px;">Manual proxy setup</h3>
            ${settingsToggle('Use a proxy server','For LAN connections',false)}
            <div style="display:grid;grid-template-columns:1fr 100px;gap:8px;margin:8px 0;">
                <input type="text" placeholder="Proxy server address" style="padding:10px;border:1px solid #ccc;border-radius:4px;">
                <input type="text" placeholder="Port" style="padding:10px;border:1px solid #ccc;border-radius:4px;">
            </div>
            <textarea placeholder="Use the proxy server except for addresses (semicolon-separated)" style="width:100%;height:60px;padding:10px;border:1px solid #ccc;border-radius:4px;"></textarea>
            ${settingsToggle("Don't use proxy server for local addresses",'',true)}`,
        advanced: () => `<h2 style="font-weight:400;margin-bottom:18px;">⚙️ Advanced network settings</h2>
            <h3 style="margin-bottom:10px;">Related settings</h3>
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
                ${[
                    ['Change adapter options','View network adapters'],
                    ['Network and Sharing Center','For network and sharing'],
                    ['Network reset','Reinstall all adapters'],
                    ['Windows Firewall','Allow apps through firewall'],
                    ['Wi-Fi calling','Make calls over Wi-Fi'],
                    ['DNS settings','Configure DNS providers']
                ].map(([t,d]) => `<div onclick="alert('${t} would open')" style="background:#f5f5f5;padding:14px;border-radius:8px;cursor:pointer;transition:.2s;" onmouseover="this.style.background='#e3f2fd'" onmouseout="this.style.background='#f5f5f5'">
                    <div style="font-weight:500;">${t}</div><div style="color:#666;font-size:12px;margin-top:4px;">${d}</div>
                </div>`).join('')}
            </div>
            <h3 style="margin:20px 0 10px;">DNS over HTTPS</h3>
            ${settingsToggle('Encrypt DNS queries','More private DNS lookups',true)}
            <div class="setting-item"><div><div class="setting-label">DNS provider</div><div class="setting-description"></div></div>
                <select style="padding:8px;border-radius:4px;border:1px solid #ccc;"><option>Cloudflare (1.1.1.1)</option><option>Google (8.8.8.8)</option><option>Quad9 (9.9.9.9)</option><option>Custom</option></select></div>`
    };
    el.innerHTML = (tabs[_wifiTab] || tabs.status)();
}

function wifiConnectTo(i) {
    _wifiAvailable.forEach(w => w.connected = false);
    _wifiAvailable[i].connected = true;
    if (typeof playSound === 'function') playSound('notification');
    renderWifiTab();
}

// ── Discord OAuth2 state management ──────────────────────────────────────────
let _discordAuthWindow = null;
let _discordPollInterval = null;

// Listen for postMessage from the success popup page
window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'discord_auth_success' && e.data.user) {
        clearInterval(_discordPollInterval);
        window._discordLoggedInUser = e.data.user;
        localStorage.setItem('discord_user_data', JSON.stringify(e.data.user));
        discordShowProfile(e.data.user);
    }
});

function discordStartOAuth() {
    localStorage.removeItem('discord_user_data');

    // Open the server-side OAuth start endpoint in a new tab (server manages state securely)
    const authUrl = '/api/auth/discord';

    _discordAuthWindow = window.open(authUrl, '_blank');

    // Show "waiting for auth" UI in Discord window
    const body = document.getElementById('discord-app-body');
    if (body) {
        body.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;padding:40px;">
          <div style="font-size:60px;margin-bottom:20px;">🔗</div>
          <h3 style="color:white;margin-bottom:8px;">Authorize in the new tab</h3>
          <p style="color:#b9bbbe;font-size:14px;margin-bottom:8px;">A new tab opened for Discord login. After you approve, it will<br>redirect you back to this app and log you in automatically.</p>
          <p style="color:#72767d;font-size:12px;margin-bottom:24px;">You can also switch back here first — login syncs automatically.</p>
          <div style="display:flex;gap:8px;">
            <button onclick="discordCheckAuth()" style="background:#5865f2;border:none;border-radius:4px;padding:10px 20px;color:white;cursor:pointer;font-size:14px;">Check Now</button>
            <button onclick="discordCancelAuth()" style="background:#4f545c;border:none;border-radius:4px;padding:10px 20px;color:white;cursor:pointer;font-size:14px;">Cancel</button>
          </div>
        </div>`;
    }

    // Poll localStorage for auth completion (the callback page will write there)
    if (_discordPollInterval) clearInterval(_discordPollInterval);
    _discordPollInterval = setInterval(discordCheckAuth, 1500);
}

function discordCheckAuth() {
    // 1. Check localStorage (written by discord-success.html)
    const data = localStorage.getItem('discord_user_data');
    if (data) {
        clearInterval(_discordPollInterval);
        _discordPollInterval = null;
        if (_discordAuthWindow && !_discordAuthWindow.closed) _discordAuthWindow.close();
        try {
            const user = JSON.parse(data);
            window._discordLoggedInUser = user;
            discordShowProfile(user);
        } catch(e) { console.error('Discord parse error:', e); }
        return;
    }
    // 2. Fallback: try server session endpoint
    fetch('/api/auth/user').then(r => r.json()).then(user => {
        if (user && user.id) {
            clearInterval(_discordPollInterval);
            _discordPollInterval = null;
            localStorage.setItem('discord_user_data', JSON.stringify(user));
            window._discordLoggedInUser = user;
            discordShowProfile(user);
        }
    }).catch(() => {});
}

function discordCancelAuth() {
    clearInterval(_discordPollInterval);
    if (_discordAuthWindow) _discordAuthWindow.close();
    const body = document.getElementById('discord-app-body');
    if (body) body.innerHTML = discordLoginPageHTML();
}

function discordLogout() {
    localStorage.removeItem('discord_user_data');
    window._discordLoggedInUser = null;
    const body = document.getElementById('discord-app-body');
    if (body) body.innerHTML = discordLoginPageHTML();
}

function discordLoginPageHTML() {
    return `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;padding:40px;background:linear-gradient(135deg,#1a1d23,#23272a);">
      <div style="width:80px;height:80px;background:linear-gradient(135deg,#5865f2,#7289da);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:40px;margin-bottom:24px;box-shadow:0 8px 32px rgba(88,101,242,0.4);">💬</div>
      <h2 style="color:white;font-size:28px;margin-bottom:8px;font-weight:700;">Welcome back!</h2>
      <p style="color:#b9bbbe;margin-bottom:32px;font-size:15px;">Connect your Discord account to get started.</p>
      <button onclick="discordStartOAuth()" style="background:#5865f2;border:none;border-radius:8px;padding:14px 40px;color:white;font-size:16px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(88,101,242,0.4);transition:transform 0.1s;" onmouseover="this.style.background='#4752c4'" onmouseout="this.style.background='#5865f2'">
        🔗 Login with Discord
      </button>
      <p style="color:#72767d;font-size:12px;margin-top:20px;">Opens in a new tab • Returns you directly to the desktop • Auto-login</p>
    </div>`;
}

function discordShowProfile(user) {
    const guilds = user.guilds || [];
    const body = document.getElementById('discord-app-body');
    if (!body) return;
    body.innerHTML = `
    <div style="display:flex;height:100%;">
      <!-- Server list sidebar -->
      <div style="width:72px;background:#202225;display:flex;flex-direction:column;align-items:center;padding:12px 0;gap:2px;overflow-y:auto;">
        <div style="width:48px;height:48px;background:linear-gradient(135deg,#5865f2,#7289da);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer;margin-bottom:8px;" title="Direct Messages">💬</div>
        <div style="width:32px;height:2px;background:#3c3f43;border-radius:1px;margin:4px 0;"></div>
        ${guilds.slice(0,8).map((g,i)=>`
        <div title="${g.name}" style="width:48px;height:48px;background:${['#3ba55d','#5865f2','#eb459e','#faa61a','#ed4245'][i%5]};border-radius:${i===0?'50%':'24px'};display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;margin:2px 0;transition:border-radius 0.2s;" onmouseover="this.style.borderRadius='12px'" onmouseout="this.style.borderRadius='${i===0?'50%':'24px'}'">
          ${g.icon && !g.icon.startsWith('https') ? g.icon : g.name.slice(0,2).toUpperCase()}
        </div>`).join('')}
        <div style="width:48px;height:48px;background:#36393f;border-radius:24px;display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer;margin-top:4px;color:#3ba55d;transition:border-radius 0.2s;" onmouseover="this.style.borderRadius='12px';this.style.background='#3ba55d';this.style.color='white'" onmouseout="this.style.borderRadius='24px';this.style.background='#36393f';this.style.color='#3ba55d'" title="Add a Server">+</div>
      </div>
      <!-- Channel sidebar -->
      <div style="width:240px;background:#2f3136;display:flex;flex-direction:column;">
        <div style="padding:16px;font-size:15px;font-weight:700;color:white;border-bottom:1px solid #202225;display:flex;align-items:center;justify-content:space-between;">
          <span>Your Server</span>
          <span style="cursor:pointer;color:#b9bbbe;">⋮</span>
        </div>
        <div style="flex:1;overflow-y:auto;padding:8px 0;">
          <div style="padding:6px 8px;font-size:11px;font-weight:600;color:#8e9297;text-transform:uppercase;letter-spacing:0.5px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;" onmouseover="this.style.color='#dcddde'" onmouseout="this.style.color='#8e9297'">
            <span>▾ Text Channels</span><span>+</span>
          </div>
          ${['# general','# announcements','# memes','# dev-talk','# off-topic'].map((c,i)=>`
          <div onclick="discordSwitchChannel(this,'${c}')" style="display:flex;align-items:center;gap:6px;padding:6px 16px;color:${i===0?'#fff':'#8e9297'};cursor:pointer;border-radius:4px;margin:0 8px;${i===0?'background:rgba(79,84,92,0.4);':''}" onmouseover="this.style.background='rgba(79,84,92,0.3)';this.style.color='#dcddde'" onmouseout="this.style.background='${i===0?'rgba(79,84,92,0.4)':'transparent'}';this.style.color='${i===0?'#fff':'#8e9297'}'">
            <span style="font-size:13px;">${c}</span>
          </div>`).join('')}
          <div style="padding:6px 8px;font-size:11px;font-weight:600;color:#8e9297;text-transform:uppercase;letter-spacing:0.5px;margin-top:8px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;" onmouseover="this.style.color='#dcddde'" onmouseout="this.style.color='#8e9297'">
            <span>▾ Voice Channels</span><span>+</span>
          </div>
          ${['🔊 General','🔊 Gaming','🔊 Music Bot'].map(c=>`
          <div style="display:flex;align-items:center;gap:6px;padding:6px 16px;color:#8e9297;cursor:pointer;border-radius:4px;margin:0 8px;" onmouseover="this.style.background='rgba(79,84,92,0.3)';this.style.color='#dcddde'" onmouseout="this.style.background='transparent';this.style.color='#8e9297'">
            <span style="font-size:13px;">${c}</span>
          </div>`).join('')}
        </div>
        <!-- User panel -->
        <div style="background:#292b2f;padding:8px 8px;display:flex;align-items:center;gap:8px;border-top:1px solid #202225;">
          <div style="position:relative;">
            <div style="width:32px;height:32px;background:linear-gradient(135deg,#5865f2,#7289da);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;">😊</div>
            <div style="position:absolute;bottom:-1px;right:-1px;width:12px;height:12px;background:#3ba55d;border-radius:50%;border:2px solid #292b2f;"></div>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:600;color:white;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${user.username}</div>
            <div style="font-size:11px;color:#b9bbbe;">#${String(user.id||'0000').slice(-4)}</div>
          </div>
          <div style="display:flex;gap:4px;">
            <button onclick="addNotification('🎤','Discord','Muted')" style="background:none;border:none;cursor:pointer;font-size:16px;color:#b9bbbe;" title="Mute">🎤</button>
            <button onclick="addNotification('🎧','Discord','Deafened')" style="background:none;border:none;cursor:pointer;font-size:16px;color:#b9bbbe;" title="Deafen">🎧</button>
            <button onclick="discordLogout()" style="background:none;border:none;cursor:pointer;font-size:16px;color:#b9bbbe;" title="Settings">⚙️</button>
          </div>
        </div>
      </div>
      <!-- Main chat area -->
      <div style="flex:1;display:flex;flex-direction:column;background:#36393f;">
        <div style="padding:12px 16px;border-bottom:1px solid #202225;display:flex;align-items:center;gap:8px;">
          <span style="color:#8e9297;font-size:18px;">#</span>
          <span style="font-weight:700;color:white;font-size:15px;">general</span>
          <span style="color:#72767d;font-size:13px;">│ Welcome to the server! 🎉</span>
          <div style="margin-left:auto;display:flex;gap:12px;color:#b9bbbe;">
            <span style="cursor:pointer;" title="Start Voice Call">📞</span>
            <span style="cursor:pointer;" title="Members">👥</span>
            <span style="cursor:pointer;" title="Search">🔍</span>
          </div>
        </div>
        <div style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px;" id="discord-chat-messages">
          ${discordGetMessages(user.username)}
        </div>
        <div style="padding:8px 16px 16px;">
          <div style="background:#40444b;border-radius:8px;padding:10px 14px;display:flex;align-items:center;gap:10px;">
            <button onclick="addNotification('📎','Discord','File picker')" style="background:none;border:none;cursor:pointer;font-size:20px;color:#b9bbbe;">+</button>
            <input id="discord-msg-input" type="text" placeholder="Message #general" style="flex:1;background:none;border:none;color:#dcddde;font-size:14px;outline:none;"
              onkeydown="if(event.key==='Enter')discordSendMsg()">
            <span style="color:#b9bbbe;cursor:pointer;font-size:18px;" onclick="addNotification('😀','Discord','Emoji picker')">😀</span>
            <span style="color:#b9bbbe;cursor:pointer;font-size:18px;" onclick="discordSendMsg()">➤</span>
          </div>
        </div>
      </div>
      <!-- Members list -->
      <div style="width:240px;background:#2f3136;overflow-y:auto;padding:16px 8px;">
        <div style="font-size:11px;font-weight:600;color:#8e9297;text-transform:uppercase;margin-bottom:8px;">Online — ${2 + guilds.length}</div>
        <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:4px;cursor:pointer;" onmouseover="this.style.background='rgba(79,84,92,0.4)'" onmouseout="this.style.background='transparent'">
          <div style="position:relative;"><div style="width:32px;height:32px;background:linear-gradient(135deg,#5865f2,#7289da);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;">😊</div><div style="position:absolute;bottom:0;right:0;width:10px;height:10px;background:#3ba55d;border-radius:50%;border:2px solid #2f3136;"></div></div>
          <div><div style="font-size:13px;color:#dcddde;font-weight:600;">${user.username}</div><div style="font-size:11px;color:#8e9297;">You</div></div>
        </div>
        ${['Alice','Bob','Carol','Dave','Eve'].map((n,i)=>`
        <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:4px;cursor:pointer;" onmouseover="this.style.background='rgba(79,84,92,0.4)'" onmouseout="this.style.background='transparent'">
          <div style="position:relative;"><div style="width:32px;height:32px;background:${['#3ba55d','#5865f2','#eb459e','#faa61a','#ed4245'][i]};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;">${n[0]}</div><div style="position:absolute;bottom:0;right:0;width:10px;height:10px;background:#3ba55d;border-radius:50%;border:2px solid #2f3136;"></div></div>
          <div><div style="font-size:13px;color:#dcddde;">${n}</div><div style="font-size:11px;color:#8e9297;">Member</div></div>
        </div>`).join('')}
        <div style="font-size:11px;font-weight:600;color:#8e9297;text-transform:uppercase;margin:12px 0 8px;">Offline — 3</div>
        ${['Frank','Grace','Henry'].map(n=>`
        <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:4px;cursor:pointer;opacity:0.5;" onmouseover="this.style.background='rgba(79,84,92,0.4)'" onmouseout="this.style.background='transparent'">
          <div style="width:32px;height:32px;background:#4f545c;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;">${n[0]}</div>
          <div style="font-size:13px;color:#dcddde;">${n}</div>
        </div>`).join('')}
      </div>
    </div>`;
}

function discordGetMessages(username) {
    const msgs = [
        {user:'Alice',color:'#3ba55d',av:'A',time:'Today at 9:00 AM',text:'Good morning everyone! 👋'},
        {user:'Bob',color:'#5865f2',av:'B',time:'Today at 9:02 AM',text:'Morning! Ready for the stream tonight?'},
        {user:'Carol',color:'#eb459e',av:'C',time:'Today at 9:05 AM',text:'Yep! Can\'t wait 🎮'},
        {user:'Dave',color:'#faa61a',av:'D',time:'Today at 9:10 AM',text:'What game are we playing? 👀'},
        {user:'Alice',color:'#3ba55d',av:'A',time:'Today at 9:11 AM',text:'Halo Infinite! Ranked matches'},
        {user:username,color:'#5865f2',av:username[0]||'?',time:'Today at 9:12 AM',text:'Count me in! 🙌',isMe:true},
    ];
    return msgs.map(m=>`
    <div style="display:flex;gap:12px;padding:2px 0;${m.isMe?'flex-direction:row-reverse;text-align:right;':''}" onmouseover="this.style.background='rgba(79,84,92,0.1)'" onmouseout="this.style.background='transparent'">
      <div style="width:40px;height:40px;background:${m.color};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;flex-shrink:0;">${m.av}</div>
      <div>
        <div style="display:flex;align-items:baseline;gap:8px;${m.isMe?'flex-direction:row-reverse;':''};margin-bottom:4px;">
          <span style="font-size:14px;font-weight:600;color:${m.color};">${m.user}</span>
          <span style="font-size:11px;color:#72767d;">${m.time}</span>
        </div>
        <div style="font-size:14px;color:#dcddde;line-height:1.4;">${m.text}</div>
      </div>
    </div>`).join('');
}

function discordSwitchChannel(el, channel) {}

function discordSendMsg() {
    const input = document.getElementById('discord-msg-input');
    const messages = document.getElementById('discord-chat-messages');
    if (!input || !messages || !input.value.trim()) return;
    const text = input.value.trim();
    const user = window._discordLoggedInUser || { username: userData?.username || 'User', id: '0' };
    input.value = '';
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;gap:12px;padding:2px 0;flex-direction:row-reverse;text-align:right;';
    div.innerHTML = `<div style="width:40px;height:40px;background:#5865f2;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;flex-shrink:0;">${(user.username||'?')[0]}</div><div><div style="display:flex;align-items:baseline;gap:8px;flex-direction:row-reverse;margin-bottom:4px;"><span style="font-size:14px;font-weight:600;color:#5865f2;">${user.username}</span><span style="font-size:11px;color:#72767d;">Just now</span></div><div style="font-size:14px;color:#dcddde;">${text}</div></div>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    const replies = ['Nice! 🔥','Sounds good!','lol 😂','💯','That\'s crazy','Let\'s goo!','Facts 🙌'];
    const names = [['Alice','#3ba55d','A'],['Bob','#5865f2','B'],['Carol','#eb459e','C']];
    const [name,color,av] = names[Math.floor(Math.random()*names.length)];
    setTimeout(() => {
        const rdiv = document.createElement('div');
        rdiv.style.cssText = 'display:flex;gap:12px;padding:2px 0;';
        rdiv.innerHTML = `<div style="width:40px;height:40px;background:${color};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;flex-shrink:0;">${av}</div><div><div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px;"><span style="font-size:14px;font-weight:600;color:${color};">${name}</span><span style="font-size:11px;color:#72767d;">Just now</span></div><div style="font-size:14px;color:#dcddde;">${replies[Math.floor(Math.random()*replies.length)]}</div></div>`;
        messages.appendChild(rdiv);
        messages.scrollTop = messages.scrollHeight;
    }, 800 + Math.random()*1200);
}

function createDiscordApp() {
    // Check for previously stored auth or URL params
    const stored = localStorage.getItem('discord_user_data');
    const urlParams = new URLSearchParams(window.location.search);
    const urlUser = urlParams.get('user');
    const urlToken = urlParams.get('discord_token');

    let loggedInUser = null;
    if (stored) {
        try { loggedInUser = JSON.parse(stored); } catch(e) {}
    } else if (urlUser && urlToken) {
        try {
            loggedInUser = JSON.parse(decodeURIComponent(urlUser));
            loggedInUser.guilds = loggedInUser.guilds || [];
            localStorage.setItem('discord_user_data', JSON.stringify(loggedInUser));
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch(e) {}
    }

    window._discordLoggedInUser = loggedInUser;

    return `<div style="height:100%;background:#36393f;" id="discord-app-body">${
        loggedInUser ? '' : discordLoginPageHTML()
    }</div>`;
}

// Called after rendering — shows profile if already logged in (localStorage or server session)
function discordInitIfLoggedIn() {
    if (window._discordLoggedInUser) {
        discordShowProfile(window._discordLoggedInUser);
        return;
    }
    // Also try server session (in case page was refreshed after OAuth)
    fetch('/api/auth/user').then(r => r.json()).then(user => {
        if (user && user.id) {
            localStorage.setItem('discord_user_data', JSON.stringify(user));
            window._discordLoggedInUser = user;
            discordShowProfile(user);
        }
    }).catch(() => {});
}

async function handleDiscordCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const returnedState = params.get('state');
    if (!code) return;
    const savedState = localStorage.getItem('discord_oauth_state');
    if (returnedState && savedState && returnedState !== savedState) {
        console.warn('Discord OAuth state mismatch — possible CSRF');
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }
    localStorage.removeItem('discord_oauth_state');
    window.history.replaceState({}, document.title, window.location.pathname);

    // Try to exchange code via our backend handler (if running)
    // The callback handler on port 3001 will redirect back with user data in URL,
    // but since we may not have that backend running, we fallback to simulation.

    // Check if URL has user data (redirected back from backend)
    const userParam = params.get('user');
    if (userParam) {
        try {
            const user = JSON.parse(decodeURIComponent(userParam));
            localStorage.setItem('discord_user_data', JSON.stringify(user));
        } catch(e) {}
        return;
    }

    // Simulate auth success (frontend-only fallback)
    const simulatedUser = {
        username: userData?.username || 'ReplitUser',
        id: Math.floor(Math.random() * 900000000000000 + 100000000000000).toString(),
        email: (userData?.email) || 'user@example.com',
        avatar: '',
        guilds: [
            { name: 'Windows 10 Sim', icon: '💻' },
            { name: 'Replit Community', icon: '🌐' },
            { name: 'Gaming Hub', icon: '🎮' },
            { name: 'Dev Server', icon: '⚡' },
        ]
    };
    localStorage.setItem('discord_user_data', JSON.stringify(simulatedUser));
}

// Handle OAuth callback code on page load
if (window.location.search.includes('code=')) {
    handleDiscordCallback();
}

function createAdvancedSettings() {
    return `
        <div style="height: 100%; background: #f5f5f5; overflow-y: auto; padding: 20px;">
            <h2 style="margin-bottom: 20px;">Advanced Settings</h2>
            
            <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <h3 style="margin-bottom: 12px; font-size: 16px;">System Performance</h3>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
                    <span>Enable Hardware Acceleration</span>
                    <label class="toggle-switch">
                        <input type="checkbox" checked>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
                    <span>Virtual Memory</span>
                    <span style="color: #666;">16 GB</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                    <span>Storage Optimization</span>
                    <button style="padding: 6px 12px; background: #0078d4; color: white; border: none; border-radius: 4px; cursor: pointer;">Run</button>
                </div>
            </div>

            <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <h3 style="margin-bottom: 12px; font-size: 16px;">Privacy & Security</h3>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
                    <span>Windows Defender</span>
                    <span style="color: #107c10;">✓ Active</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
                    <span>Firewall</span>
                    <span style="color: #107c10;">✓ On</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                    <span>App Permissions</span>
                    <button style="padding: 6px 12px; background: #0078d4; color: white; border: none; border-radius: 4px; cursor: pointer;">Manage</button>
                </div>
            </div>

            <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <h3 style="margin-bottom: 12px; font-size: 16px;">About This PC</h3>
                <div style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>OS Build:</strong> 19042.1234</div>
                <div style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Processor:</strong> Intel(R) Core(TM) i7-10700K</div>
                <div style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>RAM:</strong> 32 GB</div>
                <div style="padding: 8px 0;"><strong>Device Name:</strong> REPLIT-PC</div>
            </div>

            <div style="background: white; padding: 16px; border-radius: 8px;">
                <h3 style="margin-bottom: 12px; font-size: 16px;">Devices</h3>
                <div style="padding: 8px 0; border-bottom: 1px solid #eee;">
                    <div style="font-weight: bold; margin-bottom: 4px;">💾 Storage</div>
                    <div style="color: #666; font-size: 12px;">256 GB SSD • 178 GB free</div>
                </div>
                <div style="padding: 8px 0;">
                    <div style="font-weight: bold; margin-bottom: 4px;">🔊 Audio Devices</div>
                    <div style="color: #666; font-size: 12px;">Stereo Mix, Speakers, Microphone</div>
                </div>
            </div>
        </div>
    `;
}

function createCodeEditor() {
    return `
        <div style="height: 100%; display: flex; flex-direction: column; background: #1e1e1e;">
            <div style="background: #2d2d2d; padding: 12px; border-bottom: 1px solid #3e3e42; color: #ccc; display: flex; gap: 8px;">
                <button style="padding: 4px 8px; background: #0078d4; color: white; border: none; border-radius: 2px; cursor: pointer; font-size: 12px;">File</button>
                <button style="padding: 4px 8px; background: transparent; color: #ccc; border: none; cursor: pointer; font-size: 12px;">Edit</button>
                <button style="padding: 4px 8px; background: transparent; color: #ccc; border: none; cursor: pointer; font-size: 12px;">View</button>
                <button style="padding: 4px 8px; background: transparent; color: #ccc; border: none; cursor: pointer; font-size: 12px;">Help</button>
            </div>
            <textarea placeholder="// Write your code here..." style="flex: 1; background: #1e1e1e; color: #d4d4d4; border: none; padding: 16px; font-family: 'Courier New', monospace; font-size: 14px; resize: none;"></textarea>
            <div style="background: #2d2d2d; padding: 8px 12px; color: #859900; border-top: 1px solid #3e3e42; font-size: 12px; font-family: monospace;">
                Ln 1, Col 1
            </div>
        </div>
    `;
}

function createSystemInfo() {
    return `
        <div style="height: 100%; background: #f5f5f5; overflow-y: auto; padding: 20px;">
            <h2 style="margin-bottom: 20px;">System Information</h2>
            
            <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <h3 style="margin-bottom: 12px;">Computer Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 50%;">Computer Name:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">REPLIT-DESKTOP</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Manufacturer:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">Virtual Machine</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">OS Name:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">Windows 10 Pro</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">OS Build:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">19042.1288</td></tr>
                    <tr><td style="padding: 8px; font-weight: bold;">Installation Date:</td><td style="padding: 8px;">3/10/2026</td></tr>
                </table>
            </div>

            <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <h3 style="margin-bottom: 12px;">Hardware</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 50%;">Processor:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">Intel Core i7 @ 3.6GHz</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Installed RAM:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">32 GB (Available: 18 GB)</td></tr>
                    <tr><td style="padding: 8px; font-weight: bold;">System Type:</td><td style="padding: 8px;">x64-based PC</td></tr>
                </table>
            </div>

            <div style="background: white; padding: 16px; border-radius: 8px;">
                <h3 style="margin-bottom: 12px;">Network</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 50%;">IP Address:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">192.168.1.100</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">IPv4 Address:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">192.168.1.100</td></tr>
                    <tr><td style="padding: 8px; font-weight: bold;">DNS Servers:</td><td style="padding: 8px;">8.8.8.8, 8.8.4.4</td></tr>
                </table>
            </div>
        </div>
    `;
}

// ============================================================
// NEW APPS
// ============================================================

function createRecycleBin() {
    return `
    <div style="height:100%;display:flex;flex-direction:column;background:white;">
      <div style="background:#f5f5f5;border-bottom:1px solid #ddd;padding:8px 12px;display:flex;align-items:center;gap:8px;">
        <button onclick="emptyRecycleBin()" style="padding:6px 14px;background:#d13438;color:white;border:none;border-radius:4px;cursor:pointer;font-size:13px;">🗑️ Empty Recycle Bin</button>
        <button style="padding:6px 14px;background:#f5f5f5;border:1px solid #ccc;border-radius:4px;cursor:pointer;font-size:13px;">Restore all items</button>
      </div>
      <div id="recycle-content" style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#999;">
        <div style="font-size:64px;margin-bottom:16px;">🗑️</div>
        <p style="font-size:16px;">The Recycle Bin is empty.</p>
      </div>
    </div>`;
}

function emptyRecycleBin() {
    addNotification('🗑️', 'Recycle Bin', 'Recycle Bin has been emptied.');
}

function createSearch() {
    return `
    <div style="height:100%;display:flex;flex-direction:column;background:#1a1a2e;color:white;">
      <div style="padding:20px;background:#0f0f23;">
        <div style="display:flex;align-items:center;background:#2a2a4a;border-radius:8px;padding:12px 16px;gap:10px;border:1px solid #444;">
          <span style="font-size:18px;">🔍</span>
          <input id="win-search-input" type="text" placeholder="Type to search apps, files, and settings..."
            style="flex:1;background:none;border:none;color:white;font-size:15px;outline:none;"
            oninput="updateWinSearch(this.value)"
            onkeydown="if(event.key==='Enter')launchWinSearch()">
        </div>
      </div>
      <div style="display:flex;flex:1;overflow:hidden;">
        <div style="flex:1;padding:16px;overflow-y:auto;">
          <div id="search-results">
            <p style="color:#888;font-size:13px;margin-bottom:16px;">Top apps</p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              ${[['🌐','Edge','browser'],['📁','File Explorer','explorer'],['⚙️','Settings','settings'],['⬛','CMD','cmd'],['🔢','Calculator','calculator'],['📝','Notepad','notepad'],['📊','Task Manager','taskmgr'],['🎨','Paint','paint']].map(([ic,nm,ap])=>`
              <div onclick="openApp('${ap}');closeWindow('search')" style="display:flex;align-items:center;gap:10px;padding:10px;background:#2a2a4a;border-radius:6px;cursor:pointer;" onmouseover="this.style.background='#3a3a5a'" onmouseout="this.style.background='#2a2a4a'">
                <span style="font-size:24px;">${ic}</span>
                <span style="font-size:13px;">${nm}</span>
              </div>`).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function updateWinSearch(q) {
    const allApps = [
        {name:'Edge Browser',icon:'🌐',app:'browser'},{name:'Google Chrome',icon:'🔵',app:'chrome'},{name:'File Explorer',icon:'📁',app:'explorer'},
        {name:'Settings',icon:'⚙️',app:'settings'},{name:'Task Manager',icon:'📊',app:'taskmgr'},{name:'Command Prompt',icon:'⬛',app:'cmd'},
        {name:'PowerShell',icon:'🔷',app:'powershell'},{name:'Calculator',icon:'🔢',app:'calculator'},{name:'Notepad',icon:'📝',app:'notepad'},
        {name:'WordPad',icon:'📄',app:'wordpad'},{name:'Paint',icon:'🎨',app:'paint'},{name:'Photos',icon:'🖼️',app:'photos'},
        {name:'Calendar',icon:'📅',app:'calendar'},{name:'Clock',icon:'⏰',app:'clock'},{name:'Maps',icon:'🗺️',app:'maps'},
        {name:'Weather',icon:'🌤️',app:'weather'},{name:'Music',icon:'🎵',app:'music'},{name:'Microsoft Store',icon:'🛍️',app:'store'},
        {name:'Discord',icon:'💬',app:'discord'},{name:'Windows Security',icon:'🛡️',app:'defender'},{name:'Sticky Notes',icon:'🟡',app:'stickynotes'},
        {name:'Control Panel',icon:'🎛️',app:'controlpanel'},{name:'Device Manager',icon:'🖥️',app:'devmgr'},{name:'Registry Editor',icon:'📋',app:'registry'},
        {name:'Teams',icon:'👥',app:'teams'},{name:'Xbox',icon:'🎮',app:'xbox'},{name:'Mail',icon:'📧',app:'mail'},
        {name:'VS Code',icon:'💻',app:'code'},{name:'System Info',icon:'ℹ️',app:'sysinfo'},{name:'Solitaire',icon:'🃏',app:'solitaire'}
    ];
    const res = document.getElementById('search-results');
    if (!res) return;
    if (!q) {
        res.innerHTML = '<p style="color:#888;font-size:13px;margin-bottom:16px;">Top apps</p>';
        return;
    }
    const matches = allApps.filter(a => a.name.toLowerCase().includes(q.toLowerCase()));
    res.innerHTML = matches.length ? matches.map(a=>`
        <div onclick="openApp('${a.app}');closeWindow('search')" style="display:flex;align-items:center;gap:12px;padding:12px;background:#2a2a4a;border-radius:6px;cursor:pointer;margin-bottom:6px;" onmouseover="this.style.background='#3a3a5a'" onmouseout="this.style.background='#2a2a4a'">
          <span style="font-size:28px;">${a.icon}</span>
          <div><div style="font-size:14px;">${a.name}</div><div style="font-size:11px;color:#888;">App</div></div>
        </div>`).join('') : `<p style="color:#888;padding:20px;">No results for "${q}"</p>`;
}

function createWordPad() {
    return `
    <div style="height:100%;display:flex;flex-direction:column;background:white;">
      <div style="background:#f5f5f5;border-bottom:1px solid #ddd;padding:6px 10px;display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
        <button onclick="wordpadExec('bold')" title="Bold" style="font-weight:bold;padding:4px 10px;border:1px solid #ccc;border-radius:3px;cursor:pointer;background:white;">B</button>
        <button onclick="wordpadExec('italic')" title="Italic" style="font-style:italic;padding:4px 10px;border:1px solid #ccc;border-radius:3px;cursor:pointer;background:white;">I</button>
        <button onclick="wordpadExec('underline')" title="Underline" style="text-decoration:underline;padding:4px 10px;border:1px solid #ccc;border-radius:3px;cursor:pointer;background:white;">U</button>
        <span style="width:1px;background:#ccc;height:20px;margin:0 4px;"></span>
        <button onclick="wordpadExec('justifyLeft')" title="Left" style="padding:4px 10px;border:1px solid #ccc;border-radius:3px;cursor:pointer;background:white;">≡</button>
        <button onclick="wordpadExec('justifyCenter')" title="Center" style="padding:4px 10px;border:1px solid #ccc;border-radius:3px;cursor:pointer;background:white;">☰</button>
        <button onclick="wordpadExec('justifyRight')" title="Right" style="padding:4px 10px;border:1px solid #ccc;border-radius:3px;cursor:pointer;background:white;">▤</button>
        <span style="width:1px;background:#ccc;height:20px;margin:0 4px;"></span>
        <select onchange="wordpadFontSize(this.value)" style="padding:4px;border:1px solid #ccc;border-radius:3px;">
          ${[8,10,12,14,16,18,20,24,28,36,48,72].map(s=>`<option value="${s}" ${s===14?'selected':''}>${s}</option>`).join('')}
        </select>
        <select onchange="wordpadFontFamily(this.value)" style="padding:4px;border:1px solid #ccc;border-radius:3px;width:130px;">
          ${['Arial','Times New Roman','Courier New','Georgia','Verdana','Segoe UI'].map(f=>`<option value="${f}">${f}</option>`).join('')}
        </select>
        <input type="color" onchange="wordpadExec('foreColor',this.value)" title="Text Color" style="width:32px;height:28px;border:1px solid #ccc;border-radius:3px;cursor:pointer;" value="#000000">
        <span style="width:1px;background:#ccc;height:20px;margin:0 4px;"></span>
        <button onclick="wordpadExec('insertOrderedList')" title="Numbered List" style="padding:4px 10px;border:1px solid #ccc;border-radius:3px;cursor:pointer;background:white;">1.</button>
        <button onclick="wordpadExec('insertUnorderedList')" title="Bullet List" style="padding:4px 10px;border:1px solid #ccc;border-radius:3px;cursor:pointer;background:white;">•</button>
        <span style="flex:1"></span>
        <button onclick="wordpadSave()" style="padding:4px 14px;background:#0078d4;color:white;border:none;border-radius:3px;cursor:pointer;">💾 Save</button>
      </div>
      <div id="wordpad-editor" contenteditable="true" 
        style="flex:1;padding:40px 60px;outline:none;overflow-y:auto;font-family:'Times New Roman';font-size:14px;line-height:1.8;caret-color:#0078d4;"
        onkeydown="wordpadKeydown(event)">
        <p>Welcome to WordPad! Start typing here...</p>
      </div>
      <div style="background:#f5f5f5;border-top:1px solid #ddd;padding:4px 12px;font-size:11px;color:#666;display:flex;gap:20px;">
        <span id="wp-wordcount">Words: 0</span>
        <span id="wp-charcount">Characters: 0</span>
        <span>100%</span>
      </div>
    </div>`;
}

function wordpadExec(cmd, val) {
    document.getElementById('wordpad-editor')?.focus();
    document.execCommand(cmd, false, val || null);
    updateWordpadCount();
}
function wordpadFontSize(s) { document.getElementById('wordpad-editor')?.focus(); document.execCommand('fontSize', false, '7'); document.querySelectorAll('#wordpad-editor font[size="7"]').forEach(f=>{f.removeAttribute('size');f.style.fontSize=s+'px';}); }
function wordpadFontFamily(f) { wordpadExec('fontName', f); }
function wordpadKeydown(e) { setTimeout(updateWordpadCount, 10); }
function updateWordpadCount() {
    const ed = document.getElementById('wordpad-editor');
    if (!ed) return;
    const text = ed.innerText || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const wc = document.getElementById('wp-wordcount');
    const cc = document.getElementById('wp-charcount');
    if (wc) wc.textContent = 'Words: ' + words;
    if (cc) cc.textContent = 'Characters: ' + text.length;
}
function wordpadSave() { addNotification('📄', 'WordPad', 'Document saved successfully.'); }

function createStickyNotes() {
    const colors = ['#fff9c4','#f8bbd0','#c8e6c9','#bbdefb','#ffe0b2'];
    return `
    <div style="height:100%;background:#2d2d2d;padding:12px;overflow:auto;" id="sticky-board">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="color:white;font-size:16px;font-weight:500;">Sticky Notes</span>
        <button onclick="addStickyNote()" style="background:#f9ca24;border:none;border-radius:50%;width:32px;height:32px;font-size:20px;cursor:pointer;font-weight:bold;">+</button>
      </div>
      <div id="sticky-notes-container" style="display:flex;flex-wrap:wrap;gap:12px;">
        <div class="sticky-note" style="background:#fff9c4;width:220px;min-height:180px;border-radius:4px;padding:12px;box-shadow:3px 3px 12px rgba(0,0,0,0.3);position:relative;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="font-size:11px;color:#888;">${new Date().toLocaleDateString()}</span>
            <button onclick="this.closest('.sticky-note').remove()" style="background:none;border:none;cursor:pointer;font-size:14px;color:#999;">✕</button>
          </div>
          <div contenteditable="true" style="outline:none;font-size:14px;color:#333;min-height:120px;font-family:'Segoe UI';">Click to type your note here...</div>
        </div>
      </div>
    </div>`;
}

function addStickyNote() {
    const colors = ['#fff9c4','#f8bbd0','#c8e6c9','#bbdefb','#ffe0b2','#e1bee7'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const container = document.getElementById('sticky-notes-container');
    if (!container) return;
    const note = document.createElement('div');
    note.className = 'sticky-note';
    note.style.cssText = `background:${color};width:220px;min-height:180px;border-radius:4px;padding:12px;box-shadow:3px 3px 12px rgba(0,0,0,0.3);position:relative;`;
    note.innerHTML = `<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="font-size:11px;color:#888;">${new Date().toLocaleDateString()}</span><button onclick="this.closest('.sticky-note').remove()" style="background:none;border:none;cursor:pointer;font-size:14px;color:#999;">✕</button></div><div contenteditable="true" style="outline:none;font-size:14px;color:#333;min-height:120px;font-family:'Segoe UI';">New note...</div>`;
    container.appendChild(note);
}

function createPowerShell() {
    setTimeout(() => {
        const input = document.getElementById('ps-input');
        if (input) {
            input.focus();
            input.addEventListener('keydown', handlePSInput);
        }
    }, 100);
    return `
    <div class="cmd-window" id="ps-container" style="background:#012456;color:#eeedf0;" onclick="document.getElementById('ps-input')?.focus()">
      <div class="cmd-output" id="ps-output" style="color:#eeedf0;">Windows PowerShell
Copyright (C) Microsoft Corporation. All rights reserved.

Install the latest PowerShell for new features and improvements! https://aka.ms/PSWindows

</div>
      <div class="cmd-input-line">
        <span class="cmd-prompt" style="color:#eeedf0;">PS ${userData?.username ? 'C:\\Users\\'+userData.username : 'C:\\Users\\User'}> </span>
        <input type="text" class="cmd-input" id="ps-input" style="color:#eeedf0;" autocomplete="off">
      </div>
    </div>`;
}

let psHistory = [], psHistIdx = -1;
function handlePSInput(e) {
    const input = document.getElementById('ps-input');
    const output = document.getElementById('ps-output');
    if (e.key === 'Enter') {
        const cmd = input.value.trim();
        if (cmd) { psHistory.push(cmd); psHistIdx = psHistory.length; }
        output.textContent += `PS C:\\Users\\${userData?.username||'User'}> ${cmd}\n`;
        const result = executePSCommand(cmd);
        if (result) output.textContent += result + '\n';
        output.textContent += '\n';
        input.value = '';
        output.scrollTop = output.scrollHeight;
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (psHistIdx > 0) input.value = psHistory[--psHistIdx];
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (psHistIdx < psHistory.length - 1) input.value = psHistory[++psHistIdx];
        else { psHistIdx = psHistory.length; input.value = ''; }
    }
}

function executePSCommand(cmd) {
    const lower = cmd.toLowerCase().trim();
    if (lower === 'help' || lower === 'get-help') return `PowerShell Commands:\n  Get-Process (ps)   - List processes\n  Get-Service        - List services\n  Get-Date           - Current date/time\n  Get-Location (pwd) - Current directory\n  Set-Location (cd)  - Change directory\n  Get-ChildItem (ls) - List files\n  Get-Content (cat)  - Read file\n  Write-Host         - Print text\n  Get-ComputerInfo   - System info\n  Clear-Host (cls)   - Clear screen\n  Invoke-WebRequest  - Web request\n  Start-Process      - Start app\n  Stop-Process       - Kill process\n  Exit               - Close PowerShell`;
    if (lower === 'get-date' || lower === 'date') return new Date().toString();
    if (lower === 'get-location' || lower === 'pwd') return `Path\n----\nC:\\Users\\${userData?.username||'User'}`;
    if (lower === 'get-childitem' || lower === 'ls' || lower === 'dir') return `\n    Directory: C:\\Users\\${userData?.username||'User'}\n\nMode                 LastWriteTime         Length Name\n----                 -------------         ------ ----\nd----          ${new Date().toLocaleDateString()}  <DIR>          Desktop\nd----          ${new Date().toLocaleDateString()}  <DIR>          Documents\nd----          ${new Date().toLocaleDateString()}  <DIR>          Downloads\nd----          ${new Date().toLocaleDateString()}  <DIR>          Pictures`;
    if (lower === 'clear-host' || lower === 'cls') { const o=document.getElementById('ps-output'); if(o)o.textContent=''; return ''; }
    if (lower === 'get-process' || lower === 'ps') return `\nHandles  NPM(K)    PM(K)      WS(K) CPU(s)     Id  SI ProcessName\n-------  ------    -----      ----- ------     --  -- -----------\n    560      32    15244      41936   0.08   2340   1 explorer\n    324      18     8192      25600   0.05   4096   1 chrome\n    412      24    12288      35840   0.12   5120   1 code\n    128       8     4096      12288   0.01   3120   1 taskmgr`;
    if (lower === 'get-service') return `\nStatus   Name               DisplayName\n------   ----               -----------\nRunning  AudioEndpointBuil… Windows Audio Endpoint Builder\nRunning  Audiosrv           Windows Audio\nRunning  BFE                Base Filtering Engine\nRunning  BITS               Background Intelligent Transfer\nStopped  fax                Fax\nRunning  MsMpSvc            Microsoft Defender Antivirus`;
    if (lower.startsWith('write-host')) return cmd.replace(/write-host\s+/i,'').replace(/['"]/g,'');
    if (lower === 'get-computerinfo') return `\nWindowsProductName : Windows 10 Pro\nWindowsVersion     : 2009\nWindowsBuildLabEx  : 19041.1.amd64fre\nOsHardwareAbstract : AT/AT COMPATIBLE\nCsProcessors       : Intel(R) Core(TM) i7-13700K\nCsNumberOfProcessor: 1\nCsNumberOfLogicPro : 16\nOsTotalVisibleMemo : 16,384 MB`;
    if (lower.startsWith('invoke-webrequest') || lower.startsWith('curl')) return `StatusCode        : 200\nStatusDescription : OK\nContent           : {123, 34, 114, 101...}\nRawContent        : HTTP/1.1 200 OK\nHeaders           : {[Content-Type, application/json]}\nRawContentLength  : 1024`;
    if (lower.startsWith('start-process')) { const app = lower.split(' ')[1]; if(app) openApp(app === 'notepad' ? 'notepad' : app === 'calc' ? 'calculator' : 'cmd'); return ''; }
    if (lower === 'exit') { closeWindow('powershell'); return ''; }
    if (lower === '') return '';
    return `${cmd} : The term '${cmd.split(' ')[0]}' is not recognized as the name of a cmdlet, function,\nscript file, or operable program.`;
}

function createControlPanel() {
    const items = [
        {icon:'🖥️',name:'Display',desc:'Adjust resolution, brightness, and orientation'},
        {icon:'🔊',name:'Sound',desc:'Manage audio devices and volume'},
        {icon:'🌐',name:'Network',desc:'View network status and set up connections'},
        {icon:'🖨️',name:'Printers',desc:'Add or manage printers and scanners'},
        {icon:'👤',name:'User Accounts',desc:'Change account settings and passwords'},
        {icon:'🛡️',name:'Security Center',desc:'Check security status',onclick:'controlpanel',app:'defender'},
        {icon:'⏰',name:'Date & Time',desc:'Change date, time, and time zone'},
        {icon:'🌍',name:'Region',desc:'Change location, number and currency formats'},
        {icon:'♿',name:'Ease of Access',desc:'Adjust settings for vision, hearing, and mobility'},
        {icon:'🔋',name:'Power Options',desc:'Change battery settings and sleep mode'},
        {icon:'🗂️',name:'File History',desc:'Save backups of your files'},
        {icon:'🔧',name:'Programs',desc:'Uninstall or change a program'},
        {icon:'🖱️',name:'Mouse',desc:'Change mouse pointer and click settings'},
        {icon:'⌨️',name:'Keyboard',desc:'Adjust keyboard repeat rate and cursor blink rate'},
        {icon:'🖼️',name:'Personalization',desc:'Change themes, wallpaper, and colors',onclick:'settings'},
        {icon:'🔍',name:'Indexing',desc:'Modify which locations are indexed for searching'}
    ];
    return `
    <div style="height:100%;display:flex;flex-direction:column;background:white;">
      <div style="background:#f5f5f5;border-bottom:1px solid #ddd;padding:8px 16px;display:flex;align-items:center;gap:12px;">
        <span style="color:#0078d4;font-size:13px;">All Control Panel Items</span>
        <input type="text" placeholder="🔍 Search Control Panel" style="margin-left:auto;padding:5px 12px;border:1px solid #ccc;border-radius:4px;font-size:13px;width:200px;">
      </div>
      <div style="flex:1;overflow-y:auto;padding:16px;">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;">
          ${items.map(i=>`
          <div onclick="${i.app?`openApp('${i.app}')`:'alert(\"'+i.name+' settings coming soon!\")'}" style="display:flex;align-items:flex-start;gap:12px;padding:12px;border:1px solid transparent;border-radius:4px;cursor:pointer;" onmouseover="this.style.background='#e3f2fd';this.style.borderColor='#90caf9'" onmouseout="this.style.background='transparent';this.style.borderColor='transparent'">
            <span style="font-size:32px;flex-shrink:0;">${i.icon}</span>
            <div><div style="font-size:13px;font-weight:600;color:#0078d4;margin-bottom:2px;">${i.name}</div><div style="font-size:11px;color:#666;">${i.desc}</div></div>
          </div>`).join('')}
        </div>
      </div>
    </div>`;
}

function createDeviceManager() {
    const devices = [
        {cat:'💻 Computer',items:['DESKTOP-WIN10SIM']},
        {cat:'💾 Disk drives',items:['SAMSUNG SSD 980 PRO 476GB','Generic USB Flash Drive 16GB']},
        {cat:'🖥️ Display adapters',items:['NVIDIA GeForce RTX 3080 Ti']},
        {cat:'🌐 Network adapters',items:['Intel(R) Ethernet Connection I219-V','Intel(R) Wi-Fi 6 AX201 160MHz']},
        {cat:'⌨️ Keyboards',items:['HID Keyboard Device']},
        {cat:'🖱️ Mice and other pointing devices',items:['HID-compliant mouse']},
        {cat:'🖨️ Print queues',items:['Microsoft Print to PDF','Microsoft XPS Document Writer']},
        {cat:'🔊 Sound, video and game controllers',items:['Realtek High Definition Audio','AMD High Definition Audio Device']},
        {cat:'🔌 Universal Serial Bus controllers',items:['USB Root Hub (USB 3.0)','Generic USB Hub']},
        {cat:'📷 Cameras',items:['Integrated Webcam']},
        {cat:'🔋 Batteries',items:['Microsoft ACPI-Compliant Control Method Battery']},
        {cat:'⚙️ System devices',items:['ACPI Fan','ACPI Processor Aggregator','Direct memory access controller']}
    ];
    return `
    <div style="height:100%;display:flex;flex-direction:column;background:white;">
      <div style="background:#f5f5f5;border-bottom:1px solid #ddd;padding:6px 12px;display:flex;gap:8px;align-items:center;">
        <button onclick="addNotification('🔍','Device Manager','Scanning for hardware changes...')" style="padding:4px 10px;border:1px solid #ccc;border-radius:3px;background:white;cursor:pointer;font-size:12px;">🔍 Scan for changes</button>
        <button onclick="addNotification('📋','Device Manager','No driver updates found.')" style="padding:4px 10px;border:1px solid #ccc;border-radius:3px;background:white;cursor:pointer;font-size:12px;">🔄 Update drivers</button>
      </div>
      <div style="flex:1;overflow-y:auto;padding:8px;">
        ${devices.map(d=>`
        <div>
          <div onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'"
            style="display:flex;align-items:center;gap:8px;padding:6px 8px;cursor:pointer;font-size:13px;user-select:none;" onmouseover="this.style.background='#e3f2fd'" onmouseout="this.style.background='transparent'">
            <span style="font-size:10px;">▶</span>${d.cat}
          </div>
          <div style="display:none;margin-left:24px;">
            ${d.items.map(item=>`
            <div style="display:flex;align-items:center;gap:8px;padding:5px 8px;font-size:12px;color:#333;cursor:pointer;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='transparent'">
              <span>✅</span>${item}
            </div>`).join('')}
          </div>
        </div>`).join('')}
      </div>
    </div>`;
}

function createRegistryEditor() {
    return `
    <div style="height:100%;display:flex;flex-direction:column;background:white;">
      <div style="background:#f5f5f5;border-bottom:1px solid #ddd;padding:6px 12px;display:flex;gap:8px;align-items:center;">
        <span style="font-size:12px;color:#666;">Computer\\HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion</span>
      </div>
      <div style="display:flex;flex:1;overflow:hidden;">
        <div style="width:280px;border-right:1px solid #ddd;overflow-y:auto;padding:4px;">
          ${[
            {key:'HKEY_CLASSES_ROOT',id:'hkcr'},
            {key:'HKEY_CURRENT_USER',id:'hkcu'},
            {key:'HKEY_LOCAL_MACHINE',id:'hklm'},
            {key:'HKEY_USERS',id:'hku'},
            {key:'HKEY_CURRENT_CONFIG',id:'hkcc'}
          ].map(k=>`
          <div onclick="expandRegKey('${k.id}')" style="display:flex;align-items:center;gap:6px;padding:4px 8px;cursor:pointer;font-size:12px;" onmouseover="this.style.background='#e3f2fd'" onmouseout="this.style.background='transparent'">
            <span id="arrow-${k.id}" style="font-size:10px;transition:transform 0.2s;">▶</span>
            <span>🗂️</span><span>${k.key}</span>
          </div>
          <div id="sub-${k.id}" style="display:none;margin-left:20px;">
            ${k.id==='hklm'?`
            <div style="padding:3px 8px;font-size:12px;cursor:pointer;" onmouseover="this.style.background='#e3f2fd'" onmouseout="this.style.background='transparent'">📁 HARDWARE</div>
            <div style="padding:3px 8px;font-size:12px;cursor:pointer;" onmouseover="this.style.background='#e3f2fd'" onmouseout="this.style.background='transparent'">📁 SAM</div>
            <div style="padding:3px 8px;font-size:12px;cursor:pointer;" onmouseover="this.style.background='#e3f2fd'" onmouseout="this.style.background='transparent'">📁 SECURITY</div>
            <div onclick="loadRegValues()" style="padding:3px 8px;font-size:12px;cursor:pointer;color:#0078d4;" onmouseover="this.style.background='#e3f2fd'" onmouseout="this.style.background='transparent'">📁 SOFTWARE ▶</div>
            <div style="padding:3px 8px;font-size:12px;cursor:pointer;" onmouseover="this.style.background='#e3f2fd'" onmouseout="this.style.background='transparent'">📁 SYSTEM</div>`:
            '<div style="padding:3px 8px;font-size:12px;color:#999;">(empty)</div>'}
          </div>`).join('')}
        </div>
        <div style="flex:1;overflow:auto;">
          <table id="reg-values-table" style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead><tr style="background:#f5f5f5;">
              <th style="text-align:left;padding:6px 12px;border-bottom:1px solid #ddd;">Name</th>
              <th style="text-align:left;padding:6px 12px;border-bottom:1px solid #ddd;">Type</th>
              <th style="text-align:left;padding:6px 12px;border-bottom:1px solid #ddd;">Data</th>
            </tr></thead>
            <tbody id="reg-tbody">
              <tr><td colspan="3" style="padding:20px;color:#999;text-align:center;">Select a key to view its values</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div style="background:#f5f5f5;border-top:1px solid #ddd;padding:4px 12px;font-size:11px;color:#666;">
        ⚠️ Modifying the registry incorrectly can cause serious problems. This is a simulation.
      </div>
    </div>`;
}

function expandRegKey(id) {
    const sub = document.getElementById('sub-' + id);
    const arr = document.getElementById('arrow-' + id);
    if (sub) sub.style.display = sub.style.display === 'none' ? 'block' : 'none';
    if (arr) arr.style.transform = sub?.style.display === 'block' ? 'rotate(90deg)' : '';
}

function loadRegValues() {
    const tbody = document.getElementById('reg-tbody');
    if (!tbody) return;
    const values = [
        ['(Default)','REG_SZ','(value not set)'],
        ['CurrentBuild','REG_SZ','19045'],
        ['CurrentBuildNumber','REG_SZ','19045'],
        ['CurrentType','REG_SZ','Multiprocessor Free'],
        ['CurrentVersion','REG_SZ','6.3'],
        ['EditionID','REG_SZ','Professional'],
        ['InstallationType','REG_SZ','Client'],
        ['InstallDate','REG_DWORD','0x65d3c500 (1708324096)'],
        ['ProductName','REG_SZ','Windows 10 Pro'],
        ['ReleaseId','REG_SZ','2009'],
        ['RegisteredOwner','REG_SZ',userData?.username||'User'],
        ['SystemRoot','REG_SZ','C:\\Windows'],
        ['UBR','REG_DWORD','0x00000b2b (2859)']
    ];
    tbody.innerHTML = values.map(([name,type,data])=>`
    <tr onmouseover="this.style.background='#e3f2fd'" onmouseout="this.style.background='transparent'" style="cursor:pointer;">
      <td style="padding:4px 12px;border-bottom:1px solid #f0f0f0;">${name}</td>
      <td style="padding:4px 12px;border-bottom:1px solid #f0f0f0;color:#666;">${type}</td>
      <td style="padding:4px 12px;border-bottom:1px solid #f0f0f0;">${data}</td>
    </tr>`).join('');
}

function createMediaPlayer() {
    const tracks = [
        {title:'Blinding Lights',artist:'The Weeknd',duration:'3:20'},
        {title:'Watermelon Sugar',artist:'Harry Styles',duration:'2:54'},
        {title:'Levitating',artist:'Dua Lipa',duration:'3:23'},
        {title:'Peaches',artist:'Justin Bieber ft. Daniel Caesar',duration:'3:18'},
        {title:'Good 4 U',artist:'Olivia Rodrigo',duration:'2:58'},
        {title:'Stay',artist:'The Kid LAROI & Justin Bieber',duration:'2:21'},
        {title:'Industry Baby',artist:'Lil Nas X & Jack Harlow',duration:'3:32'},
        {title:'Shivers',artist:'Ed Sheeran',duration:'3:27'}
    ];
    let currentTrack = 0;
    return `
    <div style="height:100%;display:flex;background:#1a1a2e;color:white;">
      <div style="width:250px;background:#0f0f1a;padding:12px;overflow-y:auto;border-right:1px solid #2a2a4a;">
        <div style="font-size:12px;color:#888;margin-bottom:8px;text-transform:uppercase;font-weight:600;">Library</div>
        <div onclick="this.classList.toggle('active')" style="padding:8px;border-radius:4px;cursor:pointer;margin-bottom:2px;background:#1a2a4a;" onmouseover="this.style.background='#2a3a5a'" onmouseout="">🎵 Music</div>
        <div style="padding:8px;border-radius:4px;cursor:pointer;margin-bottom:2px;" onmouseover="this.style.background='#1a2a4a'" onmouseout="this.style.background='transparent'">📀 Albums</div>
        <div style="padding:8px;border-radius:4px;cursor:pointer;margin-bottom:2px;" onmouseover="this.style.background='#1a2a4a'" onmouseout="this.style.background='transparent'">🎤 Artists</div>
        <div style="padding:8px;border-radius:4px;cursor:pointer;" onmouseover="this.style.background='#1a2a4a'" onmouseout="this.style.background='transparent'">📋 Playlists</div>
      </div>
      <div style="flex:1;display:flex;flex-direction:column;">
        <div style="flex:1;overflow-y:auto;padding:12px;">
          <div style="font-size:13px;color:#888;margin-bottom:12px;">All Music (${tracks.length} songs)</div>
          ${tracks.map((t,i)=>`
          <div onclick="playTrack(${i})" id="mp-track-${i}" style="display:flex;align-items:center;gap:12px;padding:10px;border-radius:6px;cursor:pointer;margin-bottom:4px;" onmouseover="this.style.background='#1a2a4a'" onmouseout="this.style.background=${i===0?'\"#0f2040\"':'\"transparent\"'}">
            <span style="width:24px;text-align:center;color:#888;font-size:13px;">${i+1}</span>
            <div style="width:40px;height:40px;background:linear-gradient(135deg,#5865f2,#7289da);border-radius:4px;display:flex;align-items:center;justify-content:center;">🎵</div>
            <div style="flex:1;">
              <div style="font-size:14px;">${t.title}</div>
              <div style="font-size:12px;color:#888;">${t.artist}</div>
            </div>
            <span style="font-size:12px;color:#888;">${t.duration}</span>
          </div>`).join('')}
        </div>
        <div style="background:#0f0f1a;padding:16px;border-top:1px solid #2a2a4a;">
          <div style="text-align:center;margin-bottom:12px;">
            <div style="font-size:16px;" id="mp-title">${tracks[0].title}</div>
            <div style="font-size:13px;color:#888;" id="mp-artist">${tracks[0].artist}</div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
            <span style="font-size:12px;color:#888;" id="mp-time">0:00</span>
            <div style="flex:1;height:4px;background:#2a2a4a;border-radius:2px;cursor:pointer;" onclick="seekTrack(event,this)" id="mp-progress-bar">
              <div id="mp-progress" style="height:100%;background:#5865f2;border-radius:2px;width:0%;transition:width 0.3s;"></div>
            </div>
            <span style="font-size:12px;color:#888;" id="mp-duration">${tracks[0].duration}</span>
          </div>
          <div style="display:flex;justify-content:center;gap:20px;align-items:center;">
            <button onclick="mpShuffle()" title="Shuffle" style="background:none;border:none;cursor:pointer;font-size:20px;color:#888;">🔀</button>
            <button onclick="playTrack(window.mpCurrent>0?window.mpCurrent-1:0)" title="Previous" style="background:none;border:none;cursor:pointer;font-size:24px;color:white;">⏮</button>
            <button onclick="mpPlayPause()" id="mp-playbtn" title="Play/Pause" style="background:#5865f2;border:none;cursor:pointer;font-size:20px;width:44px;height:44px;border-radius:50%;color:white;">▶</button>
            <button onclick="playTrack((window.mpCurrent||0)+1)" title="Next" style="background:none;border:none;cursor:pointer;font-size:24px;color:white;">⏭</button>
            <button onclick="mpRepeat()" title="Repeat" style="background:none;border:none;cursor:pointer;font-size:20px;color:#888;">🔁</button>
          </div>
        </div>
      </div>
    </div>`;
}

window.mpCurrent = 0;
window.mpPlaying = false;
window.mpInterval = null;
window.mpProgress = 0;

const mpTracks = [
    {title:'Blinding Lights',artist:'The Weeknd',duration:'3:20',secs:200},
    {title:'Watermelon Sugar',artist:'Harry Styles',duration:'2:54',secs:174},
    {title:'Levitating',artist:'Dua Lipa',duration:'3:23',secs:203},
    {title:'Peaches',artist:'Justin Bieber',duration:'3:18',secs:198},
    {title:'Good 4 U',artist:'Olivia Rodrigo',duration:'2:58',secs:178},
    {title:'Stay',artist:'The Kid LAROI',duration:'2:21',secs:141},
    {title:'Industry Baby',artist:'Lil Nas X',duration:'3:32',secs:212},
    {title:'Shivers',artist:'Ed Sheeran',duration:'3:27',secs:207}
];

function playTrack(idx) {
    if (idx < 0 || idx >= mpTracks.length) return;
    window.mpCurrent = idx;
    window.mpProgress = 0;
    window.mpPlaying = true;
    if (window.mpInterval) clearInterval(window.mpInterval);
    const track = mpTracks[idx];
    document.getElementById('mp-title').textContent = track.title;
    document.getElementById('mp-artist').textContent = track.artist;
    document.getElementById('mp-duration').textContent = track.duration;
    document.getElementById('mp-playbtn').textContent = '⏸';
    window.mpInterval = setInterval(() => {
        if (!window.mpPlaying) return;
        window.mpProgress = Math.min(window.mpProgress + 1, track.secs);
        const pct = (window.mpProgress / track.secs) * 100;
        const prog = document.getElementById('mp-progress');
        if (prog) prog.style.width = pct + '%';
        const min = Math.floor(window.mpProgress / 60);
        const sec = window.mpProgress % 60;
        const timeEl = document.getElementById('mp-time');
        if (timeEl) timeEl.textContent = min + ':' + String(sec).padStart(2,'0');
        if (window.mpProgress >= track.secs) playTrack((idx + 1) % mpTracks.length);
    }, 1000);
}

function mpPlayPause() {
    window.mpPlaying = !window.mpPlaying;
    document.getElementById('mp-playbtn').textContent = window.mpPlaying ? '⏸' : '▶';
    if (window.mpPlaying && !window.mpInterval) playTrack(window.mpCurrent);
}

function mpShuffle() { playTrack(Math.floor(Math.random() * mpTracks.length)); }
function mpRepeat() { window.mpProgress = 0; }
function seekTrack(e, bar) {
    const rect = bar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const track = mpTracks[window.mpCurrent];
    window.mpProgress = Math.floor(pct * track.secs);
}

function createTeams() {
    const channels = ['General','Announcements','Development','Design','Marketing','Support'];
    const messages = [
        {user:'Alice Chen',avatar:'👩',time:'10:30 AM',msg:'Good morning everyone! Ready for the standup? 👋'},
        {user:'Bob Smith',avatar:'👨',time:'10:31 AM',msg:'Morning! Yes, be right there in 5 mins.'},
        {user:'Alice Chen',avatar:'👩',time:'10:32 AM',msg:'The new feature deployment went smoothly last night! 🚀'},
        {user:'Carol Davis',avatar:'👩‍💼',time:'10:35 AM',msg:'Great news! I\'ll update the stakeholders. Also, quick reminder: team lunch at 12pm today 🍕'},
        {user:'Dave Wilson',avatar:'🧑',time:'10:38 AM',msg:'@Carol Thanks for the reminder! See everyone at lunch.'},
        {user:userData?.username||'You',avatar:'😊',time:'Just now',msg:'Just joined the channel!',isMe:true}
    ];
    return `
    <div style="height:100%;display:flex;background:#1d1f2b;color:#d1d2d4;">
      <div style="width:60px;background:#1b1c26;display:flex;flex-direction:column;align-items:center;padding:12px 0;gap:8px;">
        <div style="width:44px;height:44px;background:linear-gradient(135deg,#6264a7,#4f52a5);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer;">👤</div>
        <div style="margin-top:8px;display:flex;flex-direction:column;gap:4px;">
          ${['💬','📅','📞','📁','⚙️'].map(ic=>`<div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;border-radius:4px;font-size:22px;" onmouseover="this.style.background='#2a2b3a'" onmouseout="this.style.background='transparent'">${ic}</div>`).join('')}
        </div>
      </div>
      <div style="width:200px;background:#1d1f2b;border-right:1px solid #2a2b3a;padding:12px;">
        <div style="font-size:14px;font-weight:600;margin-bottom:12px;color:white;">Teams</div>
        <div style="font-size:11px;color:#888;margin-bottom:6px;text-transform:uppercase;">Channels</div>
        ${channels.map((c,i)=>`
        <div onclick="switchTeamsChannel('${c}')" style="padding:6px 8px;border-radius:4px;cursor:pointer;font-size:13px;margin-bottom:2px;${i===0?'background:#2a2b3a;':''}" onmouseover="this.style.background='#2a2b3a'" onmouseout="this.style.background=${i===0?'\"#2a2b3a\"':'\"transparent\"'}">
          # ${c}
        </div>`).join('')}
      </div>
      <div style="flex:1;display:flex;flex-direction:column;">
        <div style="padding:12px 16px;border-bottom:1px solid #2a2b3a;font-weight:600;color:white;"># General</div>
        <div style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;" id="teams-messages">
          ${messages.map(m=>`
          <div style="display:flex;gap:10px;align-items:flex-start;${m.isMe?'flex-direction:row-reverse;':''}" >
            <div style="width:36px;height:36px;background:${m.isMe?'#6264a7':'#424242'};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">${m.avatar}</div>
            <div style="max-width:70%;${m.isMe?'align-items:flex-end;':''}">
              <div style="font-size:11px;color:#888;margin-bottom:3px;${m.isMe?'text-align:right;':''}">${m.user} • ${m.time}</div>
              <div style="background:${m.isMe?'#6264a7':'#2a2b3a'};padding:10px 14px;border-radius:${m.isMe?'12px 12px 2px 12px':'12px 12px 12px 2px'};font-size:13px;">${m.msg}</div>
            </div>
          </div>`).join('')}
        </div>
        <div style="padding:12px 16px;border-top:1px solid #2a2b3a;display:flex;gap:8px;align-items:center;">
          <div style="flex:1;background:#2a2b3a;border-radius:8px;padding:10px 14px;display:flex;align-items:center;gap:8px;">
            <input id="teams-msg-input" type="text" placeholder="Type a new message" 
              style="flex:1;background:none;border:none;color:#d1d2d4;outline:none;font-size:14px;"
              onkeydown="if(event.key==='Enter')sendTeamsMessage()">
            <span style="color:#888;">😊</span>
            <span style="color:#888;">📎</span>
          </div>
          <button onclick="sendTeamsMessage()" style="background:#6264a7;border:none;border-radius:8px;width:40px;height:40px;cursor:pointer;color:white;font-size:18px;">➤</button>
        </div>
      </div>
    </div>`;
}

function sendTeamsMessage() {
    const input = document.getElementById('teams-msg-input');
    const msgs = document.getElementById('teams-messages');
    if (!input || !msgs || !input.value.trim()) return;
    const text = input.value.trim();
    input.value = '';
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;gap:10px;align-items:flex-start;flex-direction:row-reverse;';
    div.innerHTML = `<div style="width:36px;height:36px;background:#6264a7;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">😊</div><div style="max-width:70%;align-items:flex-end;"><div style="font-size:11px;color:#888;margin-bottom:3px;text-align:right;">${userData?.username||'You'} • Just now</div><div style="background:#6264a7;padding:10px 14px;border-radius:12px 12px 2px 12px;font-size:13px;">${text}</div></div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    setTimeout(() => {
        const replies = ['Got it! 👍','That sounds great!','Thanks for sharing!','Will do!','Let me check on that.','On it! 🚀'];
        const reply = replies[Math.floor(Math.random()*replies.length)];
        const names = [['Alice Chen','👩'],['Bob Smith','👨'],['Carol Davis','👩‍💼']];
        const [name,av] = names[Math.floor(Math.random()*names.length)];
        const rdiv = document.createElement('div');
        rdiv.style.cssText = 'display:flex;gap:10px;align-items:flex-start;';
        rdiv.innerHTML = `<div style="width:36px;height:36px;background:#424242;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">${av}</div><div><div style="font-size:11px;color:#888;margin-bottom:3px;">${name} • Just now</div><div style="background:#2a2b3a;padding:10px 14px;border-radius:12px 12px 12px 2px;font-size:13px;">${reply}</div></div>`;
        msgs.appendChild(rdiv);
        msgs.scrollTop = msgs.scrollHeight;
    }, 1000 + Math.random()*1500);
}

function switchTeamsChannel(name) {}

function createSpeedTest() {
    return `
    <div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#0f0f1a,#1a1a2e);color:white;">
      <h2 style="margin-bottom:6px;font-weight:300;font-size:28px;">Internet Speed Test</h2>
      <p style="color:#888;margin-bottom:40px;font-size:14px;">Test your connection speed</p>
      <div style="position:relative;width:240px;height:240px;margin-bottom:30px;">
        <svg viewBox="0 0 200 200" style="width:240px;height:240px;">
          <circle cx="100" cy="100" r="90" fill="none" stroke="#1a2a4a" stroke-width="12"/>
          <circle id="st-ring" cx="100" cy="100" r="90" fill="none" stroke="#00d4ff" stroke-width="12"
            stroke-dasharray="565" stroke-dashoffset="565" stroke-linecap="round"
            transform="rotate(-90 100 100)" style="transition:stroke-dashoffset 0.1s;"/>
        </svg>
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
          <div id="st-speed" style="font-size:42px;font-weight:300;color:#00d4ff;">--</div>
          <div id="st-unit" style="font-size:13px;color:#888;margin-top:2px;">Mbps</div>
          <div id="st-label" style="font-size:12px;color:#555;margin-top:4px;">Download</div>
        </div>
      </div>
      <div style="display:flex;gap:40px;margin-bottom:30px;">
        <div style="text-align:center;">
          <div style="font-size:11px;color:#888;margin-bottom:4px;">📥 Download</div>
          <div id="st-dl" style="font-size:20px;color:white;">--</div>
          <div style="font-size:11px;color:#888;">Mbps</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:11px;color:#888;margin-bottom:4px;">📤 Upload</div>
          <div id="st-ul" style="font-size:20px;color:white;">--</div>
          <div style="font-size:11px;color:#888;">Mbps</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:11px;color:#888;margin-bottom:4px;">⏱️ Ping</div>
          <div id="st-ping" style="font-size:20px;color:white;">--</div>
          <div style="font-size:11px;color:#888;">ms</div>
        </div>
      </div>
      <button id="st-btn" onclick="runSpeedTest()" style="background:linear-gradient(135deg,#00d4ff,#0078d4);border:none;border-radius:30px;padding:14px 48px;color:white;font-size:18px;font-weight:600;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">GO</button>
      <p id="st-status" style="color:#888;font-size:13px;margin-top:16px;"> </p>
    </div>`;
}

function runSpeedTest() {
    const btn = document.getElementById('st-btn');
    const status = document.getElementById('st-status');
    const ring = document.getElementById('st-ring');
    const speedEl = document.getElementById('st-speed');
    const dlEl = document.getElementById('st-dl');
    const ulEl = document.getElementById('st-ul');
    const pingEl = document.getElementById('st-ping');
    const labelEl = document.getElementById('st-label');
    if (btn) btn.disabled = true;
    
    const dl = (Math.random() * 400 + 50).toFixed(1);
    const ul = (Math.random() * 100 + 20).toFixed(1);
    const ping = Math.floor(Math.random() * 20 + 5);
    
    if (status) status.textContent = 'Testing ping...';
    if (pingEl) setTimeout(() => { pingEl.textContent = ping; if(status) status.textContent = 'Testing download speed...'; }, 800);
    
    let current = 0, target = parseFloat(dl);
    const interval = setInterval(() => {
        current = Math.min(current + target/60, target);
        if (speedEl) speedEl.textContent = current.toFixed(0);
        if (ring) ring.style.strokeDashoffset = 565 - (current/400)*565;
        if (current >= target) {
            clearInterval(interval);
            if (dlEl) dlEl.textContent = dl;
            if (status) status.textContent = 'Testing upload speed...';
            setTimeout(() => {
                if (ulEl) ulEl.textContent = ul;
                if (speedEl) speedEl.textContent = ul;
                if (labelEl) labelEl.textContent = 'Upload';
                if (ring) ring.style.stroke = '#00ff88';
                setTimeout(() => {
                    if (status) status.textContent = `✅ Speed test complete! Server: New York, NY`;
                    if (btn) btn.disabled = false;
                }, 1500);
            }, 2000);
        }
    }, 50);
}

function createMail() {
    const emails = [
        {from:'Microsoft',subject:'Welcome to Windows 10!',time:'9:00 AM',preview:'Thank you for using Windows 10. Get started with...',read:false},
        {from:'GitHub',subject:'[github] Action required: Verify your email',time:'Yesterday',preview:'Please verify your email address to continue...',read:false},
        {from:'LinkedIn',subject:'You have 5 new profile views',time:'Mon',preview:'See who\'s been looking at your profile this week...',read:true},
        {from:'Google',subject:'Security alert: New device signed in',time:'Sun',preview:'A new device was signed in to your Google Account...',read:true},
        {from:'No-Reply',subject:'Your order has shipped!',time:'Sat',preview:'Your order #12345 has been shipped and is on its way...',read:true},
        {from:'Team Newsletter',subject:'Weekly Digest - Top stories this week',time:'Fri',preview:'Here are the top stories from this week in tech...',read:true}
    ];
    return `
    <div style="height:100%;display:flex;background:white;">
      <div style="width:60px;background:#0078d4;display:flex;flex-direction:column;align-items:center;padding:12px 0;gap:12px;">
        ${['📬','📅','👤','⚙️'].map(ic=>`<div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;border-radius:8px;font-size:22px;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='transparent'">${ic}</div>`).join('')}
      </div>
      <div style="width:260px;border-right:1px solid #eee;display:flex;flex-direction:column;">
        <div style="padding:12px;border-bottom:1px solid #eee;">
          <button onclick="addNotification('📧','Mail','New email composition opened')" style="width:100%;padding:10px;background:#0078d4;color:white;border:none;border-radius:4px;cursor:pointer;font-size:13px;font-weight:600;">+ New Mail</button>
        </div>
        <div style="padding:8px;border-bottom:1px solid #eee;">
          ${['📥 Inbox','⭐ Flagged','📤 Sent','📝 Drafts','🗑️ Deleted','📂 Archive'].map((f,i)=>`<div style="padding:8px;border-radius:4px;cursor:pointer;font-size:13px;${i===0?'background:#e3f2fd;color:#0078d4;':''}" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='${i===0?'#e3f2fd':'transparent'}'">${f}</div>`).join('')}
        </div>
      </div>
      <div style="width:320px;border-right:1px solid #eee;overflow-y:auto;">
        ${emails.map((e,i)=>`
        <div onclick="openEmail(${i})" style="padding:14px;border-bottom:1px solid #f5f5f5;cursor:pointer;${!e.read?'background:#f0f7ff;':''}" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='${!e.read?'#f0f7ff':'transparent'}'">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-size:13px;font-weight:${!e.read?'700':'500'};">${e.from}</span>
            <span style="font-size:11px;color:#888;">${e.time}</span>
          </div>
          <div style="font-size:13px;${!e.read?'font-weight:600;':''}color:#333;margin-bottom:3px;">${e.subject}</div>
          <div style="font-size:12px;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${e.preview}</div>
        </div>`).join('')}
      </div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;color:#999;">
        <div style="text-align:center;">
          <div style="font-size:48px;margin-bottom:12px;">📧</div>
          <p>Select an email to read</p>
        </div>
      </div>
    </div>`;
}

function openEmail(idx) {
    const emails = [
        {from:'Microsoft',subject:'Welcome to Windows 10!',body:'<h3>Welcome to Windows 10!</h3><p>Thank you for upgrading to the latest version of Windows. We\'re excited to have you here!</p><p>Get started by exploring the new features:</p><ul><li>The new Start Menu</li><li>Cortana virtual assistant</li><li>Microsoft Edge browser</li><li>Action Center notifications</li></ul><p>Best regards,<br>The Windows Team</p>'},
        {from:'GitHub',subject:'Action required: Verify your email',body:'<h3>Verify your GitHub email address</h3><p>Please verify your email address to access all features of GitHub.</p><p><a href="#">Click here to verify</a></p>'},
        {from:'LinkedIn',subject:'You have 5 new profile views',body:'<h3>5 people viewed your profile</h3><p>See who\'s interested in your work and experience.</p>'},
        {from:'Google',subject:'Security alert: New device signed in',body:'<h3>New sign-in detected</h3><p>A new device recently signed in to your Google Account. If this was you, you can ignore this email.</p>'},
        {from:'Shipping',subject:'Your order has shipped!',body:'<h3>Your order is on its way!</h3><p>Order #12345 has been shipped via FedEx. Expected delivery: 2-3 business days.</p>'},
        {from:'Newsletter',subject:'Weekly Digest',body:'<h3>This week in tech</h3><p>Top stories from the tech world this week...</p>'}
    ];
    const email = emails[idx];
    const content = document.querySelector('[style*="Select an email"]')?.parentElement;
    if (!content) return;
    content.innerHTML = `<div style="padding:24px;overflow-y:auto;height:100%;"><h2 style="font-size:18px;margin-bottom:8px;">${email.subject}</h2><div style="color:#666;font-size:13px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #eee;"><strong>From:</strong> ${email.from}<br><strong>To:</strong> ${userData?.username||'User'}@windows10sim.com</div><div style="font-size:14px;line-height:1.8;">${email.body}</div></div>`;
}

/* ═══════════════════════════════════════════════════════════════
   🎨  AI IMAGE GENERATOR  (Pollinations.AI)
═══════════════════════════════════════════════════════════════ */
function createImageGenerator() {
    setTimeout(() => initImageGenerator(), 100);
    return `
    <div style="display:flex;flex-direction:column;height:100%;background:#1a1a2e;color:#e0e0e0;font-family:Segoe UI,sans-serif;">

      <!-- Top toolbar -->
      <div style="background:#16213e;padding:12px 16px;border-bottom:1px solid #0f3460;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <span style="font-size:20px;">🎨</span>
        <span style="font-weight:700;font-size:15px;color:#e94560;">AI Image Generator</span>
        <span style="font-size:11px;background:#0f3460;padding:2px 8px;border-radius:10px;color:#7fdbff;">Powered by Pollinations.AI</span>
      </div>

      <!-- Prompt area -->
      <div style="padding:14px 16px;background:#16213e;border-bottom:1px solid #0f3460;">
        <div style="display:flex;gap:10px;margin-bottom:10px;">
          <input id="img-prompt" placeholder="Describe what you want to generate... (e.g. a futuristic city at night, neon lights)"
            style="flex:1;background:#0f3460;border:1px solid #e94560;border-radius:6px;padding:10px 14px;color:white;font-size:14px;outline:none;"
            onkeydown="if(event.key==='Enter')generateImages()">
          <button onclick="generateImages()" id="img-gen-btn"
            style="background:linear-gradient(135deg,#e94560,#c62a47);border:none;border-radius:6px;padding:10px 20px;color:white;font-weight:700;cursor:pointer;font-size:14px;white-space:nowrap;transition:opacity 0.2s;"
            onmouseover="this.style.opacity=0.85" onmouseout="this.style.opacity=1">
            ✨ Generate
          </button>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
          <div style="display:flex;flex-direction:column;gap:3px;">
            <label style="font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:0.5px;">Style</label>
            <select id="img-style" style="background:#0f3460;border:1px solid #555;border-radius:4px;padding:5px 8px;color:white;font-size:13px;cursor:pointer;">
              <option value="">✦ No style</option>
              <option value="realistic photo, 8k, detailed">📷 Realistic Photo</option>
              <option value="anime style, manga, detailed illustration">🎌 Anime / Manga</option>
              <option value="oil painting, classical art, detailed brushwork">🖼️ Oil Painting</option>
              <option value="watercolor painting, soft colors, artistic">💧 Watercolor</option>
              <option value="cyberpunk art, neon lights, futuristic city">🌆 Cyberpunk</option>
              <option value="cartoon style, vibrant colors, clean lines">🎨 Cartoon</option>
              <option value="pixel art, 8-bit, retro game style">👾 Pixel Art</option>
              <option value="fantasy art, magical, epic, dramatic lighting">🧙 Fantasy</option>
              <option value="dark gothic art, horror, ominous atmosphere">🦇 Dark Gothic</option>
              <option value="impressionist painting, monet style, soft strokes">🌸 Impressionist</option>
              <option value="3D render, octane render, hyperrealistic, volumetric lighting">💎 3D Render</option>
              <option value="flat design, minimalist, modern illustration">📐 Minimalist</option>
            </select>
          </div>
          <div style="display:flex;flex-direction:column;gap:3px;">
            <label style="font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:0.5px;">Model</label>
            <select id="img-model" style="background:#0f3460;border:1px solid #555;border-radius:4px;padding:5px 8px;color:white;font-size:13px;cursor:pointer;">
              <option value="flux">⚡ Flux (Default)</option>
              <option value="turbo">🚀 Turbo (Fast)</option>
              <option value="flux-realism">📸 Flux Realism</option>
              <option value="flux-anime">🎌 Flux Anime</option>
              <option value="flux-3d">💎 Flux 3D</option>
              <option value="any-dark">🌑 Dark Moody</option>
            </select>
          </div>
          <div style="display:flex;flex-direction:column;gap:3px;">
            <label style="font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:0.5px;">Size</label>
            <select id="img-size" style="background:#0f3460;border:1px solid #555;border-radius:4px;padding:5px 8px;color:white;font-size:13px;cursor:pointer;">
              <option value="512,512">512×512 Square</option>
              <option value="768,512">768×512 Landscape</option>
              <option value="512,768">512×768 Portrait</option>
              <option value="1024,512">1024×512 Wide</option>
              <option value="512,1024">512×1024 Tall</option>
              <option value="768,768">768×768 Square HD</option>
            </select>
          </div>
          <div style="display:flex;flex-direction:column;gap:3px;">
            <label style="font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:0.5px;">Count</label>
            <select id="img-count" style="background:#0f3460;border:1px solid #555;border-radius:4px;padding:5px 8px;color:white;font-size:13px;cursor:pointer;">
              <option value="1">1 image</option>
              <option value="2">2 images</option>
              <option value="4">4 images</option>
            </select>
          </div>
          <div style="display:flex;flex-direction:column;gap:3px;">
            <label style="font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:0.5px;">Negative prompt</label>
            <input id="img-negative" placeholder="Exclude: blurry, ugly, low quality..."
              style="background:#0f3460;border:1px solid #555;border-radius:4px;padding:5px 8px;color:white;font-size:13px;width:180px;outline:none;">
          </div>
        </div>
        <!-- Quick prompt suggestions -->
        <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">
          ${['🌅 Sunset over mountains','🤖 Robot barista in a coffee shop','🐉 Dragon in a neon city','🏯 Japanese temple in cherry blossom','🚀 Astronaut floating in space nebula','🦁 Portrait of a lion king','🌊 Underwater palace','🎭 Masquerade ball in Venice'].map(s=>`
          <button onclick="document.getElementById('img-prompt').value='${s.slice(2)}'" style="background:#0f3460;border:1px solid #333;border-radius:16px;padding:4px 10px;color:#ccc;font-size:11px;cursor:pointer;white-space:nowrap;" onmouseover="this.style.borderColor='#e94560'" onmouseout="this.style.borderColor='#333'">${s}</button>`).join('')}
        </div>
      </div>

      <!-- Gallery -->
      <div style="flex:1;overflow-y:auto;padding:16px;" id="img-gallery">
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;opacity:0.4;gap:12px;">
          <div style="font-size:64px;">🖼️</div>
          <div style="font-size:16px;">Enter a prompt and click Generate</div>
          <div style="font-size:12px;">Powered by Pollinations.AI • Free • No API key needed</div>
        </div>
      </div>

      <!-- Status bar -->
      <div id="img-status" style="background:#0f3460;padding:6px 16px;font-size:12px;color:#aaa;border-top:1px solid #1a1a2e;">
        Ready to generate images
      </div>
    </div>`;
}

function initImageGenerator() {
    window._imgHistory = window._imgHistory || [];
}

async function generateImages() {
    const prompt = document.getElementById('img-prompt')?.value?.trim();
    if (!prompt) {
        const p = document.getElementById('img-prompt');
        if (p) { p.style.borderColor = '#ff4444'; setTimeout(() => p.style.borderColor = '#e94560', 1500); }
        return;
    }

    const style   = document.getElementById('img-style')?.value || '';
    const model   = document.getElementById('img-model')?.value || 'flux';
    const sizeVal = document.getElementById('img-size')?.value || '512,512';
    const count   = parseInt(document.getElementById('img-count')?.value || '1');
    const negative = document.getElementById('img-negative')?.value?.trim() || '';

    const [width, height] = sizeVal.split(',');
    const fullPrompt = [prompt, style].filter(Boolean).join(', ');

    const gallery = document.getElementById('img-gallery');
    const statusEl = document.getElementById('img-status');
    const btn = document.getElementById('img-gen-btn');

    if (btn) { btn.disabled = true; btn.textContent = '⏳ Generating...'; }
    if (statusEl) statusEl.textContent = `Generating ${count} image${count>1?'s':''} · Prompt: "${fullPrompt.slice(0,60)}${fullPrompt.length>60?'...':''}"`;

    // Show loading grid
    gallery.innerHTML = `
      <div style="margin-bottom:12px;padding:8px 12px;background:#0f3460;border-radius:6px;border-left:3px solid #e94560;font-size:13px;">
        <strong style="color:#e94560;">Generating:</strong> ${fullPrompt.slice(0,80)}${fullPrompt.length>80?'...':''}
      </div>
      <div style="display:grid;grid-template-columns:repeat(${count===1?1:2},1fr);gap:12px;">
        ${Array(count).fill(0).map((_,i) => `
        <div id="img-slot-${i}" style="background:#0f3460;border-radius:8px;overflow:hidden;position:relative;min-height:200px;display:flex;align-items:center;justify-content:center;">
          <div style="text-align:center;color:#aaa;">
            <div style="font-size:32px;animation:spin 1.5s linear infinite;display:inline-block;">⏳</div>
            <div style="margin-top:8px;font-size:12px;">Generating image ${i+1}…</div>
          </div>
        </div>`).join('')}
      </div>`;

    // Generate each image
    const seeds = Array(count).fill(0).map(() => Math.floor(Math.random() * 99999));

    const promises = seeds.map((seed, i) => {
        const urlPrompt = encodeURIComponent(fullPrompt + (negative ? ` --no ${negative}` : ''));
        const url = `https://image.pollinations.ai/prompt/${urlPrompt}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=${model}`;

        return new Promise(resolve => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const slot = document.getElementById(`img-slot-${i}`);
                if (slot) {
                    slot.innerHTML = `
                      <img src="${url}" style="width:100%;display:block;border-radius:8px;" title="${fullPrompt}">
                      <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.8));padding:8px 10px;display:flex;gap:6px;align-items:center;">
                        <span style="flex:1;font-size:11px;color:#ccc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">Seed: ${seed}</span>
                        <button onclick="imgDownload('${url}','ai-image-${seed}')" style="background:#e94560;border:none;border-radius:4px;padding:4px 8px;color:white;font-size:11px;cursor:pointer;" title="Download">⬇ Save</button>
                        <button onclick="imgCopyUrl('${url}')" style="background:#0f3460;border:1px solid #555;border-radius:4px;padding:4px 8px;color:white;font-size:11px;cursor:pointer;" title="Copy URL">🔗 URL</button>
                        <button onclick="imgVariation('${encodeURIComponent(fullPrompt)}','${width}','${height}','${model}',${i})" style="background:#0f3460;border:1px solid #555;border-radius:4px;padding:4px 8px;color:white;font-size:11px;cursor:pointer;" title="New variation">🔄</button>
                      </div>`;
                }
                resolve();
            };
            img.onerror = () => {
                const slot = document.getElementById(`img-slot-${i}`);
                if (slot) slot.innerHTML = `<div style="text-align:center;padding:20px;color:#ff6666;">❌ Failed to generate.<br><small>Try a different prompt.</small></div>`;
                resolve();
            };
            img.src = url;
        });
    });

    await Promise.all(promises);

    if (btn) { btn.disabled = false; btn.textContent = '✨ Generate'; }
    if (statusEl) statusEl.textContent = `✅ Generated ${count} image${count>1?'s':''} · Model: ${model} · Size: ${width}×${height}`;

    // Save to history
    window._imgHistory = window._imgHistory || [];
    window._imgHistory.unshift({ prompt: fullPrompt, seeds, width, height, model });
    if (window._imgHistory.length > 20) window._imgHistory.pop();

    addNotification('🎨', 'AI Image Generator', `Generated ${count} image${count>1?'s':''}: "${prompt.slice(0,30)}..."`);
}

function imgDownload(url, name) {
    const a = document.createElement('a');
    a.href = url;
    a.download = (name || 'ai-image') + '.jpg';
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 100);
}

function imgCopyUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
        addNotification('🔗', 'Image Generator', 'Image URL copied to clipboard!');
    }).catch(() => {
        prompt('Copy this URL:', url);
    });
}

async function imgVariation(encodedPrompt, width, height, model, slotIdx) {
    const seed = Math.floor(Math.random() * 99999);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=${model}`;
    const slot = document.getElementById(`img-slot-${slotIdx}`);
    if (!slot) return;
    slot.innerHTML = `<div style="text-align:center;color:#aaa;padding:20px;"><div style="font-size:32px;animation:spin 1.5s linear infinite;display:inline-block;">⏳</div><div style="margin-top:8px;font-size:12px;">Generating variation…</div></div>`;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        slot.innerHTML = `
          <img src="${url}" style="width:100%;display:block;border-radius:8px;">
          <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.8));padding:8px 10px;display:flex;gap:6px;align-items:center;">
            <span style="flex:1;font-size:11px;color:#ccc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">Seed: ${seed}</span>
            <button onclick="imgDownload('${url}','ai-image-${seed}')" style="background:#e94560;border:none;border-radius:4px;padding:4px 8px;color:white;font-size:11px;cursor:pointer;">⬇ Save</button>
            <button onclick="imgVariation('${encodedPrompt}','${width}','${height}','${model}',${slotIdx})" style="background:#0f3460;border:1px solid #555;border-radius:4px;padding:4px 8px;color:white;font-size:11px;cursor:pointer;">🔄</button>
          </div>`;
    };
    img.onerror = () => { slot.innerHTML = `<div style="text-align:center;padding:20px;color:#ff6666;">❌ Failed</div>`; };
    img.src = url;
}

function createXbox() {
    const games = [
        {name:'Halo Infinite',icon:'🎮',genre:'FPS',rating:'★★★★★',players:'Multiplayer'},
        {name:'Forza Horizon 5',icon:'🏎️',genre:'Racing',rating:'★★★★★',players:'Multiplayer'},
        {name:'Sea of Thieves',icon:'🏴‍☠️',genre:'Adventure',rating:'★★★★☆',players:'Multiplayer'},
        {name:'Minecraft',icon:'⛏️',genre:'Sandbox',rating:'★★★★★',players:'Multiplayer'},
        {name:'Age of Empires IV',icon:'⚔️',genre:'Strategy',rating:'★★★★☆',players:'Multiplayer'},
        {name:'Ori and the Wild',icon:'🦊',genre:'Adventure',rating:'★★★★★',players:'Single Player'},
        {name:'Microsoft Flight Simulator',icon:'✈️',genre:'Simulation',rating:'★★★★★',players:'Single/Multi'},
        {name:'Gears 5',icon:'🔫',genre:'TPS',rating:'★★★★☆',players:'Multiplayer'}
    ];
    return `
    <div style="height:100%;display:flex;flex-direction:column;background:#107c10;color:white;">
      <div style="background:rgba(0,0,0,0.2);padding:12px 20px;display:flex;align-items:center;gap:16px;">
        <span style="font-size:28px;">🎮</span>
        <span style="font-size:20px;font-weight:600;">Xbox</span>
        <nav style="display:flex;gap:24px;margin-left:20px;">
          ${['Home','My Games','Game Pass','Store','Friends'].map((n,i)=>`<a style="color:white;text-decoration:none;font-size:14px;opacity:${i===0?1:0.7};border-bottom:${i===0?'2px solid white':'none'};padding-bottom:2px;cursor:pointer;">${n}</a>`).join('')}
        </nav>
        <div style="margin-left:auto;display:flex;align-items:center;gap:12px;">
          <span style="font-size:20px;">🔔</span>
          <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;">😊</div>
        </div>
      </div>
      <div style="flex:1;overflow-y:auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#0e7a0e,#1db91d);border-radius:12px;padding:24px;margin-bottom:24px;display:flex;gap:20px;align-items:center;">
          <span style="font-size:64px;">🎮</span>
          <div>
            <div style="font-size:12px;opacity:0.8;text-transform:uppercase;letter-spacing:1px;">Xbox Game Pass Ultimate</div>
            <div style="font-size:24px;font-weight:700;margin:4px 0;">Play 100+ Games</div>
            <div style="font-size:14px;opacity:0.9;">Access hundreds of games on console, PC, and mobile</div>
            <button style="margin-top:12px;padding:8px 20px;background:white;color:#107c10;border:none;border-radius:4px;cursor:pointer;font-weight:600;font-size:14px;">Join Game Pass</button>
          </div>
        </div>
        <h3 style="margin-bottom:16px;font-size:18px;">My Games & Apps</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;">
          ${games.map(g=>`
          <div onclick="addNotification('🎮','Xbox','Launching ${g.name}...')" style="background:rgba(0,0,0,0.3);border-radius:8px;overflow:hidden;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'">
            <div style="height:100px;background:linear-gradient(135deg,rgba(0,0,0,0.2),rgba(0,0,0,0.5));display:flex;align-items:center;justify-content:center;font-size:48px;">${g.icon}</div>
            <div style="padding:10px 12px;">
              <div style="font-size:13px;font-weight:600;margin-bottom:2px;">${g.name}</div>
              <div style="font-size:11px;opacity:0.7;">${g.genre} • ${g.players}</div>
              <div style="font-size:12px;margin-top:4px;">${g.rating}</div>
            </div>
          </div>`).join('')}
        </div>
      </div>
    </div>`;
}
