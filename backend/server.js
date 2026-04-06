const express = require('express');
const cors = require('cors');
const path = require('path');

// Absolute path to .env — works both locally and on EC2
const ENV_PATH = path.resolve(__dirname, '.env');
require('dotenv').config({ path: ENV_PATH });
console.log(`📄 Loading .env from: ${ENV_PATH}`);

const { initDB } = require('./config/db');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: '✅ Hospital API running' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`✅ Server running on http://localhost:${port}`);
    console.log(`🔑 JWT_SECRET loaded: ${process.env.JWT_SECRET ? 'YES' : 'NO ⚠️'}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`⚠️  Port ${port} in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('❌ Server error:', err.message);
      process.exit(1);
    }
  });
};

// Init DB first, then register routes, then start
initDB()
  .then(() => {
    app.use('/api/auth',         require('./routes/auth'));
    app.use('/api/appointments', require('./routes/appointments'));
    app.use('/api/patients',     require('./routes/patients'));
    app.use('/api/doctors',      require('./routes/doctors'));
    app.use('/api/admin',        require('./routes/admin'));

    startServer(parseInt(process.env.PORT) || 5000);
  })
  .catch(err => {
    console.error('❌ Failed to initialize DB:', err.message);
    process.exit(1);
  });
