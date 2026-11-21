import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { FootballMatch, CricketMatch } from '../services/api';

const SOCKET_URL = 'http://192.168.0.109:3000';

interface UseLiveUpdatesProps {
  onFootballUpdate?: (matches: FootballMatch[]) => void;
  onCricketUpdate?: (matches: CricketMatch[]) => void;
}

export function useLiveUpdates({ onFootballUpdate, onCricketUpdate }: UseLiveUpdatesProps) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    socket.on('football:live', (matches: FootballMatch[]) => {
      console.log('WebSocket push: football live', matches.length);
      onFootballUpdate?.(matches);
    });

    socket.on('cricket:live', (matches: CricketMatch[]) => {
      console.log('WebSocket push: cricket live', matches.length);
      onCricketUpdate?.(matches);
    });

    return () => {
      socket.disconnect();
    };
  }, []);
}
