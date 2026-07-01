import { Schema, model } from 'mongoose';
import { TTicket, TTicketInfo } from './ticket.interface';



const ticketInfoSchema = new Schema<TTicketInfo>(
  {
    type: { type: String, required: true },
    seat: { type: Number, required: true },
  },
  { _id: false }
);

const ticketSchema = new Schema<TTicket>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    deviceId: { type: String },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
    tickets: {
      type: [ticketInfoSchema],
      required: true,
      validate: [(v: TTicketInfo[]) => v.length > 0, 'At least one ticket must be provided'],
    },
    guestName: { type: String },
    guestEmail: { type: String },
    guestPhone: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const Ticket = model<TTicket>('Ticket', ticketSchema);
