const express = require("express");
const router = express.Router();

const {
  createEvent,
  updateEvent,
  deleteEvent,
  getOrganizerBookings,getOrganizerEvents,getOrganizerPayouts
} = require("../controllers/organizerController");

const {
  authMiddleware,
  authorizeRoles
} = require("../../middleware/authMiddleware");


// CREATE
router.post(
  "/events",
  authMiddleware,
  authorizeRoles("organizer"),
  createEvent
);


// UPDATE
router.put(
  "/events/:id",
  authMiddleware,
  authorizeRoles("organizer"),
  updateEvent
);


// DELETE / CANCEL
router.delete(
  "/events/:id",
  authMiddleware,
  authorizeRoles("organizer"),
  deleteEvent
);


// BOOKINGS
router.get(
  "/bookings",
  authMiddleware,
  authorizeRoles("organizer"),
  getOrganizerBookings
);

router.get(
  "/events",
  authMiddleware,
  authorizeRoles("organizer"),
  getOrganizerEvents
);

router.get(
  "/payouts",
  authMiddleware,
  authorizeRoles("organizer"),
  getOrganizerPayouts
);



module.exports = router;