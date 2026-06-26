import { Schema } from "mongoose";


export interface INotification {
    userId?: Schema.Types.ObjectId; // Reference to User (absent for guest-triggered notifications)
    receiverId: Schema.Types.ObjectId; // Reference to User
    message: string;
    type: "Join" | "buyTicket"; // Type of notification
    isRead: boolean; // Whether the notification is read
    
  }