import httpStatus from 'http-status';
import AppError from '../error/AppError';
import catchAsync from '../utils/catchAsync';
import { verifyToken } from '../utils/tokenManage';
import config from '../config';
import { User } from '../modules/user/user.models';

const auth = (...userRoles: string[]) => {
  return catchAsync(async (req, res, next) => {
    console.log('=== AUTH MIDDLEWARE DEBUG ===');
    console.log('req.body at auth start:', req.body);
    console.log('typeof req.body:', typeof req.body);
    
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

    if (userRoles && !userRoles.includes(role)) {
      console.log("execute this line")
      throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized');
    }
    
    console.log('req.body before next:', req.body);
    req.user = decodeData;
    next();
  });
};
export default auth;
