import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const getIcon = (type) => {
        switch (type) {
            case 'success':
                return <CheckCircle size={20} className="text-green-500" />;
            case 'error':
                return <AlertCircle size={20} className="text-red-500" />;
            case 'info':
                return <Info size={20} className="text-blue-500" />;
            default:
                return <Info size={20} className="text-gray-500" />;
        }
    };

    const getBorderColor = (type) => {
        switch (type) {
            case 'success':
                return 'border-green-500/30';
            case 'error':
                return 'border-red-500/30';
            case 'info':
                return 'border-blue-500/30';
            default:
                return 'border-gray-500/30';
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 space-y-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`glass rounded-xl px-4 py-3 flex items-center gap-3 min-w-[250px] shadow-xl border ${getBorderColor(toast.type)}`}
                    >
                        {getIcon(toast.type)}
                        <span className="text-white text-sm flex-1">{toast.message}</span>
                        <button onClick={() => removeToast(toast.id)} className="text-gray-500 hover:text-white transition">
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}