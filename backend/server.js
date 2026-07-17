const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');

dotenv.config();

const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const lightRoutes = require('./routes/light');
const { initMQTT } = require('./services/mqttService');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:5173', 'https://slbus-frontend.netlify.app'],
        credentials: true
    }
});

// Store io globally for use in other files
global.io = io;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.use('/api', deviceRoutes);
app.use('/api', lightRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Socket.IO connection
io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);
    
    // Send current devices on connection
    const { getDevices } = require('./services/mqttService');
    const devices = getDevices();
    if (devices && devices.length > 0) {
        socket.emit('devices_updated', devices);
    }
    
    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    await initMQTT();
});