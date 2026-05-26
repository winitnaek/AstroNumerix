const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is required and must point to MongoDB Atlas');
  }

  if (!uri.startsWith('mongodb+srv://')) {
    throw new Error('Only MongoDB Atlas SRV connection strings are allowed');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('MongoDB Atlas connected');
}

module.exports = connectDB;
