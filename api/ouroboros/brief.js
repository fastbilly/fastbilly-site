const crypto = require('crypto');
const { verify } = require('./_auth');
const enc = require('./_brief.enc.json'); // AES-256-GCM ciphertext; key lives only in Vercel env

function decrypt() {
  const key = Buffer.from(process.env.OUROBOROS_KEY || '', 'hex');
  const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(enc.iv, 'base64'));
  d.setAuthTag(Buffer.from(enc.tag, 'base64'));
  return JSON.parse(Buffer.concat([d.update(Buffer.from(enc.data, 'base64')), d.final()]).toString('utf8'));
}
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store, private');
  const viewer = verify(req);
  if (!viewer) return res.status(401).json({ ok: false });
  console.log(JSON.stringify({ event: 'ouroboros_view', viewer, at: new Date().toISOString() }));
  const { meta, html } = decrypt();
  res.status(200).json({ ok: true, viewer, meta, html });
};
