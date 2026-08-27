// Route handlers for user auth and profile endpoints: login, get profile, save profile, refresh token.
import User from './User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getCurrentUser, loginUser, saveUserProfile, refreshAccessToken } from './service.js';

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const login = async (req, res) => {
  try {
    const result = await loginUser(req.body);
    if (!result) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Logged in successfully!!!',
      token: result.token,
      refreshToken: result.refreshToken,
      user: result.user
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.'
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await getCurrentUser(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
    });
  }
};

export const saveProfile = async (req, res) => {
  try {
    const user = await saveUserProfile(req.user.id, req.body);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Profile saved successfully!!',
      user
    });
  } catch (error) {
    console.error('Save profile error', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save profile',
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required',
        code: 'REFRESH_TOKEN_REQUIRED'
      });
    }
    const accessToken = await refreshAccessToken(token);
    return res.status(200).json({
      success: true,
      accessToken
    });
  } catch (error) {
    console.error('Refresh token error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Refresh token expired or invalid',
      code: 'REFRESH_TOKEN_EXPIRED'
    });
  }
};