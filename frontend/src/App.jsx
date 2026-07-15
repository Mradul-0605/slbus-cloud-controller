import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DeviceControl from './pages/DeviceControl';
import MasterControl from './pages/MasterControl';  // ← ADD
import { ToastProvider } from './components/Toast';

function App() {
    return (
        <ToastProvider>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/device/:node" element={<DeviceControl />} />
                    <Route path="/master" element={<MasterControl />} />  {/* ← ADD */}
                    <Route path="/" element={<Navigate to="/login" />} />
                </Routes>
            </BrowserRouter>
        </ToastProvider>
    );
}

export default App;