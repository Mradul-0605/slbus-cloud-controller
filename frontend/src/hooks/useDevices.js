import { useState, useEffect } from 'react';
import api from '../api/client';

export function useDevices() {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null);

    const fetchDevices = async () => {
        try {
            const response = await api.get('/devices');
            if (response.data.success) {
                setDevices(response.data.devices || []);
            }
        } catch (error) {
            console.error('Failed to fetch devices:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStatus = async () => {
        try {
            const response = await api.get('/status');
            if (response.data.success) {
                setStatus(response.data);
            }
        } catch {
            setStatus(null);
        }
    };

    useEffect(() => {
        fetchDevices();
        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    return { devices, loading, status, fetchDevices, fetchStatus };
}