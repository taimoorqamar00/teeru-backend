import mongoose, { Types } from "mongoose";

export type TTicketInfo = {
  type: string;
  seat: number;
};

export type TTicket = {
  userId?: Types.ObjectId;
  deviceId?: string;
  eventId: Types.ObjectId;
  paymentId: Types.ObjectId;
  tickets: TTicketInfo[];
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
};


export type BuyTicketInput = {
  fullName: string;
  userId?: mongoose.Types.ObjectId;
  deviceId?: string;
  eventId: mongoose.Types.ObjectId;
  amount: number;
  transactionId: string;
  paymentMethod: 'Wave' | 'OrangeMoney' | 'Apple' | 'Google' | 'Card' | 'Bank' | 'stripe';
  tickets: TTicketInfo[];
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
};