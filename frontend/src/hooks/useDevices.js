import { useState, useEffect } from 'react';
import api from '../api/client';
import { connectSocket } from '../socket/socket';

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

        } catch (err) {
            console.error(err);
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

        const socket = connectSocket();

        const deviceUpdateHandler = (data) => {

            console.log("🔥 SOCKET EVENT RECEIVED");
            console.log(data);

            setDevices(prev => {

                console.log("Before", prev);

                const updated = prev.map(device => {

                    if (device.node !== data.node)
                        return device;

                    return {

                        ...device,

                        power: data.power,

                        brightness: data.brightness,

                        lastUpdate: data.timestamp

                    };

                });

                console.log("After", updated);

                return updated;

            });

        };

        socket.on("device_update", deviceUpdateHandler);

        socket.on("connect", () => {

            console.log("✅ SOCKET CONNECTED");

        });

        socket.on("disconnect", () => {

            console.log("❌ SOCKET DISCONNECTED");

        });

        return () => {

            socket.off("device_update", deviceUpdateHandler);

        };

    }, []);

    const refresh = async () => {

        await fetchDevices();

        await fetchStatus();

    };

    return {

        devices,

        loading,

        status,

        refresh,

        fetchDevices,

        fetchStatus

    };

}