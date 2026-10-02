const { setCookie } = require('./_auth');
module.exports = (req, res) => { res.setHeader('Cache-Control', 'no-store'); setCookie(res, '', 0); res.status(200).json({ ok: true }); };
