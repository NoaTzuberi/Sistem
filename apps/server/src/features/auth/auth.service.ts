import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, UserDocument } from '../users/user.model';
import { config } from '../../config/env';
import { sendPasswordResetEmail } from './email.service';
import { getAppState } from '../users/appState.service';

const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = '7d';
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export class EmailAlreadyInUseError extends Error {}
export class InvalidCredentialsError extends Error {}
export class UserNotFoundError extends Error {}
export class InvalidResetTokenError extends Error {}

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: TOKEN_EXPIRY });
}

function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function toPublicUser(user: UserDocument & { _id: unknown }) {
  const id = String(user._id);
  return {
    id,
    name: user.name,
    email: user.email,
    role: user.role,
    appState: await getAppState(id, user),
    onboardingCompleted: user.onboardingCompleted,
    createdAt: user.createdAt,
  };
}

export async function registerUser(name: string, email: string, password: string) {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new EmailAlreadyInUseError('Email is already registered.');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  // Only these fields — a role from the request body must never reach the model.
  const user = await User.create({ name, email, passwordHash });

  return { token: signToken(String(user._id)), user: await toPublicUser(user) };
}

export async function getCurrentUser(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw new UserNotFoundError('User not found.');
  }
  return await toPublicUser(user);
}

export async function loginUser(email: string, password: string) {
  const user = await User.findOne({ email });
  if (!user) {
    throw new InvalidCredentialsError('Invalid email or password.');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new InvalidCredentialsError('Invalid email or password.');
  }

  return { token: signToken(String(user._id)), user: await toPublicUser(user) };
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await User.findOne({ email });
  if (!user) {
    // Never reveal whether an email is registered — resolve silently either way.
    return;
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetTokenHash = hashResetToken(rawToken);
  user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
  await user.save();

  const resetUrl = `${config.clientUrl}/reset-password?token=${rawToken}`;
  try {
    await sendPasswordResetEmail(user.email, resetUrl);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const user = await User.findOne({
    passwordResetTokenHash: hashResetToken(token),
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new InvalidResetTokenError('This reset link is invalid or has expired.');
  }

  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
}
