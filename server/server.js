const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload');
const supabase = require('./config/supabase');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const videoRoutes = require('./routes/videos');
const monthRoutes = require('./routes/months');
// Storage routes for Supabase Storage
const storageRoutes = require('./routes/storage');
// Removed Dropbox routes as we are using mock data now
const socialMediaRoutes = require('./routes/socialMedia');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max file size
  abortOnLimit: true
}));

// Test Supabase connection
supabase.auth.getSession()
  .then(() => console.log('Supabase connected'))
  .catch(err => console.error('Supabase connection error:', err));

// Routes
app.use('/api/auth', authRoutes); // Supabase auth routes
app.use('/api/users', userRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/months', monthRoutes);
// Storage routes for Supabase Storage
app.use('/api/storage', storageRoutes);
// Dropbox routes removed - using mock data instead
// Make sure social media routes are properly registered
app.use('/api/social-media', socialMediaRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
