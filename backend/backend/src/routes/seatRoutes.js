const express = require("express");

const router = express.Router();

const {
  lockSeats,releaseExpiredSeats,
} = require("../controllers/seatController");

const {
  authMiddleware,
  authorizeRoles,
} = require("../../middleware/authMiddleware");

router.post(
  "/lock",
  authMiddleware,
  authorizeRoles("attendee"),
  lockSeats
);

router.post(
    "/release-expired",
    releaseExpiredSeats
)

module.exports = router;