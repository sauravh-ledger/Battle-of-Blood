// Battle of Blood: Arena — online co-op relay server.
// Squads join a room by code; the server relays presence (player state) and events between them.
// Run: npm install && npm start   (listens on $PORT, default 8080)
const http = require('http');
const { WebSocketServer } = require('ws');
const PORT = process.env.PORT || 8080;
const MAX_ROOM = 8, MAX_MSG = 8 * 1024, MAX_RATE = 80; // players per room, bytes per message, messages per second
const rooms = new Map(); // room name -> Map(peerId -> ws)
let nextId = 1;
const server = http.createServer((req, res) => {
  if (req.url === '/health') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ ok: true, rooms: rooms.size, players: [...rooms.values()].reduce((a, r) => a + r.size, 0) })); return; }
  res.writeHead(200, { 'content-type': 'text/plain' }); res.end('Battle of Blood: Arena game server is running.\n');
});
const wss = new WebSocketServer({ server, maxPayload: MAX_MSG });
const send = (ws, o) => { if (ws.readyState === 1) ws.send(JSON.stringify(o)); };
const broadcast = (room, o, except) => { const r = rooms.get(room); if (!r) return; const s = JSON.stringify(o); for (const [id, ws] of r) if (id !== except && ws.readyState === 1) ws.send(s); };
wss.on('connection', ws => {
  ws.peer = 'p' + (nextId++).toString(36) + Math.random().toString(36).slice(2, 6); ws.room = null; ws.pres = {}; ws.count = 0; ws.alive = true;
  const tick = setInterval(() => { ws.count = 0; }, 1000);
  ws.on('pong', () => { ws.alive = true; });
  ws.on('message', raw => {
    if (++ws.count > MAX_RATE) return; let m; try { m = JSON.parse(raw); } catch (e) { return; } if (!m || typeof m.t !== 'string') return;
    if (m.t === 'join' && !ws.room) {
      const name = String(m.room || '').toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, 48); if (!name) return;
      const r = rooms.get(name) || new Map(); if (r.size >= MAX_ROOM) { send(ws, { t: 'full' }); return; }
      rooms.set(name, r); r.set(ws.peer, ws); ws.room = name;
      send(ws, { t: 'hello', peer: ws.peer, peers: [...r].filter(([id]) => id !== ws.peer).map(([id, o]) => ({ peer: id, p: o.pres })) });
      broadcast(name, { t: 'pres', peer: ws.peer, p: ws.pres }, ws.peer);
    } else if (!ws.room) return;
    else if (m.t === 'pres' && m.p && typeof m.p === 'object') { ws.pres = m.p; broadcast(ws.room, { t: 'pres', peer: ws.peer, p: m.p }, ws.peer); }
    else if (m.t === 'emit' && typeof m.topic === 'string' && /^[a-z][a-z0-9_.-]{0,47}$/.test(m.topic)) broadcast(ws.room, { t: 'emit', peer: ws.peer, topic: m.topic, data: m.data }, ws.peer);
    else if (m.t === 'leave') ws.close();
  });
  ws.on('close', () => { clearInterval(tick); const r = ws.room && rooms.get(ws.room); if (r) { r.delete(ws.peer); broadcast(ws.room, { t: 'left', peer: ws.peer }); if (!r.size) rooms.delete(ws.room); } });
});
setInterval(() => { for (const ws of wss.clients) { if (!ws.alive) { ws.terminate(); continue; } ws.alive = false; ws.ping(); } }, 20000);
server.listen(PORT, () => console.log('Battle of Blood server listening on port ' + PORT));
