import React from 'react';
import { Lightbulb, ChevronRight, Power, PowerOff } from 'lucide-react';

export default function DeviceCard({ device, isConnected, onControl }) {
    return (
        <div className="glass-card rounded-xl p-4 cursor-pointer hover:border-primary/30 transition" onClick={onControl}>
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${device.power ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                        <Lightbulb size={20} className={device.power ? 'text-green-500' : 'text-gray-500'} />
                    </div>
                    <div>
                        <h3 className="text-white font-medium">{device.name || `Light ${device.node}`}</h3>
                        <p className="text-xs text-gray-500">Node {device.node}</p>
                    </div>
                </div>
                <ChevronRight size={18} className="text-gray-500" />
            </div>
            <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={`text-xs ${device.power ? 'text-green-500' : 'text-gray-500'}`}>
                        {isConnected ? (device.power ? '● ON' : '● OFF') : '● Offline'}
                    </span>
                    <span className="text-xs text-gray-600">
                        {Math.round((device.brightness / 254) * 100)}%
                    </span>
                </div>
                {device.power ? <Power size={14} className="text-green-500" /> : <PowerOff size={14} className="text-gray-500" />}
            </div>
        </div>
    );
}