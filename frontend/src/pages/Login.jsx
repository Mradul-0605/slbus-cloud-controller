import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Loader2, WifiOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login, isAuthenticated, isConnected, error } = useAuth();
    const { showToast } = useToast();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        setLoading(true);
        const result = await login(email, password);
        setLoading(false);

        if (result.success) {
            if (isConnected) {
                showToast('Connected successfully!', 'success');
            } else {
                showToast('Logged in but gateway is disconnected', 'info');
            }
            navigate('/dashboard');
        } else {
            showToast(result.error || 'Connection failed', 'error');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass rounded-2xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 rounded-full bg-primary/20">
                            <Home size={40} className="text-primary" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-white">SL BUS Cloud</h1>
                    <p className="text-gray-400 text-sm mt-1">Sign in to control your devices</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                        <WifiOff size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="text-sm text-gray-400 block mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary focus:outline-none transition"
                            placeholder="Enter your email"
                            disabled={loading}
                        />
                    </div>

                    <div className="mb-6">
                        <label className="text-sm text-gray-400 block mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-primary focus:outline-none transition"
                            placeholder="Enter your password"
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/80 text-white font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Connecting...
                            </>
                        ) : (
                            'Connect'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}