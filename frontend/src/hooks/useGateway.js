import { useState, useEffect, useCallback } from 'react';
import { subscribeToDeviceUpdates } from '../socket/socket';
import api from '../api/client';

export function useGateway() {
    const [gatewayStatus, setGatewayStatus] = useState({
        connected: false,
        mqttConnected: false,
        lastSeen: null,
        uuid: '',
        custid: '',
        gatewayName: ''
    });
    const [devices, setDevices] = useState([]);

    // Initial fetch
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await api.get('/status');
                if (response.data.success) {
                    setGatewayStatus({
                        connected: response.data.connected || false,
                        mqttConnected: response.data.mqttConnected || false,
                        lastSeen: response.data.lastSeen,
                        uuid: response.data.uuid,
                        custid: response.data.custid,
                        gatewayName: response.data.gateway || 'SL BUS Gateway'
                    });
                    setDevices(response.data.devices || []);
                }
            } catch (error) {
                console.error('Status fetch failed:', error);
            }
        };
        fetchStatus();

        // Socket listeners
        const unsubscribe = subscribeToDeviceUpdates((event, data) => {
            if (event === 'initial_state') {
                setGatewayStatus(data.gateway || { connected: false });
                setDevices(data.devices || []);
            } else if (event === 'state_update') {
                setGatewayStatus(data.gateway || { connected: false });
                setDevices(data.devices || []);
            } else if (event === 'device_update') {
                setDevices(prev => {
                    const index = prev.findIndex(d => d.node === data.node);
                    if (index !== -1) {
                        const newDevices = [...prev];
                        newDevices[index] = {
                            ...newDevices[index],
                            power: data.power,
                            brightness: data.brightness,
                            lastUpdate: data.timestamp
                        };
                        return newDevices;
                    }
                    return prev;
                });
            } else if (event === 'gateway_status') {
                setGatewayStatus(prev => ({
                    ...prev,
                    connected: data.connected,
                    lastSeen: data.lastSeen
                }));
            }
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    const updateDevice = useCallback((node, updates) => {
        setDevices(prev => {
            const index = prev.findIndex(d => d.node === node);
            if (index !== -1) {
                const newDevices = [...prev];
                newDevices[index] = { ...newDevices[index], ...updates };
                return newDevices;
            }
            return prev;
        });
    }, []);

    return {
        gatewayStatus,
        devices,
        updateDevice,
        isConnected: gatewayStatus.connected,
        isMQTTConnected: gatewayStatus.mqttConnected
    };
}