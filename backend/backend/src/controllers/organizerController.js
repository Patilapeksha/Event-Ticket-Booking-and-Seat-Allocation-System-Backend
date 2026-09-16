const pool = require("../../db");

// CREATE EVENT + SEAT SECTION
const createEvent = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const userId = req.user.id;

    const {
      venue_id,
      title,
      description,
      category,
      date_time,
      section_name,
      price,
      total_seats
    } = req.body;

    if (
      !venue_id ||
      !title ||
      !category ||
      !date_time ||
      !section_name ||
      !price ||
      !total_seats
    ) {
      return res.status(400).json({
        success: false,
        message:
          "venue_id, title, category, date_time, section_name, price and total_seats are required"
      });
    }

    const [organizers] = await connection.query(
      `SELECT id, approval_status
       FROM organizers
       WHERE user_id = ?`,
      [userId]
    );

    if (organizers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Organizer profile not found"
      });
    }

    if (organizers[0].approval_status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Organizer is not approved"
      });
    }

    const organizerId = organizers[0].id;

    await connection.beginTransaction();

    // Create event
    const [eventResult] = await connection.query(
      `
      INSERT INTO events
      (organizer_id, venue_id, title, description, category, date_time, status)
      VALUES (?, ?, ?, ?, ?, ?, 'draft')
      `,
      [
        organizerId,
        venue_id,
        title,
        description || null,
        category,
        date_time
      ]
    );

    const eventId = eventResult.insertId;

    // Create seat section
    const [sectionResult] = await connection.query(
      `
      INSERT INTO seat_sections
      (event_id, section_name, price, total_seats)
      VALUES (?, ?, ?, ?)
      `,
      [
        eventId,
        section_name,
        Number(price),
        Number(total_seats)
      ]
    );

    const sectionId = sectionResult.insertId;

    // Create seats
    for (let i = 1; i <= Number(total_seats); i++) {
      await connection.query(
        `
        INSERT INTO seats
        (section_id, seat_label, status)
        VALUES (?, ?, 'AVAILABLE')
        `,
        [
          sectionId,
          `${section_name}-${i}`
        ]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Event and seat section created successfully",
      event_id: eventId,
      section_id: sectionId
    });

  } catch (error) {
    await connection.rollback();

    console.error(
      "Create event error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Failed to create event"
    });
  } finally {
    connection.release();
  }
};



// UPDATE EVENT
const updateEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const eventId = req.params.id;

    const {
      venue_id,
      title,
      description,
      category,
      date_time,
      status
    } = req.body;

    const [organizers] = await pool.query(
      `SELECT id FROM organizers WHERE user_id = ?`,
      [userId]
    );

    if (organizers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Organizer profile not found"
      });
    }

    const organizerId = organizers[0].id;

    const [events] = await pool.query(
      `
      SELECT id
      FROM events
      WHERE id = ? AND organizer_id = ?
      `,
      [eventId, organizerId]
    );

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found or you do not own this event"
      });
    }

    await pool.query(
      `
      UPDATE events
      SET venue_id = ?,
          title = ?,
          description = ?,
          category = ?,
          date_time = ?,
          status = ?
      WHERE id = ? AND organizer_id = ?
      `,
      [
        venue_id,
        title,
        description,
        category,
        date_time,
        status,
        eventId,
        organizerId
      ]
    );

    res.json({
      success: true,
      message: "Event updated successfully"
    });

  } catch (error) {
    console.error("Update event error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to update event"
    });
  }
};


// DELETE EVENT
const deleteEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const eventId = req.params.id;

    const [organizers] = await pool.query(
      `SELECT id FROM organizers WHERE user_id = ?`,
      [userId]
    );

    if (organizers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Organizer profile not found"
      });
    }

    const organizerId = organizers[0].id;

    const [events] = await pool.query(
      `
      SELECT id
      FROM events
      WHERE id = ? AND organizer_id = ?
      `,
      [eventId, organizerId]
    );

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found or you do not own this event"
      });
    }

    await pool.query(
      `
      UPDATE events
      SET status = 'cancelled'
      WHERE id = ? AND organizer_id = ?
      `,
      [eventId, organizerId]
    );

    res.json({
      success: true,
      message: "Event cancelled successfully"
    });

  } catch (error) {
    console.error("Delete event error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to cancel event"
    });
  }
};


// GET ORGANIZER BOOKINGS
const getOrganizerBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const [organizers] = await pool.query(
      `SELECT id FROM organizers WHERE user_id = ?`,
      [userId]
    );

    if (organizers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Organizer profile not found"
      });
    }

    const organizerId = organizers[0].id;

    const [bookings] = await pool.query(`
      SELECT
        b.id AS booking_id,
        e.id AS event_id,
        e.title AS event_title,
        b.total_amount,
        b.status,
        b.created_at,
        u.name AS attendee_name,
        u.email AS attendee_email
      FROM bookings b
      JOIN events e ON b.event_id = e.id
      JOIN users u ON b.attendee_id = u.id
      WHERE e.organizer_id = ?
      ORDER BY b.created_at DESC
    `, [organizerId]);

    res.json({
      success: true,
      bookings
    });

  } catch (error) {
    console.error("Get organizer bookings error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch organizer bookings"
    });
  }
};

const getOrganizerEvents = async (req, res) => {
  try {
    const userId = req.user.id;

    const [events] = await pool.query(
      `
      SELECT
        e.id,
        e.title,
        e.description,
        e.category,
        e.date_time,
        e.status,
        v.name AS venue_name,
        v.city,
        v.address
      FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      JOIN venues v ON e.venue_id = v.id
      WHERE o.user_id = ?
      ORDER BY e.date_time ASC
      `,
      [userId]
    );

    res.json({
      success: true,
      events
    });
  } catch (error) {
    console.error("Get organizer events error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch organizer events"
    });
  }
};

// GET ORGANIZER PAYOUTS
const getOrganizerPayouts = async (req, res) => {
  try {
    const userId = req.user.id;

    const [organizers] = await pool.query(
      `
      SELECT id
      FROM organizers
      WHERE user_id = ?
      `,
      [userId]
    );

    if (organizers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Organizer profile not found"
      });
    }

    const organizerId = organizers[0].id;

    const [payouts] = await pool.query(
      `
      SELECT
        id,
        amount,
        status,
        processed_at
      FROM payouts
      WHERE organizer_id = ?
      ORDER BY id DESC
      `,
      [organizerId]
    );

    res.json({
      success: true,
      payouts
    });

  } catch (error) {
    console.error("Get organizer payouts error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch payouts"
    });
  }
};




module.exports = {
  createEvent,
  updateEvent,
  deleteEvent,
  getOrganizerBookings,
  getOrganizerEvents,
  getOrganizerPayouts
};
