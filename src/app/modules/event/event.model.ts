import { Schema, model } from 'mongoose';
import { IEvent } from './event.interface';



const EventSchema = new Schema<IEvent>(
  {
    image: {
      type: String,
      required: true,
      default: ''
    },
    head_to_head: {
      type: String,
      required: true,
      default: ""
    },
    name: {
      type: String,
      required: true,
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
      },      
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    // Legacy hardcoded ticket prices (kept for backward compatibility)
    ticketPrices: {
      tribune: {
        price: { type: Number, default: 0 },
        serviceFee: { type: Number, default: 0 },
        processingFee: { type: Number, default: 0 },
      },
      annexeLoge: {
        price: { type: Number, default: 0 },
        serviceFee: { type: Number, default: 0 },
        processingFee: { type: Number, default: 0 },
      },
      logeVIP: {
        price: { type: Number, default: 0 },
        serviceFee: { type: Number, default: 0 },
        processingFee: { type: Number, default: 0 },
      },
      logeVVIP: {
        price: { type: Number, default: 0 },
        serviceFee: { type: Number, default: 0 },
        processingFee: { type: Number, default: 0 },
      }
    },
    // New dynamic zone-based ticket prices
    zoneTicketPrices: [
      {
        zoneType: { type: Schema.Types.ObjectId, ref: 'ZoneType', required: true },
        price: { type: Number, default: 0 },
        serviceFee: { type: Number, default: 0 },
        processingFee: { type: Number, default: 0 },
      }
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

const Event = model<IEvent>('Event', EventSchema);

export default Event;