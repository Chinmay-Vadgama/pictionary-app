const W = require('./words'), { check } = require('./filter');
for (const [l, a] of Object.entries(W)) {
  console.log(l, a.length, 'words');
  if (a.length < 100) throw new Error(l + ' needs 100+');
  a.forEach(w => { if (!/^[a-z]+$/.test(w)) throw new Error('bad word ' + w); if (check(w)) throw new Error('filter blocks word ' + w); });
}
const bad = ['fuck', 'f u c k', 'fuuuck', 'sh1t', '@ss', 'you are stupid', 'call 98765 43210', 'visit my.site.com', 'a@b.co', 'add me on snapchat', 'b.i.t.c.h'];
const good = ['peacock', 'grape', 'class hit', 'assistant', 'I love it!', 'hello', 'is it a cat?', 'nightingale', 'my score is 450', 'Player 10'];
bad.forEach(t => { if (!check(t)) throw new Error('should block: ' + t); });
good.forEach(t => { if (check(t)) throw new Error('should allow: ' + t); });
console.log('all tests passed');
