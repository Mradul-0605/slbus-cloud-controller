import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DeviceControl from './pages/DeviceControl';
import MasterControl from './pages/MasterControl';
import { ToastProvider } from './components/Toast';
import { DeviceProvider } from './context/DeviceContext';
import { connectSocket, disconnectSocket } from './socket/socket';

function App() {
    useEffect(() => {
        connectSocket();
        return () => {
            disconnectSocket();
        };
    }, []);

    return (
        <ToastProvider>
            <DeviceProvider>
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/device/:node" element={<DeviceControl />} />
                        <Route path="/master" element={<MasterControl />} />
                        <Route path="/" element={<Navigate to="/login" />} />
                    </Routes>
                </BrowserRouter>
            </DeviceProvider>
        </ToastProvider>
    );
}

export default App;