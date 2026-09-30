import { Request, Response } from 'express';
import {
  validateRegisterInput,
  validateLoginInput,
  validateForgotPasswordInput,
  validateResetPasswordInput,
} from './auth.validation';
import {
  registerUser,
  loginUser,
  getCurrentUser,
  requestPasswordReset,
  resetPassword as resetPasswordService,
  EmailAlreadyInUseError,
  InvalidCredentialsError,
  UserNotFoundError,
  InvalidResetTokenError,
} from './auth.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export async function register(req: Request, res: Response) {
  const validationError = validateRegisterInput(req.body);
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  const { name, email, password } = req.body;

  try {
    const result = await registerUser(name, email, password);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof EmailAlreadyInUseError) {
      res.status(409).json({ message: error.message });
      return;
    }
    throw error;
  }
}

export async function login(req: Request, res: Response) {
  const validationError = validateLoginInput(req.body);
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  const { email, password } = req.body;

  try {
    const result = await loginUser(email, password);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof InvalidCredentialsError) {
      res.status(401).json({ message: error.message });
      return;
    }
    throw error;
  }
}

export async function forgotPassword(req: Request, res: Response) {
  const validationError = validateForgotPasswordInput(req.body);
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  await requestPasswordReset(req.body.email);
  res.status(200).json({ message: 'If an account exists for that email, a reset link has been sent.' });
}

export async function resetPassword(req: Request, res: Response) {
  const validationError = validateResetPasswordInput(req.body);
  if (validationError) {
    res.status(400).json({ message: validationError });
    return;
  }

  const { token, password } = req.body;

  try {
    await resetPasswordService(token, password);
    res.status(200).json({ message: 'Password reset successfully.' });
  } catch (error) {
    if (error instanceof InvalidResetTokenError) {
      res.status(400).json({ message: error.message });
      return;
    }
    throw error;
  }
}

export async function me(req: AuthenticatedRequest, res: Response) {
  try {
    const user = await getCurrentUser(req.userId!);
    res.status(200).json({ user });
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      res.status(401).json({ message: error.message });
      return;
    }
    throw error;
  }
}
