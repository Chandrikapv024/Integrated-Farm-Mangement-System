const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const fieldRoutes = require('./routes/fieldRoutes');
const farmRoutes = require('./routes/farmRoutes');
const cropRoutes = require('./routes/cropRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// Connect to MongoDB Atlas
connectDB();

// CORS Middleware Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie Parser Middleware
app.use(cookieParser());

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Farm Management API Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/field-sectors', fieldRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/inventory', inventoryRoutes);



// Centralized Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(
    `[Server] Express server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
  );
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`[Server Error] Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = app;
