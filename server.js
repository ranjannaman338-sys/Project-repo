require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { exec } = require('child_process');

// Crash protection
process.on('uncaughtException', (err) => {
  console.error('[CRASH] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRASH] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Periodic memory monitoring
setInterval(() => {
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  if (used > 200) console.warn(`[DIAG] Memory usage: ${Math.round(used)} MB`);
}, 30000);

const app = express();
const server = http.createServer(app);

// Use a fallback secret for development if .env is missing to prevent total auth failure
const JWT_SECRET = process.env.JWT_SECRET || 'bidSphere_dev_fallback_secret_2024';
if (!process.env.JWT_SECRET) {
  console.warn('[WARN] JWT_SECRET is not defined in .env. Using fallback secret.');
}
app.set('jwtSecret', JWT_SECRET);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection with Retry Logic
const connectDB = async () => {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('[FATAL] MONGO_URI is not defined in .env');
    return;
  }

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s
    });
    console.log('[SUCCESS] MongoDB Connected');
  } catch (err) {
    console.error('[ERROR] MongoDB connection failed:', err.message);
    console.log('[INFO] Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// Routes
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const bidRoutes = require('./routes/bid')(io);

app.use('/api', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/bids', bidRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    version: require('./package.json').version,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    readyState: mongoose.connection.readyState,
    timestamp: new Date().toISOString()
  });
});

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Port configuration
const PORT = process.env.PORT || 5050;

/**
 * Automatically terminates any existing process on the target port
 * to prevent EADDRINUSE errors.
 */
const killPortProcess = async (port) => {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      // Windows: Taskkill by PID found via netstat
      exec(`netstat -ano | findstr :${port}`, (err, stdout) => {
        if (!err && stdout) {
          const lines = stdout.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          const pid = lastLine.trim().split(/\s+/).pop();
          if (pid && pid !== '0') {
            exec(`taskkill /F /PID ${pid}`, () => resolve());
          } else resolve();
        } else resolve();
      });
    } else {
      // Unix/Mac: Kill by PID found via lsof
      exec(`lsof -t -i:${port}`, (err, stdout) => {
        if (stdout && stdout.trim()) {
          const pids = stdout.trim().split('\n').join(' ');
          exec(`kill -9 ${pids}`, () => resolve());
        } else {
          resolve();
        }
      });
    }
  });
};

const startServer = async () => {
  await killPortProcess(PORT);
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[SUCCESS] Server running on port ${PORT}`);
    console.log(`[OK] Local: http://localhost:${PORT}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[FATAL] Port ${PORT} is still in use after attempt to clear. Please terminate manually.`);
      process.exit(1);
    } else {
      console.error('[FATAL] Server startup error:', err);
      process.exit(1);
    }
  });
};

// Global process error handling
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();

