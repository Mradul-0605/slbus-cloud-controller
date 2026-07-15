const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const lightRoutes = require('./routes/light');

const app = express();
const PORT = process.env.PORT || 5000;

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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});