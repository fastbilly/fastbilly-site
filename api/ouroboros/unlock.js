const { pins, issue, setCookie, safeEqual, MAX_AGE } = require('./_auth');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  let pin = '';
  try { pin = String((req.body && req.body.pin) || '').replace(/\D/g, '').slice(0, 12); } catch {}
  let viewer = null;
  for (const [p, name] of Object.entries(pins())) if (safeEqual(p, pin)) viewer = name;
  if (!viewer) {
    await new Promise(r => setTimeout(r, 900)); // slow down guessing
    console.log(JSON.stringify({ event: 'ouroboros_pin_fail', at: new Date().toISOString() }));
    return res.status(401).json({ ok: false });
  }
  console.log(JSON.stringify({ event: 'ouroboros_unlock', viewer, at: new Date().toISOString() }));
  setCookie(res, issue(viewer), MAX_AGE);
  res.status(200).json({ ok: true });
};
