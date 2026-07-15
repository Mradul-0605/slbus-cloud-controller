import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, LogOut, WifiOff, Layers } from 'lucide-react';  // ← ADD Layers
import Layout from '../components/Layout';
import DeviceCard from '../components/DeviceCard';
import ConnectionStatus from '../components/ConnectionStatus';
import { useDevices } from '../hooks/useDevices';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
    const navigate = useNavigate();
    const { devices, loading } = useDevices();
    const { logout, isConnected, reconnect } = useAuth();

    return (
        <Layout>
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                        <p className="text-gray-400 text-sm">Control your smart home</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate('/master')}
                            className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition flex items-center gap-2"
                        >
                            <Layers size={18} />
                            <span className="text-sm hidden sm:inline">Master</span>
                        </button>
                        <button
                            onClick={logout}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
                        >
                            <LogOut size={20} className="text-gray-400" />
                        </button>
                    </div>
                </div>

                <ConnectionStatus />

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                    </div>
                ) : !isConnected ? (
                    <div className="glass rounded-xl p-8 text-center">
                        <WifiOff size={48} className="text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">Gateway disconnected</p>
                        <p className="text-sm text-gray-500 mt-1">Check your network connection</p>
                    </div>
                ) : devices.length === 0 ? (
                    <div className="glass rounded-xl p-8 text-center">
                        <Home size={48} className="text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No devices found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Master Control Card */}
                        <div 
                            onClick={() => navigate('/master')}
                            className="glass-card rounded-xl p-4 cursor-pointer hover:border-primary/30 border-2 border-primary/20"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/20">
                                        <Layers size={20} className="text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium">Master Control</h3>
                                        <p className="text-xs text-gray-500">Control All Lights</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                                <span className="text-xs text-primary">● Click to control all</span>
                            </div>
                        </div>

                        {/* Individual Device Cards */}
                        {devices.map((device) => (
                            <DeviceCard
                                key={device.node}
                                device={device}
                                isConnected={isConnected}
                                onControl={() => navigate(`/device/${device.node}`)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}