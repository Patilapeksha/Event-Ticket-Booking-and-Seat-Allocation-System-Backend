const pool = require("./db");

const runTest = async () => {
  try {
    const [rows] = await pool.query(`
      SELECT
        e.id AS event_id,
        e.title,
        o.id AS organizer_id,
        o.organization_name,
        u.name AS organizer_name,
        o.approval_status
      FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      JOIN users u ON o.user_id = u.id
      WHERE e.id = 1
    `);

    console.log(rows);
  } catch (error) {
    console.error("Test failed:", error.message);
  } finally {
    process.exit();
  }
};

runTest();