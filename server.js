const express = require('express'), http = require('http'), { Server } = require('socket.io');
const app = express(), srv = http.createServer(app), io = new Server(srv);
const path = require('path'), fs = require('fs');
const PUB = [path.join(__dirname, 'public'), __dirname].find(d => fs.existsSync(path.join(d, 'index.html')));
if (!PUB) console.error('index.html not found! Put it in a "public" folder next to server.js');
app.use(express.static(PUB || path.join(__dirname, 'public')));
app.get('/', (req, res) => PUB ? res.sendFile(path.join(PUB, 'index.html')) : res.status(500).send('index.html not found. Place it in a "public" folder next to server.js.'));

const MAX = 10, DRAW_SECS = 80, GAP_MS = 4000;
const LEVELS = require('./words');
const { check } = require('./filter');
const ORDER = ['easy', 'medium', 'hard'];
const MULT = { easy: 1, medium: 1.25, hard: 1.5 };   // score multiplier per difficulty
function pickWord(r) {
  const lvl = LEVELS[r.diff] ? r.diff : r.diff === 'adaptive' ? r.lvl : ORDER[Math.floor(Math.random() * 3)];
  let pool = LEVELS[lvl].filter(w => !r.used.has(w));
  if (!pool.length) pool = LEVELS[lvl];
  const w = pool[Math.floor(Math.random() * pool.length)]; r.used.add(w);
  return { w, lvl };
}
const pattern = r => [...r.word].map((c, i) => r.shown.has(i) ? c : '_').join(' ');
function clearHints(r) { (r.hintT || []).forEach(clearTimeout); r.hintT = []; }
function scheduleHints(r) {            // reveal a random letter at 35%, 55%, 75% of the time (always keep 3+ hidden)
  clearHints(r);
  const n = Math.min(3, Math.max(0, r.word.length - 3));
  [0.35, 0.55, 0.75].slice(0, n).forEach(f => r.hintT.push(setTimeout(() => {
    if (r.state !== 'drawing') return;
    const hidden = [...r.word].map((_, i) => i).filter(i => !r.shown.has(i));
    r.shown.add(hidden[Math.floor(Math.random() * hidden.length)]);
    io.to(r.code).except(r.drawer).emit('hint', pattern(r));
  }, DRAW_SECS * 1000 * f)));
}
const rooms = {};

const code4 = () => Math.random().toString(36).slice(2, 6).toUpperCase();
const clean = (s, n) => String(s || '').replace(/[<>]/g, '').trim().slice(0, n);

function pub(r) {
  io.to(r.code).emit('state', {
    code: r.code, state: r.state, host: r.host, max: MAX, diff: r.diff, words: r.words,
    players: Object.entries(r.players).map(([id, p]) => ({ id, name: p.name, score: p.score }))
  });
}
function startGame(r) {
  Object.values(r.players).forEach(p => p.score = 0);
  r.lvl = 'easy'; r.turn = 0; r.used = new Set(); Object.values(r.players).forEach(p => p.drawn = 0);
  nextTurn(r);
}
function nextTurn(r) {
  const ids = Object.keys(r.players);
  if (!ids.length || r.turn >= r.words) return endGame(r);       // played all N words -> winner
  r.drawer = ids.reduce((b, id) => (r.players[id].drawn || 0) < (r.players[b].drawn || 0) ? id : b, ids[0]);
  r.players[r.drawer].drawn = (r.players[r.drawer].drawn || 0) + 1; r.turn++;
  const pk = pickWord(r); r.word = pk.w; r.curDiff = pk.lvl; r.shown = new Set();
  r.guessed = new Set(); r.fr = []; r.strokes = []; r.state = 'drawing';
  r.end = Date.now() + DRAW_SECS * 1000;
  clearTimeout(r.timer); r.timer = setTimeout(() => endTurn(r), DRAW_SECS * 1000);
  scheduleHints(r);
  pub(r);
  io.to(r.code).emit('turn', { drawer: r.drawer, hint: pattern(r), lvl: r.curDiff, ms: DRAW_SECS * 1000, no: r.turn, total: r.words });
  io.to(r.drawer).emit('word', r.word);
}
// Adaptive difficulty: blend of "how many guessed" (60%) and "how fast" (40%) -> move one level up/down
function adapt(r) {
  if (r.diff !== 'adaptive' || !r.players[r.drawer]) return;
  const others = Object.keys(r.players).length - 1; if (others < 1) return;
  const rate = r.guessed.size / others, speed = r.fr.length ? r.fr.reduce((a, b) => a + b, 0) / r.fr.length : 0;
  const score = 0.6 * rate + 0.4 * speed, i = ORDER.indexOf(r.curDiff);
  const j = score >= 0.65 ? Math.min(2, i + 1) : score <= 0.3 ? Math.max(0, i - 1) : i;
  r.lvl = ORDER[j];
  if (j !== i) io.to(r.code).emit('chat', { sys: true, text: `Difficulty adapting: ${j > i ? 'harder' : 'easier'} words next (${r.lvl}).` });
}
function endTurn(r) {
  if (r.state !== 'drawing') return;
  clearTimeout(r.timer); clearHints(r); r.state = 'between';
  io.to(r.code).emit('turnEnd', { word: r.word });
  adapt(r);
  pub(r);
  r.timer = setTimeout(() => nextTurn(r), GAP_MS);
}
function endGame(r) {
  clearTimeout(r.timer); clearHints(r); r.state = 'over';
  pub(r);
  const rank = Object.values(r.players).sort((a, b) => b.score - a.score).map(p => ({ name: p.name, score: p.score }));
  io.to(r.code).emit('gameOver', rank);
}

io.on('connection', s => {
  s.on('join', (d, cb) => {
    const name = clean(d.name, 16) || 'Player';
    if (check(name)) return cb({ error: 'Please pick a kid-friendly name (no bad words, links or phone numbers).' });
    const code = clean(d.code, 4).toUpperCase() || code4();
    const r = rooms[code] || (rooms[code] = { code, players: {}, host: s.id, state: 'lobby', queue: [], words: 10, turn: 0, strokes: [], diff: 'adaptive', lvl: 'easy', used: new Set(), hintT: [] });
    if (Object.keys(r.players).length >= MAX) return cb({ error: `Room is full (max ${MAX} players).` });
    r.players[s.id] = { name, score: 0 }; s.join(code); s.data.code = code;
    cb({ ok: true, id: s.id, code });
    pub(r);
    if (r.state === 'drawing') {
      s.emit('turn', { drawer: r.drawer, hint: pattern(r), lvl: r.curDiff, ms: r.end - Date.now(), no: r.turn, total: r.words });
      s.emit('replay', r.strokes);
    }
  });
  s.on('setDiff', d => {
    const r = rooms[s.data.code];
    if (r && r.host === s.id && ['lobby', 'over'].includes(r.state) && (d === 'mixed' || LEVELS[d])) { r.diff = d; pub(r); }
  });
  s.on('setWords', n => {
    const r = rooms[s.data.code], v = Math.round(Number(n));
    if (r && r.host === s.id && ['lobby', 'over'].includes(r.state) && v >= 1 && v <= 50) { r.words = v; pub(r); }
  });
  s.on('start', () => {
    const r = rooms[s.data.code];
    if (r && r.host === s.id && ['lobby', 'over'].includes(r.state) && Object.keys(r.players).length >= 1) startGame(r);   // 1 player = solo test
  });
  s.on('again', () => {                       // reset points, back to lobby
    const r = rooms[s.data.code];
    if (r && r.state === 'over') { Object.values(r.players).forEach(p => p.score = 0); r.state = 'lobby'; pub(r); io.to(r.code).emit('lobby'); }
  });
  s.on('draw', seg => {
    const r = rooms[s.data.code];
    if (r && r.state === 'drawing' && r.drawer === s.id) { if (!seg || typeof seg !== 'object' || r.strokes.length > 30000) return; r.strokes.push(seg); s.to(r.code).emit('draw', seg); }
  });
  s.on('undo', () => {                          // removes the drawer's last stroke/shape/fill
    const r = rooms[s.data.code];
    if (r && r.state === 'drawing' && r.drawer === s.id && r.strokes.length) {
      const k = r.strokes[r.strokes.length - 1].k;
      while (r.strokes.length && r.strokes[r.strokes.length - 1].k === k) r.strokes.pop();
      io.to(r.code).emit('undo');
    }
  });
  s.on('clear', () => {
    const r = rooms[s.data.code];
    if (r && r.drawer === s.id && r.state === 'drawing') { r.strokes = []; s.to(r.code).emit('clear'); }
  });
  s.on('chat', raw => {
    const r = rooms[s.data.code], p = r && r.players[s.id]; if (!p) return;
    const text = clean(raw, 60); if (!text) return;
    const now = Date.now(); if (now - (p.t || 0) < 700) return; p.t = now;   // slow-down for spam
    if (check(text)) return s.emit('notice', 'Message blocked. Keep chat friendly: no bad words, links, or personal info.');
    if (r.state === 'drawing' && s.id !== r.drawer && !r.guessed.has(s.id)) {
      if (text.toLowerCase() === r.word) {
        const pts = Math.round((100 + 400 * Math.max(0, (r.end - Date.now()) / (DRAW_SECS * 1000))) * MULT[r.curDiff]); // faster = more
        p.score += pts; r.players[r.drawer] && (r.players[r.drawer].score += 50);
        r.guessed.add(s.id); r.fr.push(Math.max(0, (r.end - Date.now()) / (DRAW_SECS * 1000)));
        io.to(r.code).emit('chat', { sys: true, text: `${p.name} guessed it! +${pts}` });
        pub(r);
        const others = Object.keys(r.players).filter(id => id !== r.drawer);
        if (others.every(id => r.guessed.has(id))) endTurn(r);
        return;
      }
      return io.to(r.code).emit('chat', { name: p.name, text });
    }
    // drawer / already-guessed players chat privately so the word can't leak
    if (r.state === 'drawing') {
      [r.drawer, ...r.guessed].forEach(id => io.to(id).emit('chat', { name: p.name, text, priv: true }));
    } else io.to(r.code).emit('chat', { name: p.name, text });
  });
  s.on('disconnect', () => {
    const r = rooms[s.data.code]; if (!r) return;
    delete r.players[s.id];
    const ids = Object.keys(r.players);
    if (!ids.length) { clearTimeout(r.timer); clearHints(r); return delete rooms[r.code]; }
    if (r.host === s.id) r.host = ids[0];
    if (r.state === 'drawing' && r.drawer === s.id) endTurn(r);
    pub(r);
  });
});

srv.listen(process.env.PORT || 3000, () => console.log('Running on', process.env.PORT || 3000));
