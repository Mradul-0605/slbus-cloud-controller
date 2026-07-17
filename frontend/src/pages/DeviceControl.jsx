import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Power, PowerOff, Sun, Thermometer, RefreshCw, WifiOff } from 'lucide-react';
import Layout from '../components/Layout';
import { useDeviceContext } from '../context/DeviceContext';
import { useToast } from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';

export default function DeviceControl() {
    const { node } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { isConnected, reconnect } = useAuth();
    const { devices, refresh } = useDeviceContext();

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const nodeNum = parseInt(node);
    const device = devices.find(d => d.node === nodeNum);

    // Slider state - separate from MQTT state to prevent jumps
    const [sliderBrightness, setSliderBrightness] = useState(127);
    const [sliderTemperature, setSliderTemperature] = useState(4000);

    const brightnessTimer = useRef(null);
    const tempTimer = useRef(null);
    const isMounted = useRef(true);

    // Update slider state when device changes (MQTT update)
    useEffect(() => {
        if (device) {
            setSliderBrightness(device.brightness ?? 127);
            setSliderTemperature(device.temperature ?? 4000);
        }
    }, [device]);

    // Get actual device state from context
    const isOn = device?.power ?? false;
    const brightness = device?.brightness ?? 127;
    const temperature = device?.temperature ?? 4000;

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Initial fetch - only runs once on mount or when node changes
    useEffect(() => {
        const loadDevice = async () => {
            // If device already exists in context, don't show loading
            if (device) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                await refresh();
                // After refresh, check again
                const updatedDevice = devices.find(d => d.node === nodeNum);
                if (updatedDevice) {
                    setSliderBrightness(updatedDevice.brightness ?? 127);
                    setSliderTemperature(updatedDevice.temperature ?? 4000);
                }
            } catch (error) {
                console.error('Failed to load device:', error);
                showToast('Failed to load device', 'error');
            } finally {
                if (isMounted.current) setLoading(false);
            }
        };

        if (isConnected) {
            loadDevice();
        } else {
            setLoading(false);
        }
    }, [node, isConnected]); // Only re-run when node or connection changes

    const fetchStatus = async () => {
        if (!isConnected) return;
        try {
            await refresh();
            showToast('Status refreshed', 'info');
        } catch (error) {
            console.error('Status fetch failed:', error);
        }
    };

    const handlePower = async (on) => {
        if (updating || !isConnected) return;
        setUpdating(true);
        try {
            await api.post(`/light/${node}/${on ? "on" : "off"}`);
            showToast(`Light ${node} ${on ? "ON" : "OFF"}`, "success");
            // MQTT will update automatically
        } catch {
            showToast("Failed to control device", "error");
        } finally {
            setUpdating(false);
        }
    };

    const handleBrightnessChange = (value) => {
        if (!isConnected || !isOn) return;

        if (brightnessTimer.current) clearTimeout(brightnessTimer.current);

        brightnessTimer.current = setTimeout(async () => {
            try {
                await api.post(`/light/${node}/brightness`, { level: value });
            } catch (err) {
                console.error(err);
            }
        }, 300);
    };

    const handleTemperatureChange = (value) => {
        if (!isConnected || !isOn) return;

        if (tempTimer.current) clearTimeout(tempTimer.current);

        tempTimer.current = setTimeout(async () => {
            try {
                await api.post(`/light/${node}/temp`, { kelvin: value });
            } catch (err) {
                console.error(err);
            }
        }, 300);
    };

    const handleReconnect = async () => {
        const result = await reconnect();
        if (result.success) {
            showToast('Reconnected!', 'success');
            await refresh();
        } else {
            showToast('Reconnection failed', 'error');
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                </div>
            </Layout>
        );
    }

    if (!isConnected) {
        return (
            <Layout>
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-6"
                    >
                        <ArrowLeft size={20} />
                        Back
                    </button>
                    <div className="glass rounded-2xl p-8 text-center">
                        <WifiOff size={48} className="text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Not Connected</h2>
                        <p className="text-gray-400 mb-4">Unable to control device - gateway disconnected</p>
                        <button
                            onClick={handleReconnect}
                            className="px-6 py-2 rounded-lg bg-primary hover:bg-primary/80 text-white transition"
                        >
                            Reconnect
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition"
                    >
                        <ArrowLeft size={20} />
                        Back
                    </button>
                    <button
                        onClick={fetchStatus}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>

                <div className="glass rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Light {node}</h1>
                            <p className="text-gray-400 text-sm">Node {node}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm ${isOn ? 'text-green-500' : 'text-gray-500'}`}>
                                {isOn ? '● ON' : '● OFF'}
                            </span>
                            <span className="text-xs text-gray-500">Real-time</span>
                        </div>
                    </div>

                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={() => handlePower(true)}
                            disabled={updating || isOn}
                            className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition ${
                                isOn
                                    ? 'bg-green-500/20 text-green-500 cursor-default'
                                    : 'bg-primary hover:bg-primary/80 text-white'
                            }`}
                        >
                            <Power size={20} />
                            ON
                        </button>
                        <button
                            onClick={() => handlePower(false)}
                            disabled={updating || !isOn}
                            className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition ${
                                !isOn
                                    ? 'bg-red-500/20 text-red-500 cursor-default'
                                    : 'bg-white/10 hover:bg-white/20 text-white'
                            }`}
                        >
                            <PowerOff size={20} />
                            OFF
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm text-gray-400 mb-2">
                                <span className="flex items-center gap-2">
                                    <Sun size={16} />
                                    Brightness
                                </span>
                                <span>{Math.round((sliderBrightness / 254) * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="254"
                                value={sliderBrightness}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setSliderBrightness(val);
                                    handleBrightnessChange(val);
                                }}
                                className="w-full slider-thumb h-1.5 rounded-full bg-gray-700 appearance-none cursor-pointer"
                                disabled={!isOn || !isConnected}
                            />
                        </div>

                        <div>
                            <div className="flex justify-between text-sm text-gray-400 mb-2">
                                <span className="flex items-center gap-2">
                                    <Thermometer size={16} />
                                    Color Temperature
                                </span>
                                <span>{sliderTemperature}K</span>
                            </div>
                            <input
                                type="range"
                                min="2700"
                                max="6500"
                                value={sliderTemperature}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setSliderTemperature(val);
                                    handleTemperatureChange(val);
                                }}
                                className="w-full slider-thumb h-1.5 rounded-full bg-gray-700 appearance-none cursor-pointer"
                                style={{
                                    background: `linear-gradient(to right, #ff7b00, #ffd700, #87ceeb)`
                                }}
                                disabled={!isOn || !isConnected}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}