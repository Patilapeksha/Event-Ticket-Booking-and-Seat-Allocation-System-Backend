const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./src/routes/authRoutes");
const eventRoutes = require("./src/routes/eventRoutes");
const seatRoutes = require("./src/routes/seatRoutes");
const bookingRoutes = require("./src/routes/bookingRoutes");
const organizerRoutes = require("./src/routes/organizerRoutes");
const adminRoutes = require("./src/routes/adminRoutes");


const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Event Ticket Booking API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/organizer", organizerRoutes);
app.use("/api/admin", adminRoutes);




const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});