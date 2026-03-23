import { Server } from 'socket.io';
import http from 'http';
import { CORS_ORIGIN } from './constants';

let io: Server | null = null;

export function initSocket(server: http.Server) {
  io = new Server(server, {
    cors: {
      origin: CORS_ORIGIN,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // 클라이언트가 연결 후 자기 userId로 room에 join
    socket.on('join', (userId: string) => {
      socket.join(userId);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.IO가 초기화되지 않았습니다.');
  }
  return io;
}
