const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');
const gatewayService = require('./services/gatewayService');
const socketManager = require('./socket/socketManager');

dotenv.config();

const gatewayRoutes = require('./routes/gatewayRoutes');
const deviceRoutes = require('./routes/deviceRoutes');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173','http://localhost:3000','https://slbus-frontend.netlify.app'],
    credentials: true
  }
});

// Initialize Socket.IO
socketManager.initialize(io);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', gatewayRoutes);
app.use('/api', deviceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  await gatewayService.initialize();
  console.log('✅ Backend initialized');
});