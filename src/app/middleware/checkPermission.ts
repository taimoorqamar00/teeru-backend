import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import AppError from '../error/AppError';
import { User } from '../modules/user/user.models';

const checkPermission = (...permissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, role } = req.user;

      // Admins bypass all permission checks
      if (role === 'admin') {
        return next();
      }

      const user = await User.findById(userId);

      if (!user) {
        return next(new AppError(httpStatus.NOT_FOUND, 'User not found'));
      }

      // Check if user has at least one of the required permissions
      const hasPermission = permissions.some(
        (permission) => user.permissions && user.permissions.includes(permission),
      );

      if (!hasPermission) {
        return next(
          new AppError(
            httpStatus.FORBIDDEN,
            `Access denied: missing required permission(s) '${permissions.join(', ')}'`,
          ),
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default checkPermission;
