const mongoose = require('mongoose');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let cached = global.__mongooseConnection;
if (!cached) {
  cached = global.__mongooseConnection = { conn: null, promise: null };
}

let mongodProcess = null;

async function startLocalMongod() {
  const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (isVercel) return;

  const dbPath = path.resolve(__dirname, '../../../data/db');
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }

  const possibleMongodPaths = [
    'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
    'mongod'
  ];

  let mongodBin = 'mongod';
  for (const p of possibleMongodPaths) {
    if (fs.existsSync(p)) {
      mongodBin = p;
      break;
    }
  }

  console.log(`[DB] Starting embedded mongod process using ${mongodBin} on port 27017...`);
  mongodProcess = spawn(mongodBin, ['--dbpath', dbPath, '--port', '27017', '--bind_ip', '127.0.0.1'], {
    stdio: 'ignore',
    detached: false
  });

  mongodProcess.on('error', (err) => {
    console.error('[DB] mongod process error:', err.message);
  });

  await new Promise((resolve) => setTimeout(resolve, 1500));
}

async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const uri = process.env.MONGODB_URI || (!isVercel ? 'mongodb://127.0.0.1:27017/throttlex' : null);

  if (!uri) {
    throw new Error(
      'MONGODB_URI environment variable is missing in Vercel. Please go to Vercel Project Settings > Environment Variables, add MONGODB_URI with your MongoDB Atlas connection string, and redeploy.'
    );
  }

  const isAtlas = uri.includes('mongodb+srv://') || uri.includes('@');

  const options = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
    socketTimeoutMS: 45000
  };

  if (!cached.promise) {
    cached.promise = (async () => {
      try {
        console.log(`[DB] Connecting to MongoDB (${isAtlas ? 'MongoDB Atlas' : uri})...`);
        const mongooseInstance = await mongoose.connect(uri, options);
        console.log('[DB] MongoDB connected successfully.');
        return mongooseInstance;
      } catch (err) {
        // If not MongoDB Atlas, not Vercel, and local connection failed, attempt local spawn
        if (!isAtlas && !isVercel) {
          console.log('[DB] Direct connection failed, starting local MongoDB server...');
          await startLocalMongod();
          const mongooseInstance = await mongoose.connect(uri, options);
          console.log('[DB] Successfully connected to spawned local MongoDB.');
          return mongooseInstance;
        }
        cached.promise = null;
        cached.conn = null;
        throw err;
      }
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    throw e;
  }

  return cached.conn;
}

process.on('exit', () => {
  if (mongodProcess) {
    try {
      mongodProcess.kill();
    } catch (e) {}
  }
});

module.exports = { connectDB };
