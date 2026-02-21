import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { env } from '../config/env.js';
import {
  closeSessionByTokenId,
  createUserSession,
  findActiveSessionByTokenId,
  findUserByUsid
} from '../models/userModel.js';
import { ApiError } from '../utils/ApiError.js';

export async function login(usid, password, requestMeta) {
  const user = await findUserByUsid(usid);
  if (!user) throw new ApiError(401, 'Invalid USID or password');

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) throw new ApiError(401, 'Invalid USID or password');

  const tokenId = randomUUID();

  await createUserSession({
    userId: user.id,
    tokenId,
    ipAddress: requestMeta?.ipAddress || null,
    userAgent: requestMeta?.userAgent || null
  });

  const token = jwt.sign(
    {
      id: user.id,
      usid: user.usid,
      role: user.role,
      departmentId: user.department_id,
      sid: tokenId
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

  return {
    token,
    user: {
      id: user.id,
      usid: user.usid,
      name: user.name,
      email: user.email,
      departmentId: user.department_id,
      role: user.role
    }
  };
}

export async function validateSession(tokenId) {
  if (!tokenId) return null;
  return findActiveSessionByTokenId(tokenId);
}

export async function logout(tokenId) {
  const session = await closeSessionByTokenId(tokenId);
  if (!session) throw new ApiError(401, 'Session is already invalid or expired');
  return { message: 'Logout successful' };
}
