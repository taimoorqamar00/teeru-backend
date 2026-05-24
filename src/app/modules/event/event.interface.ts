import { ObjectId } from "mongoose";

export interface ITicketPrice {
  price: number;
  serviceFee: number;
  processingFee: number;
}

export interface IZoneTicketPrice {
  zoneType: ObjectId;
  price: number;
  serviceFee: number;
  processingFee: number;
}

// Legacy format (kept for backward compatibility)
type TTicketPrices = {
  tribune: ITicketPrice;
  annexeLoge: ITicketPrice;
  logeVIP: ITicketPrice;
  logeVVIP: ITicketPrice;
};

export interface IEvent {
  image?: string;
  head_to_head?: string;
  name: string;
  category: ObjectId;
  date: Date;
  time: string;
  location: string;
  ticketPrices?: TTicketPrices;
  zoneTicketPrices: IZoneTicketPrice[];
  isDeleted?: boolean;
}