import React from 'react';
import { Lightbulb, ChevronRight } from 'lucide-react';

export default function DeviceCard({ device, onControl }) {
    return (
        <div className="glass-card rounded-xl p-4 cursor-pointer hover:border-primary/30" onClick={onControl}>
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                        <Lightbulb size={20} className="text-primary" />
                    </div>
                    <div>
                        <h3 className="text-white font-medium">{device.name}</h3>
                        <p className="text-xs text-gray-500">Node {device.node}</p>
                    </div>
                </div>
                <ChevronRight size={18} className="text-gray-500" />
            </div>
            <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-green-500">● Connected</span>
            </div>
        </div>
    );
}