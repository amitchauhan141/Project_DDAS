import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { validateSession } from '../services/authService.js';

export async function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) throw new ApiError(401, 'Missing access token');

    const decoded = jwt.verify(token, env.jwtSecret);
    const session = await validateSession(decoded.sid);

    if (!session || session.user_id !== decoded.id) {
      throw new ApiError(401, 'Session is invalid or expired');
    }

    req.user = decoded;
    req.authToken = token;
    next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    return next(new ApiError(401, 'Invalid or expired token'));
  }
}

export function authorizeRoles(...allowedRoles) {
  return (req, _res, next) => {
    const role = req.user?.role;
    if (!role) return next(new ApiError(401, 'Unauthorized'));
    if (!allowedRoles.includes(role)) {
      return next(new ApiError(403, `Role ${role} is not allowed to perform this action`));
    }
    return next();
  };
}
