import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ticketServices } from "./ticket.service";
import httpStatus from 'http-status';
import AppError from "../../error/AppError";

const buyTicket = catchAsync(async (req: Request, res: Response) => {
      if (req.user) {
        req.body.fullName = req.user.fullName;
        req.body.userId = req.user.userId;
      } else {
        const { guestName, guestEmail, guestPhone } = req.body;
        if (!guestName || !guestEmail || !guestPhone) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            'guestName, guestEmail and guestPhone are required for guest checkout'
          );
        }
        req.body.fullName = guestName;
      }

      console.log(req.body)
    const newTicket = await ticketServices.buyTicket(req.body);
  
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'TIcket buy successfully',
      data: newTicket,
    });
  });

const getUserTickets = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;

  const tickets = await ticketServices.getUserTickets(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User tickets retrieved successfully',
    data: tickets,
  });
});

export const ticketController = {
    buyTicket,
    getUserTickets
}