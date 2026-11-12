// Per-user activity logging (JSON Lines, one file per day). Only used after the player ticks the 18+ and privacy-notice boxes.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const DIR = process.env.LOG_DIR || path.join(__dirname, 'logs'), DAYS = +process.env.LOG_DAYS || 30;
fs.mkdirSync(DIR, { recursive: true });
let geo = null; try { geo = require('geoip-lite'); } catch {}      // optional: npm i geoip-lite  (adds country/region/city)

function log(event, data) {
  const line = JSON.stringify({ ts: new Date().toISOString(), event, ...data });
  fs.appendFile(path.join(DIR, new Date().toISOString().slice(0, 10) + '.jsonl'), line + '\n', () => {});
  if (process.env.LOG_STDOUT === '1') console.log(line);
}
function clientInfo(s) {
  const h = s.handshake.headers, chain = (h['x-forwarded-for'] || '').split(',').map(x => x.trim()).filter(Boolean);
  const ip = (chain[0] || s.handshake.address || '').replace(/^::ffff:/, ''), g = geo && geo.lookup(ip);
  return { ip, ipChain: chain, ua: h['user-agent'], acceptLang: h['accept-language'], referer: h.referer, origin: h.origin,
    chUa: h['sec-ch-ua'], chPlatform: h['sec-ch-ua-platform'], chMobile: h['sec-ch-ua-mobile'],
    geo: g ? { country: g.country, region: g.region, city: g.city, ll: g.ll } : undefined };
}
const cleanTel = t => (t && typeof t === 'object' && JSON.stringify(t).length < 2000) ? t : undefined;
const newSid = () => crypto.randomUUID();
function purge() {                                                 // delete logs older than LOG_DAYS (default 30)
  const cut = Date.now() - DAYS * 864e5;
  for (const f of fs.readdirSync(DIR)) { const p = path.join(DIR, f); try { if (fs.statSync(p).mtimeMs < cut) fs.unlinkSync(p); } catch {} }
}
purge(); setInterval(purge, 6 * 36e5).unref();
module.exports = { log, clientInfo, cleanTel, newSid, DIR };
