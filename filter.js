// Child-safety filter for names + chat. check(text) -> true if the text must be blocked.
// Catches: profanity (incl. l33t, repeated letters, "f u c k"), mild insults, adult/drug words,
// links, emails, phone numbers and social-media handles. Add words to the lists below as needed.
const STRONG = `fuck shit bitch bastard cunt whore slut nigg asshole dickhead pussy motherf wanker bullshit faggot retard rapist pedo nazi hitler
  porn blowjob handjob cumshot jerkoff dildo penis vagina suicide cocaine heroin`.split(/\s+/);
const EXACT = `ass arse damn hell crap sex sexy nude naked boob boobs tit tits cock dick anal anus rape fag stupid idiot dumb moron loser ugly
  sucks suck wtf stfu kys kill weed meth vodka beer whiskey drunk snap snapchat insta instagram discord whatsapp telegram kik tiktok`.split(/\s+/);
const rep = w => [...w].map(c => c + '+').join('');            // allow stretched letters: fuuuck
const STRONG_RE = STRONG.map(w => new RegExp(rep(w)));
const EXACT_RE = EXACT.map(w => new RegExp('^' + rep(w) + '$'));
const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', '@': 'a', $: 's' };

function tokens(s) {                                            // "f.u.c.k" / "f u c k" -> "fuck"
  const out = []; let buf = '';
  for (const t of s.split(/[^a-z]+/).filter(Boolean)) {
    if (t.length === 1) buf += t; else { if (buf) out.push(buf); buf = ''; out.push(t); }
  }
  if (buf) out.push(buf); return out;
}
function check(text) {
  const raw = String(text);
  if (/https?:|www\.|\S@\S|\b[\w-]+\.(com|net|org|io|gg|ly|me|co|in|xyz|tv|app|ru)\b/i.test(raw)) return true;
  if (raw.replace(/\D/g, '').length >= 7) return true;           // phone numbers / long digit strings
  const base = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const leet = base.replace(/(?<=[a-z])!(?=[a-z])/g, 'i').replace(/[013457 8@$]/g, c => LEET[c] || c);
  return [base, leet].some(v => tokens(v).some(t => EXACT_RE.some(r => r.test(t)) || STRONG_RE.some(r => r.test(t))));
}
module.exports = { check };
