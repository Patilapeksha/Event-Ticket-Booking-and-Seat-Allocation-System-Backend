const express = require("express");

const router = express.Router();

const {
  checkout,
  getMyBookings,cancelBooking,paymentWebhook,
} = require("../controllers/bookingController");

const {
  authMiddleware,
  authorizeRoles,
} = require("../../middleware/authMiddleware");

router.post(
  "/checkout",
  authMiddleware,
  authorizeRoles("attendee"),
  checkout
);


router.get(
  "/my",
  authMiddleware,
  authorizeRoles("attendee"),
  getMyBookings
);

router.post(
  "/:id/cancel",
  authMiddleware,
  authorizeRoles("attendee"),
  cancelBooking
);

router.post("/payment/webhook",paymentWebhook);

module.exports = router;