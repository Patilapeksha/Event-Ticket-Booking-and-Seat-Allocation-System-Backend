const express = require("express");
const router = express.Router();

const {
  getSalesReport,
  approveOrganizer,
  getUsers,
  updateUserStatus,
  refundBooking,
  createPayout,
  getAllEvents,
  getAllBookings,
  getOrganizers,
  updateEventStatus
} = require("../controllers/adminController");

const {
  authMiddleware,
  authorizeRoles
} = require("../../middleware/authMiddleware");


// SALES REPORT
router.get(
  "/reports/sales",
  authMiddleware,
  authorizeRoles("admin"),
  getSalesReport
);


// ORGANIZERS
router.get(
  "/organizers",
  authMiddleware,
  authorizeRoles("admin"),
  getOrganizers
);

router.post(
  "/organizers/:id/approve",
  authMiddleware,
  authorizeRoles("admin"),
  approveOrganizer
);


// EVENTS
router.get(
  "/events",
  authMiddleware,
  authorizeRoles("admin"),
  getAllEvents
);

router.patch(
  "/events/:id/status",
  authMiddleware,
  authorizeRoles("admin"),
  updateEventStatus
);


// BOOKINGS
router.get(
  "/bookings",
  authMiddleware,
  authorizeRoles("admin"),
  getAllBookings
);

router.post(
  "/bookings/:id/refund",
  authMiddleware,
  authorizeRoles("admin"),
  refundBooking
);


// USERS
router.get(
  "/users",
  authMiddleware,
  authorizeRoles("admin"),
  getUsers
);

router.patch(
  "/users/:id/status",
  authMiddleware,
  authorizeRoles("admin"),
  updateUserStatus
);


// PAYOUT
router.post(
  "/organizers/:id/payout",
  authMiddleware,
  authorizeRoles("admin"),
  createPayout
);

module.exports = router;