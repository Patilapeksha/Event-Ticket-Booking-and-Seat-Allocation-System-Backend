const pool = require("../../db");

// ===============================
// SALES REPORT
// ===============================
const getSalesReport = async (req, res) => {
  try {
    const [report] = await pool.query(`
      SELECT
        COUNT(*) AS total_bookings,

        SUM(
          CASE
            WHEN status = 'PAID' THEN 1
            ELSE 0
          END
        ) AS paid_bookings,

        SUM(
          CASE
            WHEN status = 'CANCELLED' THEN 1
            ELSE 0
          END
        ) AS cancelled_bookings,

        COALESCE(
          SUM(
            CASE
              WHEN status = 'PAID' THEN total_amount
              ELSE 0
            END
          ),
          0
        ) AS total_sales

      FROM bookings
    `);

    res.json({
      success: true,
      report: report[0]
    });

  } catch (error) {
    console.error(
      "Sales report error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch sales report"
    });
  }
};


// ===============================
// GET ALL ORGANIZERS
// ===============================
const getOrganizers = async (req, res) => {
  try {
    const [organizers] = await pool.query(`
      SELECT
        o.id,
        o.user_id,
        u.name,
        u.email,
        o.organization_name,
        o.approval_status
      FROM organizers o
      JOIN users u
        ON o.user_id = u.id
      ORDER BY o.id DESC
    `);

    res.json({
      success: true,
      organizers
    });

  } catch (error) {
    console.error(
      "Get organizers error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch organizers"
    });
  }
};


// ===============================
// APPROVE ORGANIZER
// ===============================
const approveOrganizer = async (req, res) => {
  try {
    const organizerId = req.params.id;

    const [organizers] = await pool.query(
      `
      SELECT id
      FROM organizers
      WHERE id = ?
      `,
      [organizerId]
    );

    if (organizers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Organizer not found"
      });
    }

    await pool.query(
      `
      UPDATE organizers
      SET approval_status = 'approved'
      WHERE id = ?
      `,
      [organizerId]
    );

    res.json({
      success: true,
      message: "Organizer approved successfully"
    });

  } catch (error) {
    console.error(
      "Approve organizer error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to approve organizer"
    });
  }
};


// ===============================
// GET ALL USERS
// ===============================
const getUsers = async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT
        id,
        name,
        email,
        role,
        status,
        created_at
      FROM users
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      users
    });

  } catch (error) {
    console.error(
      "Get users error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch users"
    });
  }
};


// ===============================
// ACTIVATE / DEACTIVATE USER
// ===============================
const updateUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const { status } = req.body;

    if (
      !["active", "inactive"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be active or inactive"
      });
    }

    const [users] = await pool.query(
      `
      SELECT id
      FROM users
      WHERE id = ?
      `,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    await pool.query(
      `
      UPDATE users
      SET status = ?
      WHERE id = ?
      `,
      [status, userId]
    );

    res.json({
      success: true,
      message: `User ${status} successfully`
    });

  } catch (error) {
    console.error(
      "Update user status error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to update user status"
    });
  }
};


// ===============================
// GET ALL EVENTS
// ===============================
const getAllEvents = async (req, res) => {
  try {
    const [events] = await pool.query(`
      SELECT
        e.id,
        e.title,
        e.category,
        e.date_time,
        e.status,

        o.id AS organizer_id,
        u.name AS organizer_name,

        v.name AS venue_name,
        v.city

      FROM events e

      JOIN organizers o
        ON e.organizer_id = o.id

      JOIN users u
        ON o.user_id = u.id

      JOIN venues v
        ON e.venue_id = v.id

      ORDER BY e.created_at DESC
    `);

    res.json({
      success: true,
      events
    });

  } catch (error) {
    console.error(
      "Get all events error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch events"
    });
  }
};


// ===============================
// UPDATE EVENT STATUS
// ===============================
const updateEventStatus = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { status } = req.body;

    const allowedStatuses = [
      "draft",
      "published",
      "cancelled",
      "completed"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event status"
      });
    }

    const [events] = await pool.query(
      `
      SELECT id
      FROM events
      WHERE id = ?
      `,
      [eventId]
    );

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    await pool.query(
      `
      UPDATE events
      SET status = ?
      WHERE id = ?
      `,
      [status, eventId]
    );

    res.json({
      success: true,
      message:
        `Event ${status} successfully`
    });

  } catch (error) {
    console.error(
      "Update event status error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to update event status"
    });
  }
};


// ===============================
// GET ALL BOOKINGS
// ===============================
const getAllBookings = async (req, res) => {
  try {
    const [bookings] = await pool.query(`
      SELECT
        b.id AS booking_id,
        b.event_id,

        e.title AS event_title,

        b.attendee_id,

        u.name AS attendee_name,
        u.email AS attendee_email,

        b.total_amount,
        b.status,
        b.created_at

      FROM bookings b

      JOIN events e
        ON b.event_id = e.id

      JOIN users u
        ON b.attendee_id = u.id

      ORDER BY b.created_at DESC
    `);

    res.json({
      success: true,
      bookings
    });

  } catch (error) {
    console.error(
      "Get all bookings error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings"
    });
  }
};


// ===============================
// REFUND BOOKING
// ===============================
const refundBooking = async (req, res) => {
  const connection =
    await pool.getConnection();

  try {
    const bookingId = req.params.id;

    await connection.beginTransaction();

    const [bookings] =
      await connection.query(
        `
        SELECT id, status
        FROM bookings
        WHERE id = ?
        FOR UPDATE
        `,
        [bookingId]
      );

    if (bookings.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    if (bookings[0].status !== "PAID") {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "Only paid bookings can be refunded"
      });
    }

    const [bookingSeats] =
      await connection.query(
        `
        SELECT seat_id
        FROM booking_seats
        WHERE booking_id = ?
        `,
        [bookingId]
      );

    for (const bookingSeat of bookingSeats) {
      await connection.query(
        `
        UPDATE seats
        SET
          status = 'AVAILABLE',
          locked_by = NULL,
          locked_until = NULL
        WHERE id = ?
        `,
        [bookingSeat.seat_id]
      );
    }

    await connection.query(
      `
      UPDATE bookings
      SET status = 'CANCELLED'
      WHERE id = ?
      `,
      [bookingId]
    );

    await connection.query(
      `
      UPDATE payments
      SET status = 'FAILED'
      WHERE booking_id = ?
      `,
      [bookingId]
    );

    await connection.commit();

    res.json({
      success: true,
      message:
        "Booking refunded successfully"
    });

  } catch (error) {
    await connection.rollback();

    console.error(
      "Refund booking error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to refund booking"
    });

  } finally {
    connection.release();
  }
};


// ===============================
// CREATE PAYOUT
// ===============================
const createPayout = async (req, res) => {
  const connection =
    await pool.getConnection();

  try {
    const organizerId = req.params.id;

    // Check organizer
    const [organizers] =
      await connection.query(
        `
        SELECT
          id,
          organization_name
        FROM organizers
        WHERE id = ?
        `,
        [organizerId]
      );

    if (organizers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Organizer not found"
      });
    }

    // Calculate paid sales
    const [sales] =
      await connection.query(
        `
        SELECT
          COALESCE(
            SUM(b.total_amount),
            0
          ) AS total_sales,

          COUNT(b.id) AS paid_bookings

        FROM bookings b

        JOIN events e
          ON b.event_id = e.id

        WHERE e.organizer_id = ?
          AND b.status = 'PAID'
        `,
        [organizerId]
      );

    const totalSales =
      Number(sales[0].total_sales);

    const paidBookings =
      Number(sales[0].paid_bookings);

    console.log(
      "Organizer:",
      organizerId,
      "Paid bookings:",
      paidBookings,
      "Total sales:",
      totalSales
    );

    if (
      paidBookings === 0 ||
      totalSales <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "No paid sales available for payout"
      });
    }

    // Create payout
    const [result] =
      await connection.query(
        `
        INSERT INTO payouts
        (
          organizer_id,
          amount,
          status
        )
        VALUES (?, ?, 'PENDING')
        `,
        [
          organizerId,
          totalSales
        ]
      );

    res.status(201).json({
      success: true,
      message:
        "Payout created successfully",

      payout: {
        id: result.insertId,

        organizer_id:
          Number(organizerId),

        amount: totalSales,

        paid_bookings:
          paidBookings,

        status: "PENDING"
      }
    });

  } catch (error) {
    console.error(
      "Create payout error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to create payout"
    });

  } finally {
    connection.release();
  }
};


// ===============================
// EXPORTS
// ===============================
module.exports = {
  getSalesReport,
  getOrganizers,
  approveOrganizer,
  getUsers,
  updateUserStatus,
  getAllEvents,
  updateEventStatus,
  getAllBookings,
  refundBooking,
  createPayout
};