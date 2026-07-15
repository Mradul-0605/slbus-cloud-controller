import { useState, useEffect } from 'react';
import api from '../api/client';

export function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [gatewayInfo, setGatewayInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const checkStatus = async () => {
        try {
            const response = await api.get('/status');
            if (response.data.success) {
                setIsConnected(response.data.connected || false);
                setIsAuthenticated(response.data.loggedIn || false);
                setGatewayInfo({
                    gateway: response.data.gateway,
                    uuid: response.data.uuid
                });
                if (response.data.error) {
                    setError(response.data.error);
                }
                return response.data;
            }
        } catch (error) {
            setIsConnected(false);
            setError('Connection failed');
        }
        return null;
    };

    useEffect(() => {
        const init = async () => {
            const token = localStorage.getItem('slbus_auth');
            if (token === 'true') {
                setIsAuthenticated(true);
                await checkStatus();
            }
            setLoading(false);
        };
        init();

        const interval = setInterval(async () => {
            if (isAuthenticated) {
                await checkStatus();
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [isAuthenticated]);

    const login = async (email, password) => {
        try {
            const response = await api.post('/login', { email, password });
            if (response.data.success) {
                setIsAuthenticated(true);
                setIsConnected(response.data.gateway.connected || false);
                setGatewayInfo({
                    gateway: response.data.gateway.deviceName,
                    uuid: response.data.gateway.uuid,
                    devices: response.data.gateway.devices
                });
                localStorage.setItem('slbus_auth', 'true');
                localStorage.setItem('slbus_email', email);
                localStorage.setItem('slbus_password', password);
                setError('');
                return { success: true, data: response.data };
            }
            return { success: false, error: 'Login failed' };
        } catch (error) {
            const msg = error.response?.data?.error || error.message;
            setError(msg);
            setIsAuthenticated(false);
            setIsConnected(false);
            return { success: false, error: msg };
        }
    };

    const reconnect = async () => {
        const email = localStorage.getItem('slbus_email');
        const password = localStorage.getItem('slbus_password');
        
        if (!email || !password) {
            return { success: false, error: 'Credentials not found' };
        }

        try {
            const response = await api.post('/reconnect', { email, password });
            if (response.data.success) {
                setIsConnected(response.data.connected || false);
                setError('');
                return { success: true };
            }
            setIsConnected(false);
            setError(response.data.error || 'Reconnection failed');
            return { success: false, error: response.data.error };
        } catch (error) {
            setIsConnected(false);
            setError(error.message);
            return { success: false, error: error.message };
        }
    };

    const logout = () => {
        setIsAuthenticated(false);
        setIsConnected(false);
        setGatewayInfo(null);
        localStorage.removeItem('slbus_auth');
    };

    return { 
        isAuthenticated, 
        isConnected, 
        gatewayInfo, 
        loading, 
        error,
        login, 
        logout, 
        checkStatus,
        reconnect
    };
}