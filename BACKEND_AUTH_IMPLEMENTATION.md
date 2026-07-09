/**
 * BACKEND API IMPLEMENTATION GUIDE
 * File: backend/routes/auth.js (or equivalent for your backend framework)
 * 
 * This shows how to implement the /api/v1/auth/signin endpoint
 * that the frontend Auth.tsx component is calling.
 */

// ============================================================================
// OPTION 1: Express.js / Node.js Backend
// ============================================================================

/**
 * File: backend/routes/auth.js
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../database'); // Your database connection

// POST /api/v1/auth/signin
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find user in database
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email.toLowerCase()]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if user's email is verified
    if (!user.email_verified_at) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        isAdmin: user.is_admin,
        personaType: user.persona_type,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set secure HTTP-only cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Log login activity
    await pool.query(
      'INSERT INTO user_activity_logs (user_id, action, ip_address) VALUES ($1, $2, $3)',
      [user.id, 'login', req.ip]
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        personaType: user.persona_type,
        isAdmin: user.is_admin,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during login',
    });
  }
});

// POST /api/v1/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName, personaType } = req.body;

    // Validation
    if (!email || !password || !fullName || !personaType) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already in use',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const query = `
      INSERT INTO users (email, password_hash, full_name, persona_type, is_admin)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, full_name, persona_type
    `;

    const result = await pool.query(query, [
      email.toLowerCase(),
      passwordHash,
      fullName,
      personaType,
      false, // is_admin
    ]);

    const newUser = result.rows[0];

    // Generate verification token
    const verificationToken = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send verification email (implement email service)
    // await sendVerificationEmail(newUser.email, verificationToken);

    res.status(201).json({
      success: true,
      message: 'Account created. Please check your email to verify your account.',
      userId: newUser.id,
      email: newUser.email,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during registration',
    });
  }
});

// GET /api/v1/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('authToken');
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

module.exports = router;

// ============================================================================
// DATABASE SCHEMA (PostgreSQL)
// ============================================================================

/**
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  persona_type VARCHAR(50) NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_activity_logs_user_id ON user_activity_logs(user_id);
*/

// ============================================================================
// ENVIRONMENT VARIABLES (.env file)
// ============================================================================

/**
DATABASE_URL=postgresql://user:password@localhost:5432/migrationpath
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
*/

// ============================================================================
// MIDDLEWARE (auth.middleware.js)
// ============================================================================

/**
 * Middleware to verify JWT token from cookies or Authorization header
 */

const verifyToken = (req, res, next) => {
  try {
    // Check Authorization header first (Bearer token)
    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else {
      // Fall back to cookies
      token = req.cookies.authToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }
  next();
};

module.exports = { verifyToken, requireAdmin };

// ============================================================================
// MAIN SERVER SETUP (server.js or app.js)
// ============================================================================

/**
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/v1/auth', authRoutes);

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
*/
