require('dotenv').config();
const { connectDB } = require('./config/database');
const app = require('./app');

const startServer = async () => {
  try {
    await connectDB();
    
    const PORT = process.env.PORT || 5080;
    app.listen(PORT, () => {
      console.log(`🚀 SDA Church Kiserian Main Server running on port ${PORT}`);
      console.log(`📱 M-Pesa integration ready`);
      console.log(`📧 SMS service ready`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
