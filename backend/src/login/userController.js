import User from './User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Helper to generate JWT access token
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      currentStep: user.currentStep,
      role: user.role || 'user', // fallback in case role is missing
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' } // ← consider shortening to '15m'–'1h' later
  );
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Basic input validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address',
      });
    }

    // 2. Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Don't tell attacker whether email exists → same message
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // 3. Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // 4. Generate token
    const token = generateAccessToken(user);

    // 5. Response (never send password or sensitive fields)
    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        currentStep: user.currentStep,
        // Add any other safe fields you want to expose
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.',
    });
  }
};

export const saveProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized - no user' });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid updates data' });
    }

    const userId = req.user.id; // from auth middleware (protect)
    const updates = req.body;

    // Optional: define allowed fields to prevent overwriting critical data
    const allowedUpdates = [
      'name',
      'phone',
      'location',
      'skills',
      'designation',
      'experience',
      'experienceTimeline',
      'degree',
      // ... add other fields you allow
    ];

    const sanitizedUpdates = {};
    allowedUpdates.forEach((key) => {
      if (updates[key] !== undefined) {
        sanitizedUpdates[key] = updates[key];
      }
    });

    // Prevent changing email or other sensitive fields via this endpoint
    if (updates.email || updates.password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password cannot be updated here',
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...sanitizedUpdates,
        currentStep: 'mcq', // advance step
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'Profile saved successfully!',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        currentStep: updatedUser.currentStep,
        // add other fields you want to return
      },
    });
  } catch (error) {
    console.error('Save profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};