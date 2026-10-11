import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { loginSchema, registerSchema, refreshSchema } from '../validators/auth.validators';
import { asyncHandler, ApiError } from '../middleware/errorHandler';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !comparePassword(password, user.passwordHash)) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const token = signAccessToken({ userId: user.id, role: user.role });
  const refresh = signRefreshToken({ userId: user.id });

  res.json({ token, refresh, role: user.role, userId: user.id, email: user.email });
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new ApiError(409, 'An account with that email already exists');

  const existingStudent = await prisma.resident.findUnique({ where: { studentNumber: data.studentNumber } });
  if (existingStudent) throw new ApiError(409, 'That student number is already registered');

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: data.email,
        passwordHash: hashPassword(data.password),
        role: 'RESIDENT',
      },
    });
    await tx.resident.create({
      data: {
        userId: created.id,
        studentNumber: data.studentNumber,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        course: data.course,
        school: data.school,
      },
    });
    return created;
  });

  const token = signAccessToken({ userId: user.id, role: user.role });
  const refresh = signRefreshToken({ userId: user.id });

  res.status(201).json({ token, refresh, role: user.role, userId: user.id, email: user.email });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refresh: refreshToken } = refreshSchema.parse(req.body);

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Refresh token expired or invalid, please log in again');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw new ApiError(401, 'User no longer exists');

  const token = signAccessToken({ userId: user.id, role: user.role });
  res.json({ token, role: user.role });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  // Stateless JWTs: logout is handled client-side by discarding the tokens.
  // This endpoint exists for symmetry with the API summary in the build
  // guide, and as a hook point if you later move to a refresh-token
  // denylist stored in the database or Redis.
  res.json({ message: 'Logged out' });
});
