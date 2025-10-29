require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- CORS ----------
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173' , 'https://mgnrega-frontend-nine.vercel.app'], // Vite dev server
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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// Aditya Mohite adityamohite4973@gmail.com 