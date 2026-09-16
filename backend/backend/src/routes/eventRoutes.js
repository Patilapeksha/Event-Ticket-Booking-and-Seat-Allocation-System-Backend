const express = require("express");

const router = express.Router();

const {
  getEvents,
  getSeatMap,
} = require("../controllers/eventController");

router.get("/", getEvents);
router.get("/:id/seatmap", getSeatMap);

module.exports = router;