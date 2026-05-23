import { Router } from "express";
import auth from "../../middleware/auth";
import checkPermission from "../../middleware/checkPermission";
import { paymentController } from "./payment.controller";


const router = Router();

// Get all payments
router.get('/', auth('admin'), checkPermission('view_finance'), paymentController.getAllPayments);
router.get('/paymentOverview', auth('admin'), checkPermission('view_finance'), paymentController.getPaymentOverview);

export const paymentRoutes =  router;