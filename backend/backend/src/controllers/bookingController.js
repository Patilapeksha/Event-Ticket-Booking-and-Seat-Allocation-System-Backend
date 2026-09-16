const pool = require("../../db");

const checkout = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { seat_ids } = req.body;
    const attendee_id = req.user.id;

    if (!Array.isArray(seat_ids) || seat_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "seat_ids must be a non-empty array",
      });
    }

    await connection.beginTransaction();

    const selectedSeats = [];
    let totalAmount = 0;
    let eventId = null;

    for (const seatId of seat_ids) {
      const [rows] = await connection.query(
        `
        SELECT
          s.id,
          s.status,
          s.locked_by,
          s.locked_until,
          ss.event_id,
          ss.price
        FROM seats s
        JOIN seat_sections ss
          ON s.section_id = ss.id
        WHERE s.id = ?
        FOR UPDATE
        `,
        [seatId]
      );

      if (rows.length === 0) {
        await connection.rollback();

        return res.status(404).json({
          success: false,
          message: `Seat ${seatId} not found`,
        });
      }

      const seat = rows[0];

      if (
        seat.status !== "LOCKED" ||
        seat.locked_by !== attendee_id ||
        !seat.locked_until ||
        new Date(seat.locked_until) <= new Date()
      ) {
        await connection.rollback();

        return res.status(409).json({
          success: false,
          message: `Seat ${seatId} is not locked by you or the lock has expired`,
        });
      }

      if (eventId === null) {
        eventId = seat.event_id;
      }

      if (eventId !== seat.event_id) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: "All seats must belong to the same event",
        });
      }

      totalAmount += Number(seat.price);
      selectedSeats.push(seat);
    }

    const [bookingResult] = await connection.query(
      `
      INSERT INTO bookings
      (attendee_id, event_id, total_amount, status)
      VALUES (?, ?, ?, 'PENDING')
      `,
      [attendee_id, eventId, totalAmount]
    );

    const bookingId = bookingResult.insertId;

    for (const seat of selectedSeats) {
      await connection.query(
        `
        INSERT INTO booking_seats
        (booking_id, seat_id)
        VALUES (?, ?)
        `,
        [bookingId, seat.id]
      );
    }

    // Mock payment
    const paymentReference = `MOCK-${Date.now()}-${bookingId}`;

    await connection.query(
      `
      INSERT INTO payments
      (booking_id, amount, gateway_reference, status)
      VALUES (?, ?, ?, 'SUCCESS')
      `,
      [bookingId, totalAmount, paymentReference]
    );

    await connection.query(
      `
      UPDATE bookings
      SET status = 'PAID'
      WHERE id = ?
      `,
      [bookingId]
    );

    for (const seat of selectedSeats) {
      await connection.query(
        `
        UPDATE seats
        SET status = 'SOLD',
            locked_by = NULL,
            locked_until = NULL
        WHERE id = ?
        `,
        [seat.id]
      );
    }

    const ticketCodes = [];

    for (const seat of selectedSeats) {
      const [bookingSeatRows] = await connection.query(
        `
        SELECT id
        FROM booking_seats
        WHERE booking_id = ? AND seat_id = ?
        `,
        [bookingId, seat.id]
      );

      const bookingSeatId = bookingSeatRows[0].id;

      const ticketCode = `TICKET-${bookingId}-${seat.id}-${Date.now()}`;

      await connection.query(
        `
        INSERT INTO tickets
        (booking_seat_id, ticket_code)
        VALUES (?, ?)
        `,
        [bookingSeatId, ticketCode]
      );

      ticketCodes.push(ticketCode);
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Booking confirmed successfully",
      booking: {
        id: bookingId,
        event_id: eventId,
        total_amount: totalAmount,
        status: "PAID",
        payment_status: "SUCCESS",
        tickets: ticketCodes,
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error("Checkout error:", error.message);

    res.status(500).json({
      success: false,
      message: "Checkout failed",
    });
  } finally {
    connection.release();
  }
};

const getMyBookings = async (req, res) => {
  try {
    const attendee_id = req.user.id;

    const [bookings] = await pool.query(
      `
      SELECT
        b.id AS booking_id,
        b.event_id,
        e.title AS event_title,
        b.total_amount,
        b.status,
        b.created_at,
        GROUP_CONCAT(t.ticket_code) AS tickets
      FROM bookings b
      JOIN events e
        ON b.event_id = e.id
      LEFT JOIN booking_seats bs
        ON b.id = bs.booking_id
      LEFT JOIN tickets t
        ON bs.id = t.booking_seat_id
      WHERE b.attendee_id = ?
      GROUP BY b.id
      ORDER BY b.created_at DESC
      `,
      [attendee_id]
    );

    res.json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("Get my bookings error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
    });
  }
};

const cancelBooking = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const bookingId = req.params.id;
    const attendeeId = req.user.id;

    await connection.beginTransaction();

    const [bookings] = await connection.query(
      `
      SELECT id, status
      FROM bookings
      WHERE id = ? AND attendee_id = ?
      FOR UPDATE
      `,
      [bookingId, attendeeId]
    );

    if (bookings.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const booking = bookings[0];

    if (booking.status !== "PAID") {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Only paid bookings can be cancelled",
      });
    }

    const [bookingSeats] = await connection.query(
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
        SET status = 'AVAILABLE',
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
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Cancel booking error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to cancel booking",
    });
  } finally {
    connection.release();
  }
};

const paymentWebhook = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { booking_id, payment_status, gateway_reference } = req.body;

    if (!booking_id || !payment_status) {
      return res.status(400).json({
        success: false,
        message: "booking_id and payment_status are required",
      });
    }

    await connection.beginTransaction();

    const [payments] = await connection.query(
      `
      SELECT *
      FROM payments
      WHERE booking_id = ?
      FOR UPDATE
      `,
      [booking_id]
    );

    if (payments.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment_status === "SUCCESS") {
      await connection.query(
        `
        UPDATE payments
        SET status = 'SUCCESS',
            gateway_reference = COALESCE(?, gateway_reference)
        WHERE booking_id = ?
        `,
        [gateway_reference || null, booking_id]
      );

      await connection.query(
        `
        UPDATE bookings
        SET status = 'PAID'
        WHERE id = ?
        `,
        [booking_id]
      );
    } else if (payment_status === "FAILED") {
      await connection.query(
        `
        UPDATE payments
        SET status = 'FAILED',
            gateway_reference = COALESCE(?, gateway_reference)
        WHERE booking_id = ?
        `,
        [gateway_reference || null, booking_id]
      );

      await connection.query(
        `
        UPDATE bookings
        SET status = 'CANCELLED'
        WHERE id = ?
        `,
        [booking_id]
      );
    } else {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Payment webhook processed successfully",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Payment webhook error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to process payment webhook",
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  checkout,
  getMyBookings,
  cancelBooking,
 paymentWebhook,
};