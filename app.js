// FastBilly hub — light interactions
(function () {
  const root = document.documentElement;

  // Theme: remember the visitor's choice on this device.
  try {
    const saved = localStorage.getItem('fb-theme');
    if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
  } catch (e) {}
  const btn = document.getElementById('themeToggle');
  if (btn) btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('fb-theme', next); } catch (e) {}
  });

  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Links that pre-pick a contact topic, e.g. "Let's ride".
  document.querySelectorAll('[data-topic]').forEach((a) => {
    a.addEventListener('click', () => {
      const t = a.getAttribute('data-topic');
      const r = document.querySelector('input[name="topic"][value="' + t + '"]');
      if (r) r.checked = true;
    });
  });
  const params = new URLSearchParams(location.search);
  if (params.get('topic')) {
    const r = document.querySelector('input[name="topic"][value="' + params.get('topic') + '"]');
    if (r) r.checked = true;
  }

  // Contact form → email relay. Opens the visitor's mail app only if the relay fails.
  const form = document.getElementById('contactForm');
  if (!form) return;
  const status = document.getElementById('formStatus');
  const send = document.getElementById('sendBtn');
  const ENDPOINT = 'https://formsubmit.co/ajax/billy@fastbilly.com';

  const setStatus = (msg, kind) => { status.textContent = msg; status.className = 'form-status' + (kind ? ' ' + kind : ''); };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    if (data._honey) return; // bot

    let bad = null;
    ['name', 'email', 'message'].forEach((k) => {
      const el = form.elements[k];
      const v = (data[k] || '').trim();
      const invalid = !v || (k === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
      el.setAttribute('aria-invalid', invalid ? 'true' : 'false');
      if (invalid && !bad) bad = el;
    });
    if (bad) { setStatus('Add your name, a valid email and a short note.', 'err'); bad.focus(); return; }

    send.disabled = true; send.textContent = 'Sending…'; setStatus('');
    const payload = {
      name: data.name.trim(),
      email: data.email.trim(),
      topic: data.topic || 'Something else',
      message: data.message.trim(),
      _subject: 'FastBilly · ' + (data.topic || 'Note') + ' · from ' + data.name.trim(),
      _template: 'table',
      _captcha: 'false'
    };
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || String(out.success) !== 'true') throw new Error(out.message || 'relay');
      form.reset();
      setStatus('Got it. Thanks, ' + payload.name.split(' ')[0] + '. I\u2019ll get back to you soon.', 'ok');
    } catch (err) {
      const body = encodeURIComponent(payload.message + '\n\n— ' + payload.name + ' (' + payload.email + ')');
      const link = 'mailto:billy@fastbilly.com?subject=' + encodeURIComponent(payload._subject) + '&body=' + body;
      status.className = 'form-status err';
      status.innerHTML = 'That didn\u2019t go through. <a href="' + link + '">Send it by email instead</a>.';
    } finally {
      send.disabled = false; send.textContent = 'Send it';
    }
  });
})();
