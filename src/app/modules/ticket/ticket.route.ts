import { Router } from "express";
import auth, { optionalAuth } from "../../middleware/auth";
import { ticketController } from "./ticket.controller";

export const ticketRoutes = Router();

ticketRoutes
 .post(
    "/buy",
    optionalAuth(),
    ticketController.buyTicket
 )

.get(
    "/myTickets",
    auth("user", 'admin'),
    ticketController.getUserTickets
)

// .get(
//     "/:ticketId",
//     auth("")
// )