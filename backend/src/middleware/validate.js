import { ApiError } from '../utils/ApiError.js';

export function requireFields(fields = []) {
  return (req, _res, next) => {
    const missing = fields.filter((field) => req.body[field] === undefined || req.body[field] === null);
    if (missing.length) {
      throw new ApiError(400, 'Validation error', { missingFields: missing });
    }
    next();
  };
}
