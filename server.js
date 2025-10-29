require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- CORS (configurable) ----------
// Set ALLOWED_ORIGINS in Render as comma-separated list when deploying.
// Example: ALLOWED_ORIGINS="http://localhost:5173,https://mgnrega-frontend-nine.vercel.app"
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,https://mgnrega-frontend-nine.vercel.app')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin like curl or server-side
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
      console.warn('Blocked CORS request from origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());

// ---------- MongoDB ----------
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('MongoDB error:', err));

// ---------- Routes ----------
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'MGNREGA API Server Running', version: '1.0' });
});

// Health endpoint for readiness checks
app.get('/health', (req, res) => {
  const mongoState = mongoose.connection && mongoose.connection.readyState;
  // readyState === 1 means connected
  res.json({ ok: true, mongo_connected: mongoState === 1, mongo_ready_state: mongoState });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// Aditya Mohite adityamohite4973@gmail.com 