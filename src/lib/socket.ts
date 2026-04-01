import { Server } from 'socket.io';
import http from 'http';
import { FRONTEND_URL } from './constants';

let io: Server | null = null;

export function initSocket(server: http.Server) {
  io = new Server(server, {
    cors: {
      origin: [FRONTEND_URL, 'http://localhost:3000'], // app.ts와 동일하게 FRONTEND_URL(3000) 사용
      methods: ['GET', 'POST'],
      credentials: true,
    },
    allowEIO3: true,
  });

  io.on('connection', (socket) => {
    console.log(`🔌 [Socket.io] New client connected: ${socket.id}`);

    // 클라이언트가 연결 후 자기 userId로 room에 join
    socket.on('join', (userId: string) => {
      console.log(`🏠 [Socket.io] User ${userId} joined their notification room.`);
      socket.join(userId);
    });

    socket.on('disconnect', () => {
      console.log(`❌ [Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  console.log('🚀 [Socket.io] Initialized successfully');
  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.IO가 초기화되지 않았습니다.');
  }
  return io;
}
