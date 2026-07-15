import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './Toast';

export default function ConnectionStatus() {
    const { isConnected, gatewayInfo, error, reconnect, checkStatus } = useAuth();
    const [reconnecting, setReconnecting] = useState(false);
    const { showToast } = useToast();

    const handleReconnect = async () => {
        setReconnecting(true);
        const result = await reconnect();
        setReconnecting(false);
        
        if (result.success) {
            showToast('Reconnected successfully!', 'success');
        } else {
            showToast('Reconnection failed: ' + result.error, 'error');
        }
    };

    const handleRefresh = async () => {
        await checkStatus();
        showToast('Status refreshed', 'info');
    };

    return (
        <div className="glass rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${isConnected ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        {isConnected ? (
                            <Wifi size={24} className="text-green-500" />
                        ) : (
                            <WifiOff size={24} className="text-red-500" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                                {isConnected ? '● Connected' : '● Disconnected'}
                            </span>
                            {error && (
                                <span className="text-xs text-red-400 flex items-center gap-1">
                                    <AlertCircle size={12} />
                                    {error}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-400">
                            {isConnected ? (gatewayInfo?.gateway || 'SL BUS Gateway') : 'Not Connected'}
                        </p>
                        {isConnected && gatewayInfo?.uuid && (
                            <p className="text-xs text-gray-500 font-mono">
                                UUID: {gatewayInfo.uuid}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition text-sm flex items-center gap-1.5"
                    >
                        <RefreshCw size={14} />
                        Refresh
                    </button>
                    {!isConnected && (
                        <button
                            onClick={handleReconnect}
                            disabled={reconnecting}
                            className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/80 text-white transition text-sm flex items-center gap-1.5 disabled:opacity-50"
                        >
                            {reconnecting ? (
                                <>
                                    <RefreshCw size={14} className="animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                'Reconnect'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}