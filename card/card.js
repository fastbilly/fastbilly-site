// FastBilly QR card — big, scannable codes for in-person intros.
(function () {
  const TABS = {
    linkedin: { url: 'https://www.linkedin.com/in/billhudak', big: 'Connect on LinkedIn', small: 'linkedin.com/in/billhudak', color: '#0A66C2',
      icon: '<svg viewBox="0 0 24 24"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4v11H3zM9.5 9.5h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6v5.4h-4v-4.8c0-1.2 0-2.7-1.6-2.7s-1.9 1.3-1.9 2.6v4.9h-4z" fill="currentColor"/></svg>' },
    whatsapp: { url: null, big: 'Message me on WhatsApp', small: '', color: '#25D366', locked: true,
      icon: '<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>' },
    instagram: { url: 'https://www.instagram.com/fastbilly/', big: 'Follow @fastbilly', small: 'instagram.com/fastbilly', color: '#D62976',
      icon: '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="3.8" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>' },
    site: { url: 'https://fastbilly.com', big: 'fastbilly.com', small: 'Work, stack, contact form', color: '#211E24',
      icon: '<svg viewBox="0 0 40 32"><path d="M2 28 L9 10 L14 22 L20 6 L26 22 L31 10 L38 28 Z" fill="none" stroke="#FF6BD8" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/></svg>' }
  };

  const $ = (id) => document.getElementById(id);
  const tile = $('qrTile'), qrView = $('qrView'), lockView = $('lockView'), label = $('label'), openLink = $('openLink'), relock = $('relock');
  let wa = null, current = 'linkedin';

  function qrSvg(text) {
    const qr = qrcode(0, 'H');
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += 'M' + c + ' ' + r + 'h1v1h-1z';
    return '<svg viewBox="-1 -1 ' + (n + 2) + ' ' + (n + 2) + '" shape-rendering="crispEdges" role="img" aria-label="QR code"><path d="' + d + '" fill="#111"/></svg>';
  }

  function render(tab) {
    const t = TABS[tab];
    current = tab;
    document.querySelectorAll('.tab').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === tab ? 'true' : 'false'));
    try { localStorage.setItem('fb-card-tab', tab); } catch (e) {}
    history.replaceState(null, '', '#' + tab);

    const url = tab === 'whatsapp' ? (wa && wa.url) : t.url;
    if (!url) {
      qrView.hidden = true; lockView.hidden = false; label.innerHTML = ''; openLink.hidden = true; relock.hidden = true;
      return;
    }
    lockView.hidden = true; qrView.hidden = false; openLink.hidden = false;
    tile.innerHTML = qrSvg(url) + '<div class="badge"><span style="background:' + t.color + '">' + t.icon + '</span></div>';
    const small = tab === 'whatsapp' ? wa.display : t.small;
    label.innerHTML = '<span class="big">' + t.big + '</span><span class="small">' + small + '</span>';
    openLink.href = url;
    openLink.textContent = tab === 'whatsapp' ? 'Open WhatsApp ↗' : 'Open link ↗';
    relock.hidden = tab !== 'whatsapp';
  }

  // WhatsApp details ship only as AES-GCM ciphertext (card/wa.enc.json). The PIN derives the key
  // on this device; once unlocked, the link is remembered here until "Lock" is tapped.
  const STORE = 'fb-card-wa';
  function checkWa() {
    try { const s = JSON.parse(localStorage.getItem(STORE) || 'null'); if (s && s.url) wa = s; } catch (e) {}
    return Promise.resolve();
  }
  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  async function decryptWa(pin) {
    const blob = await (await fetch('./wa.enc.json', { cache: 'no-store' })).json();
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(blob.salt), iterations: blob.iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(blob.iv) }, key, b64(blob.ct));
    return JSON.parse(new TextDecoder().decode(pt));
  }

  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => render(b.dataset.tab)));

  // Arrow-key support across the tab list.
  document.querySelector('.tabs').addEventListener('keydown', (e) => {
    const keys = Object.keys(TABS); const i = keys.indexOf(current);
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const next = keys[(i + (e.key === 'ArrowRight' ? 1 : keys.length - 1)) % keys.length];
      render(next); document.querySelector('[data-tab="' + next + '"]').focus();
    }
  });

  $('pinForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pin = $('pin').value.replace(/\D/g, '');
    const btn = $('pinBtn'), msg = $('pinMsg');
    if (!pin) { msg.textContent = 'Enter the PIN.'; return; }
    btn.disabled = true; msg.style.color = 'var(--muted)'; msg.textContent = 'Unlocking…';
    try {
      wa = await decryptWa(pin);
      try { localStorage.setItem(STORE, JSON.stringify(wa)); } catch (e2) {}
      $('pin').value = ''; msg.textContent = ''; render('whatsapp');
    } catch (err) {
      await new Promise((r) => setTimeout(r, 600));
      msg.style.color = ''; msg.textContent = 'That PIN didn\u2019t work.';
    }
    btn.disabled = false;
  });

  relock.addEventListener('click', async () => {
    try { localStorage.removeItem(STORE); } catch (e) {}
    wa = null; render('whatsapp');
  });

  // Hide the add-to-home tip when already launched from the home screen.
  if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) $('hint').hidden = true;

  const fromHash = (location.hash || '').slice(1);
  let start = TABS[fromHash] ? fromHash : null;
  if (!start) { try { start = localStorage.getItem('fb-card-tab'); } catch (e) {} }
  if (!TABS[start]) start = 'linkedin';
  render(start === 'whatsapp' ? 'linkedin' : start);
  checkWa().then(() => { if (start === 'whatsapp' || current === 'whatsapp') render('whatsapp'); });
})();
