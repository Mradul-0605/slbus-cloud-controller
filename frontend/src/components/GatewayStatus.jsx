import React from 'react';
import { Wifi, WifiOff, Server, Clock, AlertCircle } from 'lucide-react';
import { useDeviceContext } from '../context/DeviceContext';

export default function GatewayStatus() {
    const { devices, connected } = useDeviceContext();

    const formatTime = (timestamp) => {
        if (!timestamp) return 'Never';
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    };

    const lastUpdate = devices.length > 0 ? devices[0]?.lastUpdate : null;

    return (
        <div className="glass rounded-2xl p-6 mb-6 border border-white/5">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${connected ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        {connected ? (
                            <Wifi size={24} className="text-green-500" />
                        ) : (
                            <WifiOff size={24} className="text-red-500" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-white font-medium">Gateway Status</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {connected ? 'Online' : 'Offline'}
                            </span>
                        </div>
                        <p className="text-sm text-gray-400">
                            {connected ? 'SL BUS Gateway' : 'Disconnected'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                                <Server size={12} />
                                Devices: {devices.length}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock size={12} />
                                Last Update: {formatTime(lastUpdate)}
                            </span>
                            {!connected && (
                                <span className="flex items-center gap-1 text-red-400">
                                    <AlertCircle size={12} />
                                    Waiting for connection...
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`text-xs ${connected ? 'text-green-500' : 'text-red-500'}`}>
                        {connected ? '● Connected' : '● Disconnected'}
                    </div>
                </div>
            </div>
        </div>
    );
}