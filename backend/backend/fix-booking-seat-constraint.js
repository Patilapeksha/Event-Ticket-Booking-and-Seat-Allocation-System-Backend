const pool = require("./db");

async function fixConstraint() {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Temporarily remove the foreign key that uses the seat_id index.
    await connection.query(`
      ALTER TABLE booking_seats
      DROP FOREIGN KEY booking_seats_ibfk_2
    `);

    // Remove the old unique constraint.
    await connection.query(`
      ALTER TABLE booking_seats
      DROP INDEX unique_booking_seat
    `);

    // Add a normal index for the seat foreign key.
    await connection.query(`
      ALTER TABLE booking_seats
      ADD INDEX idx_booking_seats_seat_id (seat_id)
    `);

    // Restore the foreign key.
    await connection.query(`
      ALTER TABLE booking_seats
      ADD CONSTRAINT booking_seats_ibfk_2
      FOREIGN KEY (seat_id)
      REFERENCES seats(id)
    `);

    // Prevent the same seat from being added twice
    // to the same booking.
    await connection.query(`
      ALTER TABLE booking_seats
      ADD UNIQUE KEY unique_booking_seat_per_booking
      (booking_id, seat_id)
    `);

    await connection.commit();

    console.log(
      "Booking seat constraint fixed successfully."
    );
  } catch (error) {
    await connection.rollback();

    console.error(
      "Fix failed:",
      error.message
    );
  } finally {
    connection.release();
  }
}

fixConstraint();