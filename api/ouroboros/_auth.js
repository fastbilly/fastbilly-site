const crypto = require('crypto');
const COOKIE = 'obr_s';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function pins() { try { return JSON.parse(process.env.OUROBOROS_PINS || '{}'); } catch { return {}; } }
function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET not configured');
  return s;
}
const sign = p => crypto.createHmac('sha256', secret()).update(p).digest('base64url');
function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
function issue(viewer) {
  const body = Buffer.from(JSON.stringify({ v: viewer, e: Date.now() + MAX_AGE * 1000 })).toString('base64url');
  return body + '.' + sign(body);
}
function readCookie(req) {
  const m = (req.headers.cookie || '').split(/;\s*/).find(c => c.startsWith(COOKIE + '='));
  return m ? decodeURIComponent(m.slice(COOKIE.length + 1)) : null;
}
// Valid only while the viewer's PIN still exists, so removing a PIN revokes that person's access.
function verify(req) {
  const tok = readCookie(req);
  if (!tok || !tok.includes('.')) return null;
  const [body, sig] = tok.split('.');
  if (!safeEqual(sig, sign(body))) return null;
  let d; try { d = JSON.parse(Buffer.from(body, 'base64url').toString()); } catch { return null; }
  if (!d || Date.now() > d.e) return null;
  return Object.values(pins()).includes(d.v) ? d.v : null;
}
function setCookie(res, value, maxAge) {
  res.setHeader('Set-Cookie', `${COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`);
}
module.exports = { pins, issue, verify, setCookie, safeEqual, MAX_AGE };
