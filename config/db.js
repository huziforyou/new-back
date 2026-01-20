// config/db.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    if (!process.env.MONGO_URI) {
      throw new Error('Please define the MONGO_URI environment variable inside .env.local');
    }

    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongoose) => {
      console.log(`MongoDB Connected: ${mongoose.connection.host}`);
      return mongoose;
    }).catch(error => {
      console.error(`Error connecting to MongoDB: ${error.message}`);
      throw error; // Let the caller handle it, don't exit process
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error(`Error resolving MongoDB connection: ${e.message}`);
    throw e;
  }

  return cached.conn;
};

module.exports = connectDB;
