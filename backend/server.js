const express = require('express');
const cors = require('cors');

require('dotenv').config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({ status: '✅ Hospital API running' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

// Init DB first, then start server
const { initDB } = require('./config/db');
initDB()
  .then(() => app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`)))
  .catch(err => {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  });
const authRoutes = require('./routes/auth');