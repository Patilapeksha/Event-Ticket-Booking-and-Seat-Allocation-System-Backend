const pool = require("../../db");

const lockSeats = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { seat_ids } = req.body;
    const user_id = req.user.id;

    if (!Array.isArray(seat_ids) || seat_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "seat_ids must be a non-empty array",
      });
    }

    await connection.beginTransaction();

    const lockedUntil = new Date(Date.now() + 10 * 60 * 1000);

    const selectedSeats = [];

    for (const seatId of seat_ids) {
      const [rows] = await connection.query(
        `
        SELECT
          s.id,
          s.status,
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
        seat.status === "SOLD" ||
        (seat.status === "LOCKED" &&
          seat.locked_until &&
          new Date(seat.locked_until) > new Date())
      ) {
        await connection.rollback();

        return res.status(409).json({
          success: false,
          message: `Seat ${seatId} is not available`,
        });
      }

      selectedSeats.push(seat);
    }

    for (const seat of selectedSeats) {
      await connection.query(
        `
        UPDATE seats
        SET status = 'LOCKED',
            locked_by = ?,
            locked_until = ?
        WHERE id = ?
        `,
        [user_id, lockedUntil, seat.id]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Seats locked successfully",
      locked_until: lockedUntil,
      seats: selectedSeats.map((seat) => ({
        id: seat.id,
        price: seat.price,
        event_id: seat.event_id,
      })),
    });
  } catch (error) {
    await connection.rollback();

    console.error("Lock seats error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to lock seats",
    });
  } finally {
    connection.release();
  }
};

const releaseExpiredSeats = async (req, res) => {
  try {
    const [result] = await pool.query(`
      UPDATE seats
      SET status = 'AVAILABLE',
          locked_by = NULL,
          locked_until = NULL
      WHERE status = 'LOCKED'
        AND locked_until IS NOT NULL
        AND locked_until <= NOW()
    `);

    res.json({
      success: true,
      message: "Expired seats released successfully",
      released_seats: result.affectedRows
    });
  } catch (error) {
    console.error("Release expired seats error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to release expired seats"
    });
  }
};


module.exports = {
  lockSeats,
  releaseExpiredSeats,
};



