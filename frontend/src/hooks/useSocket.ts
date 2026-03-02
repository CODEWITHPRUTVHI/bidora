'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'https://bidora-api-production.up.railway.app';

// Singleton socket instance shared across the app
let globalSocket: Socket | null = null;

function getSocket(token: string): Socket {
    if (globalSocket && globalSocket.connected) return globalSocket;

    globalSocket = io(WS_URL, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
        transports: ['websocket', 'polling']
    });

    return globalSocket;
}

export function useSocket(token: string | null) {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!token) return;

        const socket = getSocket(token);
        socketRef.current = socket;

        return () => {
            // Don't disconnect the global singleton on unmount
            // only stop listening
        };
    }, [token]);

    const on = useCallback((event: string, handler: (...args: any[]) => void) => {
        socketRef.current?.on(event, handler);
        return () => socketRef.current?.off(event, handler);
    }, []);

    const emit = useCallback((event: string, ...args: any[]) => {
        socketRef.current?.emit(event, ...args);
    }, []);

    return { socket: socketRef.current, on, emit };
}

export function disconnectSocket() {
    if (globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
    }
}
