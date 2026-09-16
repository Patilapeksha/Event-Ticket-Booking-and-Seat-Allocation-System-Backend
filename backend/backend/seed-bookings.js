const pool = require("./db");

async function seedBookings() {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [attendees] = await connection.query(
      "SELECT id FROM users WHERE email = 'attendee@events.test'"
    );

    if (attendees.length === 0) {
      throw new Error("Attendee not found");
    }

    const attendeeId = attendees[0].id;

    const [seats] = await connection.query(`
      SELECT
        s.id,
        ss.event_id,
        ss.price
      FROM seats s
      JOIN seat_sections ss
        ON s.section_id = ss.id
      WHERE s.status = 'AVAILABLE'
      AND NOT EXISTS (
        SELECT 1
        FROM booking_seats bs
        WHERE bs.seat_id = s.id
      )
      ORDER BY s.id
      LIMIT 30
      FOR UPDATE
    `);

    if (seats.length < 30) {
      throw new Error("Not enough available seats");
    }

    let createdBookings = 0;

    for (let i = 0; i < 15; i++) {
      const seat1 = seats[i * 2];
      const seat2 = seats[i * 2 + 1];

      if (seat1.event_id !== seat2.event_id) {
        continue;
      }

      const totalAmount =
        Number(seat1.price) + Number(seat2.price);

      const [bookingResult] = await connection.query(
        `
        INSERT INTO bookings
        (attendee_id, event_id, total_amount, status)
        VALUES (?, ?, ?, 'PAID')
        `,
        [attendeeId, seat1.event_id, totalAmount]
      );

      const bookingId = bookingResult.insertId;

      for (const seat of [seat1, seat2]) {
        const [bookingSeatResult] = await connection.query(
          `
          INSERT INTO booking_seats
          (booking_id, seat_id)
          VALUES (?, ?)
          `,
          [bookingId, seat.id]
        );

        const bookingSeatId = bookingSeatResult.insertId;

        await connection.query(
          `
          INSERT INTO tickets
          (booking_seat_id, ticket_code)
          VALUES (?, ?)
          `,
          [
            bookingSeatId,
            `SEED-TICKET-${bookingId}-${seat.id}`
          ]
        );

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

      await connection.query(
        `
        INSERT INTO payments
        (booking_id, amount, gateway_reference, status)
        VALUES (?, ?, ?, 'SUCCESS')
        `,
        [
          bookingId,
          totalAmount,
          `SEED-PAYMENT-${bookingId}`,
        ]
      );

      createdBookings++;
    }

    if (createdBookings < 15) {
      throw new Error(
        `Only ${createdBookings} bookings could be created`
      );
    }

    await connection.commit();

    console.log(
      `${createdBookings} sample bookings created successfully`
    );
  } catch (error) {
    await connection.rollback();
    console.error("Seed bookings error:", error.message);
  } finally {
    connection.release();
    process.exit();
  }
}

seedBookings();