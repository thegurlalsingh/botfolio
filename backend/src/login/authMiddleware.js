// middleware/auth.js
import jwt from 'jsonwebtoken';

/**
 * Verifies JWT access token and attaches user data to req.user
 * Use this to protect routes that require authentication
 */
export const verifyToken = (req, res, next) => {
  // 1. Get token from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Invalid token format.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach minimal but useful user info
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'candidate', // fallback if role missing
      currentStep: decoded.currentStep,   // useful for flow control
      // NEVER attach sensitive data like password hash here
    };

    next();
  } catch (error) {
    console.error('[Token Verification Error]', {
      name: error.name,
      message: error.message,
      expiredAt: error.expiredAt,
    });

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
        code: 'TOKEN_EXPIRED',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
        code: 'INVALID_TOKEN',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed.',
      code: 'AUTH_FAILED',
    });
  }
};

/**
 * Restrict route to HR users only
 */
export const isHR = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  if (req.user.role !== 'hr') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. HR role required.',
      code: 'FORBIDDEN_HR_ONLY',
    });
  }

  next();
};

/**
 * Restrict route to Candidate users only
 */
export const isCandidate = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  if (req.user.role !== 'candidate') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Candidate role required.',
      code: 'FORBIDDEN_CANDIDATE_ONLY',
    });
  }

  next();
};

/**
 * Optional: Allow any authenticated user (HR or Candidate)
 * Useful for shared routes (profile, dashboard, etc.)
 */
export const isAuthenticated = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }
  next();
};