import httpStatus from 'http-status';
import AppError from '../error/AppError';
import catchAsync from '../utils/catchAsync';
import { verifyToken } from '../utils/tokenManage';
import config from '../config';
import { User } from '../modules/user/user.models';

const auth = (...userRoles: string[]) => {
  return catchAsync(async (req, res, next) => {
    const token: any = req.headers?.authorization || req?.headers?.token;

    if (!token) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'you are not authorized!');
    }

    const decodeData = verifyToken({
      token,
      access_secret: config.jwt_access_secret as string,
    });

     
    const { role, userId } = decodeData;

    const isUserExist = await User.IsUserExistById(userId);
    if (!isUserExist) {
      throw new AppError(httpStatus.NOT_FOUND, 'user not found');
    }

    // Allow access if:
    // 1. User's role is in the allowed roles list, OR
    // 2. User is a staff member with permissions (staff can access admin routes based on permissions)
    if (userRoles && userRoles.length > 0 && !userRoles.includes(role)) {
      // If the user is staff and admin is in the allowed roles, let them through
      // Permission-level checks will be handled by checkPermission middleware
      if (role === 'staff' && userRoles.includes('admin')) {
        // Staff with permissions can access admin-level routes
        // Actual permission checks happen via checkPermission middleware
      } else {
        throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized');
      }
    }
    
    req.user = decodeData;
    next();
  });
};
export default auth;
