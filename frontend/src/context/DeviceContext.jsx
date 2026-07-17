import React, { createContext, useState, useContext, useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '../api/client';

const DeviceContext = createContext();

const socket = io('http://localhost:5000', {
    transports: ['websocket'],
    reconnection: true
});

export function DeviceProvider({ children }) {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [initialized, setInitialized] = useState(false);

    const fetchDevices = async () => {
        try {
            const response = await api.get('/devices');
            if (response.data.success) {
                setDevices(response.data.devices || []);
                return response.data.devices || [];
            }
        } catch (error) {
            console.error('Failed to fetch devices:', error);
        }
        return [];
    };

    const fetchStatus = async () => {
        try {
            const response = await api.get('/status');
            if (response.data.success) {
                setConnected(response.data.connected || false);
            }
        } catch {
            setConnected(false);
        }
    };

    const refresh = async () => {
        setLoading(true);
        await fetchDevices();
        await fetchStatus();
        setLoading(false);
    };

    useEffect(() => {
        const init = async () => {
            await fetchDevices();
            await fetchStatus();
            setInitialized(true);
            setLoading(false);
        };
        init();

        socket.on('devices_updated', (updatedDevices) => {
            console.log('📱 Devices updated via Socket.IO:', updatedDevices);
            setDevices(updatedDevices);
        });

        socket.on('connect', () => {
            console.log('✅ Socket.IO connected');
        });

        socket.on('disconnect', () => {
            console.log('❌ Socket.IO disconnected');
        });

        return () => {
            socket.off('devices_updated');
        };
    }, []);

    const value = {
        devices,
        loading,
        connected,
        initialized,
        refresh,
        fetchDevices,
        fetchStatus
    };

    return (
        <DeviceContext.Provider value={value}>
            {children}
        </DeviceContext.Provider>
    );
}

export function useDeviceContext() {
    const context = useContext(DeviceContext);
    if (!context) {
        throw new Error('useDeviceContext must be used within a DeviceProvider');
    }
    return context;
}

export default DeviceContext;