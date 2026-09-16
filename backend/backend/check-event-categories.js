const pool = require("./db");

async function checkCategories() {
  try {
    const [events] = await pool.query(
      `SELECT id, title, category FROM events ORDER BY id`
    );

    console.table(events);
  } catch (error) {
    console.error("Check failed:", error.message);
  } finally {
    await pool.end();
  }
}

checkCategories();