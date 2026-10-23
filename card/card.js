// FastBilly QR card — scannable codes for anyone, plus Bill's PIN-locked pocket tools.
// Private content (WhatsApp, demos, event guide, Meet key) ships only as AES-GCM ciphertext in vault.enc.json.
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const getC = (k) => { try { const m = document.cookie.split('; ').find((c) => c.startsWith(k + '=')); return m ? decodeURIComponent(m.slice(k.length + 1)) : null; } catch (e) { return null; } };
  const setC = (k, v, days) => { try { document.cookie = k + '=' + encodeURIComponent(v) + '; Max-Age=' + Math.round(days * 86400) + '; Path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : ''); } catch (e) {} };

  const ICON = {
    li: '<svg viewBox="0 0 24 24"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4v11H3zM9.5 9.5h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6v5.4h-4v-4.8c0-1.2 0-2.7-1.6-2.7s-1.9 1.3-1.9 2.6v4.9h-4z" fill="currentColor"/></svg>',
    wa: '<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    ig: '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="3.8" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>',
    fb: '<svg viewBox="0 0 40 32"><path d="M2 28 L9 10 L14 22 L20 6 L26 22 L31 10 L38 28 Z" fill="none" stroke="#FF6BD8" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/></svg>',
    mic: '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    cam: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M4 8h3l2-2.5h6L17 8h3v11H4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="13.5" r="3.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>'
  };

  const TABS = {
    linkedin: { url: 'https://www.linkedin.com/in/billhudak', big: 'Connect on LinkedIn', small: 'linkedin.com/in/billhudak', color: '#0A66C2', icon: ICON.li },
    whatsapp: { url: null, big: 'Message me on WhatsApp', small: '', color: '#25D366', icon: ICON.wa },
    instagram: { url: 'https://www.instagram.com/fastbilly/', big: 'Follow @fastbilly', small: 'instagram.com/fastbilly', color: '#D62976', icon: ICON.ig },
    site: { url: 'https://fastbilly.com', big: 'fastbilly.com', small: 'Work, stack, contact form', color: '#211E24', icon: ICON.fb }
  };

  const tile = $('qrTile'), qrView = $('qrView'), lockView = $('lockView'), label = $('label'), openLink = $('openLink'), relock = $('relock');
  let vault = null, current = 'linkedin';

  function qrSvg(text, ec) {
    const qr = qrcode(0, ec || 'H');
    qr.addData(text); qr.make();
    const n = qr.getModuleCount(); let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += 'M' + c + ' ' + r + 'h1v1h-1z';
    return '<svg viewBox="-1 -1 ' + (n + 2) + ' ' + (n + 2) + '" shape-rendering="crispEdges" role="img" aria-label="QR code"><path d="' + d + '" fill="#111"/></svg>';
  }

  // ---------- Vault ----------
  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const toB64 = (buf) => btoa(String.fromCharCode.apply(null, new Uint8Array(buf)));
  let blobP = null;
  const getBlob = () => (blobP = blobP || fetch('./vault.enc.json', { cache: 'no-store' }).then((r) => r.json()));
  async function openWithKey(key) {
    const blob = await getBlob();
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(blob.iv) }, key, b64(blob.ct));
    return JSON.parse(new TextDecoder().decode(pt));
  }
  async function unlock(pin) {
    const blob = await getBlob();
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(blob.salt), iterations: blob.iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, true, ['decrypt']);
    vault = await openWithKey(key);
    setC('fb_vk', toB64(await crypto.subtle.exportKey('raw', key)), 365); // remembered on this device only
    onUnlocked();
  }
  async function restore() {
    const raw = getC('fb_vk');
    if (!raw) return;
    try {
      const key = await crypto.subtle.importKey('raw', b64(raw), { name: 'AES-GCM' }, false, ['decrypt']);
      vault = await openWithKey(key);
      onUnlocked();
    } catch (e) { setC('fb_vk', '', 0); }
  }
  function lockAll() { vault = null; setC('fb_vk', '', 0); $('pocket').hidden = true; $('toolsLock').hidden = false; render(current); }
  function onUnlocked() { $('pocket').hidden = false; $('toolsLock').hidden = true; render(current); }

  // ---------- QR tabs ----------
  function render(tab) {
    const t = TABS[tab]; current = tab;
    document.querySelectorAll('.tab').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === tab ? 'true' : 'false'));
    setC('fb_card_tab', tab, 365);
    history.replaceState(null, '', '#' + tab);
    const wa = vault && vault.whatsapp;
    const url = tab === 'whatsapp' ? (wa && wa.url) : t.url;
    if (!url) { qrView.hidden = true; lockView.hidden = false; label.innerHTML = ''; openLink.hidden = true; relock.hidden = true; return; }
    lockView.hidden = true; qrView.hidden = false; openLink.hidden = false;
    tile.innerHTML = qrSvg(url) + '<div class="badge"><span style="background:' + t.color + '">' + t.icon + '</span></div>';
    label.innerHTML = '<span class="big">' + t.big + '</span><span class="small">' + esc(tab === 'whatsapp' ? wa.display : t.small) + '</span>';
    openLink.href = url;
    openLink.textContent = tab === 'whatsapp' ? 'Open WhatsApp ↗' : 'Open link ↗';
    relock.hidden = tab !== 'whatsapp';
  }
  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => render(b.dataset.tab)));
  document.querySelector('.tabs').addEventListener('keydown', (e) => {
    const keys = Object.keys(TABS), i = keys.indexOf(current);
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const next = keys[(i + (e.key === 'ArrowRight' ? 1 : keys.length - 1)) % keys.length];
      render(next); document.querySelector('[data-tab="' + next + '"]').focus();
    }
  });

  async function tryPin(input, msg, btn) {
    const pin = input.value.replace(/\D/g, '');
    if (!pin) { msg.textContent = 'Enter the PIN.'; return false; }
    btn.disabled = true; msg.style.color = 'var(--muted)'; msg.textContent = 'Unlocking…';
    try { await unlock(pin); input.value = ''; msg.textContent = ''; btn.disabled = false; return true; }
    catch (err) { await new Promise((r) => setTimeout(r, 600)); msg.style.color = ''; msg.textContent = 'That PIN didn\u2019t work.'; btn.disabled = false; return false; }
  }
  $('pinForm').addEventListener('submit', async (e) => { e.preventDefault(); if (await tryPin($('pin'), $('pinMsg'), $('pinBtn'))) render('whatsapp'); });
  relock.addEventListener('click', lockAll);

  // ---------- Sheet ----------
  const sheet = $('sheet'), body = $('sheetBody');
  function openSheet(title, html) { $('sheetTitle').textContent = title; body.innerHTML = html; sheet.hidden = false; body.scrollTop = 0; document.body.style.overflow = 'hidden'; }
  function closeSheet() { stopMic(); sheet.hidden = true; body.innerHTML = ''; document.body.style.overflow = ''; }
  $('sheetClose').addEventListener('click', closeSheet);

  $('toolsLock').addEventListener('click', () => {
    openSheet("Bill's tools", '<p class="lede">Hand-off follow-ups, show &amp; tell, people and today\u2019s guide. PIN once per device.</p>' +
      '<form class="pin-row" id="toolsPinForm" autocomplete="off"><input id="toolsPin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="12" placeholder="PIN" aria-label="PIN" /><button type="submit" id="toolsPinBtn">Unlock</button></form><div class="pin-msg" id="toolsPinMsg" role="status"></div>');
    $('toolsPin').focus();
    $('toolsPinForm').addEventListener('submit', async (e) => { e.preventDefault(); if (await tryPin($('toolsPin'), $('toolsPinMsg'), $('toolsPinBtn'))) closeSheet(); });
  });
  document.querySelectorAll('#pocket button').forEach((b) => b.addEventListener('click', () => MODES[b.dataset.mode]()));

  // ---------- Voice (Web Speech API where the browser has it) ----------
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null;
  function stopMic() { if (rec) { try { rec.stop(); } catch (e) {} rec = null; } document.querySelectorAll('.mic.on').forEach((m) => m.classList.remove('on')); }
  function micButton(targetId) { return SR ? '<button type="button" class="mic" data-target="' + targetId + '" aria-label="Dictate">' + ICON.mic + '</button>' : ''; }
  function wireMics(root) {
    root.querySelectorAll('.mic').forEach((m) => m.addEventListener('click', () => {
      if (m.classList.contains('on')) { stopMic(); return; }
      stopMic();
      const ta = $(m.dataset.target); const start = ta.value ? ta.value.trim() + ' ' : '';
      rec = new SR(); rec.lang = 'en-US'; rec.interimResults = true; rec.continuous = true;
      rec.onresult = (ev) => { let s = ''; for (let i = 0; i < ev.results.length; i++) s += ev.results[i][0].transcript; ta.value = start + s; };
      rec.onend = () => m.classList.remove('on');
      rec.onerror = () => m.classList.remove('on');
      try { rec.start(); m.classList.add('on'); } catch (e) {}
    }));
  }

  // ---------- Photo → small JPEG ----------
  function shrink(file) {
    return new Promise((resolve) => {
      const img = new Image(); const url = URL.createObjectURL(file);
      img.onload = () => {
        const s = 360 / Math.max(img.width, img.height), w = Math.round(img.width * Math.min(1, s)), h = Math.round(img.height * Math.min(1, s));
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        try { resolve(cv.toDataURL('image/jpeg', 0.72)); } catch (e) { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  async function meet(action, payload) {
    const r = await fetch(vault.meet.url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-meet-key': vault.meet.key }, body: JSON.stringify(Object.assign({ action }, payload || {})) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Request failed');
    return j;
  }
  const eventName = () => getC('fb_event') || (vault && vault.meet.event) || 'the event';
  const firstName = (n) => String(n || '').trim().split(/\s+/)[0] || 'there';
  const sign = () => '\n\nBill Hudak\nfastbilly.com · linkedin.com/in/billhudak' + (vault ? ' · WhatsApp ' + vault.whatsapp.display : '');
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const mailHref = (to, note) => 'mailto:' + encodeURIComponent(to || '') + '?subject=' + encodeURIComponent('Great meeting you at ' + eventName()) + '&body=' + encodeURIComponent(note + sign());
  const smsHref = (to, note) => 'sms:' + String(to || '').replace(/[^\d+]/g, '') + (isIOS ? '&' : '?') + 'body=' + encodeURIComponent(note + '\n\n— Bill · fastbilly.com');
  const fallbackNote = (c) => 'Hi ' + firstName(c.name) + ', great meeting you at ' + eventName() + '. ' + (c.building ? 'I liked hearing about ' + c.building.replace(/\.$/, '') + '. ' : '') + 'Let\u2019s keep the conversation going. Here\u2019s my info so we stay in touch.';

  // ---------- Modes ----------
  const TOPICS = ['Retention & LTV', 'AI apps for my business', 'Partnership', 'Hiring', 'Happy hour / dinner', "Let's ride"];
  const MODES = {
    handoff() {
      openSheet('Hand off', '<form id="hoForm" novalidate>' +
        '<h2 class="h-hello">Hey, I\u2019m Bill.<br><em>Let\u2019s stay in touch.</em></h2>' +
        '<p class="h-sub">Drop your info and my AI writes your follow-up in about five seconds. Then you send it to yourself.</p>' +
        '<label class="f"><span>Your name</span><input name="name" autocomplete="off" autocapitalize="words" required maxlength="120" /></label>' +
        '<div class="row2"><label class="f"><span>Email</span><input name="email" type="email" inputmode="email" autocomplete="off" autocapitalize="off" maxlength="200" /></label>' +
        '<label class="f"><span>Mobile</span><input name="phone" type="tel" inputmode="tel" autocomplete="off" maxlength="40" /></label></div>' +
        '<div class="row2"><label class="f"><span>Brand / company</span><input name="company" autocomplete="off" maxlength="160" /></label>' +
        '<label class="f"><span>Your role</span><input name="role" autocomplete="off" maxlength="120" /></label></div>' +
        '<label class="f"><span>What are you building? ' + (SR ? 'Tap the mic and just tell me.' : '') + '</span><span class="mic-wrap"><textarea id="hoBuilding" name="building" maxlength="1500" placeholder="A sentence or two is perfect"></textarea>' + micButton('hoBuilding') + '</span></label>' +
        '<div class="f"><span>What should we talk about next?</span></div><div class="chips">' + TOPICS.map((t) => '<label><input type="checkbox" name="topics" value="' + esc(t) + '"><span>' + esc(t) + '</span></label>').join('') + '</div>' +
        '<label class="photo" id="photoLbl"><span class="ph" id="photoPh">' + ICON.cam + '</span><span><b>Snap a selfie with Bill</b><small>Optional. No name badges here, so it helps me remember.</small></span><input type="file" accept="image/*" capture="user" id="photoIn"></label>' +
        '<button class="big-btn" type="submit" id="hoGo">Write my follow-up</button>' +
        '<p class="err" id="hoErr" role="status"></p>' +
        '<p class="fine">Saved privately for Bill. Nothing is sent until you tap send.</p></form>');
      wireMics(body);
      let photo = null;
      $('photoIn').addEventListener('change', async (e) => {
        const f = e.target.files && e.target.files[0]; if (!f) return;
        photo = await shrink(f);
        if (photo) $('photoPh').outerHTML = '<img src="' + photo + '" alt="Selfie preview">';
      });
      $('hoForm').addEventListener('submit', async (e) => {
        e.preventDefault(); stopMic();
        const fd = new FormData(e.target);
        const c = { name: (fd.get('name') || '').trim(), email: (fd.get('email') || '').trim(), phone: (fd.get('phone') || '').trim(), company: (fd.get('company') || '').trim(), role: (fd.get('role') || '').trim(), building: (fd.get('building') || '').trim(), topics: fd.getAll('topics'), photo };
        if (!c.name) { $('hoErr').textContent = 'Add your name.'; return; }
        if (!c.email && !c.phone) { $('hoErr').textContent = 'Add an email or mobile so you can send yourself the note.'; return; }
        thinking(c);
        let note = null;
        try { const r = await meet('save', { event: eventName(), contact: c }); note = r.followup; c.id = r.id; } catch (err) { c.saveFailed = true; }
        result(c, note || fallbackNote(c));
      });
    },
    async demos() {
      openSheet('Show & tell', '<p class="lede"><b>Recent builds.</b> Each one took an hour or two with Perplexity Computer, from first prompt to a live link.</p>' +
        vault.demos.map((d) => '<article class="demo"><div class="demo-tag">' + esc(d.tag) + '</div><h3>' + esc(d.title) + '</h3><p>' + esc(d.what) + '</p>' + (d.tip ? '<p class="tip">' + esc(d.tip) + '</p>' : '') +
          '<div class="demo-links">' + d.links.map((l, i) => '<a class="pill-btn' + (i === 0 ? ' hot' : '') + '" href="' + esc(l[1]) + '" target="_blank" rel="noopener">' + esc(l[0]) + ' ↗</a>').join('') +
          '<button class="pill-btn" data-qr="' + esc(d.links[0][1]) + '">QR for their phone</button></div><div class="demo-qr" hidden></div></article>').join('') +
        '<p class="fine">Private. These only appear on devices you\u2019ve unlocked.</p>');
      body.querySelectorAll('[data-qr]').forEach((b) => b.addEventListener('click', () => {
        const box = b.parentElement.nextElementSibling;
        if (box.hidden) { box.innerHTML = qrSvg(b.dataset.qr, 'M'); box.hidden = false; b.textContent = 'Hide QR'; } else { box.hidden = true; b.textContent = 'QR for their phone'; }
      }));
    },
    async people() {
      openSheet('People', '<div class="think" id="pLoad"><div class="orb"></div><div class="think-line">Loading your people…</div></div>');
      let list;
      try { list = (await meet('list')).contacts || []; } catch (e) { body.innerHTML = '<p class="err">Couldn\u2019t load. Check your connection and try again.</p>'; return; }
      if (!list.length) { body.innerHTML = '<p class="lede">No one yet. Tap <b>Hand off</b> and give someone your phone.</p>'; return; }
      body.innerHTML = '<p class="lede"><b>' + list.length + '</b> ' + (list.length === 1 ? 'person' : 'people') + '. Ask Perplexity to draft follow-ups for everyone and it will show you drafts first.</p>' + list.map((p) => {
        const when = new Date(p.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
        return '<article class="person" data-id="' + esc(p.id) + '"><div class="p-head">' + (p.photo ? '<img src="' + esc(p.photo) + '" alt="">' : '<span class="ph">' + esc(firstName(p.name)[0] || '?') + '</span>') +
          '<div><div class="p-name">' + esc(p.name) + '</div><div class="p-meta">' + esc([p.role, p.company].filter(Boolean).join(' · ')) + '</div><div class="p-meta">' + esc(when) + (p.followed_up_at ? ' · <span class="done-badge">FOLLOWED UP</span>' : '') + '</div></div></div>' +
          '<div class="p-body">' + (p.building ? '<div><b>Building:</b> ' + esc(p.building) + '</div>' : '') + (p.topics && p.topics.length ? '<div><b>Talk about:</b> ' + esc(p.topics.join(', ')) + '</div>' : '') +
          (p.email ? '<div>' + esc(p.email) + '</div>' : '') + (p.phone ? '<div>' + esc(p.phone) + '</div>' : '') + '</div>' +
          '<label class="f" style="margin-top:10px"><span>Your note</span><span class="mic-wrap"><textarea id="bn-' + esc(p.id) + '" placeholder="What to remember about them">' + esc(p.bill_note || '') + '</textarea>' + micButton('bn-' + p.id) + '</span></label>' +
          '<div class="p-actions"><button class="pill-btn hot" data-save>Save note</button>' +
          (p.email ? '<a class="pill-btn" href="' + mailHref(p.email, p.followup || fallbackNote(p)) + '">Email</a>' : '') +
          (p.phone ? '<a class="pill-btn" href="' + smsHref(p.phone, p.followup || fallbackNote(p)) + '">Text</a>' : '') +
          (p.followed_up_at ? '' : '<button class="pill-btn" data-done>Mark followed up</button>') + '</div></article>';
      }).join('');
      wireMics(body);
      body.querySelectorAll('.person').forEach((el) => {
        const id = el.dataset.id;
        el.querySelector('[data-save]').addEventListener('click', async (e) => { const b = e.target; b.disabled = true; try { await meet('note', { id, bill_note: $('bn-' + id).value }); b.textContent = 'Saved'; } catch (err) { b.textContent = 'Retry'; } b.disabled = false; });
        const d = el.querySelector('[data-done]');
        if (d) d.addEventListener('click', async () => { d.disabled = true; try { await meet('followed', { id }); d.outerHTML = '<span class="done-badge">FOLLOWED UP</span>'; } catch (err) { d.disabled = false; } });
      });
    },
    today() {
      openSheet('Today', vault.guide +
        '<div class="settings"><h3>Settings</h3>' +
        '<label class="f"><span>Event name in follow-ups</span><input id="setEvent" value="' + esc(eventName()) + '" maxlength="80"></label>' +
        '<label class="f"><span>After-party WhatsApp group invite link</span><input id="setGroup" value="' + esc(getC('fb_group') || '') + '" placeholder="https://chat.whatsapp.com/…" inputmode="url" autocapitalize="off"></label>' +
        '<button class="big-btn alt" id="setSave">Save settings</button><p class="fine" id="setMsg"></p>' +
        '<button class="tools-lock" id="lockBtn" style="opacity:1">Lock Bill\u2019s tools on this device</button></div>');
      $('setSave').addEventListener('click', () => {
        const g = $('setGroup').value.trim();
        if (g && !/^https:\/\/chat\.whatsapp\.com\//.test(g)) { $('setMsg').textContent = 'Group links start with https://chat.whatsapp.com/'; return; }
        setC('fb_group', g, 30); setC('fb_event', $('setEvent').value.trim() || vault.meet.event, 30);
        $('setMsg').textContent = 'Saved on this device.';
      });
      $('lockBtn').addEventListener('click', () => { closeSheet(); lockAll(); });
    }
  };

  function thinking(c) {
    const lines = ['Saving your info', c.company ? 'Looking up ' + c.company : 'Reading what you\u2019re building', 'Writing a note from Bill'];
    body.innerHTML = '<div class="think"><div class="orb"></div><div class="think-line" id="tl">' + esc(lines[0]) + '…</div><div class="think-sub">Perplexity · live</div></div>';
    let i = 0; const iv = setInterval(() => { const el = $('tl'); if (!el) return clearInterval(iv); i = Math.min(i + 1, lines.length - 1); el.textContent = lines[i] + '…'; }, 1700);
  }

  function result(c, note) {
    const group = getC('fb_group');
    body.innerHTML = '<h2 class="h-hello">Here you go, <em>' + esc(firstName(c.name)) + '.</em></h2>' +
      '<div class="note"><div class="note-k">YOUR FOLLOW-UP FROM BILL · EDIT ANYTHING</div><textarea id="noteTa">' + esc(note) + '</textarea></div>' +
      '<div class="stack">' +
      (c.email ? '<a class="big-btn" id="sendMail" href="#">Email it to me</a>' : '') +
      (c.phone ? '<a class="big-btn' + (c.email ? ' alt' : '') + '" id="sendSms" href="#">Text it to me</a>' : '') + '</div>' +
      '<div class="qr-mini"><div class="qrw">' + qrSvg(vault.vcard, 'M') + '</div><div><b>Save Bill\u2019s contact</b><small>Scan with your camera.</small></div></div>' +
      (group ? '<div class="qr-mini"><div class="qrw">' + qrSvg(group, 'M') + '</div><div><b>Join the crew</b><small>WhatsApp group for happy hour and dinner plans.</small></div></div>' : '') +
      (c.saveFailed ? '<p class="err">Heads up: this didn\u2019t save to Bill\u2019s list (no signal?). Sending it to yourself still works.</p>' : '') +
      '<div style="margin-top:18px"><button class="big-btn alt" id="handBack">Done · hand the phone back</button></div>';
    const ta = $('noteTa');
    if ($('sendMail')) $('sendMail').addEventListener('click', (e) => { e.currentTarget.href = mailHref(c.email, ta.value); });
    if ($('sendSms')) $('sendSms').addEventListener('click', (e) => { e.currentTarget.href = smsHref(c.phone, ta.value); });
    $('handBack').addEventListener('click', closeSheet);
  }

  // ---------- Boot ----------
  if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) $('hint').hidden = true;
  else if (/Android/i.test(navigator.userAgent)) $('hint').textContent = 'Tip: Chrome menu (\u22ee) \u2192 Add to Home screen opens this card in one tap.';
  const fromHash = (location.hash || '').slice(1);
  let start = TABS[fromHash] ? fromHash : getC('fb_card_tab');
  if (!TABS[start]) start = 'linkedin';
  render(start === 'whatsapp' ? 'linkedin' : start);
  restore().then(() => { if (start === 'whatsapp') render('whatsapp'); });
})();
