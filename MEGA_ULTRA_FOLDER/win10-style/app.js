/* app.js - interactive bits for Win10-ish demo */

(function(){
  const startBtn = document.getElementById('start-btn');
  const startMenu = document.getElementById('start-menu');
  const tiles = document.querySelectorAll('.tile, .sm-tile, .tb-btn');
  const windowsArea = document.getElementById('windows');
  const clockEl = document.getElementById('clock');
  let zIndexCounter = 100;

  // Clock
  function updateClock(){
    const d = new Date();
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    clockEl.textContent = `${hh}:${mm}`;
  }
  updateClock();
  setInterval(updateClock, 1000*15);

  // Toggle start menu
  startBtn.addEventListener('click', () => {
    const visible = startMenu.style.display === 'block';
    startMenu.style.display = visible ? 'none' : 'block';
  });

  // Clicking outside closes start menu
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#start-menu') && !e.target.closest('#start-btn')) {
      startMenu.style.display = 'none';
    }
  });

  // Launch app windows when tiles clicked
  tiles.forEach(el => {
    el.addEventListener('click', (ev) => {
      const app = el.dataset.app;
      if(!app) return;
      openAppWindow(app);
      ev.stopPropagation();
    });
  });

  function openAppWindow(app){
    const win = document.createElement('div');
    win.className = 'app-window';
    win.style.left = `${60 + Math.random()*260}px`;
    win.style.top = `${40 + Math.random()*120}px`;
    win.style.zIndex = ++zIndexCounter;
    win.innerHTML = `
      <div class="app-title">
        <div class="name">${capitalize(app)}</div>
        <div>
          <button class="min">—</button>
          <button class="close">✕</button>
        </div>
      </div>
      <div class="app-content">${appContent(app)}</div>
    `;
    windowsArea.appendChild(win);

    // Make draggable (simple)
    makeDraggable(win);

    // close button
    win.querySelector('.close').addEventListener('click', () => win.remove());
    win.querySelector('.min').addEventListener('click', () => win.style.display = 'none');

    // focus on click
    win.addEventListener('mousedown', () => win.style.zIndex = ++zIndexCounter);
  }

  function capitalize(s){ return (s||'App').charAt(0).toUpperCase() + (s||'app').slice(1); }

  function appContent(app){
    switch(app){
      case 'browser':
        return `<p>Welcome to the demo browser — type an address (fake)</p>
                <input placeholder="https://example.com" style="width:100%; padding:8px; border-radius:6px; border:1px solid rgba(255,255,255,0.06); background:transparent; color:inherit;">`;
      case 'explorer':
        return `<p>Files:</p><ul><li>Documents</li><li>Pictures</li><li>Music</li></ul>`;
      case 'music':
        return `<p>Groove is playing (not really). Enjoy the tile animation!</p>`;
      case 'settings':
        return `<p>Settings: theme, accounts, updates (demo-only)</p>`;
      default:
        return `<p>${app} — a neat demo app window</p>`;
    }
  }

  // Very simple drag
  function makeDraggable(el){
    const title = el.querySelector('.app-title');
    let offsetX=0, offsetY=0, dragging=false;
    title.style.cursor='grab';
    title.addEventListener('mousedown', (e)=>{
      dragging = true;
      title.style.cursor='grabbing';
      const rect = el.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
    function onMove(e){
      if(!dragging) return;
      el.style.left = Math.max(6, e.clientX - offsetX) + 'px';
      el.style.top = Math.max(6, e.clientY - offsetY) + 'px';
    }
    function onUp(){
      dragging=false;
      title.style.cursor='grab';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
  }

  // small keyboard shortcut: Win key / Meta to toggle start
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Meta') {
      startMenu.style.display = startMenu.style.display === 'block' ? 'none' : 'block';
      e.preventDefault();
    }
    if(e.key === 'Escape'){
      startMenu.style.display = 'none';
    }
  });

  // bonus: tile drag-to-random wobble
  document.querySelectorAll('.tile').forEach(t => {
    t.addEventListener('mouseenter', () => {
      t.animate([{ transform: 'translateY(0px)' }, { transform: 'translateY(-6px) rotate(-1deg)' }, { transform: 'translateY(0px)' }], { duration: 540, iterations: 1 });
    });
  });

  // Example startup: open Files window
  setTimeout(()=> openAppWindow('explorer'), 800);

})();
