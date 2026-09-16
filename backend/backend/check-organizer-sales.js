const pool = require("./db");

async function checkSales() {
  try {
    const [rows] = await pool.query(`
      SELECT
        e.organizer_id,
        COUNT(b.id) AS paid_bookings,
        COALESCE(SUM(b.total_amount), 0) AS total_sales
      FROM bookings b
      JOIN events e ON b.event_id = e.id
      WHERE b.status = 'PAID'
      GROUP BY e.organizer_id
    `);

    console.log(rows);
  } catch (error) {
    console.log("Error:", error.message);
  } finally {
    process.exit();
  }
}

checkSales();