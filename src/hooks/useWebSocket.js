import { useEffect, useRef, useCallback } from 'react';

const useWebSocket = (onMessage) => {
    const socketRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    const connect = useCallback(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) return;

        console.log('Connecting to WebSocket...');
        const socket = new WebSocket('ws://localhost:8080/ws');

        socket.onopen = () => {
            console.log('WebSocket Connected');
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (onMessage) onMessage(data);
            } catch (err) {
                console.error('WebSocket message parse error:', err);
            }
        };

        socket.onclose = () => {
            console.log('WebSocket Disconnected. Reconnecting in 3s...');
            reconnectTimeoutRef.current = setTimeout(connect, 3000);
        };

        socket.onerror = (err) => {
            console.error('WebSocket Error:', err);
            socket.close();
        };

        socketRef.current = socket;
    }, [onMessage]);

    useEffect(() => {
        connect();
        return () => {
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            if (socketRef.current) {
                socketRef.current.onclose = null; // Prevent reconnect on intentional unmount
                socketRef.current.close();
            }
        };
    }, [connect]);

    return socketRef.current;
};

export default useWebSocket;
