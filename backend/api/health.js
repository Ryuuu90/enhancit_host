const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
  });

  isConnected = true;
}

module.exports = async (req, res) => {
  try {
    await connectDB();

    if (mongoose.connection.readyState === 1) {
      res.status(200).json({ status: 'ok', db: 'connected' });
    } else {
      res.status(500).json({ status: 'error', db: 'not connected' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};