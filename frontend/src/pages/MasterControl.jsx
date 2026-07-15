import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Power, PowerOff, Sun, Thermometer, RefreshCw, WifiOff, Layers } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api/client';
import { useToast } from '../components/Toast';
import { useAuth } from '../hooks/useAuth';

export default function MasterControl() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { isConnected, reconnect } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    
    // Node 0 state
    const [node0On, setNode0On] = useState(false);
    const [node0Brightness, setNode0Brightness] = useState(127);
    const [node0Temp, setNode0Temp] = useState(4000);
    
    // Node 1 state
    const [node1On, setNode1On] = useState(false);
    const [node1Brightness, setNode1Brightness] = useState(127);
    const [node1Temp, setNode1Temp] = useState(4000);
    
    // Master state
    const [masterOn, setMasterOn] = useState(false);
    const [masterBrightness, setMasterBrightness] = useState(127);
    const [masterTemp, setMasterTemp] = useState(4000);
    const [syncing, setSyncing] = useState(false);
    
    const brightnessTimer = useRef(null);
    const tempTimer = useRef(null);

    useEffect(() => {
        if (isConnected) {
            fetchAllStatus();
        } else {
            setLoading(false);
        }
    }, [isConnected]);

    const fetchAllStatus = async () => {
        if (!isConnected) return;
        setRefreshing(true);
        try {
            // Fetch both nodes in parallel
            const [n0Status, n0Bright, n1Status, n1Bright] = await Promise.all([
                api.get('/light/0/status'),
                api.get('/light/0/brightness'),
                api.get('/light/1/status'),
                api.get('/light/1/brightness')
            ]);

            // Node 0
            if (n0Status.data.success) {
                setNode0On(n0Status.data.data?.status === true);
            }
            if (n0Bright.data.success) {
                const val = n0Bright.data.data?.brightness;
                if (val !== undefined && val !== null) setNode0Brightness(val);
            }

            // Node 1
            if (n1Status.data.success) {
                setNode1On(n1Status.data.data?.status === true);
            }
            if (n1Bright.data.success) {
                const val = n1Bright.data.data?.brightness;
                if (val !== undefined && val !== null) setNode1Brightness(val);
            }

            // Update master state based on both nodes
            updateMasterState();
            
        } catch (error) {
            console.error('Status fetch failed:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const updateMasterState = () => {
        // Master ON if BOTH nodes are ON
        setMasterOn(node0On && node1On);
        
        // Master brightness = average of both
        const avgBright = Math.round((node0Brightness + node1Brightness) / 2);
        setMasterBrightness(avgBright);
        
        // Master temp = average of both
        const avgTemp = Math.round((node0Temp + node1Temp) / 2);
        setMasterTemp(avgTemp);
    };

    // Update master state when individual states change
    useEffect(() => {
        updateMasterState();
    }, [node0On, node1On, node0Brightness, node1Brightness, node0Temp, node1Temp]);

    // Send command to both nodes
    const sendToBoth = async (command, value = null) => {
        if (updating) return;
        setUpdating(true);
        
        try {
            const promises = [];
            
            if (command === 'on') {
                promises.push(api.post('/light/0/on'));
                promises.push(api.post('/light/1/on'));
                setNode0On(true);
                setNode1On(true);
            } else if (command === 'off') {
                promises.push(api.post('/light/0/off'));
                promises.push(api.post('/light/1/off'));
                setNode0On(false);
                setNode1On(false);
            } else if (command === 'brightness') {
                promises.push(api.post('/light/0/brightness', { level: value }));
                promises.push(api.post('/light/1/brightness', { level: value }));
                setNode0Brightness(value);
                setNode1Brightness(value);
            } else if (command === 'temp') {
                promises.push(api.post('/light/0/temp', { kelvin: value }));
                promises.push(api.post('/light/1/temp', { kelvin: value }));
                setNode0Temp(value);
                setNode1Temp(value);
            }
            
            await Promise.all(promises);
            showToast(`Master command executed`, 'success');
            
        } catch (error) {
            showToast('Failed to execute master command', 'error');
        } finally {
            setUpdating(false);
        }
    };

    // Individual node controls
    const handleNodePower = async (node, on) => {
        if (updating) return;
        setUpdating(true);
        try {
            await api.post(`/light/${node}/${on ? 'on' : 'off'}`);
            if (node === 0) setNode0On(on);
            else setNode1On(on);
            showToast(`Light ${node} ${on ? 'ON' : 'OFF'}`, 'success');
        } catch (error) {
            showToast(`Failed to control Light ${node}`, 'error');
        } finally {
            setUpdating(false);
        }
    };

    const handleNodeBrightness = async (node, value) => {
        if (node === 0) setNode0Brightness(value);
        else setNode1Brightness(value);
        
        if (brightnessTimer.current) clearTimeout(brightnessTimer.current);
        brightnessTimer.current = setTimeout(() => {
            if (isConnected) {
                api.post(`/light/${node}/brightness`, { level: value }).catch(console.error);
            }
        }, 500);
    };

    const handleNodeTemp = async (node, value) => {
        if (node === 0) setNode0Temp(value);
        else setNode1Temp(value);
        
        if (tempTimer.current) clearTimeout(tempTimer.current);
        tempTimer.current = setTimeout(() => {
            if (isConnected) {
                api.post(`/light/${node}/temp`, { kelvin: value }).catch(console.error);
            }
        }, 500);
    };

    // Master controls
    const handleMasterPower = (on) => {
        sendToBoth(on ? 'on' : 'off');
    };

    const handleMasterBrightness = (value) => {
        setMasterBrightness(value);
        if (brightnessTimer.current) clearTimeout(brightnessTimer.current);
        brightnessTimer.current = setTimeout(() => {
            sendToBoth('brightness', value);
        }, 500);
    };

    const handleMasterTemp = (value) => {
        setMasterTemp(value);
        if (tempTimer.current) clearTimeout(tempTimer.current);
        tempTimer.current = setTimeout(() => {
            sendToBoth('temp', value);
        }, 500);
    };

    const handleReconnect = async () => {
        const result = await reconnect();
        if (result.success) {
            showToast('Reconnected!', 'success');
            fetchAllStatus();
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

    return (
        <Layout>
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition"
                        >
                            <ArrowLeft size={20} />
                            Back
                        </button>
                        <h1 className="text-2xl font-bold text-white">Master Control</h1>
                    </div>
                    <button
                        onClick={fetchAllStatus}
                        disabled={refreshing}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10"
                    >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>

                {/* Master Control Section */}
                <div className="glass rounded-2xl p-6 mb-6 border border-primary/20">
                    <div className="flex items-center gap-3 mb-4">
                        <Layers size={24} className="text-primary" />
                        <h2 className="text-xl font-bold text-white">Master Control</h2>
                        <span className="text-xs text-gray-500">(Controls both lights)</span>
                    </div>

                    <div className="flex gap-4 mb-4">
                        <button
                            onClick={() => handleMasterPower(true)}
                            disabled={updating || masterOn}
                            className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition ${
                                masterOn
                                    ? 'bg-green-500/20 text-green-500 cursor-default'
                                    : 'bg-primary hover:bg-primary/80 text-white'
                            }`}
                        >
                            <Power size={18} />
                            All ON
                        </button>
                        <button
                            onClick={() => handleMasterPower(false)}
                            disabled={updating || !masterOn}
                            className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition ${
                                !masterOn
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
                                <span>{Math.round((masterBrightness / 254) * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="254"
                                value={masterBrightness}
                                onChange={(e) => handleMasterBrightness(parseInt(e.target.value))}
                                className="w-full slider-thumb h-1.5 rounded-full bg-gray-700 appearance-none cursor-pointer"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between text-sm text-gray-400 mb-2">
                                <span className="flex items-center gap-2">
                                    <Thermometer size={16} />
                                    All Temperature
                                </span>
                                <span>{masterTemp}K</span>
                            </div>
                            <input
                                type="range"
                                min="2700"
                                max="6500"
                                value={masterTemp}
                                onChange={(e) => handleMasterTemp(parseInt(e.target.value))}
                                className="w-full slider-thumb h-1.5 rounded-full bg-gray-700 appearance-none cursor-pointer"
                                style={{
                                    background: `linear-gradient(to right, #ff7b00, #ffd700, #87ceeb)`
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Individual Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Node 0 */}
                    <div className="glass rounded-2xl p-5">
                        <h3 className="text-lg font-bold text-white mb-3">Light 0</h3>
                        <div className="flex gap-2 mb-3">
                            <button
                                onClick={() => handleNodePower(0, true)}
                                disabled={updating || node0On}
                                className={`flex-1 py-1.5 rounded-lg text-sm transition ${
                                    node0On
                                        ? 'bg-green-500/20 text-green-500 cursor-default'
                                        : 'bg-primary hover:bg-primary/80 text-white'
                                }`}
                            >
                                ON
                            </button>
                            <button
                                onClick={() => handleNodePower(0, false)}
                                disabled={updating || !node0On}
                                className={`flex-1 py-1.5 rounded-lg text-sm transition ${
                                    !node0On
                                        ? 'bg-red-500/20 text-red-500 cursor-default'
                                        : 'bg-white/10 hover:bg-white/20 text-white'
                                }`}
                            >
                                OFF
                            </button>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                            <Sun size={14} />
                            <span>{Math.round((node0Brightness / 254) * 100)}%</span>
                            <input
                                type="range"
                                min="0"
                                max="254"
                                value={node0Brightness}
                                onChange={(e) => handleNodeBrightness(0, parseInt(e.target.value))}
                                className="flex-1 slider-thumb h-1 rounded-full bg-gray-700 appearance-none cursor-pointer"
                                disabled={!node0On}
                            />
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-400 mt-2">
                            <Thermometer size={14} />
                            <span>{node0Temp}K</span>
                            <input
                                type="range"
                                min="2700"
                                max="6500"
                                value={node0Temp}
                                onChange={(e) => handleNodeTemp(0, parseInt(e.target.value))}
                                className="flex-1 slider-thumb h-1 rounded-full bg-gray-700 appearance-none cursor-pointer"
                                style={{
                                    background: `linear-gradient(to right, #ff7b00, #ffd700, #87ceeb)`
                                }}
                                disabled={!node0On}
                            />
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                            Status: {node0On ? '🟢 ON' : '⚫ OFF'}
                        </div>
                    </div>

                    {/* Node 1 */}
                    <div className="glass rounded-2xl p-5">
                        <h3 className="text-lg font-bold text-white mb-3">Light 1</h3>
                        <div className="flex gap-2 mb-3">
                            <button
                                onClick={() => handleNodePower(1, true)}
                                disabled={updating || node1On}
                                className={`flex-1 py-1.5 rounded-lg text-sm transition ${
                                    node1On
                                        ? 'bg-green-500/20 text-green-500 cursor-default'
                                        : 'bg-primary hover:bg-primary/80 text-white'
                                }`}
                            >
                                ON
                            </button>
                            <button
                                onClick={() => handleNodePower(1, false)}
                                disabled={updating || !node1On}
                                className={`flex-1 py-1.5 rounded-lg text-sm transition ${
                                    !node1On
                                        ? 'bg-red-500/20 text-red-500 cursor-default'
                                        : 'bg-white/10 hover:bg-white/20 text-white'
                                }`}
                            >
                                OFF
                            </button>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                            <Sun size={14} />
                            <span>{Math.round((node1Brightness / 254) * 100)}%</span>
                            <input
                                type="range"
                                min="0"
                                max="254"
                                value={node1Brightness}
                                onChange={(e) => handleNodeBrightness(1, parseInt(e.target.value))}
                                className="flex-1 slider-thumb h-1 rounded-full bg-gray-700 appearance-none cursor-pointer"
                                disabled={!node1On}
                            />
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-400 mt-2">
                            <Thermometer size={14} />
                            <span>{node1Temp}K</span>
                            <input
                                type="range"
                                min="2700"
                                max="6500"
                                value={node1Temp}
                                onChange={(e) => handleNodeTemp(1, parseInt(e.target.value))}
                                className="flex-1 slider-thumb h-1 rounded-full bg-gray-700 appearance-none cursor-pointer"
                                style={{
                                    background: `linear-gradient(to right, #ff7b00, #ffd700, #87ceeb)`
                                }}
                                disabled={!node1On}
                            />
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                            Status: {node1On ? '🟢 ON' : '⚫ OFF'}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}