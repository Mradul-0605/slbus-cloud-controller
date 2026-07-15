import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

export default function ColorWheel({ node, onColorChange }) {
    const canvasRef = useRef(null);
    const [selectedColor, setSelectedColor] = useState('#3b82f6');

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 8;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw color wheel
        for (let angle = 0; angle < 360; angle++) {
            const startAngle = (angle * Math.PI) / 180;
            const endAngle = ((angle + 1) * Math.PI) / 180;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            
            const hue = angle;
            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            ctx.fill();
        }

        // Inner circle
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

    }, []);

    const handleClick = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const pixel = canvas.getContext('2d').getImageData(x, y, 1, 1);
        const data = pixel.data;
        
        if (data[3] > 0) {
            const hex = `#${data[0].toString(16).padStart(2, '0')}${data[1].toString(16).padStart(2, '0')}${data[2].toString(16).padStart(2, '0')}`;
            setSelectedColor(hex);
            
            // Convert hex to RGB
            const r = data[0];
            const g = data[1];
            const b = data[2];
            onColorChange(r, g, b);
        }
    };

    return (
        <div className="relative inline-block">
            <canvas
                ref={canvasRef}
                width={200}
                height={200}
                className="rounded-full cursor-pointer"
                onClick={handleClick}
            />
            <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-white shadow-lg"
                style={{ backgroundColor: selectedColor }}
            />
            <button 
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition"
                onClick={() => {
                    setSelectedColor('#3b82f6');
                    onColorChange(59, 130, 246);
                }}
            >
                <RotateCcw size={14} className="text-gray-400" />
            </button>
        </div>
    );
}