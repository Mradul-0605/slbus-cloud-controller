import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Power, PowerOff, Sun, Thermometer, RefreshCw, WifiOff, Layers } from 'lucide-react';
import Layout from '../components/Layout';
import { useDeviceContext } from '../context/DeviceContext';
import { useToast } from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';

export default function MasterControl() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { isConnected, reconnect } = useAuth();
    const { devices, refresh } = useDeviceContext();

    const [updating, setUpdating] = useState(false);
    const [loading, setLoading] = useState(true);

    // Slider state
    const [sliderBrightness, setSliderBrightness] = useState(127);
    const [sliderTemperature, setSliderTemperature] = useState(4000);

    const brightnessTimer = useRef(null);
    const tempTimer = useRef(null);

    // Update slider when devices change
    useEffect(() => {
        if (devices && devices.length > 0) {
            const avgBright = Math.round(devices.reduce((sum, d) => sum + d.brightness, 0) / devices.length);
            const avgTemp = Math.round(devices.reduce((sum, d) => sum + d.temperature, 0) / devices.length);
            setSliderBrightness(avgBright || 127);
            setSliderTemperature(avgTemp || 4000);
            setLoading(false);
        }
    }, [devices]);

    const allOn = devices.every(d => d.power);
    const allOff = devices.every(d => !d.power);
    const anyOn = devices.some(d => d.power);

    const handlePowerAll = async (on) => {
        if (updating || !isConnected) return;
        setUpdating(true);
        try {
            const promises = devices.map(d =>
                api.post(`/light/${d.node}/${on ? "on" : "off"}`)
            );
            await Promise.all(promises);
            showToast(`All lights ${on ? 'ON' : 'OFF'}`, 'success');
        } catch {
            showToast('Failed to control all lights', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const handleBrightnessAll = (value) => {
        setSliderBrightness(value);
        if (brightnessTimer.current) clearTimeout(brightnessTimer.current);
        brightnessTimer.current = setTimeout(async () => {
            if (isConnected) {
                try {
                    const promises = devices.map(d =>
                        api.post(`/light/${d.node}/brightness`, { level: value })
                    );
                    await Promise.all(promises);
                } catch (err) {
                    console.error(err);
                }
            }
        }, 300);
    };

    const handleTemperatureAll = (value) => {
        setSliderTemperature(value);
        if (tempTimer.current) clearTimeout(tempTimer.current);
        tempTimer.current = setTimeout(async () => {
            if (isConnected) {
                try {
                    const promises = devices.map(d =>
                        api.post(`/light/${d.node}/temp`, { kelvin: value })
                    );
                    await Promise.all(promises);
                } catch (err) {
                    console.error(err);
                }
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
                        <p className="text-gray-400 mb-4">Unable to control devices - gateway disconnected</p>
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

    if (devices.length === 0) {
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
                        <Layers size={48} className="text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No devices found</p>
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
                        onClick={refresh}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>

                <div className="glass rounded-2xl p-6 border border-primary/20">
                    <div className="flex items-center gap-3 mb-4">
                        <Layers size={24} className="text-primary" />
                        <h2 className="text-xl font-bold text-white">Master Control</h2>
                        <span className="text-xs text-gray-500">({devices.length} lights)</span>
                    </div>

                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={() => handlePowerAll(true)}
                            disabled={updating || allOn}
                            className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition ${
                                allOn
                                    ? 'bg-green-500/20 text-green-500 cursor-default'
                                    : 'bg-primary hover:bg-primary/80 text-white'
                            }`}
                        >
                            <Power size={18} />
                            All ON
                        </button>
                        <button
                            onClick={() => handlePowerAll(false)}
                            disabled={updating || allOff}
                            className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition ${
                                allOff
                                    ? 'bg-red-500/20 text-red-500 cursor-default'
                                    : 'bg-white/10 hover:bg-white/20 text-white'
                            }`}
                        >
                            <PowerOff size={18} />
                            All OFF
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm text-gray-400 mb-2">
                                <span className="flex items-center gap-2">
                                    <Sun size={16} />
                                    All Brightness
                                </span>
                                <span>{Math.round((sliderBrightness / 254) * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="254"
                                value={sliderBrightness}
                                onChange={(e) => handleBrightnessAll(parseInt(e.target.value))}
                                className="w-full slider-thumb h-1.5 rounded-full bg-gray-700 appearance-none cursor-pointer"
                                disabled={!anyOn || !isConnected}
                            />
                        </div>

                        <div>
                            <div className="flex justify-between text-sm text-gray-400 mb-2">
                                <span className="flex items-center gap-2">
                                    <Thermometer size={16} />
                                    All Temperature
                                </span>
                                <span>{sliderTemperature}K</span>
                            </div>
                            <input
                                type="range"
                                min="2700"
                                max="6500"
                                value={sliderTemperature}
                                onChange={(e) => handleTemperatureAll(parseInt(e.target.value))}
                                className="w-full slider-thumb h-1.5 rounded-full bg-gray-700 appearance-none cursor-pointer"
                                style={{
                                    background: `linear-gradient(to right, #ff7b00, #ffd700, #87ceeb)`
                                }}
                                disabled={!anyOn || !isConnected}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {devices.map((device) => (
                        <div key={device.node} className="glass rounded-xl p-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-white">Light {device.node}</span>
                                <span className={`text-xs ${device.power ? 'text-green-500' : 'text-gray-500'}`}>
                                    {device.power ? '● ON' : '● OFF'}
                                </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                Brightness: {Math.round((device.brightness / 254) * 100)}%
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
}