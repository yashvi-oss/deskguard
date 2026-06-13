import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
        code: 'NO_TOKEN',
      });
      return;
    }

    const decoded = jwt.verify(token, env.jwt_secret) as any;
    (req as any).userId = decoded.userId;
    (req as any).role = decoded.role;

    next();
  } catch (error) {
    logger.warn('Auth middleware error', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
  }
};

export const librarianOnly = (req: Request, res: Response, next: NextFunction) => {
  const role = (req as any).role;

  if (role !== 'librarian' && role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Only librarians can access this',
      code: 'FORBIDDEN',
    });
    return;
  }

  next();
};
