// Auth/profile service layer: login, token refresh, and user profile retrieval.
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { updateRefreshToken, findUserByRefreshToken, findPublicUserById, findUserByEmail, updateProfileWithTimelines } from "./repository.js";

const toApiUser = (user) => ({
  ...user,
  experience: user.experienceYear,
  degree: user.educationTimeLine,
  educationTimeLine: undefined,
  experienceYear: undefined
});

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      currentStep: user.currentStep,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await findUserByEmail(normalizedEmail);
  if (!user) {
    return null;
  }
  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    return null;
  }
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  const refreshTokenExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await updateRefreshToken(user.id, refreshToken, refreshTokenExpires);
  return {
    token: accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      currentStep: user.currentStep
    }
  };
};

export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error("Refresh token required");
  }
  const user = await findUserByRefreshToken(refreshToken);
  if (!user) {
    throw new Error("Refresh token expired or invalid");
  }
  const accessToken = generateAccessToken(user);
  return accessToken;
};

export const getCurrentUser = async (userId) => {
  const user = await findPublicUserById(userId);
  return user ? toApiUser(user) : null;
};

export const saveUserProfile = async (userId, data) => {
  const user = await updateProfileWithTimelines(userId, data);
  return user ? toApiUser(user) : null;
};