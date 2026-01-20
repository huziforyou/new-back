const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const userRoutes = require('./routes/user.route.js');
const photoRoutes = require('./routes/photo.route.js');
const imageSourceRoutes = require('./routes/imageSource.routes.js');
const AllowedEmail = require('./models/AllowedEmail.model.js');
const { allowedEmails } = require('./config/allowedEmail.js');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const session = require('express-session');
const Image = require('./models/Image.model.js');

require('./auth/google.js');

dotenv.config();
// connectDB(); // Call this conditionally in routes or specific init functions if needed, but for Vercel, having it global is okay if it caches.
// However, since we refactored db.js to return a promise, we should probably await it or let endpoints handle it.
// For now, I will keep it global but inside a try-catch equivalent or just let it start async. 
// Actually, with the new db.js, we can just call it.
// connectDB();

const app = express();

app.use(async (req, res, next) => {
  try {
    console.log("Attempting to connect to DB...");
    console.log("Environment Keys:", Object.keys(process.env));
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Middlewares
app.use(cors({
  // ❗️ FRONTEND_URL ko environment variable se lein
  origin: process.env.FRONTEND_URL || 'https://maps-maker-frontend.vercel.app',
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

app.set('trust proxy', 1);

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-for-dev',
  resave: false,
  saveUninitialized: false,
  proxy: true, // Required for Vercel
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());

// Routes
app.use('/users', userRoutes);
app.use('/photos', photoRoutes);
app.use('/api/image-sources', imageSourceRoutes);

// Seed function removed for serverless compatibility.
// If seeding is needed, create a dedicated admin endpoint.

// Google Auth
app.get('/', (req, res) => {
  res.send('<a href="/auth/google">Continue With Google</a>');
});

app.get('/auth/google',
  passport.authenticate('google', {
    scope: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/drive.readonly'
    ],
    accessType: 'offline',
    prompt: 'consent'
  })
);

app.get('/gtoken',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL}/home`,
    successRedirect: '/photos/sync-images', // must exist in photoRoutes
  })
);

app.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/');
  });
});

// ✅ Test API for images
app.get('/api/images', async (req, res) => {
  try {
    const images = await Image.find({ latitude: { $ne: null }, longitude: { $ne: null } });
    res.json(images);
  } catch (err) {
    console.error('Failed to fetch images:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Vercel ke liye app ko export karein
module.exports = app;
