import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const server = http.createServer(app);

app.use(express.json());

// In-memory rooms for WebSocket multiplayer
interface ClientConnection {
  ws: WebSocket;
  playerId: string;
  playerName: string;
  roomId: string;
}

const rooms: Record<string, {
  id: string;
  clients: ClientConnection[];
  gameState: any;
}> = {};

// WebSocket Server attached to same HTTP server
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket) => {
  let currentRoomId: string | null = null;
  let currentPlayerId: string | null = null;

  ws.on('message', (raw: string) => {
    try {
      const data = JSON.parse(raw.toString());
      const { type, roomId, playerId, playerName, payload } = data;

      if (type === 'create_room' || type === 'join_room') {
        currentRoomId = roomId;
        currentPlayerId = playerId;

        if (!rooms[roomId]) {
          rooms[roomId] = {
            id: roomId,
            clients: [],
            gameState: payload?.initialState || null,
          };
        }

        const room = rooms[roomId];
        // Remove existing connection for same player if any
        room.clients = room.clients.filter(c => c.playerId !== playerId);
        room.clients.push({ ws, playerId, playerName: playerName || 'Гравець', roomId });

        // Broadcast player joined & current state
        const playerList = room.clients.map(c => ({ id: c.playerId, name: c.playerName }));
        ws.send(JSON.stringify({
          type: 'room_joined',
          roomId,
          players: playerList,
          gameState: room.gameState,
        }));

        broadcastToRoom(roomId, {
          type: 'players_updated',
          players: playerList,
        }, ws);
      } else if (type === 'sync_game_state' && currentRoomId && rooms[currentRoomId]) {
        rooms[currentRoomId].gameState = payload.gameState;
        broadcastToRoom(currentRoomId, {
          type: 'game_state_updated',
          gameState: payload.gameState,
          action: payload.action,
        });
      } else if (type === 'game_action' && currentRoomId && rooms[currentRoomId]) {
        broadcastToRoom(currentRoomId, {
          type: 'game_action_received',
          action: payload.action,
          playerId,
        });
      } else if (type === 'chat_message' && currentRoomId && rooms[currentRoomId]) {
        broadcastToRoom(currentRoomId, {
          type: 'chat_received',
          sender: playerName || 'Гравець',
          text: payload.text,
          time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
        });
      }
    } catch (err) {
      console.error('WS parse error:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoomId && rooms[currentRoomId]) {
      const room = rooms[currentRoomId];
      room.clients = room.clients.filter(c => c.ws !== ws);
      if (room.clients.length === 0) {
        delete rooms[currentRoomId];
      } else {
        const playerList = room.clients.map(c => ({ id: c.playerId, name: c.playerName }));
        broadcastToRoom(currentRoomId, {
          type: 'players_updated',
          players: playerList,
        });
      }
    }
  });
});

function broadcastToRoom(roomId: string, message: any, excludeWs?: WebSocket) {
  const room = rooms[roomId];
  if (!room) return;
  const payload = JSON.stringify(message);
  for (const client of room.clients) {
    if (client.ws.readyState === WebSocket.OPEN && client.ws !== excludeWs) {
      client.ws.send(payload);
    }
  }
}

// REST API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', activeRooms: Object.keys(rooms).length });
});

// API endpoint to list open rooms
app.get('/api/rooms', (req, res) => {
  const roomSummaries = Object.values(rooms).map(r => ({
    id: r.id,
    playerCount: r.clients.length,
    inProgress: !!r.gameState && r.gameState.phase !== 'lobby',
  }));
  res.json(roomSummaries);
});

// Vite middleware setup
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Bad Company game server running on http://0.0.0.0:${PORT}`);
  });
}

start();
