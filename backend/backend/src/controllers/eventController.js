const pool = require("../../db");

const getEvents = async (req, res) => {
  try {
    const [events] = await pool.query(`
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
      JOIN venues v ON e.venue_id = v.id
      WHERE e.status = 'published'
      ORDER BY e.date_time ASC
    `);

    res.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error("Get events error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
    });
  }
};

const getSeatMap = async (req, res) => {
  try {
    const { id } = req.params;

    const [seats] = await pool.query(
      `
      SELECT
        s.id,
        s.seat_label,
        s.status,
        s.locked_until,
        ss.section_name,
        ss.price
      FROM seats s
      JOIN seat_sections ss
        ON s.section_id = ss.id
      WHERE ss.event_id = ?
      ORDER BY ss.id, s.id
      `,
      [id]
    );

    res.json({
      success: true,
      event_id: Number(id),
      seats,
    });
  } catch (error) {
    console.error("Get seat map error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch seat map",
    });
  }
};

module.exports = {
  getEvents,
  getSeatMap,
};