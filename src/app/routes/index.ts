import { Router } from "express";
import { userRoutes } from "../modules/user/user.route";
import { authRoutes } from "../modules/auth/auth.route";
import { otpRoutes } from "../modules/otp/otp.routes";
import { settingsRoutes } from "../modules/setting/setting.route";
import { notificationRoutes } from "../modules/notifications/notifications.route";
import { categoryRoutes } from "../modules/category/category.route";
import { eventRoutes } from "../modules/event/event.route";
import { reviewRoutes } from "../modules/review/review.route";
import { ticketRoutes } from "../modules/ticket/ticket.route";
import { paymentRoutes } from "../modules/payment/payment.route";
import { slidingTextRoutes } from "../modules/slidingText/slidingText.route";
import { bookingRoutes } from "../modules/booking/booking.route";
import { testBookingRoutes } from "../modules/booking/booking.test-route";
import { bayRoutes } from "../modules/bay/bay.route";
import { scheduleRoutes } from "../modules/schedule/schedule.route";

const router = Router();

const moduleRoutes = [
  {
    path: '/users',
    route: userRoutes,
  },
  {
    path: '/auth',
    route: authRoutes,
  },
  {
    path: "/otp",
    route: otpRoutes
  },
  {
    path: "/settings",
    route: settingsRoutes
  },
  {
     path: "/notifications",
     route: notificationRoutes
  }, 
  {
    path: "/category",
    route: categoryRoutes
 },
 {
  path: "/event",
  route: eventRoutes
},

{
  path: "/review",
  route: reviewRoutes
},
{
  path: "/ticket",
  route: ticketRoutes
},
{
  path: "/earnings",
  route: paymentRoutes
},
{
  path: "/slidingText",
  route: slidingTextRoutes
},
{
  path: "/bookings",
  route: bookingRoutes
},
{
  path: "/test-bookings",
  route: testBookingRoutes
},
{
  path: "/bays",
  route: bayRoutes
},
{
  path: "/schedules",
  route: scheduleRoutes
}
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;