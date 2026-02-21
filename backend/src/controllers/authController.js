import { login as loginService, logout as logoutService } from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const login = asyncHandler(async (req, res) => {
  const { usid, password } = req.body;
  const data = await loginService(usid, password, {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] || null
  });
  res.json({ success: true, data });
});

export const logout = asyncHandler(async (req, res) => {
  const data = await logoutService(req.user.sid);
  res.json({ success: true, data });
});
