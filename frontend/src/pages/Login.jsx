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
        console.log("isAuthenticated =", isAuthenticated);

        if (isAuthenticated) {
            console.log("Navigating to dashboard...");
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log("================================");
        console.log("LOGIN BUTTON CLICKED");
        console.log("Email:", email);
        console.log("Password:", password);
        console.log("================================");

        if (!email || !password) {
            console.log("Email or password missing");
            showToast('Please fill in all fields', 'error');
            return;
        }

        try {
            setLoading(true);

            console.log("Calling login()...");

            const result = await login(email, password);

            console.log("login() returned:");
            console.log(result);

            setLoading(false);

           if (result && result.success) {

    console.log("================================");
    console.log("LOGIN SUCCESS");
    console.log(result);
    console.log("Gateway =", result.data.gateway);
    console.log("================================");

    if (result.data.gateway.connected) {
        showToast("Connected successfully!", "success");
    } else {
        showToast("Logged in but gateway disconnected", "info");
    }

    navigate("/dashboard");

} else {

    console.log("================================");
    console.log("LOGIN FAILED");
    console.log(result);
    console.log("================================");

    showToast(
        result?.error || "Login failed",
        "error"
    );
}

        } catch (err) {
            setLoading(false);

            console.error("================================");
            console.error("LOGIN EXCEPTION");
            console.error(err);
            console.error(err.response);
            console.error(err.response?.data);
            console.error("================================");

            showToast(
                err.response?.data?.error ||
                err.message ||
                "Unknown Error",
                "error"
            );
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

                    <h1 className="text-2xl font-bold text-white">
                        SL BUS Cloud
                    </h1>

                    <p className="text-gray-400 mt-2">
                        Sign in to control your devices
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
                        <WifiOff size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="mb-4">
                        <label className="block mb-1 text-sm text-gray-400">
                            Email
                        </label>

                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email"
                            disabled={loading}
                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block mb-1 text-sm text-gray-400">
                            Password
                        </label>

                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            disabled={loading}
                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-lg bg-primary text-white font-semibold"
                    >
                        {loading ? (
                            <>
                                <Loader2
                                    size={18}
                                    className="inline animate-spin mr-2"
                                />
                                Connecting...
                            </>
                        ) : (
                            "Connect"
                        )}
                    </button>

                </form>
            </div>
        </div>
    );
}